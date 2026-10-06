// Values that change once the backend is live. Leave a value as null to hide that part of the page.
window.DEMO_CONFIG = {
  // n8n webhook that creates the Retell web call server-side (see CONTRACT.md).
  // Example: "https://<tunnel-hostname>/webhook/webcall_token"
  webcallUrl: null,

  // Demo phone line, once approved for the page. Example:
  // phone: { display: "+1 (312) 555-0100", tel: "+13125550100" },
  phone: null,

  // Recorded test call (made-up details only). Example: "assets/media/test-call.mp3"
  recording: null,

  // Max call length set on the agent, shown to visitors.
  maxMinutes: 5
};
