-- Synthetic fixture only. Local auth identities use reserved example.test addresses.
insert into auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,aud,role) values
('00000000-0000-4000-8000-000000000001','synthetic-admin@example.test','',now(),now(),now(),'authenticated','authenticated'),
('00000000-0000-4000-8000-000000000002','synthetic-member@example.test','',now(),now(),now(),'authenticated','authenticated');
insert into public.profiles(id,display_name,created_by,updated_by) values
('00000000-0000-4000-8000-000000000001','Synthetic Administrator','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001'),
('00000000-0000-4000-8000-000000000002','Synthetic Member','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001');
insert into public.verified_emails(profile_id,email,is_nus,verified_at,verified_by) values
('00000000-0000-4000-8000-000000000001','synthetic-admin@example.test',false,now(),'00000000-0000-4000-8000-000000000001'),
('00000000-0000-4000-8000-000000000002','synthetic-member@example.test',false,now(),'00000000-0000-4000-8000-000000000001');
insert into public.academic_years(id,label,starts_on,ends_on,lifecycle,semester_one_start,semester_one_end,semester_two_start,semester_two_end) values ('10000000-0000-4000-8000-000000000001','AY2026/27','2026-08-01','2027-07-31','active','2026-08-01','2026-12-31','2027-01-01','2027-07-31');
insert into public.memberships(profile_id,academic_year_id,category,starts_on,verified_by) values ('00000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','incumbent','2026-08-01','00000000-0000-4000-8000-000000000001');
