import { GoogleGenAI } from "@google/genai";
import { allowPost, bodyOf, fail, getApiKey } from "../lib/utils.js";
function extractJson(value=""){const cleaned=String(value).replace(/^```(?:json)?\s*/i,"").replace(/```\s*$/i,"").trim();const s=cleaned.indexOf("{");const e=cleaned.lastIndexOf("}");if(s<0||e<0)throw new Error("Kein gültiges Storyboard erhalten.");return JSON.parse(cleaned.slice(s,e+1));}
function safeColor(value,fallback){return /^#[0-9a-f]{6}$/i.test(String(value||""))?value:fallback;}
export default async function handler(req,res){
  if(!allowPost(req,res))return;
  try{
    const {prompt,aspectRatio="16:9"}=bodyOf(req);
    if(!String(prompt||"").trim())return res.status(400).json({error:"Bitte beschreibe das Video."});
    const ai=new GoogleGenAI({apiKey:getApiKey()});
    const interaction=await ai.interactions.create({model:"gemini-3.6-flash",input:String(prompt).trim(),system_instruction:`Du bist Regisseur für kurze Social-Media-Motion-Graphics. Erstelle ein Storyboard für ein kostenlos lokal gerendertes 8-Sekunden-Video. Antworte ausschließlich als JSON: {"title":"kurzer Titel","subtitle":"kurze Unterzeile","musicMood":"ruhig|energetisch|dramatisch|freundlich","scenes":[{"text":"maximal 8 Wörter","emoji":"genau ein passendes Emoji","color1":"#RRGGBB","color2":"#RRGGBB"},{"text":"maximal 8 Wörter","emoji":"genau ein passendes Emoji","color1":"#RRGGBB","color2":"#RRGGBB"},{"text":"maximal 8 Wörter","emoji":"genau ein passendes Emoji","color1":"#RRGGBB","color2":"#RRGGBB"}]}. Keine Markdown-Zeichen und keine weiteren Felder.`,generation_config:{thinking_level:"low"}});
    const raw=extractJson(interaction.output_text||"");
    const fallback=[{text:"Deine Idee wird sichtbar",emoji:"✨",color1:"#6d5dfc",color2:"#17112f"},{text:"Kreativ. Schnell. Kostenlos.",emoji:"🎬",color1:"#0ea5e9",color2:"#10213b"},{text:"Erstellt mit Nour AI",emoji:"N",color1:"#8b5cf6",color2:"#1f153f"}];
    const scenes=(Array.isArray(raw.scenes)?raw.scenes:fallback).slice(0,4).map((scene,index)=>({text:String(scene?.text||fallback[index%fallback.length].text).slice(0,70),emoji:String(scene?.emoji||fallback[index%fallback.length].emoji).slice(0,4),color1:safeColor(scene?.color1,fallback[index%fallback.length].color1),color2:safeColor(scene?.color2,fallback[index%fallback.length].color2)}));
    res.status(200).json({freeMode:true,aspectRatio,storyboard:{title:String(raw.title||"Nour AI Video").slice(0,80),subtitle:String(raw.subtitle||prompt).slice(0,120),musicMood:String(raw.musicMood||"energetisch"),scenes:scenes.length?scenes:fallback}});
  }catch(error){fail(res,error);}
}
