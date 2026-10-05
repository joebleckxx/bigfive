# Home CTA rollout

The homepage offers a start link before the feature cards and retains the bottom link. Mobile hero typography and spacing are compacted.

- `home_cta_viewed`: at least 50% of a link enters the viewport, once per placement per component mount. This is visibility, not proof of attention.
- `home_cta_clicked`: a start link is activated.
- Both events include `placement` (`hero` or `bottom`), `locale`, and `home_version=cta_top_v1`, using the existing analytics wrapper and its test-traffic rules.
- Browsers without IntersectionObserver still navigate and record clicks; they do not record visibility.
- Existing `test_started` means the test route loaded. The first `question_answered` establishes actual participation.

Compare equivalent campaign traffic before and after production deployment. This sequential rollout is not a randomized A/B test. Re-entering home can record another impression; use matching identities and attempts for conversion analysis.
