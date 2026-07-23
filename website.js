import { GoogleGenAI } from "@google/genai";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST erforderlich"});
  if(!process.env.GEMINI_API_KEY) return res.status(500).json({error:"GEMINI_API_KEY fehlt in Vercel."});
  try{
    const {prompt}=req.body||{};
    const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
    const r=await ai.models.generateContent({
      model:"gemini-3.6-flash",
      contents:`Erstelle eine vollständige moderne responsive Website als EINE HTML-Datei mit eingebettetem CSS und JavaScript. Gib ausschließlich den HTML-Code aus, ohne Markdown-Codeblock. Wunsch: ${prompt}`
    });
    let html=(r.text||"").replace(/^```html\s*/i,"").replace(/```$/,"").trim();
    res.status(200).json({html});
  }catch(e){res.status(500).json({error:e?.message||"Website-Fehler"});}
}