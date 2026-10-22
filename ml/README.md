# ML — conversion model (XGBoost baseline)

`conversion_model.py` trains a baseline **XGBoost** classifier on the site's event data. The question it answers: *from how someone browses during a session, how likely is that session to end in a booking or an enquiry?*

- **Rows:** one per session.
- **Label:** the session produced a row in `bookings` or `enquiries`.
- **Features:** behaviour **before** converting only. That covers page and package views, listing clicks, searches, filters, gallery, reviews, FAQs, price views, tier and date picks, wishlist, shares, and WhatsApp or call clicks. It also covers the channel, device, OS, landing page type, returning visitor, hour and weekend flags, the highest package price viewed, and page load time.
- **Leakage guard:** events after the conversion are cut off. The conversion steps themselves are never used as features: enquiry forms, the Plan-my-event wizard, checkout, payment and confirmation. Leaving `enquiry_form_viewed` in, for example, made a no-signal dataset look like AUC 0.78.
- **Evaluation:**
  - 5-fold stratified cross-validation × 10 repeats, with metrics computed within each fold.
  - Compared against logistic regression and a majority-class baseline.
  - A **label-permutation test** checks whether the score beats what the same procedure gets on shuffled labels.
- **Explanation:** mean |SHAP| per feature, from XGBoost's built-in `pred_contribs`, with the direction of each effect.

## Run

```bash
cd ml
uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python -r requirements.txt
brew install libomp                      # macOS only: XGBoost needs the OpenMP runtime
DATABASE_URL='postgresql://…' .venv/bin/python conversion_model.py
```

| Flag | Effect |
|---|---|
| `--real-only` | Ignore seeded demo sessions (`npm run db:seed-demo`) |
| `--repeats N` | Cross-validation repeats (default 10) |
| `--permutations N` | Shuffles for the significance test (default 30, `0` to skip) |
| `--no-db-write` | Don't record the run in `ml_model_runs` |

Outputs:
- `reports/latest.md` and `reports/latest.json`: the metrics, permutation test, feature ranking and caveats.
- `artifacts/conversion_xgb.json`: the fitted model.
- A row in `ml_model_runs`, which `/dashboard` shows as the **Conversion model** card.

## Current result, and how to read it

The data today is 135 seeded demo sessions plus 1 real one, with 11 conversions. In the seed data the converting sessions were picked **at random**, so a correct, leak-free model should find nothing, and it doesn't:
- ROC-AUC 0.27 ± 0.17
- Shuffled labels average 0.48
- Permutation p = 1.00

A cross-validated AUC below 0.5 at this size is the usual small-sample bias when there's no signal, not a model that predicts backwards.

As a **positive control**, I planted a signal in the same feature matrix ("picked a date" and "viewed 2+ packages" raise the conversion odds). The pipeline then scored ROC-AUC 0.86 against 0.51 on shuffled labels, p = 0.048, and ranked the two planted features in its top three. So it does find real signal when there is some.

Re-run with `--real-only` once the live site has a few hundred real sessions and roughly 50+ conversions. That's when the feature ranking starts to say something about your customers.
