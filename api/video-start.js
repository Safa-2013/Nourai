import { GoogleGenAI } from "@google/genai";
import { allowPost, bodyOf, getApiKey } from "../lib/utils.js";

function friendlyError(res, error) {
  const message = String(error?.message || error || "Unbekannter Fehler");
  if (/429|quota|RESOURCE_EXHAUSTED|billing|paid tier/i.test(message)) {
    return res.status(402).json({
      error: "Videogenerierung mit Veo benötigt einen bezahlten Gemini-API-Tarif. Aktiviere zuerst die Abrechnung für dein Google-Projekt."
    });
  }
  console.error(error);
  return res.status(Number(error?.statusCode) || 500).json({ error: message });
}

export default async function handler(req, res) {
  if (!allowPost(req, res)) return;
  try {
    const { prompt, aspectRatio = "16:9" } = bodyOf(req);
    if (!String(prompt || "").trim()) return res.status(400).json({ error: "Bitte beschreibe das Video." });

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const operation = await ai.models.generateVideos({
      model: process.env.NOUR_VIDEO_MODEL || "veo-3.1-lite-generate-preview",
      prompt: String(prompt).trim(),
      config: {
        aspectRatio,
        resolution: "720p",
        durationSeconds: 8,
        numberOfVideos: 1
      }
    });

    if (!operation?.name) throw new Error("Google hat keine Vorgangsnummer zurückgegeben.");
    res.status(200).json({ operation: operation.name });
  } catch (error) {
    friendlyError(res, error);
  }
}
