/* ---------- ตั้งค่าฐานข้อมูลออนไลน์ Supabase ----------
   ใส่ค่าจาก Supabase Dashboard → Project Settings → API แล้วเว็บจะใช้ฐานข้อมูลกลางทันที
   (ทั้งบน GitHub Pages และ npm start) — เว้นว่างไว้ = ใช้ server.js หรือโหมดสาธิตเหมือนเดิม
   anon key เปิดเผยได้ ความปลอดภัยมาจาก Row Level Security ใน supabase/schema.sql */
window.SL_CONFIG = {
  supabaseUrl: "https://fqyalbbogakntrqfvkxz.supabase.co",
  supabaseAnonKey: "sb_publishable_rc7X505--xfz33QbkHcZfA_94tEa2BQ",   // คีย์ publishable (anon public)
  /* Supabase เข้าสู่ระบบด้วยอีเมล จึงแปลงรหัสนักศึกษาเป็น <รหัส>@<โดเมนนี้>
     (ต้องปิด Confirm email ใน Authentication → Sign In / Providers → Email) */
  emailDomain: "student.secondlife.app"
};
