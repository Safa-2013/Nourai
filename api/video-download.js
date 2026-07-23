import { fail, getApiKey } from "./_utils.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).end("Nur GET ist erlaubt.");
    const raw = String(req.query?.uri || "");
    const url = new URL(raw);
    const allowed = url.protocol === "https:" && (
      url.hostname.endsWith("googleapis.com") ||
      url.hostname.endsWith("googleusercontent.com")
    );
    if (!allowed) return res.status(400).end("Ungültige Video-Adresse.");

    const upstream = await fetch(url, {
      redirect: "follow",
      headers: { "x-goog-api-key": getApiKey() }
    });
    if (!upstream.ok || !upstream.body) throw new Error("Video konnte nicht heruntergeladen werden.");

    res.statusCode = 200;
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "video/mp4");
    res.setHeader("Content-Disposition", 'inline; filename="nour-ai-video.mp4"');
    res.setHeader("Cache-Control", "private, max-age=300");

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (error) {
    if (!res.headersSent) return fail(res, error);
    res.end();
  }
}
