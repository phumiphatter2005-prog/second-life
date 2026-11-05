-- =====================================================================
-- Second Life — อัปเดตฐานข้อมูลครั้งที่ 10: กิจกรรมล่าสุดในแดชบอร์ดมี id ประกาศและรูปโปรไฟล์ (รันต่อจาก 009_pass_cancel.sql)
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางไฟล์นี้ทั้งไฟล์ → Run
--
-- แทนที่ admin_dashboard() จาก 008_admin_dashboard.sql: เหมือนเดิมทุกอย่าง เพิ่มแค่ใน activity
--   productId : id ประกาศ (หน้าแดชบอร์ดใช้บอกสถานะ เผยแพร่ / ส่งต่อแล้ว / ถูกรายงาน / ถูกลบ)
--   avatar    : รูปโปรไฟล์ของผู้ใช้ในกิจกรรมนั้น
-- ไม่รันไฟล์นี้ก็ใช้ได้ (หน้าเว็บจับคู่สถานะจากชื่อประกาศแทน และใช้วงกลมตัวอักษรแทนรูปโปรไฟล์)
--
-- ไฟล์นี้ไม่ลบตารางหรือข้อมูลเดิม (ไม่มี DROP / DELETE / TRUNCATE) และรันซ้ำได้
-- =====================================================================

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
      select jsonb_agg(jsonb_build_object('kind', x.kind, 'at', public.ms(x.at), 'productId', x.pid, 'avatar', x.avatar,
                                          'who', coalesce(x.who, case when x.kind in ('product', 'passed') then 'Second Life' else 'ผู้ใช้' end),
                                          'title', x.title)
                       order by x.at desc)
      from (
        select * from (
          (select 'product'::text as kind, p.created_at as at, u.name as who, p.title, p.id as pid, u.avatar_url as avatar
             from products p left join profiles u on u.id = p.user_id
             order by p.created_at desc limit 8)
          union all
          (select 'passed', p.passed_at, u.name, p.title, p.id, u.avatar_url
             from products p left join profiles u on u.id = p.user_id
             where p.passed and p.passed_at is not null
             order by p.passed_at desc limit 8)
          union all
          (select 'review', r.created_at, u.name, p.title, p.id, u.avatar_url
             from reviews r left join profiles u on u.id = r.user_id join products p on p.id = r.product_id
             order by r.created_at desc limit 8)
          union all
          (select 'report', r.created_at, u.name, p.title, p.id, u.avatar_url
             from reports r left join profiles u on u.id = r.user_id join products p on p.id = r.product_id
             order by r.created_at desc limit 8)
          union all
          (select 'report', c.created_at, u.name, p.title, p.id, u.avatar_url
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
