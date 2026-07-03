-- Bear Tracker v1.6 starter seed data
-- Run this after supabase-schema.sql.

-- Course holes: Black Bear Golf Club
insert into courses (id, name, default_tee) values
('black-bear-gc', 'Black Bear Golf Club', 'Saturday tees')
on conflict (id) do update set name = excluded.name, default_tee = excluded.default_tee;

insert into course_holes (course_id, hole_number, par, stroke_index) values
('black-bear-gc',1,4,5),
('black-bear-gc',2,5,17),
('black-bear-gc',3,3,15),
('black-bear-gc',4,5,11),
('black-bear-gc',5,3,9),
('black-bear-gc',6,4,1),
('black-bear-gc',7,4,7),
('black-bear-gc',8,4,13),
('black-bear-gc',9,4,3),
('black-bear-gc',10,4,10),
('black-bear-gc',11,3,12),
('black-bear-gc',12,4,2),
('black-bear-gc',13,4,6),
('black-bear-gc',14,5,14),
('black-bear-gc',15,3,18),
('black-bear-gc',16,5,16),
('black-bear-gc',17,4,4),
('black-bear-gc',18,4,8)
on conflict (course_id, hole_number) do update set par = excluded.par, stroke_index = excluded.stroke_index;

-- Current Saturday player list. PINs are placeholders and should be changed by admin.
insert into players (name, handicap, quota, pin, active) values
('Fred Tucker',6,30,'1001',true),
('Paul Tucker JR',10,27,'1002',true),
('Steve Robin',11,23,'1003',true),
('Russ Lizzoli',16,16,'1004',true),
('Cam Crollard',5,30,'1005',true),
('Paul Tucker SR',8,25,'1006',true),
('Kevin Baker',12,19,'1007',true),
('Mark Knuutilla',10,24,'1008',true),
('Tyler Adams',9,25,'1009',true),
('Don Maines',13,21,'1010',true),
('Dave Hall',9,26,'1011',true),
('Ed Sanchez',12,21,'1012',true),
('Neal Self',11,19,'1013',true),
('Chuck Blankenship',12,26,'1014',true),
('Bruce Coleman',11,19,'1015',true),
('George Heider',6,26,'1016',true),
('Anthony Ciuzio',4,29,'1017',true),
('Tom Tzobanakis',12,21,'1018',true),
('Shawn Boone',16,15,'1019',true),
('Blake Donahue',4,23,'1020',true),
('Wayne Smith',11,18,'1021',true),
('Preston Rager',11,21,'1022',true),
('Les Smith',19,16,'1023',true),
('Mike Ondrasik',13,18,'1024',true);
