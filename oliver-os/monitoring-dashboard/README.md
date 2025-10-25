# Smart Assistance Monitoring Dashboard

A real-time monitoring dashboard for the Smart Assistance System, built with React, TypeScript, and Tailwind CSS.

## 🎯 Features

### Real-time Monitoring
- **Live Metrics** - Performance, memory, error rates, suggestion quality
- **Quality Gates** - Automated quality threshold monitoring
- **System Health** - Service status and uptime tracking
- **Alert Management** - Real-time alerts and notifications
- **Test Results** - Live test execution and results

### Interactive Dashboard
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - WebSocket connection for live data
- **Interactive Charts** - Beautiful data visualizations with Recharts
- **Filtering & Search** - Advanced filtering and search capabilities
- **Modal Details** - Detailed views for alerts and test results

### Quality Assurance
- **Coverage Tracking** - Test coverage monitoring
- **Performance Metrics** - Response time and throughput tracking
- **Security Monitoring** - Security score and vulnerability tracking
- **Code Quality** - Maintainability and complexity metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Smart Assistance System running on port 3000

### Installation
```bash
# Navigate to monitoring dashboard
cd monitoring-dashboard

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The dashboard will be available at `http://localhost:3001`

### Production Build
```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 🏗️ Architecture

### Tech Stack
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Beautiful chart components
- **Socket.io** - Real-time WebSocket communication
- **Vite** - Fast build tool and dev server

### Project Structure
```
monitoring-dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx      # Dashboard header
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   ├── MetricsOverview.tsx
│   │   ├── PerformanceCharts.tsx
│   │   ├── QualityGates.tsx
│   │   ├── AlertsCenter.tsx
│   │   ├── SystemHealth.tsx
│   │   └── TestResults.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useWebSocket.ts # WebSocket data management
│   │   └── useApi.ts       # API data fetching
│   ├── services/           # External services
│   │   ├── websocket.ts    # WebSocket service
│   │   └── api.ts          # API service
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   └── index.ts
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 📊 Dashboard Sections

### 1. Overview
- **System Status** - Overall health and performance
- **Key Metrics** - Test coverage, performance, quality, security
- **Active Alerts** - Current alerts and notifications
- **Performance Charts** - Real-time performance graphs
- **Quality Gates** - Automated quality checks

### 2. Metrics
- **Detailed Metrics** - Comprehensive metric analysis
- **Trend Analysis** - Performance trends over time
- **Threshold Monitoring** - Quality threshold tracking
- **Historical Data** - Past performance data

### 3. Performance
- **CPU Usage** - Real-time CPU utilization
- **Memory Usage** - Memory consumption tracking
- **Response Time** - API response time monitoring
- **Throughput** - Request throughput tracking
- **Performance History** - Historical performance data

### 4. Quality Gates
- **Gate Status** - Individual gate status
- **Threshold Tracking** - Quality threshold monitoring
- **Success Rates** - Gate success statistics
- **Manual Triggers** - Manual gate execution

### 5. Alerts
- **Active Alerts** - Current system alerts
- **Alert History** - Past alert records
- **Alert Management** - Acknowledge and resolve alerts
- **Filtering** - Filter by type, severity, status

### 6. Tests
- **Test Results** - Live test execution results
- **Test History** - Past test runs
- **Test Management** - Run individual or all tests
- **Test Details** - Detailed test information

### 7. Health
- **Service Status** - Individual service health
- **System Uptime** - Overall system uptime
- **Health History** - Service health over time
- **System Information** - System configuration details

## 🔌 Integration

### WebSocket Connection
The dashboard connects to the Smart Assistance System via WebSocket for real-time data:

```typescript
// WebSocket events
'dashboard:data'     // Complete dashboard data
'metrics:update'     // Metrics updates
'alerts:new'         // New alerts
'alerts:update'      // Alert updates
'health:update'      // Health status updates
'performance:update' // Performance data updates
'tests:update'       // Test result updates
'quality-gates:update' // Quality gate updates
```

### API Endpoints
The dashboard also uses REST API endpoints for data fetching:

```typescript
// API endpoints
GET /api/monitoring/dashboard     // Dashboard data
GET /api/monitoring/metrics       // Metrics data
GET /api/monitoring/alerts        // Alerts data
GET /api/monitoring/health        // Health data
GET /api/monitoring/performance   // Performance data
GET /api/monitoring/tests         // Test results
GET /api/monitoring/quality-gates // Quality gates
```

## 🎨 Customization

### Themes
The dashboard supports light and dark themes (configurable):

```typescript
// Theme configuration
const config = {
  theme: 'light' | 'dark'
};
```

### Colors
Customize colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* Primary color palette */ },
      success: { /* Success color palette */ },
      warning: { /* Warning color palette */ },
      danger: { /* Danger color palette */ }
    }
  }
}
```

### Charts
Customize charts by modifying the Recharts components in the chart components.

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- **Desktop** - Full feature set with sidebar navigation
- **Tablet** - Collapsible sidebar with touch-friendly interface
- **Mobile** - Mobile-optimized layout with bottom navigation

## 🔧 Development

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type checking
```

### Adding New Components
1. Create component in `src/components/`
2. Add types in `src/types/index.ts`
3. Add hooks in `src/hooks/` if needed
4. Import and use in `App.tsx`

### Adding New Metrics
1. Add metric type to `QualityMetric` interface
2. Update WebSocket service to handle new metric
3. Add metric display in `MetricsOverview` component
4. Add chart visualization if needed

## 🚀 Deployment

### Build for Production
```bash
pnpm build
```

### Deploy to Static Hosting
The dashboard can be deployed to any static hosting service:
- **Vercel** - Zero-config deployment
- **Netlify** - Drag and drop deployment
- **GitHub Pages** - Free hosting for public repos
- **AWS S3** - Static website hosting

### Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## 📈 Performance

### Optimization Features
- **Code Splitting** - Automatic code splitting with Vite
- **Tree Shaking** - Unused code elimination
- **Lazy Loading** - Component lazy loading
- **Memoization** - React.memo for expensive components
- **Virtual Scrolling** - For large data sets

### Bundle Size
- **Development**: ~2MB (with source maps)
- **Production**: ~200KB (gzipped)
- **Chunks**: Vendor, charts, and app chunks

## 🛠️ Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Check if Smart Assistance System is running on port 3000
- Verify WebSocket endpoint is available
- Check firewall settings

#### No Data Displayed
- Verify API endpoints are responding
- Check browser console for errors
- Ensure proper CORS configuration

#### Charts Not Rendering
- Check if Recharts is properly installed
- Verify data format matches chart expectations
- Check for JavaScript errors in console

### Debug Mode
Enable debug mode by setting:
```typescript
localStorage.setItem('debug', 'true');
```

## 📚 API Reference

### WebSocket Events
| Event | Description | Data Type |
|-------|-------------|-----------|
| `dashboard:data` | Complete dashboard data | `DashboardData` |
| `metrics:update` | Metrics updates | `QualityMetric[]` |
| `alerts:new` | New alert | `QualityAlert` |
| `alerts:update` | Alert updates | `QualityAlert[]` |
| `health:update` | Health updates | `SystemHealth` |
| `performance:update` | Performance data | `PerformanceData` |
| `tests:update` | Test results | `TestResult[]` |
| `quality-gates:update` | Quality gates | `QualityGate[]` |

### REST API Endpoints
| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/monitoring/dashboard` | GET | Dashboard data | `DashboardData` |
| `/api/monitoring/metrics` | GET | Metrics data | `QualityMetric[]` |
| `/api/monitoring/alerts` | GET | Alerts data | `QualityAlert[]` |
| `/api/monitoring/health` | GET | Health data | `SystemHealth` |
| `/api/monitoring/performance` | GET | Performance data | `PerformanceData[]` |
| `/api/monitoring/tests` | GET | Test results | `TestResult[]` |
| `/api/monitoring/quality-gates` | GET | Quality gates | `QualityGate[]` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for the Smart Assistance System monitoring and quality assurance.*
