-- Auto Shop Management Schema - Repair Orders focused
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Customers
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz default now()
);

-- Vehicles
create table if not exists vehicles (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  year integer,
  make text,
  model text,
  vin text,
  license_plate text,
  color text,
  mileage integer,
  notes text,
  created_at timestamptz default now()
);

-- Repair Orders
create type ro_status as enum (
  'estimate',
  'authorized',
  'in_progress',
  'completed',
  'invoiced',
  'cancelled'
);

create table if not exists repair_orders (
  id uuid primary key default uuid_generate_v4(),
  ro_number text unique not null,           -- e.g. RO-2026-001
  customer_id uuid references customers(id),
  vehicle_id uuid references vehicles(id),
  status ro_status default 'estimate',
  opened_at timestamptz default now(),
  closed_at timestamptz,
  mileage_in integer,
  mileage_out integer,
  customer_concern text,                    -- what the customer said
  tech_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Labor Lines
create table if not exists labor_lines (
  id uuid primary key default uuid_generate_v4(),
  repair_order_id uuid references repair_orders(id) on delete cascade,
  description text not null,                -- e.g. "Replace front brake pads"
  hours_billed numeric(6,2) not null default 0,  -- sold hours
  hours_actual numeric(6,2),                     -- actual time spent
  labor_rate numeric(8,2) not null default 120,  -- your shop rate
  cost numeric(10,2) default 0,                  -- any outside labor cost
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Parts Lines (on the RO)
create table if not exists parts_lines (
  id uuid primary key default uuid_generate_v4(),
  repair_order_id uuid references repair_orders(id) on delete cascade,
  part_number text,
  description text not null,
  quantity numeric(8,2) not null default 1,
  cost_price numeric(10,2) not null default 0,   -- what you paid
  sell_price numeric(10,2) not null default 0,   -- what customer pays
  vendor text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Simple Inventory (for later)
create table if not exists inventory (
  id uuid primary key default uuid_generate_v4(),
  part_number text unique,
  description text not null,
  quantity_on_hand numeric(10,2) default 0,
  min_quantity numeric(10,2) default 0,
  cost_price numeric(10,2) default 0,
  sell_price numeric(10,2) default 0,
  vendor text,
  location text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_ro_status on repair_orders(status);
create index if not exists idx_ro_customer on repair_orders(customer_id);
create index if not exists idx_labor_ro on labor_lines(repair_order_id);
create index if not exists idx_parts_ro on parts_lines(repair_order_id);

-- Helpful view for profit calculations
create or replace view repair_order_summary as
select
  ro.id,
  ro.ro_number,
  ro.status,
  ro.opened_at,
  c.name as customer_name,
  v.year || ' ' || v.make || ' ' || v.model as vehicle,
  coalesce(sum(ll.hours_billed * ll.labor_rate), 0) as labor_total,
  coalesce(sum(ll.hours_billed), 0) as total_hours_billed,
  coalesce(sum(pl.quantity * pl.sell_price), 0) as parts_total,
  coalesce(sum(pl.quantity * pl.cost_price), 0) as parts_cost,
  coalesce(sum(ll.hours_billed * ll.labor_rate), 0) + coalesce(sum(pl.quantity * pl.sell_price), 0) as grand_total,
  coalesce(sum(ll.hours_billed * ll.labor_rate), 0) + coalesce(sum(pl.quantity * pl.sell_price), 0)
    - coalesce(sum(pl.quantity * pl.cost_price), 0) as gross_profit
from repair_orders ro
left join customers c on c.id = ro.customer_id
left join vehicles v on v.id = ro.vehicle_id
left join labor_lines ll on ll.repair_order_id = ro.id
left join parts_lines pl on pl.repair_order_id = ro.id
group by ro.id, ro.ro_number, ro.status, ro.opened_at, c.name, v.year, v.make, v.model;
