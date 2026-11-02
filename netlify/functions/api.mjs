import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const store = () => getStore({ name: "skn-flowers", consistency: "strong" });

async function getAccounts(s) {
  return (await s.get("accounts", { type: "json" })) || [];
}

const MONTH = /^\d{4}-\d{2}$/;
const ACC = /^[a-z0-9_-]{1,40}$/i;

export default async (req) => {
  const pin = process.env.SKN_PIN;
  if (!pin) return json({ error: "PIN not configured" }, 500);
  if (req.headers.get("x-pin") !== pin) return json({ error: "bad pin" }, 401);

  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/api\/?/, "");
  const s = store();

  try {
    if (route === "login") return json({ ok: true });

    if (route === "data" && req.method === "GET") {
      const m = url.searchParams.get("m");
      if (!MONTH.test(m || "")) return json({ error: "bad month" }, 400);
      const accounts = await getAccounts(s);
      const rows = (await s.get("month/" + m, { type: "json" })) || {};
      return json({ accounts, rows });
    }

    if (route === "accounts" && req.method === "PUT") {
      const body = await req.json();
      if (!Array.isArray(body.accounts)) return json({ error: "bad body" }, 400);
      await s.setJSON("accounts", body.accounts);
      return json({ ok: true });
    }

    if (route === "month" && req.method === "PUT") {
      const m = url.searchParams.get("m");
      const acc = url.searchParams.get("acc");
      if (!MONTH.test(m || "") || !ACC.test(acc || "")) return json({ error: "bad params" }, 400);
      const body = await req.json();
      if (!Array.isArray(body.rows)) return json({ error: "bad body" }, 400);
      const key = "month/" + m;
      const cur = (await s.get(key, { type: "json" })) || {};
      if (body.rows.length) cur[acc] = body.rows;
      else delete cur[acc];
      await s.setJSON(key, cur);
      return json({ ok: true });
    }

    if (route === "restore" && req.method === "PUT") {
      const body = await req.json();
      if (!Array.isArray(body.accounts) || typeof body.months !== "object" || !body.months) return json({ error: "bad body" }, 400);
      const months = Object.entries(body.months);
      if (months.some(([m, v]) => !MONTH.test(m) || typeof v !== "object" || !v)) return json({ error: "bad months" }, 400);
      await s.setJSON("accounts", body.accounts);
      for (const [m, v] of months) await s.setJSON("month/" + m, v);
      return json({ ok: true, accounts: body.accounts.length, months: months.length });
    }

    if (route === "backup" && req.method === "GET") {
      const accounts = await getAccounts(s);
      const { blobs } = await s.list({ prefix: "month/" });
      const months = {};
      for (const b of blobs) months[b.key.slice(6)] = await s.get(b.key, { type: "json" });
      return json({ exportedAt: new Date().toISOString(), accounts, months });
    }

    return json({ error: "not found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: String(e && e.message || e) }, 500);
  }
};

export const config = { path: "/api/*" };
