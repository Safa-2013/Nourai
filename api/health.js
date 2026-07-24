import { json } from "../lib/utils.js";
export default async function handler(req,res){
  json(res,200,{ok:true,service:"Nour AI Studio v3",hasGeminiKey:Boolean(process.env.GEMINI_API_KEY),method:req.method,time:new Date().toISOString()});
}
