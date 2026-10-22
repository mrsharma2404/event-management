"""Baseline XGBoost conversion model on the website's event data.

Question: from how a visitor browses during a session, how likely is that session to convert
(a booking or an enquiry)? One row per session; features use only behaviour *before* the
conversion, and never the form/checkout/payment steps themselves (those are the conversion).

    .venv/bin/python conversion_model.py                 # train, evaluate, save report + run summary
    .venv/bin/python conversion_model.py --real-only     # ignore seeded demo sessions
    .venv/bin/python conversion_model.py --no-db-write   # don't record the run in ml_model_runs

Reads DATABASE_URL from the environment or ../.env.local.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import psycopg
import xgboost as xgb
from psycopg.types.json import Jsonb
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import RepeatedStratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

# numpy 2.x on Apple's Accelerate BLAS emits spurious matmul warnings for valid inputs.
warnings.filterwarnings("ignore", message=r".*encountered in matmul", category=RuntimeWarning)

HERE = Path(__file__).resolve().parent
ARTIFACTS = HERE / "artifacts"
REPORTS = HERE / "reports"
SEED = 42

# Steps that *are* the conversion (or only happen once someone has decided to convert), plus
# end-of-session bookkeeping. Using them as features would leak the label.
EXCLUDED_EVENTS = [
    # Opening an enquiry form is the first step of an enquiry, not a signal that predicts one.
    "enquiry_form_viewed", "enquiry_form_started", "enquiry_field_filled", "enquiry_submit_attempted", "enquiry_submitted",
    "enquiry_success", "enquiry_failed", "form_error", "lead_created", "enquiry_confirmed",
    "checkout_started", "add_to_cart", "cart_updated", "cart_abandoned", "cart_removed",
    "add_on_selected", "add_on_removed", "coupon_applied", "coupon_failed", "time_slot_selected",
    "booking_form_viewed", "booking_form_started", "booking_form_field_filled",
    "booking_form_validation_failed", "booking_form_submit_attempted", "booking_form_submitted",
    "payment_method_selected", "payment_initiated", "payment_success", "payment_failed",
    "payment_cancelled", "booking_success", "booking_failed", "order_created", "booking_confirmed",
    "order_confirmation_viewed", "booking_receipt_downloaded", "safe_checkout_viewed",
    "secure_payment_badge_viewed", "checkout_error", "failed_payment_gateway", "exit_page", "session_end",
]

FEATURE_SQL = """
WITH conv AS (
  SELECT session_id, min(created_at) AS converted_at
  FROM (SELECT session_id, created_at FROM bookings WHERE session_id IS NOT NULL
        UNION ALL
        SELECT session_id, created_at FROM enquiries WHERE session_id IS NOT NULL) x
  GROUP BY 1
),
ev AS (
  SELECT e.*, c.converted_at
  FROM analytics_events e LEFT JOIN conv c USING (session_id)
  WHERE e.session_id <> 'server' AND (%(include_seed)s OR e.anonymous_id NOT LIKE 'seed-%%')
),
pre AS (
  SELECT * FROM ev
  WHERE (converted_at IS NULL OR occurred_at < converted_at)
    AND event_name <> ALL(%(excluded)s)
    -- Checkout pages and the Plan-my-event wizard are the conversion forms themselves.
    AND coalesce(page_type, '') NOT IN ('checkout_booking', 'checkout_payment', 'confirmation', 'plan_my_event')
),
agg AS (
  SELECT session_id,
    count(*)                                                                       AS n_events,
    count(*) FILTER (WHERE event_name = 'page_view')                               AS n_page_views,
    count(*) FILTER (WHERE event_name = 'event_detail_page_view')                  AS n_detail_views,
    count(DISTINCT package_slug) FILTER (WHERE event_name = 'event_viewed')        AS n_packages_viewed,
    count(*) FILTER (WHERE event_name = 'listing_page_view')                       AS n_listing_views,
    count(*) FILTER (WHERE event_name = 'listing_result_clicked')                  AS n_results_clicked,
    count(*) FILTER (WHERE event_name = 'search_performed')                        AS n_searches,
    count(*) FILTER (WHERE event_name IN ('filter_applied', 'sort_applied'))       AS n_filters,
    count(*) FILTER (WHERE event_name IN ('event_gallery_opened', 'event_image_viewed')) AS n_gallery,
    count(*) FILTER (WHERE event_name IN ('event_review_viewed', 'rating_viewed', 'review_count_viewed')) AS n_reviews,
    count(*) FILTER (WHERE event_name = 'faq_viewed')                              AS n_faq,
    count(*) FILTER (WHERE event_name IN ('price_breakdown_viewed', 'ticket_type_viewed')) AS n_price_views,
    count(*) FILTER (WHERE event_name = 'ticket_option_selected')                  AS n_tier_selects,
    count(*) FILTER (WHERE event_name = 'date_selected')                           AS n_date_selects,
    count(*) FILTER (WHERE event_name = 'wishlist_added')                          AS n_wishlist,
    count(*) FILTER (WHERE event_name IN ('event_share_clicked', 'share_link_copied')) AS n_shares,
    count(*) FILTER (WHERE event_name IN ('whatsapp_click', 'call_click', 'email_click')) AS n_contact_clicks,
    count(*) FILTER (WHERE event_name = 'testimonial_viewed')                      AS n_testimonials,
    coalesce(max(CASE WHEN event_name = 'event_viewed' AND jsonb_typeof(properties->'price_min') = 'number'
                      THEN (properties->>'price_min')::numeric END), 0)            AS max_price_viewed,
    avg(CASE WHEN event_name = 'page_load_time' AND jsonb_typeof(properties->'load_ms') = 'number'
             THEN (properties->>'load_ms')::numeric END)                           AS avg_load_ms,
    extract(epoch FROM max(occurred_at) - min(occurred_at))                        AS active_seconds
  FROM pre GROUP BY 1
),
start AS (
  SELECT DISTINCT ON (session_id) session_id, anonymous_id, occurred_at, source_channel, device_type, os,
    landing_page, (properties->>'is_returning') = 'true' AS is_returning
  FROM ev ORDER BY session_id, (event_name = 'session_start') DESC, occurred_at
)
SELECT s.session_id,
  (s.anonymous_id LIKE 'seed-%%') AS is_seed,
  (c.converted_at IS NOT NULL)::int AS converted,
  coalesce(s.source_channel, 'direct') AS channel,
  coalesce(s.device_type, 'unknown') AS device,
  coalesce(s.os, 'Other') AS os,
  CASE
    WHEN split_part(coalesce(s.landing_page, '/'), '?', 1) = '/' THEN 'home'
    WHEN s.landing_page LIKE '/packages/%%' THEN 'package'
    WHEN s.landing_page LIKE '/packages%%' THEN 'listing'
    WHEN s.landing_page LIKE '/events/%%' OR s.landing_page LIKE '/destinations/%%' THEN 'collection'
    WHEN s.landing_page LIKE '/blog%%' THEN 'blog'
    WHEN s.landing_page LIKE '/plan-my-event%%' THEN 'plan_my_event'
    ELSE 'other' END AS landing_type,
  coalesce(s.is_returning, false)::int AS is_returning,
  extract(hour FROM s.occurred_at AT TIME ZONE 'Asia/Kolkata')::int AS hour_ist,
  (extract(isodow FROM s.occurred_at AT TIME ZONE 'Asia/Kolkata') >= 6)::int AS is_weekend,
  a.*
FROM start s
LEFT JOIN conv c USING (session_id)
LEFT JOIN agg a USING (session_id)
"""

CATEGORICAL = ["channel", "device", "os", "landing_type"]


def database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    env_file = HERE.parent / ".env.local"
    if not url and env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith("DATABASE_URL="):
                url = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not url:
        sys.exit("DATABASE_URL is not set (environment or ../.env.local).")
    return url


def load(conn: psycopg.Connection, include_seed: bool) -> pd.DataFrame:
    cur = conn.execute(FEATURE_SQL, {"include_seed": include_seed, "excluded": EXCLUDED_EVENTS})
    df = pd.DataFrame(cur.fetchall(), columns=[d.name for d in cur.description])
    return df.loc[:, ~df.columns.duplicated()]  # a.* repeats session_id


def to_matrix(df: pd.DataFrame) -> tuple[pd.DataFrame, np.ndarray]:
    y = df["converted"].astype(int).to_numpy()
    numeric = df.drop(columns=["session_id", "is_seed", "converted", *CATEGORICAL]).apply(pd.to_numeric).fillna(0.0)
    dummies = pd.get_dummies(df[CATEGORICAL], prefix=CATEGORICAL, dtype=float)
    return pd.concat([numeric, dummies], axis=1).astype(float), y


def xgb_model(pos_weight: float) -> xgb.XGBClassifier:
    # Deliberately small and regularised: the dataset is tiny and imbalanced.
    return xgb.XGBClassifier(
        n_estimators=200, learning_rate=0.05, max_depth=3, min_child_weight=1, subsample=0.8,
        colsample_bytree=0.8, reg_lambda=1.0, scale_pos_weight=pos_weight, eval_metric="logloss",
        random_state=SEED, n_jobs=1,
    )


def evaluate(X: pd.DataFrame, y: np.ndarray, repeats: int) -> dict:
    """Repeated stratified k-fold. Metrics are computed within each test fold and then averaged.

    (Pooling out-of-fold scores across folds is biased with this few positives: each fold's model is
    calibrated to its own training prevalence, which drags a no-signal model well below AUC 0.5.)
    """
    n_splits = int(min(5, y.sum(), len(y) - y.sum()))
    pos_weight = (len(y) - y.sum()) / max(y.sum(), 1)
    models = {
        "xgboost": lambda: xgb_model(pos_weight),
        "logistic_regression": lambda: make_pipeline(StandardScaler(), LogisticRegression(class_weight="balanced", max_iter=5000)),
        "majority_baseline": lambda: DummyClassifier(strategy="prior"),
    }
    results = {name: {"roc_auc": [], "pr_auc": []} for name in models}
    cv = RepeatedStratifiedKFold(n_splits=n_splits, n_repeats=repeats, random_state=SEED)
    for train_idx, test_idx in cv.split(X, y):
        y_test = y[test_idx]
        for name, make in models.items():
            scores = make().fit(X.iloc[train_idx], y[train_idx]).predict_proba(X.iloc[test_idx])[:, 1]
            results[name]["roc_auc"].append(roc_auc_score(y_test, scores))
            results[name]["pr_auc"].append(average_precision_score(y_test, scores))
    return {
        "folds": n_splits,
        "repeats": repeats,
        "prevalence": float(y.mean()),
        "models": {
            name: {k: {"mean": float(np.mean(v)), "std": float(np.std(v))} for k, v in m.items()}
            for name, m in results.items()
        },
    }


def permutation_test(X: pd.DataFrame, y: np.ndarray, observed: float, n_perm: int, repeats: int) -> dict:
    """Is XGBoost's cross-validated ROC-AUC better than what the same procedure gets on shuffled labels?"""
    rng = np.random.default_rng(SEED)
    pos_weight = (len(y) - y.sum()) / max(y.sum(), 1)
    n_splits = int(min(5, y.sum(), len(y) - y.sum()))
    null = []
    for _ in range(n_perm):
        y_perm = rng.permutation(y)
        cv = RepeatedStratifiedKFold(n_splits=n_splits, n_repeats=repeats, random_state=int(rng.integers(1_000_000)))
        aucs = [roc_auc_score(y_perm[te], xgb_model(pos_weight).fit(X.iloc[tr], y_perm[tr]).predict_proba(X.iloc[te])[:, 1])
                for tr, te in cv.split(X, y_perm)]
        null.append(float(np.mean(aucs)))
    null = np.array(null)
    return {
        "permutations": n_perm,
        "null_mean": float(null.mean()),
        "null_p05": float(np.percentile(null, 5)),
        "null_p95": float(np.percentile(null, 95)),
        "p_value": float(((null >= observed).sum() + 1) / (n_perm + 1)),
    }


def explain(X: pd.DataFrame, y: np.ndarray) -> tuple[xgb.XGBClassifier, list[dict]]:
    """Fit on all sessions; rank features by mean |SHAP| (XGBoost's built-in pred_contribs)."""
    model = xgb_model((len(y) - y.sum()) / max(y.sum(), 1)).fit(X, y)
    contribs = model.get_booster().predict(xgb.DMatrix(X), pred_contribs=True)[:, :-1]  # last column = bias
    importance = np.abs(contribs).mean(axis=0)
    rows = []
    for i in np.argsort(-importance):
        if importance[i] <= 0:
            continue
        values = X.iloc[:, i].to_numpy()
        # Direction: does a higher feature value push the prediction up or down?
        corr = np.corrcoef(values, contribs[:, i])[0, 1] if values.std() > 0 and contribs[:, i].std() > 0 else 0.0
        rows.append({"feature": X.columns[i], "mean_abs_shap": float(importance[i]),
                     "direction": "higher → more likely" if corr > 0 else "higher → less likely"})
    return model, rows


def report_markdown(meta: dict, metrics: dict, features: list[dict]) -> str:
    m = metrics["models"]
    fmt = lambda d: f"{d['mean']:.3f} ± {d['std']:.3f}"
    lines = [
        "# Conversion model — XGBoost baseline",
        "",
        f"Trained {meta['trained_at']} on **{meta['n_sessions']} sessions** "
        f"({meta['n_positive']} converted, {metrics['prevalence']:.1%}); "
        f"{meta['n_seed']} of them are seeded demo sessions." if meta["include_seed"] else
        f"Trained {meta['trained_at']} on **{meta['n_sessions']} real sessions** ({meta['n_positive']} converted).",
        "",
        "Target: the session produced a booking or an enquiry. Features: browsing behaviour before conversion only.",
        "",
        f"## Cross-validated performance ({metrics['folds']}-fold stratified × {metrics['repeats']} repeats)",
        "",
        "| Model | ROC-AUC | PR-AUC |",
        "|---|---|---|",
        *[f"| {name.replace('_', ' ')} | {fmt(v['roc_auc'])} | {fmt(v['pr_auc'])} |" for name, v in m.items()],
        "",
        f"Chance level: ROC-AUC 0.5, PR-AUC ≈ {metrics['prevalence']:.3f} (the conversion rate).",
        "",
        *([
            "### Permutation test (is there any signal at all?)",
            "",
            f"The same XGBoost + cross-validation run on {pt['permutations']} label-shuffled copies of the data scores "
            f"ROC-AUC {pt['null_mean']:.3f} on average (90% of runs between {pt['null_p05']:.3f} and {pt['null_p95']:.3f}). "
            f"Real labels score {m['xgboost']['roc_auc']['mean']:.3f} → p = {pt['p_value']:.2f}"
            + (" — **better than chance**." if pt["p_value"] < 0.05 else " — **no evidence the features predict conversion yet**."),
            "",
        ] if (pt := metrics.get("permutation_test")) else []),
        "## What drives the prediction (mean |SHAP|, model fit on all sessions)",
        "",
        "| Feature | Importance | Effect |",
        "|---|---|---|",
        *[f"| {f['feature']} | {f['mean_abs_shap']:.3f} | {f['direction']} |" for f in features[:12]],
        "",
        "## Reading this",
        "",
        *meta["caveats"],
    ]
    return "\n".join(lines) + "\n"


def caveats(meta: dict, metrics: dict) -> list[str]:
    out = []
    xgb_auc = metrics["models"]["xgboost"]["roc_auc"]
    if meta["n_positive"] < 50:
        out.append(f"- Only {meta['n_positive']} conversions: every metric above is very noisy (see the ±). "
                   "Treat this as a pipeline check, not a finding.")
    if meta["include_seed"] and meta["n_seed"] > meta["n_sessions"] / 2:
        out.append("- Most sessions are seeded demo data, in which converting sessions were picked at random. "
                   "A leak-free model *should* score near chance here; a high score would point to leakage.")
    pt = metrics.get("permutation_test")
    if pt and pt["p_value"] >= 0.05:
        out.append(f"- The permutation test (p = {pt['p_value']:.2f}) finds no evidence of signal, so the feature ranking "
                   "describes what the model latched onto, not real drivers of conversion.")
    elif not pt and xgb_auc["mean"] - xgb_auc["std"] <= 0.5:
        out.append("- XGBoost is not reliably better than chance on this data.")
    if xgb_auc["mean"] < 0.5:
        low_tail = pt and xgb_auc["mean"] < pt["null_p05"]
        out.append("- A cross-validated AUC *below* 0.5 is not a model that predicts backwards: with this few conversions, "
                   "shuffled labels also land below 0.5 on average"
                   + (f" ({pt['null_mean']:.2f}), and this run fell in the low tail of that range. " if low_tail else ". ")
                   + "It means there is nothing reliable to learn yet.")
    out.append("- Re-run with `--real-only` once the site has a few hundred real sessions and ~50+ conversions.")
    return out


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--real-only", action="store_true", help="exclude seeded demo sessions")
    p.add_argument("--repeats", type=int, default=10, help="cross-validation repeats (default 10)")
    p.add_argument("--permutations", type=int, default=30, help="label-shuffle permutations for the significance test (0 = skip)")
    p.add_argument("--no-db-write", action="store_true", help="don't record the run in ml_model_runs")
    args = p.parse_args()

    with psycopg.connect(database_url()) as conn:
        df = load(conn, include_seed=not args.real_only)
        X, y = to_matrix(df)
        n_pos = int(y.sum())
        print(f"{len(y)} sessions · {n_pos} converted · {X.shape[1]} features")
        if n_pos < 3 or len(y) - n_pos < 3:
            sys.exit("Not enough converted and non-converted sessions to train (need at least 3 of each).")

        metrics = evaluate(X, y, args.repeats)
        if args.permutations:
            print(f"Permutation test ({args.permutations} shuffles)…")
            metrics["permutation_test"] = permutation_test(X, y, metrics["models"]["xgboost"]["roc_auc"]["mean"], args.permutations, repeats=2)
        model, features = explain(X, y)

        meta = {
            "trained_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            "n_sessions": len(y), "n_positive": n_pos, "n_seed": int(df["is_seed"].sum()),
            "include_seed": not args.real_only, "n_features": X.shape[1],
        }
        meta["caveats"] = caveats(meta, metrics)

        ARTIFACTS.mkdir(exist_ok=True)
        REPORTS.mkdir(exist_ok=True)
        model.save_model(ARTIFACTS / "conversion_xgb.json")
        (REPORTS / "latest.md").write_text(report_markdown(meta, metrics, features))
        (REPORTS / "latest.json").write_text(json.dumps({"meta": meta, "metrics": metrics, "features": features}, indent=2))

        if not args.no_db_write:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS ml_model_runs (
                  id bigserial PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), model text NOT NULL,
                  target text NOT NULL, n_sessions integer NOT NULL, n_positive integer NOT NULL, n_seed integer NOT NULL,
                  include_seed boolean NOT NULL, metrics jsonb NOT NULL, top_features jsonb NOT NULL, caveats jsonb NOT NULL)""")
            conn.execute(
                "INSERT INTO ml_model_runs (model, target, n_sessions, n_positive, n_seed, include_seed, metrics, top_features, caveats) "
                "VALUES ('xgboost-baseline', 'session_conversion', %s, %s, %s, %s, %s, %s, %s)",
                (meta["n_sessions"], n_pos, meta["n_seed"], meta["include_seed"], Jsonb(metrics), Jsonb(features[:10]), Jsonb(meta["caveats"])),
            )

    m = metrics["models"]
    print(f"ROC-AUC  xgboost {m['xgboost']['roc_auc']['mean']:.3f}±{m['xgboost']['roc_auc']['std']:.3f}  "
          f"logreg {m['logistic_regression']['roc_auc']['mean']:.3f}  baseline {m['majority_baseline']['roc_auc']['mean']:.3f}")
    print(f"PR-AUC   xgboost {m['xgboost']['pr_auc']['mean']:.3f}±{m['xgboost']['pr_auc']['std']:.3f}  "
          f"(chance ≈ {metrics['prevalence']:.3f})")
    if (pt := metrics.get("permutation_test")):
        print(f"Permutation null ROC-AUC {pt['null_mean']:.3f} [{pt['null_p05']:.3f}, {pt['null_p95']:.3f}] → p = {pt['p_value']:.2f}")
    print("Top features:", ", ".join(f["feature"] for f in features[:5]))
    print(f"Report: {REPORTS / 'latest.md'}")


if __name__ == "__main__":
    main()
