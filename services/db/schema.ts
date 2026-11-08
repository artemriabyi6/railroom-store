/**
 * Database schema. Idempotent: applied automatically on the first query of each
 * server instance (see client.ts), so a fresh database needs no manual migration.
 * The catalogue is seeded from data/products.ts the first time the products table is empty.
 */
export const SCHEMA_SQL = `
create table if not exists products (
  slug        text primary key,
  name        text not null,
  color_name  text not null,
  category    text not null,
  price_eur   integer not null check (price_eur >= 0),
  description text not null default '',
  details     jsonb not null default '[]'::jsonb,
  stock       jsonb not null,
  art         jsonb not null,
  rail        boolean not null default false,
  is_new      boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists orders (
  id               text primary key,
  status           text not null,
  currency         text not null,
  lines            jsonb not null,
  subtotal         integer not null,
  shipping         integer not null,
  total            integer not null,
  customer         jsonb not null,
  payment_provider text,
  payment_ref      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_created_at_idx on orders (created_at desc);

create table if not exists messages (
  id         bigserial primary key,
  kind       text not null,
  email      text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_kind_created_idx on messages (kind, created_at desc);
create unique index if not exists messages_newsletter_email_uq on messages (email) where kind = 'newsletter';

-- Repair: an early build stored jsonb values double-encoded (as JSON strings).
-- Unwrap any such rows; a no-op once data is clean.
update products set details = (details #>> '{}')::jsonb where jsonb_typeof(details) = 'string';
update products set stock   = (stock   #>> '{}')::jsonb where jsonb_typeof(stock)   = 'string';
update products set art     = (art     #>> '{}')::jsonb where jsonb_typeof(art)     = 'string';
update orders   set lines   = (lines   #>> '{}')::jsonb where jsonb_typeof(lines)   = 'string';
update orders   set customer = (customer #>> '{}')::jsonb where jsonb_typeof(customer) = 'string';
update messages set payload = (payload #>> '{}')::jsonb where jsonb_typeof(payload) = 'string';
`;
