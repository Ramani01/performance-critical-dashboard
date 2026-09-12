# Performance-Critical Real-Time Data Visualization Dashboard

A production-grade, ultra-high-density telemetry data visualization dashboard built from scratch using **Next.js 14+ (App Router)**, **React 18**, **TypeScript**, **Canvas 2D**, **SVG overlays**, and **Web Workers**.

Designed to continuously render and update **10,000+ to 100,000+ data points** at a target **60 FPS** with interaction latency below 100ms and zero memory leaks.

---

## 🌟 Key Features

* **Zero External Charting Libraries**: 100% custom Canvas 2D + SVG hybrid rendering engine (No Chart.js, D3, Recharts, Plotly, or ApexCharts).
* **High-Density Render Engine**: 
  * **Line Chart**: Real-time multi-category paths with adaptive min-max downsampling.
  * **Bar Chart**: Category & time-binned bar distribution with rounded styling.
  * **Scatter Plot**: 100k point cloud visualization with multi-category color mapping.
  * **Heatmap Matrix**: 2D intensity matrix calculated across time & secondary metric dimensions with plasma color lookup.
* **Separation of Render vs. React State**: Viewport zoom/pan transforms (`scaleX`, `scaleY`, `offsetX`, `offsetY`) are maintained inside mutable `useRef` buffers, enabling silky-smooth 60 FPS panning & zooming without React re-render thrashing.
* **Bounded Sliding Window**: Strict bounded ring-buffer data window preventing memory growth during continuous 100ms multi-hour streaming sessions.
* **Off-Thread Web Worker Processing**: Aggregations (1m, 5m, 1h), category filtering, search queries, and min/max downsampling run inside a Web Worker thread (`public/workers/dataWorker.js`) with main-thread fallback.
* **Custom Virtualized Telemetry Table**: Custom `useVirtualization` engine rendering 100,000+ records with zero DOM lag (renders only visible rows + buffer).
* **Empirical Performance HUD**: Live FPS counter, frame render time (ms), Web Worker processing time (ms), active point count, and browser JS Heap memory gauge (`performance.memory`).
* **Stress Test Mode**: Workload simulator pushing dense 30ms data bursts to validate 60 FPS stability under extreme load.

---

## 🏗 Architecture & Technology Stack

* **Framework**: Next.js 14+ (App Router exclusively)
* **Language**: TypeScript (Strict Mode)
* **UI & Styling**: React 18, Tailwind CSS, Lucide Icons, Glassmorphism design system
* **Rendering**: Canvas 2D (`requestAnimationFrame` + `devicePixelRatio` HiDPI support) + SVG overlays for axes, grid lines, and interactive crosshair/tooltips
* **State Management**: React Context (`DataProvider.tsx`) + `useRef` rendering buffers
* **Background Worker**: Web Worker (`public/workers/dataWorker.js`)

```
performance-dashboard/
├── app/
│   ├── api/
│   │   └── data/
│   │       └── route.ts         # Route handler for initial seed data
│   ├── dashboard/
│   │   ├── layout.tsx           # Dashboard layout
│   │   └── page.tsx             # Main dashboard workspace
│   ├── error.tsx                # Global error boundary
│   ├── globals.css              # Dark mode design tokens & Tailwind CSS
│   ├── layout.tsx               # Root layout & Google Fonts
│   ├── loading.tsx              # Suspense loading fallback
│   └── page.tsx                 # Root redirect to /dashboard
├── components/
│   ├── charts/
│   │   ├── BaseChartCanvas.tsx  # Canvas + SVG hybrid wrapper & gesture listener
│   │   ├── LineChart.tsx        # Downsampled multi-category line chart
│   │   ├── BarChart.tsx         # Category/time binned bar visualization
│   │   ├── ScatterPlot.tsx      # Point cloud scatter plot
│   │   └── Heatmap.tsx          # 2D plasma intensity matrix
│   ├── controls/
│   │   ├── FilterPanel.tsx      # Category & live search filters
│   │   ├── LoadControls.tsx     # Workload switcher (1k-100k) & stress mode
│   │   └── TimeRangeSelector.tsx# Time aggregation selector (1m, 5m, 1h)
│   ├── providers/
│   │   └── DataProvider.tsx     # Global React Context provider
│   └── ui/
│       ├── DataTable.tsx        # Virtualized telemetry table
│       ├── Header.tsx           # Dashboard navigation & chart switcher
│       └── PerformanceMonitor.tsx# Empirical performance HUD
├── hooks/
│   ├── useChartRenderer.ts      # Canvas rAF loop & zoom/pan gesture engine
│   ├── useDataStream.ts         # 100ms real-time stream & sliding window hook
│   ├── usePerformanceMonitor.ts # Real-time FPS & JS memory tracker
│   └── useVirtualization.ts     # Lightweight virtual scroll engine
├── lib/
│   ├── canvasUtils.ts           # Coordinate mapping, downsampling, color mappers
│   ├── dataGenerator.ts         # Multi-variate time-series seed & delta producer
│   ├── performanceUtils.ts      # Rolling FPS tracker & JS memory detector
│   └── types.ts                 # Strongly typed models and worker protocols
├── public/
│   └── workers/
│       └── dataWorker.js        # Off-thread Web Worker for filtering & aggregation
├── package.json
├── next.config.mjs
├── tsconfig.json
├── README.md
└── PERFORMANCE.md
```

---

## ⚡ Quick Start & Setup

### Requirements
* Node.js v18.17+ or v20+
* npm or yarn

### Installation
```bash
# Clone repository and install dependencies
npm install
```

### Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Launch
```bash
# Build production bundle
npm run build

# Start production server
npm start
```

---

## 🧪 How to Run Performance & Stress Tests

1. **Preset Load Switcher**: Use the workload buttons in the top control bar to switch between **1k, 5k, 10k, 25k, 50k, and 100k** data points.
2. **Interactive Pan & Zoom**: Scroll your mouse wheel over the canvas to zoom in/out, or click-and-drag to pan across historical data. Observe that FPS remains smooth.
3. **Stress Test Mode**: Click the **Stress Test (30ms Burst)** button. This will simulate high-frequency multi-point bursts every 30ms. Check the **Empirical Performance HUD** for live FPS, frame render time, and JS Heap Memory metrics.
4. **Virtualized Table Scroll**: Scroll down to the **Virtualized Telemetry Records** table and scroll rapidly through 100,000 items.

---

## 🌐 Deployment to Vercel

This project is fully optimized for Vercel deployment:

1. Push your code to GitHub/GitLab.
2. Import project into Vercel Dashboard.
3. Framework Preset: **Next.js**.
4. Build Command: `npm run build`.
5. Output Directory: `.next`.

---

## 📝 Known Limitations

* `performance.memory` API is currently supported natively in Chromium-based browsers (Chrome, Edge, Opera). Firefox and Safari report "API N/A" gracefully without crashing.
