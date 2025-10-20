# Oliver-OS End-to-End Tests

This directory contains comprehensive end-to-end tests for the Oliver-OS system, testing the complete integration between all components.

## 🧪 Test Structure

### Test Suites

| Suite | File | Description | Timeout |
|-------|------|-------------|---------|
| **WebSocket** | `websocket.test.ts` | WebSocket communication tests | 60s |
| **Database** | `database.test.ts` | Database integration tests | 120s |
| **AI Services** | `ai-services.test.ts` | AI services integration tests | 60s |

### Test Categories

#### WebSocket Tests
- ✅ Connection management (connect, disconnect, reconnect)
- ✅ Thought processing (create, analyze, error handling)
- ✅ Agent management (spawn, error handling)
- ✅ Voice processing (transcription, error handling)
- ✅ Channel subscription (subscribe, unsubscribe)
- ✅ Real-time collaboration events
- ✅ Error handling and edge cases
- ✅ Performance under load

#### Database Tests
- ✅ Database connection and health checks
- ✅ User operations (create, read, update)
- ✅ Thought operations (create, read, search)
- ✅ Knowledge graph operations (nodes, relationships)
- ✅ Collaboration operations (sessions, events)
- ✅ AI processing results storage
- ✅ Voice recordings storage
- ✅ Mind visualizations storage
- ✅ Error handling and validation
- ✅ Performance and concurrency

#### AI Services Tests
- ✅ Health check endpoints
- ✅ Thought processing via REST API
- ✅ Agent spawning and management
- ✅ Voice processing and transcription
- ✅ Error handling and validation
- ✅ Performance under load
- ✅ Integration with WebSocket

## 🚀 Running Tests

### Prerequisites

1. **Start Required Services**
   ```bash
   # Start PostgreSQL and Redis
   cd database
   docker-compose up -d
   
   # Wait for services to be ready
   sleep 10
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

### Running All E2E Tests

```bash
# Run all E2E tests with full reporting
pnpm run test:e2e

# Run with cleanup after tests
CLEANUP_TEST_RESULTS=true pnpm run test:e2e
```

### Running Individual Test Suites

```bash
# WebSocket tests only
pnpm run test:e2e:websocket

# Database tests only
pnpm run test:e2e:database

# AI Services tests only
pnpm run test:e2e:ai-services
```

### Running with Vitest Directly

```bash
# Run all E2E tests
npx vitest run tests/e2e/

# Run specific test file
npx vitest run tests/e2e/websocket.test.ts

# Run with verbose output
npx vitest run tests/e2e/ --reporter=verbose

# Run with coverage (not recommended for E2E)
npx vitest run tests/e2e/ --coverage
```

## 📊 Test Results

### Output Files

- `test-results/e2e-report.json` - JSON report with detailed results
- `test-results/websocket-results.txt` - WebSocket test output
- `test-results/database-results.txt` - Database test output
- `test-results/ai-services-results.txt` - AI Services test output

### Test Metrics

The E2E tests measure and report:

- **Response Times**: API and WebSocket response times
- **Throughput**: Requests per second under load
- **Error Rates**: Failed requests and error handling
- **Resource Usage**: Memory and CPU usage during tests
- **Concurrency**: Performance with multiple concurrent operations

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `test` | Test environment |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/oliver_os_test` | Test database URL |
| `REDIS_URL` | `redis://localhost:6379/1` | Test Redis URL |
| `TEST_BACKEND_PORT` | `3001` | Backend test port |
| `TEST_AI_SERVICES_PORT` | `8001` | AI Services test port |
| `CLEANUP_TEST_RESULTS` | `false` | Clean up test results after completion |

### Test Timeouts

- **Individual Tests**: 2 minutes (120s)
- **Setup/Teardown**: 1 minute (60s)
- **Global Setup**: 5 minutes (300s)
- **Global Teardown**: 30 seconds (30s)

## 🐛 Debugging

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   pg_isready
   
   # Start database services
   cd database && docker-compose up -d
   ```

2. **Redis Connection Failed**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Start Redis
   redis-server
   ```

3. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3001
   
   # Kill the process
   kill -9 <PID>
   ```

4. **Test Timeout**
   - Check if all services are running
   - Increase timeout in test configuration
   - Check system resources (CPU, memory)

### Debug Mode

```bash
# Run with debug output
DEBUG=true pnpm run test:e2e

# Run single test with debug
npx vitest run tests/e2e/websocket.test.ts --reporter=verbose
```

### Logs

Test logs are written to:
- Console output (stdout/stderr)
- `test-results/` directory
- Individual test result files

## 📈 Performance Benchmarks

### Expected Performance

| Test | Metric | Expected | Warning | Critical |
|------|--------|----------|---------|----------|
| WebSocket Connection | Time | < 1s | > 2s | > 5s |
| Thought Processing | Response Time | < 2s | > 5s | > 10s |
| Database Query | Response Time | < 100ms | > 500ms | > 1s |
| AI Services | Response Time | < 3s | > 10s | > 30s |
| Concurrent Requests | Throughput | > 10 req/s | < 5 req/s | < 1 req/s |

### Load Testing

The E2E tests include load testing scenarios:

- **Concurrent Thoughts**: 10 simultaneous thought processing requests
- **High Volume**: 50 rapid API requests
- **Sustained Load**: 20 requests over 5 seconds
- **WebSocket Load**: Continuous ping/pong for 5 seconds

## 🔄 Continuous Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run test:e2e
```

### Local Development

```bash
# Run E2E tests before committing
pnpm run test:e2e

# Run specific tests during development
pnpm run test:e2e:websocket
```

## 📝 Writing New Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupE2E, TEST_CONFIG } from './setup';

setupE2E();

describe('My Feature E2E Tests', () => {
  beforeEach(async () => {
    // Setup for each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  it('should test my feature', async () => {
    // Test implementation
    expect(true).toBe(true);
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up resources after tests
3. **Timeouts**: Use appropriate timeouts for E2E tests
4. **Error Handling**: Test both success and error scenarios
5. **Performance**: Include performance assertions
6. **Documentation**: Document what each test validates

## 🎯 Test Coverage

The E2E tests provide coverage for:

- ✅ **API Endpoints**: All REST API endpoints
- ✅ **WebSocket Events**: All WebSocket communication
- ✅ **Database Operations**: All CRUD operations
- ✅ **Error Scenarios**: Error handling and edge cases
- ✅ **Performance**: Load and stress testing
- ✅ **Integration**: Cross-component communication
- ✅ **Real-time Features**: WebSocket and collaboration
- ✅ **AI Processing**: Thought and voice processing

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Socket.IO Testing](https://socket.io/docs/v4/testing/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
- [PostgreSQL Testing](https://www.postgresql.org/docs/current/testing.html)
