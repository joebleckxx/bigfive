# TMJ analytics access and event contract

Repository: joebleckxx/bigfive. Production: https://hellotmj.com.
PostHog organization: tellmejoe. EU project: **288523**.
Project URL: https://eu.posthog.com/project/288523
Ingestion: https://eu.i.posthog.com. Configuration: lib/analytics-config.ts.
The checked-in phc_ token is a public ingestion token, not a personal/read API key.
Optional NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST overrides must point to the same project in the browser and server build.

## Access in future conversations

Use the connected PostHog plugin to read project 288523 directly. Verify the selected project and discover the current event schema before analysis. Do not require a browser login or screenshots when the connector works. Access still depends on the user's connector authorization; application instrumentation cannot install or reauthorize a ChatGPT connector.

Vercel Analytics and Speed Insights remain installed. The Vercel connector available during implementation did not expose Web Analytics event queries. Use PostHog for future product analysis and any historical Vercel CSV exports separately. New instrumentation cannot reconstruct events from before its deployment.

## Events

| Event | Meaning |
|---|---|
| $pageview | A route visit, including locale, campaign tags and sanitized URL |
| test_started | Test route loaded; once per attempt, not a deliberate first answer |
| question_answered | First answer to each question; question number only, never the answer |
| test_completed | All 25 answers present; once per attempt, including across reloads |
| test_abandoned | Best-effort pagehide while incomplete; use a funnel for actual drop-off |
| pay_viewed | Pay route visit |
| checkout_started | Checkout-button request starts |
| checkout_canceled | Return from Stripe cancellation |
| checkout_failed | Checkout URL missing or request failed |
| payment_paid | Signed Stripe webhook for a paid checkout session |
| result_viewed | Result successfully loaded |
| pdf_downloaded | PDF generated and browser download requested; not proof of disk save |
| pdf_failed | PDF generation/download request failed |

Client events share a pseudonymous distinct_id and test_attempt_id. Checkout passes these to Stripe metadata, joining the paid webhook to the browser journey. Identity uses sessionStorage, so cross-tab, cross-device and long-term returning-user identity are intentionally not guaranteed. Attempts expire after 30 minutes of inactivity; retaking resets the attempt. Pageviews include device/referrer context from the SDK. Filter production reports to environment=production and integration_test=false.

The server accepts checkout.session.completed and checkout.session.async_payment_succeeded only when payment_status=paid. Configure the Stripe endpoint to deliver both if adding delayed payment methods (currently checkout accepts cards only). PostHog delivery failure returns HTTP 503 so Stripe retries; stable event UUID and checkout creation timestamp deduplicate these retries. payment_paid timestamp is checkout creation time, not settlement time. Sessions created before this deployment fall back to a Stripe session identity and cannot be reliably joined to earlier browser events.

## Privacy and diagnostics

No answer values, personality scores/results, email addresses or card details are sent. Autocapture, session recordings, exception capture and person profiles are disabled. URL query strings and fragments are stripped; named UTM campaign fields are kept. PostHog respects Do Not Track; that choice is passed to the payment webhook. Vercel retains its existing independent behavior.

Append ?tmj_analytics_test=1 to a URL to mark the entire tab's events as integration_test=true, including checkout metadata. Preview/local browser capture is disabled unless this flag is present. Such custom events are skipped in Vercel; Vercel's automatic pageviews remain independent. Stripe test-mode payments are always marked as test data. Do not count tmj_analytics_healthcheck as customer activity.

Verification commands: npm run test:analytics, npx tsc --noEmit, npm run build (requires existing Stripe environment). Tests cover completion deduplication, retakes, DNT, analytics failures, URL sanitation, payment retry identity, webhook signatures and unpaid sessions. Actual paid production purchases must be verified from real signed webhooks; synthetic diagnostics do not prove real payment delivery.

If data disappears: first check PostHog connector permissions and selected project, then the production deployment, host/key overrides, browser requests and Stripe webhook delivery status. Browser blocking and user preferences can prevent some events; no browser analytics guarantees 100% traffic coverage.
