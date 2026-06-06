-- Concrete parameter additions per factory (editable defaults)
create table factory_concrete_params (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid references factories(id) on delete cascade not null,
  param_type text not null check (param_type in ('strength', 'concrete_type', 'slump')),
  param_value text not null,
  price_addition numeric(10,2) not null default 0,
  unique (factory_id, param_type, param_value)
);

alter table factory_concrete_params enable row level security;
create policy "auth full access" on factory_concrete_params for all to authenticated using (true) with check (true);
