import { GoogleGenAI } from "@google/genai";
import { allowPost, bodyOf, fail, getApiKey } from "../lib/utils.js";

export default async function handler(req,res){
  if(!allowPost(req,res)) return;
  try{
    const {prompt,aspectRatio="16:9"}=bodyOf(req);
    if(!String(prompt||"").trim()) return res.status(400).json({error:"Bitte beschreibe das Video."});
    const ai=new GoogleGenAI({apiKey:getApiKey()});
    const operation=await ai.models.generateVideos({
      model:"veo-3.1-generate-preview",
      prompt:String(prompt).trim(),
      config:{aspectRatio,resolution:"720p",durationSeconds:8,personGeneration:"allow_adult",numberOfVideos:1}
    });
    if(!operation?.name) throw new Error("Google hat keine Vorgangsnummer zurückgegeben.");
    res.status(200).json({operation:operation.name});
  }catch(error){fail(res,error);}
}
