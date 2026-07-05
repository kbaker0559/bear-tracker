insert into courses (id, name) values ('black-bear', 'Black Bear Golf Club') on conflict (id) do update set name = excluded.name;

insert into holes (course_id, hole_number, par, stroke_index) values
('black-bear',1,4,5),('black-bear',2,5,17),('black-bear',3,3,15),('black-bear',4,5,11),('black-bear',5,3,9),('black-bear',6,4,1),('black-bear',7,4,7),('black-bear',8,4,13),('black-bear',9,4,3),('black-bear',10,4,10),('black-bear',11,3,12),('black-bear',12,4,2),('black-bear',13,4,6),('black-bear',14,5,14),('black-bear',15,3,18),('black-bear',16,5,16),('black-bear',17,4,4),('black-bear',18,4,8)
on conflict (course_id, hole_number) do update set par=excluded.par, stroke_index=excluded.stroke_index;

insert into players (id, name, handicap, quota, pin, active, is_admin) values
('fred-tucker','Fred Tucker',6,30,'1234',true,false),
('paul-tucker-jr','Paul Tucker JR',10,27,'1234',true,false),
('steve-robin','Steve Robin',11,23,'1234',true,false),
('russ-lizzoli','Russ Lizzoli',16,16,'1234',true,false),
('cam-crollard','Cam Crollard',5,30,'1234',true,false),
('paul-tucker-sr','Paul Tucker SR',8,25,'1234',true,false),
('kevin-baker','Kevin Baker',12,19,'1234',true,true),
('mark-knuutilla','Mark Knuutilla',10,24,'1234',true,false),
('tyler-adams','Tyler Adams',9,25,'1234',true,false),
('don-maines','Don Maines',13,21,'1234',true,false),
('dave-hall','Dave Hall',9,26,'1234',true,false),
('ed-sanchez','Ed Sanchez',12,21,'1234',true,false),
('neal-self','Neal Self',11,19,'1234',true,false),
('chuck-blankenship','Chuck Blankenship',12,26,'1234',true,false),
('bruce-coleman','Bruce Coleman',11,19,'1234',true,false),
('george-heider','George Heider',6,26,'1234',true,false),
('anthony-ciuzio','Anthony Ciuzio',4,29,'1234',true,false),
('tom-tzobanakis','Tom Tzobanakis',12,21,'1234',true,false),
('shawn-boone','Shawn Boone',16,15,'1234',true,false),
('blake-donahue','Blake Donahue',4,23,'1234',true,false),
('wayne-smith','Wayne Smith',11,18,'1234',true,false),
('preston-rager','Preston Rager',11,21,'1234',true,false),
('les-smith','Les Smith',19,16,'1234',true,false),
('mike-ondrasik','Mike Ondrasik',13,18,'1234',true,false)
on conflict (id) do update set
  name=excluded.name,
  handicap=excluded.handicap,
  quota=excluded.quota,
  active=excluded.active,
  is_admin=excluded.is_admin,
  updated_at=now();
