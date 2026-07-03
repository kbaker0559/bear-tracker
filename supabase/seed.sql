-- Bear Tracker seed data v1.0

insert into courses (name) values ('Black Bear Golf Club') on conflict do nothing;

with c as (select id from courses where name = 'Black Bear Golf Club' limit 1)
insert into holes (course_id, hole_number, par, stroke_index)
select c.id, v.hole, v.par, v.hcp
from c, (values
  (1,4,5),(2,5,17),(3,3,15),(4,5,11),(5,3,9),(6,4,1),
  (7,4,7),(8,4,13),(9,4,3),(10,4,10),(11,3,12),(12,4,2),
  (13,4,6),(14,5,14),(15,3,18),(16,5,16),(17,4,4),(18,4,8)
) as v(hole, par, hcp)
on conflict (course_id, hole_number) do update set par = excluded.par, stroke_index = excluded.stroke_index;

insert into players (name, handicap, quota, pin, role, active) values
('Fred Tucker',6,30,'1234','player',true),
('Paul Tucker JR',10,27,'1234','player',true),
('Steve Robin',11,23,'1234','player',true),
('Russ Lizzoli',16,16,'1234','player',true),
('Cam Crollard',5,30,'1234','player',true),
('Paul Tucker SR',8,25,'1234','player',true),
('Kevin Baker',12,19,'1234','admin',true),
('Mark Knuutilla',10,24,'1234','player',true),
('Tyler Adams',9,25,'1234','player',true),
('Don Maines',13,21,'1234','player',true),
('Dave Hall',9,26,'1234','player',true),
('Ed Sanchez',12,21,'1234','player',true),
('Neal Self',11,19,'1234','player',true),
('Chuck Blankenship',12,26,'1234','player',true),
('Bruce Coleman',11,19,'1234','player',true),
('George Heider',6,26,'1234','player',true),
('Anthony Ciuzio',4,29,'1234','player',true),
('Tom Tzobanakis',12,21,'1234','player',true),
('Shawn Boone',16,15,'1234','player',true),
('Blake Donahue',4,23,'1234','player',true),
('Wayne Smith',11,18,'1234','player',true),
('Preston Rager',11,21,'1234','player',true),
('Les Smith',19,16,'1234','player',true),
('Mike Ondrasik',13,18,'1234','player',true);
