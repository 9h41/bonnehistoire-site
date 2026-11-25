// Newsletter / beta sign-up relay for www.bonnehistoire.fr.
// The site posts {email, consent} here; we ask Brevo to send its double opt-in e-mail
// (template BREVO_TEMPLATE_ID), and the contact joins list BREVO_LIST_ID only after confirming.
// The Brevo key lives in the BREVO_API_KEY secret, never in the site.
const ALLOWED_ORIGINS = ["https://www.bonnehistoire.fr", "https://bonnehistoire.fr", "http://127.0.0.1:8081", "http://localhost:8081"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", "Vary": "Origin" };
}
const json = (status, body, origin) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...cors(origin) } });

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (url.pathname !== "/subscribe" || request.method !== "POST") return json(404, { ok: false }, origin);
    if (!ALLOWED_ORIGINS.includes(origin)) return json(403, { ok: false, error: "origin" }, origin);

    let data;
    try { data = await request.json(); } catch { return json(400, { ok: false, error: "format" }, origin); }
    const email = String(data.email || "").trim().toLowerCase();
    if (data.website) return json(200, { ok: true }, origin); // honeypot: pretend it worked
    if (!EMAIL.test(email) || email.length > 254) return json(400, { ok: false, error: "email" }, origin);
    if (data.consent !== true) return json(400, { ok: false, error: "consent" }, origin);

    const res = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        email,
        includeListIds: [Number(env.BREVO_LIST_ID)],
        templateId: Number(env.BREVO_TEMPLATE_ID),
        redirectionUrl: "https://www.bonnehistoire.fr/merci/",
      }),
    });
    if (res.ok) return json(200, { ok: true }, origin);
    const detail = await res.text();
    // already subscribed: same answer as a new sign-up, so the form does not reveal who is on the list
    if (res.status === 400 && /already exist/i.test(detail)) return json(200, { ok: true }, origin);
    console.log("brevo error", res.status, detail.slice(0, 300));
    return json(502, { ok: false, error: "upstream" }, origin);
  },
};
