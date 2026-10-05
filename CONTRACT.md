# Browser call: page ↔ webhook contract

The "Talk in your browser" button asks an n8n webhook for a call. The webhook checks the limits, creates the Retell web call server-side (`POST https://api.retellai.com/v3/create-web-call` with the API key), and returns only what the browser needs to join. The API key never reaches the page or this repo.

The page joins with `retell-client-js-sdk` 3.0.2 (`RetellClient` with a custom `fetch` that answers the SDK's create-call request with the webhook's response). See `assets/js/call.js`.

## Request

```
POST {webcallUrl}                      # set in assets/js/config.js
Origin: https://demo.naumanbuilds.com
Content-Type: application/json

{ "visitor_id": "<random UUID kept in the visitor's localStorage>", "page_version": "1" }
```

The webhook picks the agent itself. It must not take an agent ID from the request.

## Success: HTTP 200

Pass Retell's create-web-call response fields through unchanged, plus `status`:

```json
{
  "status": "ok",
  "call_id": "…",
  "access_token": "…",
  "transport": "gateway",
  "url": "…",
  "ice_servers": [ … ],
  "expires_at": 1760000000000
}
```

`url` and `ice_servers` are optional in Retell's response; include them whenever Retell returns them.

## Errors

Always JSON with a `status` field. The page decides what to show from `status`; HTTP codes are for logs.

| HTTP | `status` | Extra fields | Page shows |
|---|---|---|---|
| 429 | `cap_reached` | `scope`: `daily` or `monthly_spend` | "Demo line is busy" |
| 429 | `rate_limited` | `retry_after_s` (number) | "You can try again in N min" |
| 403 | `forbidden_origin` | | "Something went wrong" |
| 400 | `bad_request` | | "Something went wrong" |
| 503 | `unavailable` | | "Demo offline" (Retell or limit check failed: refuse the call) |
| none | timeout (8 s), network error, tunnel down | | "Demo offline" |

## CORS

- Allow exactly `https://demo.naumanbuilds.com` (`Access-Control-Allow-Origin`, plus `Vary: Origin`).
- Methods `POST, OPTIONS`; header `Content-Type`. Answer the preflight `OPTIONS` with 204.
- For local testing use a separate staging webhook that allows `http://localhost:<port>`. Don't add localhost to the production one.

The origin check only stops other websites from using the button from a browser. Scripts can send any `Origin` and any `visitor_id`, so the protection that matters is server-side: a per-IP limit, the daily call cap and the monthly spend limit.

## Testing the page without the backend

On `localhost` only, add `?mock=ok`, `?mock=busy`, `?mock=limited`, `?mock=offline` or `?mock=error` to the URL to see each state. `ok` simulates a live call without contacting anything.
