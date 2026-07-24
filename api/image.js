import { GoogleGenAI } from "@google/genai";
import { allowPost, bodyOf, fail, getApiKey } from "../lib/utils.js";

function cleanSvg(value = "") {
  let svg = String(value).replace(/^```(?:svg|xml)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = svg.indexOf("<svg");
  const end = svg.lastIndexOf("</svg>");
  if (start >= 0 && end >= 0) svg = svg.slice(start, end + 6);
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*"[^"]*"/gi, "").replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  if (!svg.startsWith("<svg") || !svg.includes("</svg>")) throw new Error("Die kostenlose Bild-KI hat kein gültiges SVG geliefert. Bitte versuche es noch einmal.");
  return svg;
}

export default async function handler(req, res) {
  if (!allowPost(req, res)) return;
  try {
    const { prompt, aspectRatio = "1:1" } = bodyOf(req);
    if (!String(prompt || "").trim()) return res.status(400).json({ error: "Bitte beschreibe das gewünschte Bild." });
    const sizes = {"1:1":[1200,1200],"4:5":[1080,1350],"16:9":[1600,900],"9:16":[900,1600]};
    const [width,height] = sizes[aspectRatio] || sizes["1:1"];
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",
      input: `Erstelle eine hochwertige Vektorillustration für diese Beschreibung: ${String(prompt).trim()}`,
      system_instruction: `Du bist ein professioneller Grafikdesigner. Erzeuge ausschließlich vollständigen SVG-Code, ohne Markdown und ohne Erklärung. Das SVG muss viewBox="0 0 ${width} ${height}" sowie width="${width}" height="${height}" besitzen, modern und werbetauglich aussehen, Gradients, Formen, Schatten und gut lesbare Typografie verwenden, keine externen Bilder, Fonts, Skripte oder Links enthalten und nur sichere SVG-Elemente nutzen. Bei fotorealistischen Wünschen erstelle stattdessen eine hochwertige stilisierte Vektorillustration.`,
      generation_config: { thinking_level: "low" }
    });
    const svg = cleanSvg(interaction.output_text || "");
    const encoded = Buffer.from(svg, "utf8").toString("base64");
    res.status(200).json({image:`data:image/svg+xml;base64,${encoded}`,text:"Kostenlose KI-Vektorgrafik erstellt. Du kannst sie im Canva-ähnlichen Editor weiterbearbeiten.",format:"svg",freeMode:true});
  } catch (error) { fail(res,error); }
}
