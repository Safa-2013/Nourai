import { GoogleGenAI } from "@google/genai";
import { allowPost, bodyOf, fail, getApiKey } from "../lib/utils.js";

function parseDataUrl(value) {
  const match = String(value || "").match(/^data:([^;]+);base64,(.+)$/);
  return match ? { mime_type: match[1], data: match[2] } : null;
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
      model: "gemini-3.1-flash-image",
      input,
      response_format: {
        type: "image",
        mime_type: "image/png",
        aspect_ratio: aspectRatio,
        image_size: imageSize
      }
    });

    const image = interaction.output_image;
    if (!image?.data) throw new Error("Das Bildmodell hat kein Bild zurückgegeben. Prüfe, ob Bildgenerierung für dein Google-Projekt freigeschaltet und bezahlt ist.");

    res.status(200).json({
      image: `data:image/png;base64,${image.data}`,
      text: interaction.output_text || "Bild erstellt."
    });
  } catch (error) {
    fail(res, error);
  }
}
