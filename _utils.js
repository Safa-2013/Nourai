export function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const error = new Error("Der Gemini-Schlüssel fehlt. Öffne Vercel → Settings → Environment Variables und füge GEMINI_API_KEY hinzu.");
    error.statusCode = 500;
    throw error;
  }
  return key;
}

export function allowPost(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Nur POST ist erlaubt." });
    return false;
  }
  return true;
}

export function bodyOf(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

export function fail(res, error) {
  const status = Number(error?.statusCode) || 500;
  const message = error?.message || "Unbekannter Fehler";
  console.error(error);
  res.status(status).json({ error: message });
}

export function stripCodeFences(text = "") {
  return String(text)
    .replace(/^\s*```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

export function safeWebsiteHtml(html = "") {
  let cleaned = stripCodeFences(html);
  cleaned = cleaned.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/\son\w+\s*=\s*(["']).*?\1/gi, "");
  cleaned = cleaned.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  if (!/^<!doctype html>/i.test(cleaned)) cleaned = "<!doctype html>\n" + cleaned;
  return cleaned;
}
