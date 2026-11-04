-- =====================================================================
-- Second Life — อัปเดตฐานข้อมูลครั้งที่ 9: ยกเลิก / เปลี่ยนผู้รับการส่งต่อ (รันต่อจาก 008_admin_dashboard.sql)
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางไฟล์นี้ทั้งไฟล์ → Run
--
-- เพิ่ม: 1) trigger บนตาราง products: เมื่อยกเลิกการส่งต่อ หรือผู้รับเปลี่ยนจากคนเดิม
--           - ลบรีวิวของผู้รับคนเดิมสำหรับสินค้าชิ้นนั้น (คะแนนสินค้าและคะแนนผู้ขายคำนวณจากตาราง reviews
--             ทุกครั้งที่อ่าน จึงอัปเดตทันทีโดยไม่ต้องเก็บค่าแยก)
--           - การ์ด "ส่งต่อแล้ว" ในห้องแชตของผู้รับคนเดิม → data.status = 'cancelled' (หน้าเว็บแสดงเป็นสีเทา)
--             และมีข้อความระบบ "ผู้ประกาศยกเลิกการส่งต่อแล้ว"
--        2) chat_passed / sl_pass_to: นับเฉพาะการ์ดที่ยังไม่ถูกยกเลิก → ห้องเดิมกด "ส่งต่อแล้ว" ใหม่ได้
-- ทำในฐานข้อมูลทั้งหมด ไม่ว่าจะยกเลิกจากหน้าเว็บ หลังบ้าน หรือแก้ตารางตรงๆ ก็ได้ผลเหมือนกัน
--
-- ไฟล์นี้ลบเฉพาะรีวิวของผู้รับคนเดิมตอนที่ยกเลิกการส่งต่อเท่านั้น (ไม่ลบตารางหรือข้อมูลอื่น) และรันซ้ำได้
-- =====================================================================

-- ---------- 1) trigger: ยกเลิก / เปลี่ยนผู้รับ ----------
create or replace function public.products_pass_cancelled()
returns trigger language plpgsql security definer set search_path = public as $$
declare room bigint;
begin
  -- ผู้รับคนเดิมหลุดจากการเป็นผู้รับ (ยกเลิกการส่งต่อ หรือเปลี่ยนเป็นคนอื่น / ไม่ระบุ)
  if old.passed_to is not null and (not new.passed or new.passed_to is distinct from old.passed_to) then
    delete from reviews where product_id = new.id and user_id = old.passed_to;

    for room in
      select r.id from chat_rooms r where r.product_id = new.id and r.buyer_id = old.passed_to
    loop
      if exists (select 1 from chat_messages m where m.room_id = room and m.kind = 'passed'
                 and coalesce(m.data ->> 'status', '') <> 'cancelled') then
        update chat_messages set data = jsonb_set(coalesce(data, '{}'::jsonb), '{status}', '"cancelled"')
        where room_id = room and kind = 'passed' and coalesce(data ->> 'status', '') <> 'cancelled';
        perform public.chat_system(room, 'ผู้ประกาศยกเลิกการส่งต่อแล้ว', 'system', new.user_id);
      end if;
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists products_pass_cancelled on public.products;
create trigger products_pass_cancelled
  after update of passed, passed_to on public.products
  for each row execute function public.products_pass_cancelled();

-- ---------- 2) กด "ส่งต่อแล้ว" ในห้องแชตเดิมได้อีกครั้งหลังยกเลิก (แทนที่ฟังก์ชันจาก 007_passed_to.sql) ----------
create or replace function public.chat_passed(p_room bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r chat_rooms; p products;
begin
  if not public.is_active_user() then raise exception 'กรุณาเข้าสู่ระบบก่อน'; end if;
  select * into r from chat_rooms where id = p_room;
  if not found then raise exception 'ไม่พบห้องแชตนี้'; end if;
  if auth.uid() <> r.seller_id then raise exception 'เฉพาะผู้ประกาศเท่านั้น'; end if;
  if exists (select 1 from chat_messages where room_id = p_room and kind = 'passed'
             and coalesce(data ->> 'status', '') <> 'cancelled') then
    raise exception 'ยืนยันส่งต่อในห้องนี้ไปแล้ว';
  end if;
  select * into p from products where id = r.product_id;
  if p.passed and p.passed_to is distinct from r.buyer_id then
    raise exception 'ของชิ้นนี้ส่งต่อให้คนอื่นไปแล้ว';
  end if;
  update products set passed = true, passed_to = r.buyer_id, passed_at = now() where id = r.product_id;
  perform public.chat_system(p_room, 'ผู้ประกาศยืนยันว่าส่งต่อแล้ว', 'passed', r.seller_id);
end $$;

create or replace function public.sl_pass_to(p_id bigint, p_to uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p products; room bigint;
begin
  if not public.is_active_user() then raise exception 'กรุณาเข้าสู่ระบบก่อน'; end if;
  select * into p from products where id = p_id;
  if not found then raise exception 'ไม่พบสินค้านี้'; end if;
  if p.user_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'แก้ไขได้เฉพาะประกาศของตัวเอง';
  end if;
  if p.passed then raise exception 'ประกาศนี้ส่งต่อไปแล้ว'; end if;
  if p_to is not null then
    select r.id into room from chat_rooms r
    where r.product_id = p_id and r.buyer_id = p_to
      and exists (select 1 from chat_messages m where m.room_id = r.id);
    if room is null then raise exception 'เลือกได้เฉพาะคนที่เคยแชตเรื่องสินค้านี้'; end if;
  end if;

  update products set passed = true, passed_to = p_to, passed_at = now() where id = p_id;
  /* ห้องแชตของผู้รับได้การ์ด "ส่งต่อแล้ว" ใบใหม่ (ใบที่ถูกยกเลิกไปแล้วไม่นับ) */
  if room is not null and not exists (select 1 from chat_messages where room_id = room and kind = 'passed'
                                      and coalesce(data ->> 'status', '') <> 'cancelled') then
    perform public.chat_system(room, 'ผู้ประกาศยืนยันว่าส่งต่อแล้ว', 'passed', p.user_id);
  end if;
  return jsonb_build_object('passed', true, 'passedTo', p_to);
end $$;
