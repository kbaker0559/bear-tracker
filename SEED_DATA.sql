-- Bear Tracker v1.7 seed data for Black Bear Saturday game
-- Run after DATABASE_SCHEMA.sql.

insert into leagues (name) values ('Black Bear Saturday Game');
insert into courses (name) values ('Black Bear Golf Club');

with c as (select id from courses where name = 'Black Bear Golf Club' limit 1)
insert into holes (course_id, hole_number, par, stroke_index)
select c.id, v.hole_number, v.par, v.stroke_index
from c,
(values
 (1,4,5),(2,5,17),(3,3,15),(4,5,11),(5,3,9),(6,4,1),
 (7,4,7),(8,4,13),(9,4,3),(10,4,10),(11,3,12),(12,4,2),
 (13,4,6),(14,5,14),(15,3,18),(16,5,16),(17,4,4),(18,4,8)
) as v(hole_number, par, stroke_index);

with l as (select id from leagues where name = 'Black Bear Saturday Game' limit 1)
insert into players (league_id, name, handicap, quota, pin, is_admin, is_active)
select l.id, v.name, v.handicap, v.quota, v.pin, v.is_admin, true
from l,
(values
 ('Fred Tucker',6,30,'1001',false),
 ('Paul Tucker JR',10,27,'1002',false),
 ('Steve Robin',11,23,'1003',false),
 ('Russ Lizzoli',16,16,'1004',false),
 ('Cam Crollard',5,30,'1005',false),
 ('Paul Tucker SR',8,25,'1006',false),
 ('Kevin Baker',12,19,'1234',true),
 ('Mark Knuutilla',10,24,'1008',false),
 ('Tyler Adams',9,25,'1009',false),
 ('Don Maines',13,21,'1010',false),
 ('Dave Hall',9,26,'1011',false),
 ('Ed Sanchez',12,21,'1012',false),
 ('Neal Self',11,19,'1013',false),
 ('Chuck Blankenship',12,26,'1014',false),
 ('Bruce Coleman',11,19,'1015',false),
 ('George Heider',6,26,'1016',false),
 ('Anthony Ciuzio',4,29,'1017',false),
 ('Tom Tzobanakis',12,21,'1018',false),
 ('Shawn Boone',16,15,'1019',false),
 ('Blake Donahue',4,23,'1020',false),
 ('Wayne Smith',11,18,'1021',false),
 ('Preston Rager',11,21,'1022',false),
 ('Les Smith',19,16,'1023',false),
 ('Mike Ondrasik',13,18,'1024',false)
) as v(name, handicap, quota, pin, is_admin);
