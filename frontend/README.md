# SpendWise Frontend — Expense & Subscription Manager

A premium, highly interactive dashboard UI built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 🎨 Design System & Aesthetics
This frontend utilizes a high-end, responsive design system. Key choices include:
- **Design Tokens**: Standardized CSS variables for custom fonts (Inter/Outfit), modern color palettes (vibrant gradients, semantic accents), and animations.
- **Glassmorphism**: Sleek, modern blurred backdrops for cards, dropdown menus, and sidebar panels.
- **Micro-Animations**: Custom hover states, transition effects, and smooth layout updates using Framer Motion.
- **Dark Mode**: Default dark theme optimized for eye comfort and visual distinction.

---

## 🚀 Key Pages & Features

*   **Dashboard** (`pages/Dashboard.tsx`): Overview charts, current month spending statistics, active subscriptions totals, and quick actions.
*   **Analytics** (`pages/Analytics.tsx`): Category-wise expense breakdown, trend charts, and daily financial data visualizations using Recharts.
*   **Expenses** (`pages/Expenses.tsx`): Add, edit, remove expense items; attach/upload receipt images; apply filter tags and pagination.
*   **Subscriptions** (`pages/Subscriptions.tsx`): Tracking panel for recurrent bills, billing cycles (weekly, monthly, yearly), and cost calculations.
*   **Budgets** (`pages/Budgets.tsx`): Interactive progress bars tracking monthly budget targets and threshold warners (e.g. 80%).
*   **Calendar** (`pages/Calendar.tsx`): Visual monthly layout mapping out upcoming subscription renewals and expenses.
*   **Settings** (`pages/Settings.tsx`): Profile adjustments (avatar, timezone, notification channels, preferred currency).

---

## 🛠️ Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/      # Reusable UI pieces & layout templates
│   │   │   └── ui/          # Radix-based custom visual components
│   │   ├── context/         # Auth and state management contexts
│   │   ├── hooks/           # Custom React hooks (useAuth, etc.)
│   │   ├── pages/           # Core page views (Dashboard, Settings, etc.)
│   │   └── routes.ts        # App routing maps
│   ├── imports/             # API client connection configurations
│   ├── styles/              # Global Tailwind variables, typography and themes
│   └── main.tsx             # Application entry point
├── package.json             # Core dependency metadata
└── vite.config.ts           # Development server configs
```

---

## ⚡ Quick Start

### Installation

Install packages using npm or your favorite package manager:
```bash
npm install
```

### Run Locally

Start the Vite hot-reloading development server:
```bash
npm run dev
```
The application will be running at `http://localhost:5173`.

### Production Build

Compile the React TypeScript app into optimized static files:
```bash
npm run build
```

---

## 🧪 Testing

Execute frontend unit tests (powered by Vitest):
```bash
npm test
```
