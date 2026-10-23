# VoltNest

An Anker-style e-commerce site built with the MERN stack: React + Vite on the front, Express + TypeScript on the back, MongoDB Atlas for data. Cash on Delivery and SSLCommerz sandbox payments, deployed at $0 a month.

> Structure and behaviour are inspired by anker.com. All brand names, product names, images and copy are original.

## Run it locally

You need Node.js 20+ and a MongoDB Atlas connection string.

```bash
# 1. API
cd server
cp .env.example .env        # then paste your MONGODB_URI into .env
npm install
npm run seed                # 6 categories, 40 products, 1 admin
npm run dev                 # http://localhost:4000/api/v1/health

# 2. Web app (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

## API (v1)

| Method | Path | What it returns |
| --- | --- | --- |
| GET | `/api/v1/health` | Server and database status |
| GET | `/api/v1/products?page&limit&sort` | Active products, paginated (`sort`: newest, price-asc, price-desc, bestselling, rating) |
| GET | `/api/v1/products/:slug` | One product plus related products |
| GET | `/api/v1/home` | Categories, new arrivals, bestsellers, featured |
| GET | `/api/v1/categories` | Active categories |
| GET | `/api/v1/categories/:slug` | One category |
| GET | `/api/v1/categories/:slug/products` | Products in a category, paginated |

Every response has the same shape: `{ success: true, data, meta? }` or `{ success: false, error: { code, message, details? } }`.
`costPrice` is stripped in the service layer and is never sent by a public endpoint.

## Project rules

1. Every feature lives in its own folder (`server/src/modules/<feature>`, `client/src/features/<feature>`).
2. Every API call goes under `/api/v1`.
3. Every database call goes through a service (`*.service.ts`). Controllers never touch models.

## Structure

```
server/src
  config/        env validation, MongoDB connection
  shared/        AppError, asyncHandler, errorHandler, notFound, response helper
  modules/       users, categories, products, carts, orders, payments, reviews
  routes/v1.ts   mounts every module under /api/v1
  seed/          demo catalogue and seed script
client/src
  app/           App, router, React Query provider
  layouts/       ShopLayout (announcement bar, header, footer)
  features/      products (types, API calls, React Query hooks)
  pages/         HomePage, NotFoundPage
  shared/        api-client, UI kit (Button, Badge, Price, ProductCard, Skeleton), utils
```

## Build log

| Day | Done | Blocked | Tomorrow |
| --- | --- | --- | --- |
| 1 | | | |
