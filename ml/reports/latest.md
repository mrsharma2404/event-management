# Conversion model — XGBoost baseline

Trained 2026-10-22 13:29 UTC on **137 sessions** (11 converted, 8.0%).

Target: the session produced a booking or an enquiry. Features: browsing behaviour before conversion only.

## Cross-validated performance (5-fold stratified × 10 repeats)

| Model | ROC-AUC | PR-AUC |
|---|---|---|
| xgboost | 0.659 ± 0.231 | 0.348 ± 0.222 |
| logistic regression | 0.727 ± 0.149 | 0.337 ± 0.216 |
| majority baseline | 0.500 ± 0.000 | 0.080 ± 0.014 |

Chance level: ROC-AUC 0.5, PR-AUC ≈ 0.080 (the conversion rate).

### Permutation test (is there any signal at all?)

The same XGBoost + cross-validation run on 30 label-shuffled copies of the data scores ROC-AUC 0.491 on average (90% of runs between 0.331 and 0.629). Real labels score 0.659 → p = 0.06 — **no evidence the features predict conversion yet**.

## What drives the prediction (mean |SHAP|, model fit on all sessions)

| Feature | Importance | Effect |
|---|---|---|
| n_events | 1.009 | higher → more likely |
| active_seconds | 0.816 | higher → more likely |
| avg_load_ms | 0.798 | higher → more likely |
| n_tier_selects | 0.749 | higher → more likely |
| n_date_selects | 0.506 | higher → more likely |
| hour_ist | 0.472 | higher → more likely |
| os_Android | 0.453 | higher → more likely |
| n_wishlist | 0.316 | higher → less likely |
| n_testimonials | 0.252 | higher → more likely |
| max_price_viewed | 0.237 | higher → less likely |
| n_reviews | 0.122 | higher → less likely |
| channel_direct | 0.112 | higher → more likely |

## What this tells us

- Shown one visit that converted and one that didn't, the model picks the converter 66% of the time (a coin flip gets 50%). The signal is promising but borderline (p = 0.06); more data will confirm it.
- 8% of visits convert. Among the visits the model ranks highest, conversions are about 4.3× as common, so it is useful for spotting hot leads to follow up first.
- Top signal: interactions: converters averaged 34.5 vs 19.7 for visits that didn't convert.
- Top signal: time spent browsing: converters averaged 1222 s vs 700 s for visits that didn't convert.
- Top signal: average page load time: converters averaged 1661 ms vs 1541 ms for visits that didn't convert.
- A simple logistic regression does slightly better for now (ROC-AUC 0.73 vs 0.66), which is normal with this little data; XGBoost usually pulls ahead as visits grow.
- Based on 137 visits and 11 conversions; the scores will firm up as more visits come in.
