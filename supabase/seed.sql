insert into courses (id, name) values ('black-bear', 'Black Bear Golf Club') on conflict (id) do update set name = excluded.name;

insert into holes (course_id, number, par, stroke_index) values
('black-bear',1,4,5),('black-bear',2,5,17),('black-bear',3,3,15),('black-bear',4,5,11),('black-bear',5,3,9),('black-bear',6,4,1),('black-bear',7,4,7),('black-bear',8,4,13),('black-bear',9,4,3),('black-bear',10,4,10),('black-bear',11,3,12),('black-bear',12,4,2),('black-bear',13,4,6),('black-bear',14,5,14),('black-bear',15,3,18),('black-bear',16,5,16),('black-bear',17,4,4),('black-bear',18,4,8)
on conflict (course_id, number) do update set par = excluded.par, stroke_index = excluded.stroke_index;
