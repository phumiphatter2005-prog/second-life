# Second Life — ตลาดสินค้ามือสองในมหาวิทยาลัย

เว็บแอปสำหรับซื้อ ขาย แลกเปลี่ยน และแจกฟรีสิ่งของมือสองในชุมชนมหาวิทยาลัย (SDG 12.5, SDG 11.6)

## วิธีเปิดใช้งาน

ต้องมี [Node.js](https://nodejs.org) เวอร์ชัน 22.13 ขึ้นไป

```bash
npm install     # ติดตั้งครั้งแรกครั้งเดียว
npm start       # เปิดเซิร์ฟเวอร์
```

จากนั้นเปิด http://localhost:3000

**ให้เพื่อนในวง Wi-Fi เดียวกันเข้าใช้:** หา IP ของเครื่อง (พิมพ์ `ipconfig` ดูที่ IPv4 Address)
แล้วให้เพื่อนเปิด `http://<IP เครื่อง>:3000` เช่น `http://192.168.1.25:3000`
(ถ้าเข้าไม่ได้ ให้อนุญาต Node.js ใน Windows Firewall)

## โครงสร้างโปรเจกต์

```
server.js        เซิร์ฟเวอร์ + API ทั้งหมด (สมัคร/เข้าสู่ระบบ, สินค้า, รายการโปรด, สถิติ)
db.js            สร้างตารางฐานข้อมูล SQLite + สินค้าตัวอย่าง
make-admin.js    ตั้งผู้ใช้เป็นผู้ดูแลระบบ
supabase/        schema.sql สำหรับฐานข้อมูลออนไลน์ Supabase
data/            ฐานข้อมูลและรูปที่อัปโหลด (สร้างอัตโนมัติ — สำรองโฟลเดอร์นี้ไว้)
public/          หน้าเว็บ (HTML, CSS, JavaScript)
```

## ใช้งาน 2 แบบ

| | GitHub Pages (ฟรี) | `npm start` บนคอมในมหาวิทยาลัย |
|---|---|---|
| เข้าได้จาก | ทุกที่ ผ่านลิงก์ `https://<ชื่อ>.github.io/second-life/` | เครื่องที่ต่อ Wi-Fi เดียวกัน |
| ข้อมูล | **โหมดสาธิต** เก็บในเบราว์เซอร์ของแต่ละคน ไม่แชร์กัน | ฐานข้อมูลกลาง ทุกคนเห็นตรงกัน |
| เหมาะกับ | นำเสนอ / ให้คนลองใช้ | ใช้ซื้อขายจริงภายในมหาวิทยาลัย |

เว็บจะเข้าโหมดสาธิตเองเมื่อเปิดจาก `github.io` หรือเปิดไฟล์ HTML ตรงๆ

### เปิด GitHub Pages (ทำครั้งเดียว)

1. สร้าง repository ใหม่ชื่อ `second-life` แบบ **Public** บน GitHub (ไม่ต้องติ๊กสร้าง README)
2. push โค้ดขึ้นไป
   ```bash
   git remote add origin https://github.com/<ชื่อผู้ใช้>/second-life.git
   git push -u origin main
   ```
3. ใน repository ไปที่ **Settings → Pages → Source** เลือก **GitHub Actions**
4. รอ 1–2 นาที ดูลิงก์เว็บได้ที่แท็บ **Actions** หรือ Settings → Pages

ครั้งต่อไปแค่ `git push` เว็บจะอัปเดตเอง

## นำขึ้นเซิร์ฟเวอร์ออนไลน์ (ถ้าต้องการฐานข้อมูลกลางบนอินเทอร์เน็ต)

ใช้บริการที่รัน Node.js ได้ เช่น Render หรือ Railway (ส่วนใหญ่มีค่าใช้จ่าย)

- คำสั่ง Build: `npm install` คำสั่ง Start: `npm start`
- ตั้งค่า `NODE_ENV=production` (คุกกี้จะใช้ได้เฉพาะ HTTPS)
- **ต้องมี Persistent Disk** แล้วตั้ง `DATA_DIR` ให้ชี้ไปที่ดิสก์นั้น ไม่อย่างนั้นข้อมูลจะหายทุกครั้งที่ deploy ใหม่

## ล้างข้อมูลทั้งหมด

ปิดเซิร์ฟเวอร์ แล้วลบโฟลเดอร์ `data/` เมื่อเปิดใหม่จะเหลือแค่สินค้าตัวอย่าง 7 ชิ้น

## แก้ไขโค้ดแล้วเว็บไม่อัปเดต / หน้าเว็บพัง

GitHub Pages ให้เบราว์เซอร์จำไฟล์ไว้ 10 นาที ทุกครั้งที่แก้ CSS หรือ JS ให้เปลี่ยนเลข `?v=4`
ในไฟล์ HTML ทุกไฟล์เป็นเลขใหม่ (เช่น `?v=5`) ก่อน push เบราว์เซอร์จะโหลดไฟล์ใหม่ทันที

## ระบบหลังบ้าน (Admin)

หน้า `admin.html` (เมนู **หลังบ้าน** จะโผล่เฉพาะบัญชีผู้ดูแลระบบ)

- **ภาพรวม** — จำนวนสินค้า ส่งต่อแล้ว ผู้ใช้ รีวิว แยกตามหมวดหมู่และประเภท
- **สินค้า** — ค้นหา ทำเครื่องหมายส่งต่อแล้ว ลบประกาศของใครก็ได้
- **ผู้ใช้** — ตั้ง/ยกเลิกสิทธิ์แอดมิน ระงับ/ปลดระงับบัญชี (บัญชีที่ถูกระงับเข้าสู่ระบบและลงประกาศไม่ได้)
- **รีวิว** — ลบรีวิวที่ไม่เหมาะสม

ตั้งผู้ดูแลระบบคนแรก (สมัครสมาชิกบนเว็บก่อน):

| ใช้งานแบบ | วิธี |
|---|---|
| `npm start` | `npm run make-admin -- 67402711` หรือตั้งตัวแปร `ADMIN_STUDENT_IDS=67402711` |
| Supabase | SQL Editor: `update public.profiles set role = 'admin' where student_id = '67402711';` |
| โหมดสาธิต | มีบัญชีให้แล้ว: รหัสนักศึกษา `00000` รหัสผ่าน `admin123` |

## ฐานข้อมูลออนไลน์ด้วย Supabase (ฟรี — ทุกคนเห็นข้อมูลตรงกัน แม้เปิดจาก GitHub Pages)

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. **SQL Editor** → วางไฟล์ `supabase/schema.sql` ทั้งไฟล์ → **Run** (สร้างตาราง, สิทธิ์ RLS, ที่เก็บรูป, สินค้าตัวอย่าง)
3. **Authentication → Sign In / Providers → Email** ปิด **Confirm email**
   (เว็บใช้รหัสนักศึกษาแทนอีเมล จึงยืนยันอีเมลไม่ได้)
4. **Project Settings → API** คัดลอก Project URL และ anon public key ไปใส่ใน `public/js/config.js`
5. สมัครสมาชิกบนเว็บ แล้วตั้งตัวเองเป็นแอดมินด้วยคำสั่ง SQL ด้านบน
6. `git push` — เว็บบน GitHub Pages จะใช้ Supabase ทันที

เมื่อใส่ค่าใน `config.js` แล้ว เว็บจะใช้ Supabase เสมอ (แทนทั้ง server.js และโหมดสาธิต)
anon key เปิดเผยได้ ข้อมูลถูกป้องกันด้วย Row Level Security ใน `schema.sql`

## เครดิตรูปภาพสินค้าตัวอย่าง

รูปสินค้าตัวอย่าง 7 ชิ้นใน `public/images/sample-*.jpg` มาจาก [Unsplash](https://unsplash.com) ใช้ฟรีภายใต้ [Unsplash License](https://unsplash.com/license) ย่อให้กว้าง 800px (รูปกระเป๋าเป้ครอปให้เหลือใบเดียว)

| ไฟล์ | สินค้า | ช่างภาพ | ต้นฉบับ |
|---|---|---|---|
| `sample-cs-book.jpg` | หนังสือวิทยาการคอมพิวเตอร์ | [Rick Muigo](https://unsplash.com/@kimothorick) | [unsplash.com/photos/UcuCPy3Pwus](https://unsplash.com/photos/get-coding-and-coding-books-beside-cup-of-coffee-UcuCPy3Pwus) |
| `sample-hoodie.jpg` | เสื้อฮู้ด Oversize | [Mediamodifier](https://unsplash.com/@mediamodifier) | [unsplash.com/photos/kJXGTOY1wLQ](https://unsplash.com/photos/white-hoodie-and-distressed-jeans-kJXGTOY1wLQ) |
| `sample-laptop.jpg` | โน้ตบุ๊ก | [Christopher Gower](https://unsplash.com/@cgower) | [unsplash.com/photos/vjMgqUkS8q8](https://unsplash.com/photos/silver-macbook-pro-on-white-table-vjMgqUkS8q8) |
| `sample-backpack.jpg` | กระเป๋าเป้ | [Wiser by the Mile](https://unsplash.com/@wiserbythemile) | [unsplash.com/photos/1Frndjy7tkM](https://unsplash.com/photos/black-and-brown-backpack-on-white-textile-1Frndjy7tkM) |
| `sample-lamp.jpg` | โคมไฟตั้งโต๊ะ | [Beth Stevenson](https://unsplash.com/@bthstvn) | [unsplash.com/photos/okUB5th8QtQ](https://unsplash.com/photos/black-desk-lamp-on-brown-wooden-table-okUB5th8QtQ) |
| `sample-headphones.jpg` | หูฟังไร้สาย | [Sam Grozyan](https://unsplash.com/@ijeunes) | [unsplash.com/photos/P7KF3cTRKcE](https://unsplash.com/photos/black-wireless-headphones-on-white-desk-P7KF3cTRKcE) |
| `sample-english-book.jpg` | หนังสือภาษาอังกฤษ | [Clarissa Watson](https://unsplash.com/@issaphotography) | [unsplash.com/photos/jAebodq7oxk](https://unsplash.com/photos/pile-of-assorted-title-books-jAebodq7oxk) |
