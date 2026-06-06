# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Order and customer management app for a concrete supply business (עומר's business). Single user (owner/admin only). Mobile-first RTL Hebrew web app.

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS, RTL Hebrew
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (single user login)

## Development Commands

```bash
# Install dependencies
cd client && npm install
cd server && npm install

# Run frontend (dev)
cd client && npm run dev

# Run backend (dev)
cd server && npm run dev

# Run both together (from root)
npm run dev

# Build frontend
cd client && npm run build

# Lint
cd client && npm run lint
```

## Architecture

```
/client       React + Vite frontend
/server       Node.js + Express API
```

### Frontend Pages (3 pages, bottom tab navigation)

1. **עמוד ראשי (Orders)** – Daily/weekly/monthly view with date navigation. Order list with filters and search. Floating (+) button to create order. Cost summary for selected period. Orders open in a bottom drawer.

2. **לקוחות (Customers)** – Regular customer list with full details and order history per customer.

3. **מחירונים (Price Lists)** – Price tables per factory (3+ factories supported).

### Key Domain Concepts

**Customer types**: regular only (saved profile with name, company, ח.פ, phone, list of construction sites). All order data is derived from the customer profile.

**Order statuses**: `ממתין` | `סגור` | `בוטל` | `נדחה`. Deferred orders carry the original date + new date.

**Order structure**:
- Customer (new or regular), factory, location (from customer's site list), date/time, payment method (צק/העברה/העברה בנקאית)
- Order details: one or more products each with quantity + agreed price
- Quantity can be "open" (e.g. `16+`) meaning minimum confirmed, final to be updated later

**Product types in an order**:
1. **בטון (Concrete)** – Has a base price from the factory price list, plus additive parameters per m³:
   - חוזק (strength): ב20 (+0), ב30 (+10), ב40 (+20), ב50 (+30), ב60 (+40)
   - סוג (type): עדש (+0), מייקו (+30), דחוס (+40)
   - שקיעה (slump): 4 (−10), 5 (+0), 6 (+10), 7 (+20)
   - Final price/m³ = base_price + strength_add + type_add + slump_add

2. **משאבה (Pump)** – Priced per job: base fee covers first 10 m³, then per additional m³. Pump quantity always equals the concrete quantity in the order.
   - 36m: 1,000₪ base + 30₪/m³ extra
   - 42m: 1,500₪ base + 40₪/m³ extra
   - 52m: 2,000₪ base + 50₪/m³ extra
   - מייקו: 1,500₪ base + 40₪/m³ extra + pipe: 20m included, additional meters = +40₪/m (default input: 20)

3. **מוצרים נלווים (Accessories)** – Any other product from the factory price list.

**Price list (מחירון)** per factory: one base concrete price, pump prices, and accessories. Concrete parameters (strength/type/slump) are calculated as additions on top of the base price — not stored as separate rows.

**Financial view**: profit = (customer price − factory cost) per product and total. Visible only when opening a specific order, not on the main page.

### DB Tables (Supabase)

- `factories` – name
- `price_lists` – factory_id, product_type, product_name, base_price, extra_per_unit (for pump)
- `customers` – name, company_name, vat_id, phone, type (new/regular)
- `customer_sites` – customer_id, site_name
- `orders` – customer_id, factory_id, location, datetime, status, payment_method, original_date (if deferred), notes
- `order_items` – order_id, product_type, product_name, quantity, is_open_quantity, unit_price (agreed), strength, concrete_type, slump (for concrete), pump_size, pipe_meters (for pump)

## UI Conventions

- RTL layout throughout (`dir="rtl"`)
- Mobile-first (max ~430px primary target)
- Bottom tab navigation (3 tabs)
- Floating action button (+) for new order
- Orders open in bottom drawer (not separate page)
- Financial details collapsed by default
