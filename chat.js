import { GoogleGenAI } from "@google/genai";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST erforderlich"});
  if(!process.env.GEMINI_API_KEY) return res.status(500).json({error:"GEMINI_API_KEY fehlt in Vercel."});
  try{
    const {messages=[]}=req.body||{};
    const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
    const input=messages.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content}]}));
    const r=await ai.models.generateContent({
      model:"gemini-3.6-flash",
      contents:input,
      config:{systemInstruction:"Du bist Nour AI. Antworte hilfreich, klar und in der Sprache des Benutzers."}
    });
    res.status(200).json({text:r.text||"Keine Antwort erhalten."});
  }catch(e){res.status(500).json({error:e?.message||"KI-Fehler"});}
}