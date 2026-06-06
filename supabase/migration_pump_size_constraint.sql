-- Remove the fixed pump_size constraint since pump names now come from the price list
alter table order_items drop constraint if exists order_items_pump_size_check;
