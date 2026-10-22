# Conversion model — XGBoost baseline

Trained 2026-10-22 13:12 UTC on **136 sessions** (11 converted, 8.1%); 135 of them are seeded demo sessions.

Target: the session produced a booking or an enquiry. Features: browsing behaviour before conversion only.

## Cross-validated performance (5-fold stratified × 10 repeats)

| Model | ROC-AUC | PR-AUC |
|---|---|---|
| xgboost | 0.272 ± 0.174 | 0.100 ± 0.056 |
| logistic regression | 0.401 ± 0.170 | 0.142 ± 0.126 |
| majority baseline | 0.500 ± 0.000 | 0.081 ± 0.013 |

Chance level: ROC-AUC 0.5, PR-AUC ≈ 0.081 (the conversion rate).

### Permutation test (is there any signal at all?)

The same XGBoost + cross-validation run on 30 label-shuffled copies of the data scores ROC-AUC 0.477 on average (90% of runs between 0.339 and 0.620). Real labels score 0.272 → p = 1.00 — **no evidence the features predict conversion yet**.

## What drives the prediction (mean |SHAP|, model fit on all sessions)

| Feature | Importance | Effect |
|---|---|---|
| active_seconds | 0.706 | higher → more likely |
| avg_load_ms | 0.668 | higher → less likely |
| max_price_viewed | 0.626 | higher → more likely |
| n_detail_views | 0.515 | higher → more likely |
| n_testimonials | 0.429 | higher → less likely |
| n_page_views | 0.336 | higher → more likely |
| hour_ist | 0.297 | higher → more likely |
| channel_direct | 0.265 | higher → less likely |
| is_returning | 0.258 | higher → less likely |
| is_weekend | 0.219 | higher → less likely |
| landing_type_listing | 0.177 | higher → less likely |
| os_macOS | 0.172 | higher → more likely |

## Reading this

- Only 11 conversions: every metric above is very noisy (see the ±). Treat this as a pipeline check, not a finding.
- Most sessions are seeded demo data, in which converting sessions were picked at random. A leak-free model *should* score near chance here; a high score would point to leakage.
- The permutation test (p = 1.00) finds no evidence of signal, so the feature ranking describes what the model latched onto, not real drivers of conversion.
- A cross-validated AUC *below* 0.5 is not a model that predicts backwards: with this few conversions, shuffled labels also land below 0.5 on average (0.48), and this run fell in the low tail of that range. It means there is nothing reliable to learn yet.
- Re-run with `--real-only` once the site has a few hundred real sessions and ~50+ conversions.
