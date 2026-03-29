import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: cors });

  try {
    const body = await req.json();
    const { name, title, amount, dueDate, paid, comment, fileName, fileType, fileData } = body;

    if (!name || !title) {
      return new Response(JSON.stringify({ error: "Name und Titel sind Pflicht" }), { status: 400, headers: cors });
    }

    const store = getStore("belege");
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const beleg = {
      id,
      name: name.trim(),
      title: title.trim(),
      amount: parseFloat(amount) || 0,
      dueDate: dueDate || null,
      paid: paid === true || paid === "true",
      comment: (comment || "").trim(),
      fileName: fileName || null,
      fileType: fileType || null,
      hasFile: !!fileData,
      status: "neu",
      createdAt: new Date().toISOString(),
    };

    await store.set("beleg:" + id, JSON.stringify(beleg));

    if (fileData) {
      await store.set("file:" + id, fileData);
    }

    let index = [];
    try {
      const existing = await store.get("index");
      if (existing) index = JSON.parse(existing);
    } catch {}
    index.push(id);
    await store.set("index", JSON.stringify(index));

    return new Response(JSON.stringify({ ok: true, id }), { status: 200, headers: cors });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
  }
};
