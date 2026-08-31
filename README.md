# Agriflow — AI-Powered Direct Agricultural Marketplace

> _"From Farm to Market. Fairer Prices. Smarter Supply Chains."_

**Smart India Hackathon Problem Statement Solution**

- **Organization:** Ministry of Consumer Affairs, Food & Public Distribution
- **Department:** Department of Consumer Affairs (DoCA)
- **Theme:** Agriculture, FoodTech & Rural Development

---

## 🌾 Overview

Agriflow is an intelligent full-stack digital agricultural marketplace that connects farmers and Farmer Producer Organizations (FPOs) directly with consumers and institutional/bulk buyers (restaurants, hotels, retailers). By removing up to 4 intermediary tiers and employing statistical AI algorithms for **Price Discovery**, **Demand Forecasting**, and **Multi-Stop Route Optimization**, Agriflow increases farmer earnings by ~75% while decreasing retail consumer costs by ~30%.

---

## 🚀 Key Features

### 1. Direct Agricultural Marketplace

- **Role-Based Portals:** Dedicated dashboards for Farmers, FPOs, Consumers, Bulk Buyers, Logistics Partners, and Administrators.
- **Search & Multi-Filter Catalog:** Filter by crop category (Vegetables, Fruits, Grains, Spices), quality grade (Grade A, B, C), organic certification, and location clusters.
- **Instant Booking & Cart:** Real-time stock validation and multi-crop shopping cart with shared delivery fee calculations.

### 2. Agriflow AI Price Engine (Deterministic Multi-Factor Model)

Calculates fair benchmark prices by analyzing:
$$\text{Recommended Price} = \text{BasePrice} \times (1 + \Delta_{\text{Demand}} + \Delta_{\text{Supply}} + \Delta_{\text{Seasonal}} + \Delta_{\text{Quality}} + \Delta_{\text{Regional}} + \Delta_{\text{Volume}})$$

- **Historical Mandi Prices:** Weighted 30–90 day time-decay average from real transaction records.
- **Order Velocity Trend:** 7-day vs previous period purchase momentum.
- **Local Supply Ratio:** Current active batch volumes vs regional baseline.
- **Seasonal Multipliers:** 12-month crop indices (e.g., monsoon tomato surges, winter root vegetable supply).
- **Explainability Panel:** Transparent breakdown of why the price was recommended + confidence rating.

### 3. Demand Forecasting & Farmer Alerts

- **Weighted Moving Average:** 7-day, 14-day, and 30-day forecast horizons.
- **Supply-Demand Gap Analysis:** Predicts regional deficits and price direction (e.g., _"Tomato supply gap of 1,520 kg in Central MP — recommend increasing listing volume"_).

### 4. Smart Route Optimizer & Logistics Tracking

- **Nearest-Neighbor Heuristic with Capacity & Priority Constraints:** Plotted coordinate trajectories with Haversine distance computations.
- **Before/After Transit Comparison:** Measurable distance savings (25–35%) and transit time reduction.
- **5-Step Delivery Lifecycle:** `Ordered → Confirmed by Farmer → Packed & Graded → In Transit → Delivered`.

### 5. Institutional Bulk Procurement (RFQ Tool)

- For restaurants, hotels, and retail chains needing 100 kg to 20,000 kg.
- Automated matching of bulk requirements with local farmer/FPO clusters with distance, quality, and transit time comparisons.

---

## 🛠 Tech Stack

| Layer                 | Technologies                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**          | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui components, Lucide Icons, Recharts                                                    |
| **Backend**           | Node.js, TypeScript, Express.js, JWT Authentication, bcryptjs, Zod validation                                                             |
| **Database**          | SQLite with Prisma ORM (28 Seed Users, 45 Listings, 120 Orders, 2,700 Market Prices, 180 Forecasts)                                       |
| **AI / Intelligence** | Deterministic statistical pricing models, time-series moving averages, Haversine route algorithms (zero external API dependency required) |

---

## 🔑 Demo Accounts (All Passwords: `Demo@123`)

| Role                  | Email                     | Name / Entity          |
| --------------------- | ------------------------- | ---------------------- |
| **Farmer**            | `farmer@Agriflow.demo`    | Rajesh Patel (Indore)  |
| **Consumer**          | `consumer@Agriflow.demo`  | Priya Verma (Bhopal)   |
| **Bulk Buyer**        | `buyer@Agriflow.demo`     | Hotel Spice Garden     |
| **FPO Collective**    | `fpo@Agriflow.demo`       | Narmada Valley FPO     |
| **Logistics Partner** | `logistics@Agriflow.demo` | Suresh Transport       |
| **Administrator**     | `admin@Agriflow.demo`     | Platform Administrator |

_Quick login buttons are available on the `/login` page for 1-click credential autofill._

---

## 📦 Setup & Local Execution

### Prerequisites

- Node.js v18+ or v20+
- npm v9+

### 1. Clone & Environment Configuration

```bash
# In backend/.env
DATABASE_URL="file:./dev.db"
JWT_SECRET="Agriflow-dev-secret-key-2024"
PORT=3000
```

### 2. Backend Initialization & Database Seeding

```bash
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
# Server running at http://localhost:3000
```

### 3. Frontend Startup

```bash
cd frontend
npm install
npm run dev
# Application accessible at http://localhost:5173
```

---

## 📡 REST API Reference Overview

- `POST /api/auth/login` — Sign in and receive JWT token + user profile.
- `POST /api/auth/register` — Register consumer, farmer, FPO, bulk buyer, or logistics partner.
- `GET /api/listings` — Search, sort, filter active produce batches.
- `POST /api/ai/price-recommendation` — Execute multi-factor statistical AI price engine.
- `GET /api/ai/demand-forecast` — Calculate 7/14/30 day regional demand projections.
- `POST /api/logistics/optimize-route` — Compute optimal multi-stop delivery sequence with savings metrics.
- `POST /api/orders` — Create order, reserve inventory, generate delivery, and dispatch notifications.
- `GET /api/analytics/impact` — Traditional vs Agriflow comparative metrics.

---

## 📜 License

Developed for the Smart India Hackathon. All rights reserved.
