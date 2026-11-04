-- =====================================================================
-- Second Life — อัปเดตฐานข้อมูลครั้งที่ 7: ส่งต่อให้ใคร (รันต่อจาก 006_swap_wish.sql)
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางไฟล์นี้ทั้งไฟล์ → Run
--
-- เพิ่ม: 1) คอลัมน์ products.passed_to (ผู้รับ) และ products.passed_at (เวลาที่ส่งต่อ)
--        2) เจ้าของเลือกผู้รับจากคนที่เคยแชตเรื่องสินค้านี้ หรือ "คนนอกระบบ / ไม่ระบุ" (sl_pass_candidates, sl_pass_to)
--        3) ประกาศที่ส่งต่อแล้ว ไม่แสดงในหน้าแรก ค้นหา และรายการโปรดของคนอื่น
--           หน้ารายละเอียดเปิดได้เฉพาะเจ้าของ ผู้รับ และแอดมิน (คนอื่นได้แค่ {restricted: true})
--        4) ประวัติการส่งต่อในหน้าโปรไฟล์ (sl_pass_history)
--        5) ให้ดาวได้เฉพาะผู้รับของชิ้นนั้น (passed_to = ฉัน)
-- ตัวนับ "ของที่ได้ชีวิตที่สอง" (sl_stats) ยังนับทุกชิ้นที่ passed = true เหมือนเดิม ไม่ได้แก้
--
-- ไฟล์นี้ไม่ลบตารางหรือข้อมูลเดิม (ไม่มี DROP / DELETE / TRUNCATE) และรันซ้ำได้
-- =====================================================================

-- ---------- 1) คอลัมน์ใหม่ ----------
alter table public.products add column if not exists passed_to uuid references public.profiles (id) on delete set null;
alter table public.products add column if not exists passed_at timestamptz;
create index if not exists products_passed_to_idx on public.products (passed_to) where passed_to is not null;

-- ข้อมูลเดิม: ของที่เคยกด "ส่งต่อแล้ว" ในห้องแชต → ผู้รับคือคนในห้องนั้น (ห้องล่าสุด)
update public.products p set passed_to = x.buyer_id, passed_at = x.at
from (select distinct on (r.product_id) r.product_id, r.buyer_id, m.created_at as at
      from chat_rooms r join chat_messages m on m.room_id = r.id and m.kind = 'passed'
      order by r.product_id, m.created_at desc) x
where p.id = x.product_id and p.passed and p.passed_to is null;

-- ---------- 2) ใครเห็นประกาศที่ส่งต่อแล้วได้บ้าง ----------
create or replace function public.sl_can_see(p public.products)
returns boolean language sql stable security definer set search_path = public as $$
  select not p.passed or p.user_id = auth.uid() or p.passed_to = auth.uid() or public.is_admin();
$$;

-- ---------- 3) อ่านสินค้า (แทนที่ฟังก์ชันจาก 006_swap_wish.sql) ----------
-- หน้าแรก/ค้นหา (ไม่ส่งพารามิเตอร์) = เฉพาะที่ยังไม่ส่งต่อ
-- รายการโปรด/ประกาศของคน = ซ่อนชิ้นที่ส่งต่อแล้ว ยกเว้นฉันเป็นเจ้าของหรือผู้รับ
-- รายละเอียด (p_id) ที่ไม่มีสิทธิ์ดู = {id, passed, restricted} เท่านั้น
create or replace function public.sl_products(p_id bigint default null, p_owner uuid default null, p_favs boolean default false)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select case when v.ok then jsonb_build_object(
    'id', p.id, 'title', p.title, 'price', p.price, 'type', p.type, 'category', p.category,
    'condition', p.condition, 'pickup', p.pickup,
    'contact', case when public.is_active_user() then p.contact end,
    'desc', p.description, 'img', p.img, 'images', p.images, 'passed', p.passed,
    'wantSwap', p.want_swap,
    'passedAt', public.ms(p.passed_at),
    'passedToName', case when p.passed and p.passed_to is not null then t.name end,
    'isRecipient', p.passed and p.passed_to is not null and p.passed_to = auth.uid(),
    'sellerName', coalesce(u.name, 'Second Life'),
    'sellerAvatar', u.avatar_url,
    'hasOwner', p.user_id is not null,
    'isOwner', p.user_id is not null and p.user_id = auth.uid(),
    'isFav', exists (select 1 from favorites f where f.product_id = p.id and f.user_id = auth.uid()),
    'rating', r.avg, 'ratingCount', r.n,
    'sellerRating', s.avg, 'sellerRatingCount', s.n,
    'createdAt', public.ms(p.created_at))
  else jsonb_build_object('id', p.id, 'passed', true, 'restricted', true) end
  from products p
  cross join lateral (select public.sl_can_see(p) as ok) v
  left join profiles u on u.id = p.user_id
  left join profiles t on t.id = p.passed_to
  cross join lateral (select avg(stars)::float8 as avg, count(*) as n from reviews where product_id = p.id) r
  cross join lateral (select avg(rv.stars)::float8 as avg, count(*) as n
                      from reviews rv join products p2 on p2.id = rv.product_id
                      where p2.user_id = p.user_id) s
  where (p_id is null or p.id = p_id)
    and (p_owner is null or p.user_id = p_owner)
    and (not p_favs or exists (select 1 from favorites f where f.product_id = p.id and f.user_id = auth.uid()))
    and (p_id is not null or v.ok)
    and (p_id is not null or p_owner is not null or p_favs or not p.passed)
  order by p.created_at desc;
$$;

-- ---------- 4) รายชื่อคนที่เคยแชตเรื่องสินค้านี้ (ให้เจ้าของเลือกผู้รับ) ----------
create or replace function public.sl_pass_candidates(p_id bigint)
returns setof jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from products where id = p_id and (user_id = auth.uid() or public.is_admin())) then
    raise exception 'เฉพาะผู้ประกาศเท่านั้น';
  end if;
  return query
    select jsonb_build_object('userId', r.buyer_id, 'name', u.name, 'avatar', u.avatar_url,
                              'lastAt', public.ms(r.last_message_at))
    from chat_rooms r join profiles u on u.id = r.buyer_id
    where r.product_id = p_id and exists (select 1 from chat_messages m where m.room_id = r.id)
    order by r.last_message_at desc nulls last;
end $$;

-- ---------- 5) เจ้าของยืนยัน "ส่งต่อแล้ว" พร้อมเลือกผู้รับ (p_to = null คือคนนอกระบบ / ไม่ระบุ) ----------
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
  /* ห้องแชตของผู้รับได้การ์ด "ส่งต่อแล้ว" ให้ดาวได้ทันที เหมือนกดในแชต */
  if room is not null and not exists (select 1 from chat_messages where room_id = room and kind = 'passed') then
    perform public.chat_system(room, 'ผู้ประกาศยืนยันว่าส่งต่อแล้ว', 'passed', p.user_id);
  end if;
  return jsonb_build_object('passed', true, 'passedTo', p_to);
end $$;

-- กดซ้ำเพื่อยกเลิก (และปุ่มในหลังบ้าน): ยกเลิกแล้วล้างผู้รับ / ส่งต่อแบบไม่ระบุผู้รับ
create or replace function public.sl_toggle_passed(p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
declare owner uuid; result boolean;
begin
  if not public.is_active_user() then raise exception 'กรุณาเข้าสู่ระบบก่อน'; end if;
  select user_id into owner from products where id = p_id;
  if not found then raise exception 'ไม่พบสินค้านี้'; end if;
  if owner is distinct from auth.uid() and not public.is_admin() then
    raise exception 'แก้ไขได้เฉพาะประกาศของตัวเอง';
  end if;
  update products set passed = not passed,
                      passed_to = null,
                      passed_at = case when passed then null else now() end
  where id = p_id returning passed into result;
  return result;
end $$;

-- ---------- 6) กด "ส่งต่อแล้ว" ในห้องแชต → ผู้รับคือคนในห้องนั้น (แทนที่ฟังก์ชันจาก 003_chat.sql) ----------
create or replace function public.chat_passed(p_room bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r chat_rooms; p products;
begin
  if not public.is_active_user() then raise exception 'กรุณาเข้าสู่ระบบก่อน'; end if;
  select * into r from chat_rooms where id = p_room;
  if not found then raise exception 'ไม่พบห้องแชตนี้'; end if;
  if auth.uid() <> r.seller_id then raise exception 'เฉพาะผู้ประกาศเท่านั้น'; end if;
  if exists (select 1 from chat_messages where room_id = p_room and kind = 'passed') then
    raise exception 'ยืนยันส่งต่อในห้องนี้ไปแล้ว';
  end if;
  select * into p from products where id = r.product_id;
  if p.passed and p.passed_to is distinct from r.buyer_id then
    raise exception 'ของชิ้นนี้ส่งต่อให้คนอื่นไปแล้ว';
  end if;
  update products set passed = true, passed_to = r.buyer_id, passed_at = coalesce(passed_at, now())
  where id = r.product_id;
  perform public.chat_system(p_room, 'ผู้ประกาศยืนยันว่าส่งต่อแล้ว', 'passed', r.seller_id);
end $$;

-- ---------- 7) ประวัติการส่งต่อ (เห็นเฉพาะเจ้าของกับผู้รับ) ----------
create or replace function public.sl_pass_history()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'given', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'title', p.title, 'img', p.img, 'type', p.type, 'price', p.price,
               'passedAt', public.ms(coalesce(p.passed_at, p.created_at)),
               'otherName', t.name, 'otherAvatar', t.avatar_url)
             order by coalesce(p.passed_at, p.created_at) desc)
      from products p left join profiles t on t.id = p.passed_to
      where p.passed and p.user_id = auth.uid()), '[]'::jsonb),
    'received', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'title', p.title, 'img', p.img, 'type', p.type, 'price', p.price,
               'passedAt', public.ms(coalesce(p.passed_at, p.created_at)),
               'otherName', coalesce(o.name, 'Second Life'), 'otherAvatar', o.avatar_url,
               'reviewed', exists (select 1 from reviews rv where rv.product_id = p.id and rv.user_id = auth.uid()))
             order by coalesce(p.passed_at, p.created_at) desc)
      from products p left join profiles o on o.id = p.user_id
      where p.passed and p.passed_to = auth.uid()), '[]'::jsonb));
$$;

-- ---------- 8) ให้ดาวได้เฉพาะผู้รับของชิ้นนั้น (แทนที่ฟังก์ชันจาก 005_security.sql) ----------
create or replace function public.sl_review(p_id bigint, p_stars integer, p_comment text)
returns void language plpgsql security definer set search_path = public as $$
declare p products;
begin
  if not public.is_active_user() then raise exception 'กรุณาเข้าสู่ระบบก่อน'; end if;
  select * into p from products where id = p_id;
  if not found then raise exception 'ไม่พบสินค้านี้'; end if;
  if p.user_id = auth.uid() then raise exception 'ให้ดาวประกาศของตัวเองไม่ได้'; end if;
  if not p.passed or p.passed_to is distinct from auth.uid() then
    raise exception 'ให้ดาวได้เฉพาะผู้ที่ได้รับของชิ้นนี้';
  end if;
  if p_stars is null or p_stars not between 1 and 5 then raise exception 'กรุณาเลือกดาว 1–5 ดวง'; end if;
  insert into reviews (product_id, user_id, stars, comment)
  values (p_id, auth.uid(), p_stars, left(trim(coalesce(p_comment, '')), 300))
  on conflict (product_id, user_id) do update
    set stars = excluded.stars, comment = excluded.comment, created_at = now();
end $$;
