# AGENTS.md — bonnehistoire-site

Architecture notes for agents and maintainers working on www.bonnehistoire.fr.
This file lives at the repository root, outside the 11ty input folder, and is never published
(see "Keeping repo-only files off the site").

**No secrets in this repository.** API keys, tokens and passwords never go into any file here,
including this one, commit messages or the site. Secrets live only in the services that use them
(see "Secrets").

## Overview

```
visitor ──► www.bonnehistoire.fr  (GitHub Pages, static 11ty build of src/)
               │  beta / newsletter form (POST JSON)
               ▼
            newsletter.bonnehistoire.fr/subscribe  (Cloudflare Worker, worker/)
               │  Brevo API (key held as a Worker secret)
               ▼
            Brevo: double opt-in e-mail ─► visitor confirms ─► contact added to the list
                                                              └► redirected to /merci/
```

- **Site:** static, no cookies, no analytics, no server code. Migrated from Wix (layout values were
  measured on the old Wix pages, hence the absolute positioning).
- **Owner / publisher:** 9H41 SARL (legal details are in `src/pages/terms-and-conditions.njk`).

## Static site (11ty)

- `eleventy.config.js`: input `src/`, output `_site/`; passthrough copies `src/assets` and `src/CNAME`.
- `src/_data/site.js`: public site settings (name, domain, contact e-mail, social links).
- `src/_includes/base.njk`: page shell: fixed header, mobile menu overlay, two-column footer
  (social and contact | legal and "À voir aussi").
- `src/pages/`:
  - `index.njk` home: hero with the phone mockup, intro cards, reviews carousel, beta form;
  - `a-propos.njk`, `merci.njk` (double opt-in landing page, `noindex`), `blank.njk` (redirect to `/a-propos/`);
  - legal: `privacy-policy.njk` (includes the `#newsletter` section), `accessibility-statement.njk`, `terms-and-conditions.njk`;
  - `404.njk`, `robots.njk`, `sitemap.njk` (sitemap skips pages with `noindex`).
- `src/assets/css/styles.css`:
  - desktop: a 1440px design scaled to the window with CSS `zoom` (`--zoom`, set by an inline head
    script) from 769px wide;
  - phones (≤768px): separate rules matching the 390px design.
- `src/assets/js/main.js`: mobile menu, reviews carousel (6s autoplay), hero phone growing on scroll
  (capped so it never covers the next section), beta form submission.
- Fonts are self-hosted in `src/assets/fonts/`.

Local preview: `npm install`, then `npm start` (http://localhost:8081). `npm run build` writes `_site/`.

## Hosting and deployment

- GitHub Pages, deployed by `.github/workflows/deploy-pages.yml` on every push to `main`
  (build with `npm install`, not `npm ci`: the lockfile has a macOS-only optional package).
- Custom domain from `src/CNAME`; HTTPS enforced in the Pages settings.
- DNS is on Cloudflare: apex A records and `www` CNAME point to GitHub Pages (DNS only, not proxied).
  The zone also holds the mail records (Google MX, Brevo DKIM and domain verification, DMARC with a
  Brevo report address) and app subdomains that are not part of this repo; leave them alone.

## Newsletter / beta sign-up

- **Form** (`index.njk`, `main.js`): e-mail, required consent checkbox, hidden honeypot field
  `website`. Posts `{email, consent, website}` as JSON to the Worker and shows the result inline.
- **Worker** (`worker/`, its own npm project, not part of the site build):
  - `index.js`: `POST /subscribe` only; checks the origin against an allow-list (live site + local
    dev server), validates the e-mail and consent, silently accepts honeypot hits, then calls Brevo's
    double opt-in endpoint. "Already subscribed" answers like a new sign-up, so the form never
    reveals who is on the list.
  - `cloudflare.config.ts`: Worker name `bonnehistoire-newsletter`, custom domain
    `newsletter.bonnehistoire.fr`, plain variables `BREVO_LIST_ID` and `BREVO_TEMPLATE_ID`,
    and the secret binding `BREVO_API_KEY` (declared, value not stored here).
  - Deploy: `cd worker && npm install && cf deploy`. To set or rotate the key, pass a temporary
    secrets file (`--secrets-file`) kept outside the repo, and delete it right after.
- **Brevo** (account of 9H41): domain bonnehistoire.fr authenticated; sender "La bonne histoire"
  `contact@bonnehistoire.fr`; one list for beta access and news; a French double opt-in template whose
  confirmation link redirects to `/merci/`. The template's sender name must be set explicitly,
  otherwise Brevo shows the company account name. API IP restriction must stay off (Cloudflare
  egress addresses vary).
- The privacy policy (`#newsletter`) documents purpose, consent, Brevo as processor (EU-hosted),
  retention and unsubscribing. Update it if the flow changes.

## Secrets

| Secret | Where it lives | Never in |
| --- | --- | --- |
| Brevo API key | Cloudflare Worker secret `BREVO_API_KEY` | repo, site, logs, chat |
| Cloudflare / GitHub credentials | the maintainer's local CLI logins | repo, CI files |

If a secret is ever exposed, revoke it in the provider, create a new one and redeploy the Worker.

## Keeping repo-only files off the site

- Only `src/` is built; root files (this file, `README.md`, `worker/`) are outside the input folder.
- `eleventy.config.js` also ignores any `AGENTS.md`, in case one is added under `src/`.
- The deploy workflow fails if `_site/` contains `AGENTS.md` or anything from `worker/`.

## Conventions

- French copy on the site; keep the Wix design parity unless asked otherwise.
- Check layout on desktop (1440px), an in-between width (~1000px) and a phone (390px) before pushing.
- Commit locally; push only when the owner says so.
