-- =====================================================================
-- Second Life — อัปเดตฐานข้อมูลครั้งที่ 6: ช่อง "อยากแลกกับอะไร" ของประกาศแลกเปลี่ยน (รันต่อจาก 005_security.sql)
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางไฟล์นี้ทั้งไฟล์ → Run
--
-- เพิ่ม: 1) คอลัมน์ products.want_swap (ไม่บังคับ ยาวไม่เกิน 60 ตัวอักษร)
--        2) sl_products ส่งช่อง wantSwap ให้หน้าเว็บ (ผลลัพธ์เดิมอยู่ครบ)
--
-- ไฟล์นี้ไม่ลบตารางหรือข้อมูลเดิม (ไม่มี DROP / DELETE / TRUNCATE) และรันซ้ำได้
-- =====================================================================

-- ---------- 1) คอลัมน์ใหม่ ----------
alter table public.products add column if not exists want_swap text not null default '';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'products_want_swap_len') then
    alter table public.products add constraint products_want_swap_len check (char_length(want_swap) <= 60);
  end if;
end $$;

-- ---------- 2) ส่ง wantSwap ไปหน้าเว็บ (แทนที่ฟังก์ชันจาก 004_avatars.sql) ----------
create or replace function public.sl_products(p_id bigint default null, p_owner uuid default null, p_favs boolean default false)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'title', p.title, 'price', p.price, 'type', p.type, 'category', p.category,
    'condition', p.condition, 'pickup', p.pickup,
    'contact', case when public.is_active_user() then p.contact end,
    'desc', p.description, 'img', p.img, 'images', p.images, 'passed', p.passed,
    'wantSwap', p.want_swap,
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
