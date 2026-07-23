import { allowPost, bodyOf, fail, getApiKey } from "./_utils.js";

export default async function handler(req, res) {
  if (!allowPost(req, res)) return;
  try {
    const { prompt, aspectRatio = "16:9" } = bodyOf(req);
    if (!String(prompt || "").trim()) return res.status(400).json({ error: "Bitte beschreibe das Video." });

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getApiKey()
      },
      body: JSON.stringify({
        instances: [{ prompt: String(prompt).trim() }],
        parameters: {
          aspectRatio,
          durationSeconds: "8",
          resolution: "720p",
          personGeneration: "allow_adult"
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Video konnte nicht gestartet werden.");
    if (!data.name) throw new Error("Google hat keine Vorgangsnummer zurückgegeben.");
    res.status(200).json({ operation: data.name });
  } catch (error) {
    fail(res, error);
  }
}
