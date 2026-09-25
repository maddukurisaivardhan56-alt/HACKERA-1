# FARMER'S GAMBLE (SIH 2026)

## AI-Assisted Mandi Price & Cold-Storage Decision Support System

**Problem Statement ID:** SIH26132  
**Problem Statement:** Strengthening market linkages and price discovery for farmers  
**Team:** HACKARA  
**Edition:** Smart India Hackathon 2026  

---

## 🌾 Project Overview

**Farmer's Gamble** is a financial decision-support and market intelligence platform engineered for smallholder Indian farmers and agricultural market administrators. 

Instead of relying on guesswork or distress-selling at harvest gluts, farmers can evaluate transparent mathematical models comparing **Immediate Mandi Realization** against **Warehouse Cold-Storage Preservation**, accounting for:
- Direct storage rental tariffs (₹/Qtl/Month)
- Freight cartage to local mandis vs. accredited cold stores
- Loading, unloading, grading, and CIPC sprout-inhibition costs
- Physical moisture shrinkage & weight loss allowances (3–6%)
- Working capital opportunity cost / Kisan Credit Card interest carrying charges

When regional market spreads widen or storage margins turn profitable, the platform generates **multilingual AI Voice Advisories** (Marathi, Hindi, English) and simulates automated telephone outreach via an Exotel IVR pipeline.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation & Local Run
```bash
# 1. Clone or navigate to the repository
cd a:/SIH

# 2. Install dependencies
npm install

# 3. Launch local Vite development server
npm run dev
```

The application will be accessible at:
👉 **`http://localhost:5173`** (or the port assigned by Vite)

---

## 🔑 Prototype Demo Access & Logins

| Role | Access URL | Credentials / Inputs | Mode & Features |
| :--- | :--- | :--- | :--- |
| **Farmer Login** | `/login` | Mobile: `9822012345`<br/>Simulated OTP: `123456` | Active profile: **Ramesh Patil** (Nashik, Onion, 2 Acres). Live sell-or-store calculator, mandi prices, storage enquiries. |
| **Admin Login** | `/login` | Email: `admin@hackara.sih`<br/>Password: `admin2026` | Full CRUD over mandi prices, CSV upload preview, cold storage facilities, rule triggers, and simulated calling. |

> [!NOTE]
> You can also quickly switch demo farmer profiles directly from the top bar (Ramesh Patil, Sunita Deshmukh, Prakash Jadhav, Ananda Shinde, Balasaheb Kadam).

---

## 🏛️ Application Architecture & Completed Pages

```
src/
├── types/                 # TypeScript data contracts & financial models
├── utils/
│   ├── sellOrStoreCalc.ts # Core mathematical decision engine & sensitivity matrix
│   ├── formatters.ts      # Indian numbering format (₹), quintal conversions, masked PII
│   └── csvParser.ts       # CSV validator & template generator for APMC price uploads
├── data/
│   ├── initialFarmers.ts  # Maharashtra farmer seeds (Nashik, Ahmednagar, Pune, Solapur)
│   ├── initialMandis.ts   # APMC price feeds (Lasalgaon, Pimpalgaon, Pune, Yeola, etc.)
│   ├── initialStorage.ts  # Cold storage facilities with capacity, CIPC fogging & rates
│   ├── initialEvents.ts   # Automated trigger rules & sample call logs
│   └── mockStore.ts       # Unified LocalStorage persistence layer
├── services/
│   ├── authService.ts     # Farmer simulated OTP & Admin authentication
│   ├── advisoryService.ts # Multilingual voice script generator (Marathi, Hindi, English)
│   └── telephonyService.ts # Simulated Exotel IVR dispatcher with browser TTS audio preview
├── context/
│   └── AppContext.tsx     # Global application state provider
├── components/
│   ├── common/            # Header, Sidebar, Footer, MetricCard, Badge, Modal, DemoTag
│   ├── charts/            # PriceTrendChart, ProfitComparisonChart, StorageCostBreakdownChart
│   └── advisory/          # SimulatedCallModal, AudioPlayerWidget, ScriptPreviewCard
└── pages/
    ├── public/
    │   ├── LandingPage.tsx           # Product overview, 4-step workflow, SIH 2026 hero
    │   └── LoginPage.tsx             # Farmer simulated OTP & Admin login
    ├── farmer/
    │   ├── FarmerDashboard.tsx       # Live mandi ticker, quick decision snapshot, active advisory
    │   ├── MandiComparisonPage.tsx   # Multi-filter APMC price comparison & 30-day price trends
    │   ├── SellOrStorePage.tsx       # Interactive financial model, sliders & sensitivity matrix
    │   ├── ColdStoragePage.tsx       # Searchable warehouse directory with enquiry dispatch
    │   └── AdvisoryHistoryPage.tsx   # Chronological voice advisory feed & TTS player
    └── admin/
        ├── AdminDashboard.tsx        # System health, macro metrics, storage occupancy
        ├── FarmerManagementPage.tsx  # Searchable farmer registry with masked PII & CRUD
        ├── MarketStorageDataPage.tsx # Mandi CSV upload preview & Cold storage manager
        └── EventCallMonitoringPage.tsx # Event rule engine & simulated voice call dispatcher
```

---

## 🛡️ Prototype Transparency & Simulation Disclosures

In compliance with hackathon evaluation standards:
1. **Mandi Prices & Historical Curves:** Indicative prices based on Maharashtra APMC trends.
2. **OTP Verification:** Simulated locally; no third-party SMS gateway charges are incurred.
3. **Telephony Dispatches:** Voice calls are simulated through an Exotel-compatible interface with client-side SpeechSynthesis (Web Speech API) audio previews.
4. **Government Database Links:** Farmer records and warehouse receipts are maintained in the local prototype state with zero false claims of live government database connectivity.
5. **Decision Engine:** Financial calculations provide structured scenario comparisons based on user-entered price expectations and holding costs; future market prices are explicitly labeled as uncertain.

---

## 👥 Team Details

- **Team Name:** HACKARA  
- **Event:** Smart India Hackathon 2026  
- **Problem Statement:** SIH26132 — Strengthening market linkages and price discovery for farmers  
