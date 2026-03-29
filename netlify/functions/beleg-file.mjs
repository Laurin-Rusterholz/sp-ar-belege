import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: cors });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing id", { status: 400, headers: cors });

    const store = getStore("belege");
    
    const metaRaw = await store.get("beleg:" + id);
    const meta = metaRaw ? JSON.parse(metaRaw) : {};
    
    const fileData = await store.get("file:" + id);
    if (!fileData) return new Response("File not found", { status: 404, headers: cors });

    const binary = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));

    return new Response(binary, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": meta.fileType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${meta.fileName || 'beleg'}"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
};
```
