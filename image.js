import { GoogleGenAI } from "@google/genai";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST erforderlich"});
  if(!process.env.GEMINI_API_KEY) return res.status(500).json({error:"GEMINI_API_KEY fehlt in Vercel."});
  try{
    const {prompt}=req.body||{};
    const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
    const r=await ai.models.generateContent({
      model:"gemini-3.1-flash-image",
      contents:prompt,
      config:{responseModalities:["TEXT","IMAGE"]}
    });
    let image=null,mime="image/png",text="";
    for(const c of r.candidates||[]) for(const p of c.content?.parts||[]){
      if(p.inlineData){image=p.inlineData.data;mime=p.inlineData.mimeType||mime}
      if(p.text) text+=p.text;
    }
    if(!image) throw new Error("Das Bildmodell hat kein Bild zurückgegeben.");
    res.status(200).json({image:`data:${mime};base64,${image}`,text});
  }catch(e){res.status(500).json({error:e?.message||"Bildfehler"});}
}