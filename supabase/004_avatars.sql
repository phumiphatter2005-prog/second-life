-- =====================================================================
-- Second Life — อัปเดตฐานข้อมูลครั้งที่ 4: รูปโปรไฟล์ (รันต่อจาก 003_chat.sql)
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางไฟล์นี้ทั้งไฟล์ → Run
--
-- เพิ่ม: คอลัมน์ avatar_url, bucket "avatars" (ทุกคนดูรูปได้ / อัปโหลด แก้ ลบ ได้เฉพาะโฟลเดอร์ของตัวเอง /
--        แอดมินลบรูปไม่เหมาะสมได้), แก้ชื่อที่แสดง, ส่งรูปโปรไฟล์ไปกับสินค้า รีวิว แชต และหลังบ้าน
--
-- ไฟล์นี้ไม่ลบตารางหรือข้อมูลเดิม (ไม่มี DROP / DELETE / TRUNCATE) และรันซ้ำได้
-- =====================================================================

-- ---------- 1) คอลัมน์รูปโปรไฟล์ ----------
alter table public.profiles add column if not exists avatar_url text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_avatar_url_len') then
    alter table public.profiles add constraint profiles_avatar_url_len check (char_length(avatar_url) <= 500);
  end if;
end $$;

-- ---------- 2) แก้โปรไฟล์ของตัวเอง (ผ่านฟังก์ชันเท่านั้น ตาราง profiles ยังไม่มี policy update) ----------
create or replace function public.profile_update(p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare clean text := left(trim(coalesce(p_name, '')), 60);
begin
  if not public.is_active_user() then raise exception 'กรุณาเข้าสู่ระบบก่อน'; end if;
  if clean = '' then raise exception 'กรุณากรอกชื่อที่จะแสดง'; end if;
  update profiles set name = clean where id = auth.uid();
  return jsonb_build_object('name', clean);
end $$;

/* ตั้งรูปโปรไฟล์ (null = ลบรูป) — ต้องเป็นไฟล์ใน avatars/<user id>/ ของตัวเองเท่านั้น
   คืนลิงก์รูปเดิม เพื่อให้หน้าเว็บลบไฟล์เก่าออกจาก Storage */
create or replace function public.profile_set_avatar(p_url text)
returns text language plpgsql security definer set search_path = public as $$
declare old text;
begin
  if not public.is_active_user() then raise exception 'กรุณาเข้าสู่ระบบก่อน'; end if;
  if p_url is not null and (
       char_length(p_url) > 500
       or position('/storage/v1/object/public/avatars/' || auth.uid()::text || '/' in p_url) = 0) then
    raise exception 'ลิงก์รูปโปรไฟล์ไม่ถูกต้อง';
  end if;
  select avatar_url into old from profiles where id = auth.uid();
  update profiles set avatar_url = p_url where id = auth.uid();
  return old;
end $$;

/* แอดมินลบรูปที่ไม่เหมาะสม — คืนลิงก์รูปเดิมให้หน้าหลังบ้านลบไฟล์ใน Storage */
create or replace function public.admin_remove_avatar(p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
declare old text;
begin
  perform public.admin_check();
  select avatar_url into old from profiles where id = p_user;
  if not found then raise exception 'ไม่พบผู้ใช้นี้'; end if;
  update profiles set avatar_url = null where id = p_user;
  return old;
end $$;

-- ---------- 3) Storage: bucket "avatars" ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$ begin
  -- อ่านได้ (จำเป็นสำหรับการแก้/ลบไฟล์ของตัวเอง) — รูปสาธารณะเปิดผ่านลิงก์ได้ทุกคนอยู่แล้ว
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'avatars: signed-in read') then
    create policy "avatars: signed-in read" on storage.objects
      for select to authenticated using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'avatars: upload own folder') then
    create policy "avatars: upload own folder" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_user());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'avatars: update own folder') then
    create policy "avatars: update own folder" on storage.objects
      for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'avatars: delete own or admin') then
    create policy "avatars: delete own or admin" on storage.objects
      for delete to authenticated
      using (bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
  end if;
end $$;

-- ---------- 4) ส่งรูปโปรไฟล์ไปทุกที่ (แทนที่ฟังก์ชันเดิม ผลลัพธ์เดิมอยู่ครบ + ช่องรูปใหม่) ----------
create or replace function public.sl_products(p_id bigint default null, p_owner uuid default null, p_favs boolean default false)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'title', p.title, 'price', p.price, 'type', p.type, 'category', p.category,
    'condition', p.condition, 'pickup', p.pickup,
    'contact', case when public.is_active_user() then p.contact end,
    'desc', p.description, 'img', p.img, 'images', p.images, 'passed', p.passed,
    'sellerName', coalesce(u.name, 'Second Life'),
    'sellerAvatar', u.avatar_url,
    'hasOwner', p.user_id is not null,
    'isOwner', p.user_id is not null and p.user_id = auth.uid(),
    'isFav', exists (select 1 from favorites f where f.product_id = p.id and f.user_id = auth.uid()),
    'rating', r.avg, 'ratingCount', r.n,
    'sellerRating', s.avg, 'sellerRatingCount', s.n,
    'createdAt', public.ms(p.created_at))
  from products p
  left join profiles u on u.id = p.user_id
  cross join lateral (select avg(stars)::float8 as avg, count(*) as n from reviews where product_id = p.id) r
  cross join lateral (select avg(rv.stars)::float8 as avg, count(*) as n
                      from reviews rv join products p2 on p2.id = rv.product_id
                      where p2.user_id = p.user_id) s
  where (p_id is null or p.id = p_id)
    and (p_owner is null or p.user_id = p_owner)
    and (not p_favs or exists (select 1 from favorites f where f.product_id = p.id and f.user_id = auth.uid()))
  order by case when p_owner is null and not p_favs then p.passed else false end, p.created_at desc;
$$;

create or replace function public.sl_reviews(p_id bigint)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', u.name, 'avatar', u.avatar_url, 'stars', r.stars, 'comment', r.comment,
                            'createdAt', public.ms(r.created_at), 'mine', r.user_id = auth.uid())
  from reviews r join profiles u on u.id = r.user_id
  where r.product_id = p_id
  order by r.created_at desc;
$$;

create or replace function public.chat_rooms_list()
returns setof jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', r.id, 'productId', p.id, 'productTitle', p.title, 'productImg', p.img,
    'productPrice', p.price, 'productType', p.type, 'productPassed', p.passed,
    'isSeller', r.seller_id = auth.uid(),
    'otherName', coalesce(o.name, 'ผู้ใช้'), 'otherAvatar', o.avatar_url,
    'lastMessage', r.last_message, 'lastAt', public.ms(r.last_message_at),
    'unread', (select count(*) from chat_messages m where m.room_id = r.id
               and m.sender_id is distinct from auth.uid()
               and m.created_at > case when r.seller_id = auth.uid() then r.seller_read_at else r.buyer_read_at end))
  from chat_rooms r
  join products p on p.id = r.product_id
  left join profiles o on o.id = case when r.seller_id = auth.uid() then r.buyer_id else r.seller_id end
  where auth.uid() in (r.buyer_id, r.seller_id)
    and exists (select 1 from chat_messages m where m.room_id = r.id)
  order by r.last_message_at desc;
$$;

create or replace function public.chat_room(p_room bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r chat_rooms; p products; me uuid := auth.uid(); seller boolean;
begin
  select * into r from chat_rooms where id = p_room;
  if not found then raise exception 'ไม่พบห้องแชตนี้'; end if;
  if me is null or (me not in (r.buyer_id, r.seller_id) and not public.is_admin()) then
    raise exception 'คุณไม่ได้อยู่ในห้องแชตนี้';
  end if;
  select * into p from products where id = r.product_id;
  seller := me = r.seller_id;
  return jsonb_build_object(
    'id', r.id, 'productId', p.id, 'productTitle', p.title, 'productImg', p.img, 'productPrice', p.price,
    'productType', p.type, 'productPassed', p.passed, 'productPickup', p.pickup,
    'isSeller', seller, 'isBuyer', me = r.buyer_id, 'adminView', me not in (r.buyer_id, r.seller_id),
    'buyerId', r.buyer_id, 'sellerId', r.seller_id,
    'buyerName', (select name from profiles where id = r.buyer_id),
    'sellerName', (select name from profiles where id = r.seller_id),
    'buyerAvatar', (select avatar_url from profiles where id = r.buyer_id),
    'sellerAvatar', (select avatar_url from profiles where id = r.seller_id),
    'otherName', (select name from profiles where id = case when seller then r.buyer_id else r.seller_id end),
    'otherAvatar', (select avatar_url from profiles where id = case when seller then r.buyer_id else r.seller_id end),
    'otherReadAt', public.ms(case when seller then r.buyer_read_at else r.seller_read_at end),
    'blockedByMe', exists (select 1 from chat_blocks b where b.active and b.blocker_id = me
                           and b.blocked_id = case when seller then r.buyer_id else r.seller_id end),
    'blocked', public.chat_blocked_between(r.buyer_id, r.seller_id),
    'requesters', case when seller and p.type = 'free' then
      (select count(distinct r2.id) from chat_rooms r2 join chat_messages m on m.room_id = r2.id
       where r2.product_id = p.id and m.kind = 'request') else 0 end);
end $$;

create or replace function public.admin_users()
returns setof jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform public.admin_check();
  return query
    select jsonb_build_object(
      'id', u.id, 'studentId', u.student_id, 'name', u.name, 'role', u.role, 'banned', u.banned,
      'avatarUrl', u.avatar_url,
      'products', (select count(*) from products p where p.user_id = u.id),
      'createdAt', public.ms(u.created_at))
    from profiles u order by u.created_at desc;
end $$;
