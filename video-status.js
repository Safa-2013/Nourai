import { fail, getApiKey } from "./_utils.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Nur GET ist erlaubt." });
    const operation = String(req.query?.operation || "");
    if (!/^operations\/[A-Za-z0-9._-]+$/.test(operation)) return res.status(400).json({ error: "Ungültiger Video-Vorgang." });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operation}`, {
      headers: { "x-goog-api-key": getApiKey() }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Videostatus konnte nicht geladen werden.");
    if (data.error) throw new Error(data.error.message || "Videogenerierung fehlgeschlagen.");

    if (!data.done) return res.status(200).json({ done: false });
    const uri = data?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
    if (!uri) throw new Error("Das Video ist fertig, aber die Download-Adresse fehlt.");
    res.status(200).json({
      done: true,
      downloadUrl: `/api/video-download?uri=${encodeURIComponent(uri)}`
    });
  } catch (error) {
    fail(res, error);
  }
}
