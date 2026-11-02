# SKN Flowers Stall — பூ கணக்கு

Daily flower entry + monthly bill PDF app for SKN Flowers Stall (Vazhappadi & VOC Market, Salem).

- `public/` — single-page Tamil UI (entry, accounts, bills, backup)
- `netlify/functions/api.mjs` — API backed by Netlify Blobs, protected by the `SKN_PIN` env var

Customer data is NOT stored in this repo. Load it once from the app: மேலும் → Backup-இலிருந்து மீட்டெடு.
