# demo.naumanbuilds.com

Landing page for a voice-agent demo: an AI receptionist for a made-up company, Northside HVAC & Plumbing. Visitors can talk to it in the browser or call it. Plain HTML, CSS and JavaScript, served by GitHub Pages from `main`. No build step.

- `assets/js/config.js`: the three things to fill in when they're ready (webhook URL, phone number, recorded call). Anything left `null` stays hidden, and the call button shows "Demo offline".
- `assets/js/call.js`: the browser call button. Page ↔ webhook contract: [CONTRACT.md](CONTRACT.md).
- `assets/vendor/retell-client-3.0.2.min.js`: Retell's browser SDK 3.0.2 bundled with its dependencies, loaded only when someone starts a call. Licences in `assets/vendor/LICENSES.txt`.
- `assets/fonts/`: self-hosted Schibsted Grotesk and JetBrains Mono (SIL Open Font License).

Preview locally: `python3 -m http.server` in this folder, then open the printed address. Add `?mock=ok` (or `busy`, `limited`, `offline`, `error`) to try the call states without the backend.

Built by [Nauman](https://naumanbuilds.com).
