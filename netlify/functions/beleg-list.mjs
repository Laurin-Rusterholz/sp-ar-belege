import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: cors });

  try {
    const store = getStore("belege");
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "POST" && action === "mark") {
      const body = await req.json();
      const id = body.id;
      if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: cors });
      
      const raw = await store.get("beleg:" + id);
      if (!raw) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: cors });
      
      const beleg = JSON.parse(raw);
      beleg.status = body.status || "verarbeitet";
      beleg.processedAt = new Date().toISOString();
      await store.set("beleg:" + id, JSON.stringify(beleg));
      
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
    }

    let index = [];
    try {
      const existing = await store.get("index");
      if (existing) index = JSON.parse(existing);
    } catch {}

    const belege = [];
    for (const id of index) {
      try {
        const raw = await store.get("beleg:" + id);
        if (raw) belege.push(JSON.parse(raw));
      } catch {}
    }

    belege.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const status = url.searchParams.get("status");
    const filtered = status ? belege.filter(b => b.status === status) : belege;

    return new Response(JSON.stringify({ belege: filtered, total: belege.length }), { status: 200, headers: cors });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
  }
};
