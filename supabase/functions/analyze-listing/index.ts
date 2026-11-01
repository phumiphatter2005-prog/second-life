// Edge Function: วิเคราะห์รูปสินค้าด้วย Google Gemini (ดู docs/AI.md)
// คีย์อยู่ใน secret GEMINI_API_KEY เท่านั้น ห้ามใส่ในโค้ดหรือหน้าเว็บ
import { handle } from "./logic.ts";

Deno.serve(req => handle(req, {
  geminiKey: Deno.env.get("GEMINI_API_KEY"),
  model: Deno.env.get("GEMINI_MODEL"),
  supabaseUrl: Deno.env.get("SUPABASE_URL")
}));
