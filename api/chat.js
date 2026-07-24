import { GoogleGenAI } from "@google/genai";
import { allowPost, bodyOf, fail, getApiKey } from "../lib/utils.js";

export default async function handler(req, res) {
  if (!allowPost(req, res)) return;
  try {
    const { prompt, previousInteractionId } = bodyOf(req);
    if (!String(prompt || "").trim()) return res.status(400).json({ error: "Bitte schreibe eine Nachricht." });

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",
      input: String(prompt).trim(),
      previous_interaction_id: previousInteractionId || undefined,
      system_instruction: "Du bist Nour AI, ein hilfreicher kreativer Assistent innerhalb einer App, die kostenlose KI-Vektorgrafiken, lokal gerenderte Motion-Graphic-Videos und Websites mit eigenen Werkzeugen erstellen kann. Antworte klar, freundlich und in der Sprache des Benutzers. Behaupte niemals, du seist nur textbasiert oder könntest grundsätzlich keine Bilder erstellen. Wenn jemand nach den Fähigkeiten fragt, erkläre, dass Nour AI Chat, Bilder, Videos und Websites unterstützt. Behaupte nie, etwas erledigt zu haben, wenn es nicht wirklich erledigt wurde.",
      generation_config: { thinking_level: "low" }
    });

    res.status(200).json({
      text: interaction.output_text || "Ich konnte gerade keine Antwort erzeugen.",
      interactionId: interaction.id || null
    });
  } catch (error) {
    fail(res, error);
  }
}
