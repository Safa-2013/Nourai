import { GoogleGenAI } from "@google/genai";
import { allowPost, bodyOf, getApiKey } from "../lib/utils.js";

function parseDataUrl(value) {
  const match = String(value || "").match(/^data:([^;]+);base64,(.+)$/);
  return match ? { mime_type: match[1], data: match[2] } : null;
}

function sendFriendlyError(res, error) {
  const message = String(error?.message || error || "Unbekannter Fehler");
  if (/429|quota|RESOURCE_EXHAUSTED|limit:\s*0/i.test(message)) {
    return res.status(402).json({
      error: "Bildgenerierung ist für dieses Google-Projekt nicht im kostenlosen API-Tarif enthalten. Aktiviere in Google AI Studio/Google Cloud die Abrechnung. Der normale Chat bleibt weiterhin nutzbar."
    });
  }
  console.error(error);
  return res.status(Number(error?.statusCode) || 500).json({ error: message });
}

export default async function handler(req, res) {
  if (!allowPost(req, res)) return;
  try {
    const { prompt, aspectRatio = "1:1", imageSize = "1K", inputImage } = bodyOf(req);
    if (!String(prompt || "").trim()) return res.status(400).json({ error: "Bitte beschreibe das Bild." });

    const reference = parseDataUrl(inputImage);
    const input = reference
      ? [
          { type: "text", text: String(prompt).trim() },
          { type: "image", data: reference.data, mime_type: reference.mime_type }
        ]
      : String(prompt).trim();

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const interaction = await ai.interactions.create({
      model: process.env.NOUR_IMAGE_MODEL || "gemini-3.1-flash-lite-image",
      input,
      response_format: {
        type: "image",
        mime_type: "image/jpeg",
        aspect_ratio: aspectRatio,
        image_size: imageSize
      }
    });

    const image = interaction.output_image;
    if (!image?.data) throw new Error("Das Bildmodell hat kein Bild zurückgegeben.");

    res.status(200).json({
      image: `data:image/jpeg;base64,${image.data}`,
      text: interaction.output_text || "Bild erstellt."
    });
  } catch (error) {
    sendFriendlyError(res, error);
  }
}
