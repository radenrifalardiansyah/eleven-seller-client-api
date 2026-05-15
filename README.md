# Lapakoo Client API

REST API backend for the Lapakoo Seller platform, built with Next.js App Router and Supabase. Deployed on Vercel.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Route Handlers)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Runtime**: Node.js 20
- **Deploy**: Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> `SUPABASE_SERVICE_ROLE_KEY` is required for registration (bypasses RLS to create company and seller profile).

### 3. Run the development server

```bash
npm run dev
```

API will be available at `http://localhost:3000`.

## Authentication

All endpoints except the auth routes require a valid Supabase session. The middleware validates the JWT token and scopes all data to the authenticated seller's `tenant_id` (multi-tenancy).

**Public routes** (no auth required):
- `POST /api/auth/register`
- `POST /api/auth/login`

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user & create tenant |
| `POST` | `/api/auth/login` | Login with email & password |
| `POST` | `/api/auth/logout` | Logout current session |
| `GET` | `/api/auth/me` | Get current user profile & tenant info |

### Store

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/store` | Get store settings & tenant info |
| `PUT` | `/api/store` | Update store settings |
| `GET` | `/api/store/stats` | Get dashboard stats (products, orders, revenue, customers, low stock) |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List products (pagination, search, filter by category & status) |
| `POST` | `/api/products` | Create product (`name`, `sku`, `price` required) |
| `GET` | `/api/products/[id]` | Get product detail with images & stock per warehouse |
| `PUT` | `/api/products/[id]` | Update product |
| `DELETE` | `/api/products/[id]` | Delete product |
| `GET` | `/api/products/[id]/images` | List product images |
| `POST` | `/api/products/[id]/images` | Add product image |
| `DELETE` | `/api/products/[id]/images/[imageId]` | Delete product image |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | List categories |
| `POST` | `/api/categories` | Create category |
| `GET` | `/api/categories/[id]` | Get category by ID |
| `PUT` | `/api/categories/[id]` | Update category |
| `DELETE` | `/api/categories/[id]` | Delete category |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/inventory` | List stock movements (pagination, filter by product, warehouse, type) |
| `POST` | `/api/inventory` | Record stock movement (`adjustment_in`, `adjustment_out`, `transfer_in`, `transfer_out`, `sale`, `restock`) |

### Warehouses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/warehouses` | List warehouses with stock distribution |
| `POST` | `/api/warehouses` | Create warehouse (`code`, `name` required) |
| `GET` | `/api/warehouses/[id]` | Get warehouse detail with stock info |
| `PUT` | `/api/warehouses/[id]` | Update warehouse |
| `DELETE` | `/api/warehouses/[id]` | Delete warehouse |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | List orders (pagination, filter by status, payment status, date range) |
| `GET` | `/api/orders/[id]` | Get order detail with customer, items, payments & returns |
| `PUT` | `/api/orders/[id]` | Update order status & tracking info |
| `GET` | `/api/orders/[id]/return` | List return requests for an order |
| `POST` | `/api/orders/[id]/return` | Create return/refund request |
| `PUT` | `/api/orders/[id]/return` | Update return status |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/customers` | List customers (pagination, search, filter by segment & status) |
| `POST` | `/api/customers` | Create customer (`name`, `email` required) |
| `GET` | `/api/customers/[id]` | Get customer detail with addresses & last 10 orders |
| `PUT` | `/api/customers/[id]` | Update customer info |

### Resellers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/resellers` | List resellers (pagination, filter by status & tier, search) |
| `POST` | `/api/resellers` | Create reseller (`code`, `name`, `email`, `referral_code` required) |
| `GET` | `/api/resellers/[id]` | Get reseller detail |
| `PUT` | `/api/resellers/[id]` | Update reseller info & tier (`Bronze`, `Silver`, `Gold`, `Platinum`) |

### Vouchers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vouchers` | List vouchers with pagination |
| `POST` | `/api/vouchers` | Create voucher (`code`, `name`, `type`, `value`, `start_date`, `end_date` required) |
| `GET` | `/api/vouchers/[id]` | Get voucher detail |
| `PUT` | `/api/vouchers/[id]` | Update voucher |
| `DELETE` | `/api/vouchers/[id]` | Delete voucher |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | List notifications (pagination, filter by status & type) |
| `PUT` | `/api/notifications` | Mark all notifications as read |
| `PUT` | `/api/notifications/[id]` | Mark specific notification as read |

## Project Structure

```
src/
├── app/
│   └── api/                  # Route handlers
│       ├── auth/
│       ├── categories/
│       ├── customers/
│       ├── inventory/
│       ├── notifications/
│       ├── orders/
│       ├── products/
│       ├── resellers/
│       ├── store/
│       ├── vouchers/
│       └── warehouses/
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client + service role client
│   └── utils/
│       └── auth.ts           # getAuthenticatedSeller() helper
└── middleware.ts              # Auth guard + session refresh
```

## Deployment

The project is configured for Vercel. Environment variables are mapped in `vercel.json`:

| Variable | Vercel Secret |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `@supabase_url` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `@supabase_publishable_key` |
| `SUPABASE_SERVICE_ROLE_KEY` | `@supabase_service_role_key` |
