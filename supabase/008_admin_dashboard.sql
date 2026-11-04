-- =====================================================================
-- Second Life — อัปเดตฐานข้อมูลครั้งที่ 8: ข้อมูลแดชบอร์ดหลังบ้าน (รันต่อจาก 007_passed_to.sql)
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางไฟล์นี้ทั้งไฟล์ → Run
--
-- เพิ่ม: admin_dashboard() — อ่านอย่างเดียว เฉพาะผู้ดูแลระบบ (admin_check เหมือนฟังก์ชัน admin_* อื่น)
--   series   : จำนวนต่อวัน 14 วันล่าสุด (นับตามวันเวลาไทย Asia/Bangkok) ของ
--              ประกาศใหม่ (products.created_at) · ส่งต่อแล้ว (products.passed_at จาก 007)
--              ผู้ใช้ใหม่ (profiles.created_at) · รายงานใหม่ (reports + chat_reports .created_at)
--   activity : 8 กิจกรรมล่าสุด (ลงประกาศ / ส่งต่อแล้ว / รีวิว / รายงาน) พร้อมชื่อผู้ใช้และเวลา
-- ทุกค่ามาจากตารางจริง ไม่มีค่าสมมติ · ต้องรัน 007 ก่อน (ใช้คอลัมน์ passed_at)
--
-- ไฟล์นี้ไม่ลบตารางหรือข้อมูลเดิม (ไม่มี DROP / DELETE / TRUNCATE) และรันซ้ำได้
-- =====================================================================

-- นับเวลาใน p_stamps ลงช่องวันละช่อง 14 ช่อง เริ่มที่วัน p_d0 (วันตามเวลาไทย)
create or replace function public.admin_day_buckets(p_stamps timestamptz[], p_d0 date)
returns jsonb language sql stable set search_path = public as $$
  select coalesce(jsonb_agg(
           (select count(*) from unnest(coalesce(p_stamps, '{}')) s
            where (s at time zone 'Asia/Bangkok')::date = g.d::date)
           order by g.d), '[]'::jsonb)
  from generate_series(p_d0::timestamp, p_d0::timestamp + interval '13 days', interval '1 day') g(d);
$$;

create or replace function public.admin_dashboard()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  d0 date := (now() at time zone 'Asia/Bangkok')::date - 13;
  since timestamptz := (d0::timestamp) at time zone 'Asia/Bangkok';
begin
  perform public.admin_check();
  return jsonb_build_object(
    'start', public.ms(since),
    'days', 14,
    'series', jsonb_build_object(
      'products', public.admin_day_buckets((select array_agg(created_at) from products where created_at >= since), d0),
      'passed',   public.admin_day_buckets((select array_agg(passed_at) from products where passed and passed_at >= since), d0),
      'users',    public.admin_day_buckets((select array_agg(created_at) from profiles where created_at >= since), d0),
      'reports',  public.admin_day_buckets((select array_agg(created_at) from (
                    select created_at from reports where created_at >= since
                    union all
                    select created_at from chat_reports where created_at >= since) r), d0)),
    'activity', coalesce((
      select jsonb_agg(jsonb_build_object('kind', x.kind, 'at', public.ms(x.at),
                                          'who', coalesce(x.who, case when x.kind in ('product', 'passed') then 'Second Life' else 'ผู้ใช้' end),
                                          'title', x.title)
                       order by x.at desc)
      from (
        select * from (
          (select 'product'::text as kind, p.created_at as at, u.name as who, p.title
             from products p left join profiles u on u.id = p.user_id
             order by p.created_at desc limit 8)
          union all
          (select 'passed', p.passed_at, u.name, p.title
             from products p left join profiles u on u.id = p.user_id
             where p.passed and p.passed_at is not null
             order by p.passed_at desc limit 8)
          union all
          (select 'review', r.created_at, u.name, p.title
             from reviews r left join profiles u on u.id = r.user_id join products p on p.id = r.product_id
             order by r.created_at desc limit 8)
          union all
          (select 'report', r.created_at, u.name, p.title
             from reports r left join profiles u on u.id = r.user_id join products p on p.id = r.product_id
             order by r.created_at desc limit 8)
          union all
          (select 'report', c.created_at, u.name, p.title
             from chat_reports c left join profiles u on u.id = c.reporter_id
             join chat_rooms rm on rm.id = c.room_id join products p on p.id = rm.product_id
             order by c.created_at desc limit 8)
        ) all_events
        order by at desc
        limit 8
      ) x), '[]'::jsonb));
end $$;

-- ฟังก์ชัน admin_* เรียกได้เฉพาะผู้ที่เข้าสู่ระบบแล้ว (เหมือนส่วนท้ายของ 005_security.sql)
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p
           where p.pronamespace = 'public'::regnamespace and p.proname like 'admin\_%'
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
