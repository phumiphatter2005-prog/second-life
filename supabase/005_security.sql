-- =====================================================================
-- Second Life — อัปเดตฐานข้อมูลครั้งที่ 5: ปิดช่องโหว่ (รันต่อจาก 004_avatars.sql)
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางไฟล์นี้ทั้งไฟล์ → Run
--
-- แก้: 1) bucket "chat-images" เป็นแบบส่วนตัว เปิดรูปได้เฉพาะคนในห้องแชตและแอดมิน (ผ่าน signed URL)
--      2) รีวิวได้เฉพาะคนที่ผู้ประกาศยืนยัน "ส่งต่อแล้ว" ให้ในห้องแชต (chat_passed)
--      3) คนที่ไม่ได้เข้าสู่ระบบ (anon) เรียกฟังก์ชัน admin_* ไม่ได้
--
-- ไฟล์นี้ไม่ลบตารางหรือข้อมูลเดิม (ไม่มี DROP / DELETE / TRUNCATE) และรันซ้ำได้
-- รีวิวเดิมที่มีอยู่แล้วยังอยู่ครบ แต่คนที่ไม่ผ่านเงื่อนไขใหม่จะแก้รีวิวนั้นไม่ได้อีก
-- =====================================================================

-- ---------- 1) รูปในแชต: bucket ส่วนตัว ----------
update storage.buckets set public = false where id = 'chat-images';

/* data.img ของข้อความเสนอแลก: รูปเก่าเป็นลิงก์ public เต็ม รูปใหม่เป็น path "<user id>/<ไฟล์>"
   แปลงให้เหลือ path เดียวกับ storage.objects.name */
create or replace function public.chat_image_path(p_img text)
returns text language sql immutable as $$
  select case when position('/storage/v1/object/public/chat-images/' in coalesce(p_img, '')) > 0
              then split_part(split_part(p_img, '/storage/v1/object/public/chat-images/', 2), '?', 1)
              else nullif(p_img, '') end;
$$;

create index if not exists chat_messages_img_idx on public.chat_messages (public.chat_image_path(data ->> 'img'))
  where kind = 'swap';

/* รูปนี้ถูกส่งในห้องที่ฉันอยู่ (หรือฉันเป็นแอดมิน) หรือไม่
   ไฟล์ต้องอยู่ในโฟลเดอร์ของผู้ส่งข้อความเอง กันการใส่ path รูปของคนอื่นลงในข้อความเพื่อขอสิทธิ์ดู */
create or replace function public.chat_can_view_image(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from chat_messages m join chat_rooms r on r.id = m.room_id
    where m.kind = 'swap' and public.chat_image_path(m.data ->> 'img') = p_name
      and split_part(p_name, '/', 1) = m.sender_id::text
      and auth.uid() in (r.buyer_id, r.seller_id));
$$;

-- การสร้าง signed URL ต้องมีสิทธิ์ select ไฟล์นั้น: เจ้าของไฟล์ (ก่อนส่ง) คนในห้อง และแอดมิน
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'chat-images: owner or room parties read') then
    create policy "chat-images: owner or room parties read" on storage.objects
      for select to authenticated
      using (bucket_id = 'chat-images'
             and ((storage.foldername(name))[1] = auth.uid()::text or public.chat_can_view_image(name)));
  end if;
end $$;

-- ---------- 2) รีวิวได้เฉพาะคนที่ได้รับของจริงผ่านแชต ----------
-- "ได้รับจริง" = ผู้ประกาศกด "ส่งต่อแล้ว" ในห้องแชตของเรา (ข้อความ kind = 'passed' จาก chat_passed)
-- ส่วน chat_give แค่เลือกผู้รับของแจกฟรี ยังไม่นับว่าได้รับของ
create or replace function public.sl_review(p_id bigint, p_stars integer, p_comment text)
returns void language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if not public.is_active_user() then raise exception 'กรุณาเข้าสู่ระบบก่อน'; end if;
  select user_id into owner from products where id = p_id;
  if not found then raise exception 'ไม่พบสินค้านี้'; end if;
  if owner = auth.uid() then raise exception 'ให้ดาวประกาศของตัวเองไม่ได้'; end if;
  if not exists (select 1 from chat_rooms r join chat_messages m on m.room_id = r.id and m.kind = 'passed'
                 where r.product_id = p_id and r.buyer_id = auth.uid()) then
    raise exception 'ให้ดาวได้หลังผู้ประกาศยืนยันว่าส่งต่อของให้คุณในแชตแล้ว';
  end if;
  if p_stars is null or p_stars not between 1 and 5 then raise exception 'กรุณาเลือกดาว 1–5 ดวง'; end if;
  insert into reviews (product_id, user_id, stars, comment)
  values (p_id, auth.uid(), p_stars, left(trim(coalesce(p_comment, '')), 300))
  on conflict (product_id, user_id) do update
    set stars = excluded.stars, comment = excluded.comment, created_at = now();
end $$;

-- ---------- 3) ฟังก์ชัน admin_* เรียกได้เฉพาะผู้ที่เข้าสู่ระบบแล้ว (ข้างในยังเช็ก admin_check() เหมือนเดิม) ----------
-- Supabase ให้สิทธิ์ execute กับ anon โดยอัตโนมัติ ถ้าเพิ่มฟังก์ชัน admin_* ใหม่ภายหลังให้รันส่วนนี้ซ้ำ
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p
           where p.pronamespace = 'public'::regnamespace and p.proname like 'admin\_%'
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
