alter table price_list_items
  add column if not exists min_cubic_meters numeric(10,2),
  add column if not exists shortfall_fee_cost numeric(10,2);

alter table price_list_items drop constraint if exists price_list_items_product_type_check;
alter table price_list_items add constraint price_list_items_product_type_check
  check (product_type in ('concrete', 'pump', 'accessory', 'mixer'));

alter table order_items drop constraint if exists order_items_product_type_check;
alter table order_items add constraint order_items_product_type_check
  check (product_type in ('concrete', 'pump', 'accessory', 'mixer'));

-- Backfill a default mixer row for factories that don't have one yet
insert into price_list_items (factory_id, product_type, product_name, base_price, min_cubic_meters, shortfall_fee_cost)
select f.id, 'mixer', 'מיקסר', 0, 8, 0
from factories f
where not exists (
  select 1 from price_list_items p where p.factory_id = f.id and p.product_type = 'mixer'
);
