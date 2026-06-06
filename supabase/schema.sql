-- Factories
create table factories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Price list items per factory
create table price_list_items (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid references factories(id) on delete cascade not null,
  product_type text not null check (product_type in ('concrete', 'pump', 'accessory')),
  product_name text not null,
  base_price numeric(10,2) not null,
  extra_per_unit numeric(10,2), -- for pump: price per m³ above 10
  created_at timestamptz default now()
);

-- Customers
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  vat_id text,
  phone text,
  type text not null default 'regular' check (type in ('new', 'regular')),
  created_at timestamptz default now()
);

-- Construction sites per customer
create table customer_sites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade not null,
  site_name text not null
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  customer_name text, -- for one-time customers
  factory_id uuid references factories(id) on delete set null not null,
  location text not null,
  scheduled_at timestamptz not null,
  original_scheduled_at timestamptz, -- set if order was deferred
  status text not null default 'ממתין' check (status in ('ממתין', 'סגור', 'בוטל', 'נדחה')),
  payment_method text check (payment_method in ('צק', 'העברה', 'העברה בנקאית')),
  notes text,
  created_at timestamptz default now()
);

-- Order items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  product_type text not null check (product_type in ('concrete', 'pump', 'accessory')),
  product_name text not null,
  quantity numeric(10,2) not null,
  is_open_quantity boolean default false, -- true = "16+" style
  unit_price_customer numeric(10,2) not null, -- agreed price with customer
  unit_price_cost numeric(10,2) not null,     -- factory cost price
  -- Concrete-specific
  strength text check (strength in ('b20','b30','b40','b50','b60')),
  concrete_type text check (concrete_type in ('adash','maico','dachus')),
  slump integer check (slump in (4,5,6,7)),
  -- Pump-specific
  pump_size text check (pump_size in ('36','42','52','maico')),
  pipe_meters numeric(10,2)
);

-- RLS: enable for all tables
alter table factories enable row level security;
alter table price_list_items enable row level security;
alter table customers enable row level security;
alter table customer_sites enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Allow authenticated user full access (single-user app)
create policy "auth full access" on factories for all to authenticated using (true) with check (true);
create policy "auth full access" on price_list_items for all to authenticated using (true) with check (true);
create policy "auth full access" on customers for all to authenticated using (true) with check (true);
create policy "auth full access" on customer_sites for all to authenticated using (true) with check (true);
create policy "auth full access" on orders for all to authenticated using (true) with check (true);
create policy "auth full access" on order_items for all to authenticated using (true) with check (true);
