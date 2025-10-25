# 🎯 Smart Assistance Monitoring Dashboard - Quick Start

## 🚀 **Start the Dashboard**

### Option 1: Using pnpm (Recommended)
```bash
# From the main project directory
pnpm monitor:start
```

### Option 2: Direct navigation
```bash
# Navigate to dashboard directory
cd monitoring-dashboard

# Install dependencies (first time only)
pnpm install

# Start development server
pnpm dev
```

### Option 3: Double-click startup
```bash
# Navigate to monitoring-dashboard folder
cd monitoring-dashboard

# Double-click start.bat
start.bat
```

## 🌐 **Access the Dashboard**

Once started, the dashboard will be available at:
- **URL**: `http://localhost:3001`
- **Port**: 3001 (separate from main app on 3000)

## 📊 **Dashboard Features**

### Real-time Monitoring
- ✅ **Live Metrics** - Performance, memory, quality scores
- ✅ **Quality Gates** - Automated quality threshold monitoring  
- ✅ **Alert Center** - Real-time alerts and notifications
- ✅ **System Health** - Service status and uptime
- ✅ **Test Results** - Live test execution and results
- ✅ **Performance Charts** - Beautiful real-time graphs

### Dashboard Sections
1. **Overview** - System status and key metrics
2. **Metrics** - Detailed metrics analysis
3. **Performance** - CPU, memory, response time charts
4. **Quality Gates** - Quality threshold monitoring
5. **Alerts** - Alert management and filtering
6. **Tests** - Test execution and results
7. **Health** - System health and service status

## 🔧 **Troubleshooting**

### Dashboard won't start
```bash
# Check if dependencies are installed
cd monitoring-dashboard
pnpm install

# Check Node.js version (requires 18+)
node --version

# Check pnpm installation
pnpm --version
```

### No real-time data
- Ensure Smart Assistance System is running on port 3000
- Check WebSocket connection in browser console
- Verify API endpoints are responding

### Port conflicts
- Dashboard runs on port 3001
- Main app runs on port 3000
- Change port in `vite.config.ts` if needed

## 🎨 **Customization**

### Change Port
Edit `monitoring-dashboard/vite.config.ts`:
```typescript
server: {
  port: 3001, // Change this number
}
```

### Change API URL
Edit `monitoring-dashboard/vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000', // Change this URL
  }
}
```

## 📱 **Mobile Access**

The dashboard is fully responsive and works on:
- **Desktop** - Full feature set
- **Tablet** - Touch-friendly interface
- **Mobile** - Mobile-optimized layout

## 🚀 **Production Deployment**

### Build for Production
```bash
cd monitoring-dashboard
pnpm build
```

### Deploy
The built files in `dist/` can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3

## 📞 **Support**

If you encounter any issues:
1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure Smart Assistance System is running
4. Check the dashboard README for detailed documentation

---

**🎉 The monitoring dashboard is completely separate from your main frontend and won't interfere with your existing code!**
