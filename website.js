import { GoogleGenAI } from "@google/genai";
import { allowPost, bodyOf, fail, getApiKey, safeWebsiteHtml } from "./_utils.js";

export default async function handler(req, res) {
  if (!allowPost(req, res)) return;
  try {
    const { prompt } = bodyOf(req);
    if (!String(prompt || "").trim()) return res.status(400).json({ error: "Bitte beschreibe die Website." });

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",
      input: String(prompt).trim(),
      system_instruction: `Du bist ein professioneller Webdesigner. Erstelle eine vollständige, moderne und responsive Website als genau EINE HTML-Datei. CSS muss in einem <style>-Block stehen. Verwende kein JavaScript, keine externen Skripte und keine Markdown-Codeblöcke. Verwende bei fehlenden Bildern schöne CSS-Flächen, Gradients oder öffentlich erreichbare Unsplash-URLs. Die Website muss sofort gut aussehen und deutschsprachige Texte enthalten, außer der Benutzer verlangt eine andere Sprache. Gib ausschließlich HTML aus.`,
      generation_config: { thinking_level: "low" }
    });

    const html = safeWebsiteHtml(interaction.output_text || "");
    if (!html.includes("<html")) throw new Error("Die KI hat keine gültige Website geliefert. Bitte versuche es erneut.");
    res.status(200).json({ html });
  } catch (error) {
    fail(res, error);
  }
}
