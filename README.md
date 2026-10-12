# TEXTAIL - Textile Billing & Stock Management Software

A full-stack, enterprise-grade Textile Billing (POS) and Inventory ERP software built with **React**, **Next.js (App Router)**, **MongoDB (Mongoose)**, and **Tailwind CSS**.

---

## 🌟 Key Features

### 1. 🧾 Textile Billing & POS Terminal (`/billing`)
- **Cut-Meter Billing**: Precise decimal meterage input (e.g. 2.5m, 12.0m) tailored for textile retail and wholesale.
- **Fabric & Roll Selector**: Select specific fabric rolls (e.g., Roll #R-COT-01 with remaining meters) or draw automatically from active rolls.
- **Live Calculation**: Instant calculation of Subtotal, Item-level Discounts (%), Taxable Amount, GST (5% default textile rate: 2.5% CGST + 2.5% SGST), and Round Off.
- **Customer Ledger**: Fast walk-in customer toggle or capture Customer Name, Mobile, Address, and B2B GSTIN.
- **Payment Modes**: Supports **Cash**, **UPI** (with QR preview), **Card**, and **Credit / Khata / Due**.
- **Instant Printable Bill**: Modal with dual format options:
  - **A4/A5 GST Tax Invoice** (formal tax invoice layout)
  - **Thermal Receipt** (compact POS receipt format)
  - Print-friendly CSS (`window.print()`).

### 2. 📦 Stock & Fabric Roll Management (`/inventory`)
- **Roll Tracking**: View total available meters as well as individual roll numbers, initial meters, and current remaining meters.
- **Automatic Stock Deduction**: Generating a bill automatically decrements stock from the selected roll and updates the fabric's inventory in real-time.
- **Category Filtering**: Filter across Cotton, Silk, Linen, Rayon, Denim, Georgette, Velvet, Wool, Satin, etc.
- **Stock Inward Entry**: Record new arrivals from textile mills with supplier name, bill number, roll numbers, meters, and purchase cost.
- **Low Stock Alerts**: Configurable minimum stock reorder thresholds with alert badges.
- **Inventory Valuation**: Total meters in hand, cost valuation (mill price), and estimated retail value.

### 3. 📈 Sales Reports: Weekly & Monthly (`/reports`)
- **Weekly Sales Report**:
  - Breakdown across each day of the week (Monday to Sunday).
  - Revenue velocity, total meters cut, order volume, and average bill value.
  - Interactive day-by-day bar chart.
  - Top 5 performing fabrics of the week.
  - Fabric category revenue share.
  - Payment modes distribution (Cash vs UPI vs Card vs Credit).
  - **1-Click Export to CSV**.
- **Monthly Sales Report**:
  - Week-by-week turnover breakdown for the entire month.
  - Month-on-month growth percentage comparison.
  - Monthly category breakdown & top revenue-generating textile varieties.
  - **1-Click Export to CSV**.

### 4. 📊 Central Dashboard (`/`)
- Top KPI metric cards: Today's Revenue, This Week's Revenue, This Month's Revenue, Stock in Hand.
- Quick action shortcuts to POS Billing, Stock Management, and Reports.
- 7-Day sales velocity bar graph.
- Low stock reorder watchlist.
- Recent sales receipts with instant print action.

### 5. 📜 Invoices Archive (`/invoices`)
- Search past bills by invoice number (`INV-2610-0001`), customer name, or phone.
- Filter by payment method.
- View and reprint any past invoice anytime.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string.

### Configuration (`.env.local`)
```env
MONGODB_URI=mongodb://127.0.0.1:27017/textail
NEXT_PUBLIC_APP_NAME=Textail Billing & ERP
NEXT_PUBLIC_SHOP_NAME=TEXTAIL FABRICS & SUITINGS
NEXT_PUBLIC_SHOP_ADDRESS=104, Ring Road Market, Surat, Gujarat - 395002
NEXT_PUBLIC_SHOP_PHONE=+91 98765 43210
NEXT_PUBLIC_SHOP_GSTIN=24AAACT1234F1Z8
```

### Running Locally
```bash
# Start Next.js development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Seed Sample Data
To populate realistic sample textile fabrics (rolls, designs, colors) and 24 past bills to test weekly & monthly reports:
```bash
npm run seed
```
*(Or click the "Load Sample Data" button directly in the top navigation bar!)*
