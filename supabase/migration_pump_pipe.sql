alter table price_list_items
  add column if not exists pipe_included_meters numeric(10,2),
  add column if not exists pipe_extra_per_meter numeric(10,2);

-- Update existing maico pump rows
update price_list_items
set pipe_included_meters = 20, pipe_extra_per_meter = 40
where product_type = 'pump' and product_name = 'מייקו';
