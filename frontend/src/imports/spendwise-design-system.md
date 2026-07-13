Design a complete multi-page UI for "SpendWise", a personal finance 
web application. Use a Dark Classic theme with modern fintech aesthetics.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Color Palette:
- Background (deepest): #0B1120
- Surface (cards): #111827
- Surface elevated: #1A2540
- Border subtle: rgba(255,255,255,0.07)
- Primary accent: #10B981 (Emerald — healthy/positive)
- Secondary accent: #22D3EE (Cyan — info/neutral)
- Warning: #F59E0B (Amber — caution/upcoming)
- Danger: #F43F5E (Rose — overspend/urgent)
- Purple: #8B5CF6 (savings/goals)
- Text primary: #E2E8F0
- Text muted: #94A3B8
- Text dim: #64748B

Typography:
- Display / Headings: Sora (weight 600–700)
- Body / Labels: Sora (weight 400–500)
- Numbers / Amounts: DM Mono (weight 400–500)
- All currency amounts must use DM Mono font

Component Tokens:
- Border radius cards: 18px
- Border radius buttons: 10px
- Border radius badges/pills: 999px
- Card border: 1px solid rgba(255,255,255,0.07)
- Card top shimmer: 1px gradient highlight on top edge
- Hover state: translateY(-3px) + stronger border
- Glassmorphism on modals: backdrop-blur with semi-transparent bg
- Glow blobs: colored radial gradients behind key metrics

Layout:
- Fixed left sidebar: 240px wide
- Top header bar: 64px height
- Main content area: fluid, max-width 1280px
- Card grid: CSS Grid, responsive columns
- Spacing unit: 8px base (16, 24, 32, 48)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL COMPONENTS (reuse across all pages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sidebar (left, fixed, 240px):
- SpendWise logo + emerald icon top left
- Nav items with icons: Dashboard, Expenses, Subscriptions,
  Budgets, Analytics, Calendar, Notifications, Settings
- Active state: emerald left border + emerald tinted background
- Bottom: user avatar + name + "Logout" button
- Subtle top-to-bottom gradient background

Top Header Bar:
- Page title (left)
- Search bar (center, rounded, dark)
- Notification bell with red badge count
- Currency selector dropdown (INR ₹)
- User avatar (right)

Stat Card Component:
- Dark surface background (#111827)
- Colored glow blob top-right corner
- Label (12px muted), Icon (tinted bg square)
- Large DM Mono number (32px)
- Trend pill (▲/▼ percentage, colored)
- Progress bar at bottom (5px height, gradient fill)

Data Table Component:
- Dark rows, alternating subtle shade
- Rounded table container
- Sortable column headers
- Status badges (colored pills)
- Action icons (edit pencil, delete trash) on hover
- Pagination bar at bottom

Modal / Drawer:
- Glassmorphism overlay
- Form fields: dark input bg, emerald focus ring
- Cancel (ghost) + Submit (emerald filled) buttons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 1 — LOGIN PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout: Centered split — left decorative panel, right form panel

Left Panel (decorative, 50%):
- Deep navy background with emerald radial glow
- SpendWise logo large + tagline:
  "Track expenses, manage subscriptions, stay within budget"
- 3 feature highlight rows with icons:
  💰 Smart Expense Tracking
  🔄 Subscription Manager
  🎯 Budget Monitoring
- Floating mockup card showing a sample stat (total spent)

Right Panel (form, 50%):
- "Welcome back" heading (Sora 700)
- Subtext: "Sign in to your SpendWise account"
- Email input field (with mail icon)
- Password input field (with eye toggle icon)
- "Remember me" checkbox + "Forgot password?" link (right aligned)
- "Sign In" button (full width, emerald gradient)
- Divider: "or continue with"
- Google OAuth button (outlined)
- Footer: "Don't have an account? Register →"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 2 — REGISTER PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Same split layout as Login

Right Panel (form):
- "Create your account" heading
- Full Name input (person icon)
- Email input (mail icon)
- Password input (lock icon, strength indicator bar below)
- Confirm Password input
- Currency preference dropdown (default: INR ₹)
- Terms & conditions checkbox with link
- "Create Account" button (full width, emerald)
- Footer: "Already have an account? Sign in →"

Left Panel:
- Same branding as login
- Show a progress steps indicator:
  Step 1: Create Account → Step 2: Set Budget → Step 3: Track!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 3 — DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full layout with sidebar + header

Top Row — 4 Stat Cards (equal width grid):
1. Total Spent (this month)
   Value: ₹18,420 | Trend: ▲12% vs last month
   Progress bar: 73% of monthly budget used
   Glow: Emerald

2. Budget Remaining
   Value: ₹6,580 | Badge: 26% left
   Progress bar: days remaining in month
   Glow: Cyan

3. Subscriptions / Month
   Value: ₹3,240 | Badge: 8 active services
   Progress bar: renewal urgency
   Glow: Amber

4. Savings Rate
   Value: 34% | Trend: ▲5%
   Progress bar: goal 40%
   Glow: Purple

Middle Row — 2 Charts (60% / 40% split):
Left — Monthly Spending Trend (line chart, Recharts style):
- X axis: last 6 months (Sep–Feb)
- Y axis: amount in ₹
- Two lines: Expenses (emerald) vs Budget (cyan dashed)
- Gradient area fill under expense line
- Dark chart background, grid lines very subtle

Right — Category Spending Pie Chart:
- Donut chart style
- Center: "₹18,420 Total"
- Segments: Food (emerald), Transport (cyan),
  Entertainment (amber), Shopping (purple),
  Utilities (rose), Other (slate)
- Legend below with colored dots + amounts

Bottom Row — 2 panels (65% / 35% split):
Left — Recent Transactions table:
- Columns: Category icon, Description, Date, Amount, Payment Method, Status
- Show 5 latest rows
- "View all" link top right
- Amounts in DM Mono, negative in rose color

Right — Upcoming Renewals widget:
- Title + "3 this week" amber pill
- List of 4 subscriptions:
  Netflix | Mar 1 | ₹649 (rose)
  Spotify | Mar 3 | ₹119 (amber)
  iCloud  | Mar 5 | ₹75  (muted)
  YouTube | Mar 7 | ₹189 (muted)
- Each row: emoji icon, name, date, amount

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 4 — EXPENSES PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar:
- Page title "Expenses"
- "+ Add Expense" button (emerald, right aligned)
- Summary row: 3 mini stat chips —
  This Month: ₹18,420 | This Week: ₹4,210 | Today: ₹850

Filter Bar (below summary):
- Date range picker (From → To)
- Category multi-select dropdown
- Payment method dropdown
- Amount range slider
- "Clear filters" ghost link
- Search input (right side)

Expense Table (full width):
Columns:
- # | Category (icon + name) | Description | Date |
  Amount | Payment Method | Receipt | Actions
- Category column: colored icon + category name
- Amount: DM Mono, rose color for expenses
- Receipt: paperclip icon if attached, dash if not
- Actions: pencil edit + trash delete icons (visible on row hover)
- Status badge: One-time / Recurring
- Pagination: 10 rows per page, prev/next controls

Add Expense Modal (show as overlay):
Fields:
- Amount (large DM Mono input, ₹ prefix)
- Category (icon grid picker — visual tiles)
- Date (date picker)
- Description (text input)
- Payment Method (Card / UPI / Cash / Net Banking — segmented control)
- Is Recurring toggle → show frequency dropdown if on
- Upload Receipt (drag & drop zone with camera icon)
- Cancel + Save Expense buttons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 5 — SUBSCRIPTIONS PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar:
- Title "Subscriptions"
- "+ Add Subscription" button (emerald)
- 3 summary chips:
  Monthly Cost: ₹3,240 | Yearly: ₹38,880 | Active: 8

Filter tabs: All | Active | Paused | Cancelled

Subscription Cards Grid (3 columns):
Each card contains:
- Service emoji/logo icon (top left)
- Service name (bold) + category badge
- Amount (DM Mono, large) + billing cycle label
- Next billing date with calendar icon
- Status badge pill: Active (emerald) / Paused (amber) / Cancelled (rose)
- Progress bar: days until next renewal
- Action buttons: Edit (pencil) | Pause | Cancel

Sample cards: Netflix, Spotify, YouTube Premium,
iCloud, Adobe CC, Amazon Prime, Notion, GitHub Pro

Upcoming Renewals banner (below grid):
- Horizontal scrollable row of next 7 days renewals
- Each item: emoji + name + date + amount chip

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 6 — BUDGETS PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar:
- Title "Budgets — February 2026"
- Month selector arrows (← Feb 2026 →)
- "+ Set Budget" button (emerald)
- Summary strip: Total Budgeted ₹25,000 | Total Spent ₹18,420 | Safe ₹6,580

Budget Cards Grid (2 columns):
Each Budget Card:
- Category icon + name (top left)
- Budget amount (DM Mono) + period label "/ month"
- Spent amount below in muted text
- Wide horizontal progress bar (colored by spend level):
  Under 50%: emerald fill
  50–80%: amber fill
  80–100%: rose fill
  Over 100%: flashing rose with "Overspent" badge
- Percentage label on right of bar
- Alert threshold chip: "Alert at 80%"
- Edit + Delete icon buttons

Categories to show:
Food & Dining (₹5,000), Transport (₹3,000),
Entertainment (₹2,500), Shopping (₹4,000),
Utilities (₹2,000), Healthcare (₹1,500),
Subscriptions (₹3,500), Miscellaneous (₹3,500)

Overall Budget summary card (full width, at top):
- Donut showing overall % used
- Total budget vs spent side by side
- Days left in month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 7 — ANALYTICS PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar:
- Title "Analytics"
- Time range selector: 1M | 3M | 6M | 1Y (segmented pill control)
- "Export CSV" button (outlined, with download icon)

Row 1 — 4 KPI chips (compact):
Total Spent | Avg Daily Spend | Highest Category | Biggest Expense

Row 2 — Large trend chart (full width):
- Multi-line chart: 6 months
- Lines: Total Spend (emerald), Food (cyan), Transport (amber)
- Area fill under total spend line
- Tooltips on hover showing breakdown
- X: months, Y: ₹ amounts

Row 3 — 3 charts side by side:
Left — Category Donut chart (same as dashboard but larger)
Center — Bar chart: Top 5 spending days of month
Right — Heatmap-style spending calendar (GitHub contribution style)
  Low spend: dark green, High spend: bright emerald

Row 4 — Insights cards row:
3 insight cards with icons:
- "Food spending up 18% this month" (amber warning icon)
- "You saved ₹2,100 vs last month" (emerald thumbs up)
- "Netflix renewal in 2 days" (rose bell icon)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 8 — CALENDAR PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar:
- Title "Calendar"
- ← February 2026 → month navigation
- Legend chips: Expense (emerald dot) | Renewal (amber dot) | Both (cyan dot)

Calendar Grid (7 columns, full month):
- Large date cells
- Each cell can contain:
  - Small emerald dot + amount for expense days
  - Small amber dot + service name for renewal days
  - Today: highlighted with cyan border
- Day cells with content show mini preview on hover

Right side panel (320px):
- "Selected Day" detail panel
- Shows list of expenses + renewals for clicked date
- Each item: icon, name, amount, category badge

Monthly Summary strip (below calendar):
- Total spent this month
- Days with expenses count
- Highest spend day highlighted

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 9 — NOTIFICATIONS PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar:
- Title "Notifications"
- Unread count badge (rose pill)
- "Mark all as read" ghost button (right)
- Filter tabs: All | Unread | Renewals | Budget Alerts

Notification List (full width):
Each notification item:
- Left: colored icon circle (rose for budget alert, amber for renewal, emerald for info)
- Title (bold) + message body (muted, 2 lines)
- Timestamp (relative: "2 hours ago")
- Unread indicator: left border accent + slightly lighter bg
- Read state: no border, dimmed text
- Hover: reveal "Dismiss" × button right side

Sample notifications:
- 🔴 Budget Alert: "Food budget at 92% — ₹460 remaining"
- 🟡 Renewal Reminder: "Netflix renews in 2 days — ₹649"
- 🟡 Renewal Reminder: "Spotify renews in 4 days — ₹119"
- 🟢 Info: "February report ready — ₹18,420 total spent"
- 🔴 Budget Alert: "Shopping budget exceeded by ₹340"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 10 — SETTINGS PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout: Left tab menu + right content panel

Left Settings Menu (200px):
Tabs with icons:
- 👤 Profile
- 🔒 Security
- 🌍 Preferences
- 🔔 Notifications
- 📤 Data & Export
- 💳 Subscription Plan

Right Content Panel — Profile Tab (default):
- Profile picture upload circle + "Change Photo" link
- Full Name input
- Email input (with "Verified" green badge)
- Phone number input (optional)
- "Save Changes" emerald button

Right Content Panel — Preferences Tab:
- Currency selector (dropdown: INR ₹, USD $, EUR €...)
- Timezone selector dropdown
- Date format toggle: DD/MM/YYYY vs MM/DD/YYYY
- Week starts on: Sunday / Monday toggle
- Theme toggle: Dark / Light (dark pre-selected)

Right Content Panel — Notifications Tab:
- Toggle rows for each notification type:
  Email Notifications (master toggle)
  → Subscription Renewal Reminders (sub-toggle)
  → Budget Alert Emails (sub-toggle)
  In-App Notifications (master toggle)
  → Budget at 80% alert
  → Budget at 100% alert
  → Monthly summary report
- Alert threshold slider: "Alert me when budget reaches __%" (default 80)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK ANNOTATIONS
(add as dev notes on each frame)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Framework: React 18 + Vite 5
- Styling: Tailwind CSS 3 (utility classes)
- Charts: Recharts 2 (LineChart, PieChart, BarChart)
- Forms: React Hook Form 7
- HTTP: Axios 1
- Routing: React Router v6
- Icons: Lucide React
- Fonts: Google Fonts — Sora + DM Mono
- Animations: CSS transitions + Tailwind animate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERABLE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- 10 separate frames, one per page
- Frame size: 1440 × 900px (desktop web)
- Also provide 375px mobile frame for:
  Login, Dashboard, Expenses pages
- Use auto-layout throughout for responsiveness
- All components as reusable Figma components
- Organized in pages: Auth / Core App / Settings