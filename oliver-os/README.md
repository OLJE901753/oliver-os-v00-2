# Smart Assistance System

[![CI/CD Status](https://github.com/oliver-os/smart-assistance/workflows/Smart%20Assistance%20CI/CD%20Pipeline/badge.svg)](https://github.com/oliver-os/smart-assistance/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/oliver-os/smart-assistance/branch/main/graph/badge.svg)](https://codecov.io/gh/oliver-os/smart-assistance)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=oliver-os_smart-assistance&metric=alert_status)](https://sonarcloud.io/dashboard?id=oliver-os_smart-assistance)
[![Security](https://snyk.io/test/github/oliver-os/smart-assistance/badge.svg)](https://snyk.io/test/github/oliver-os/smart-assistance)

## Overview

The Smart Assistance System is an intelligent development assistant that provides real-time code analysis, suggestions, and quality monitoring. Built with TypeScript and following BMAD principles (Break, Map, Automate, Document), it offers comprehensive testing, quality assurance, and CI/CD integration.

## 🚀 Features

### Smart Assistance
- **Real-time Code Analysis** - Instant code quality assessment
- **Intelligent Suggestions** - Context-aware code improvements
- **Pattern Recognition** - Learning from code patterns and user feedback
- **Quality Monitoring** - Continuous quality metrics and alerts

### Quality Assurance
- **Comprehensive Testing** - 6 test suites with 100+ test cases
- **Performance Testing** - Benchmarks and memory usage monitoring
- **Security Scanning** - Vulnerability detection and audit
- **Quality Gates** - Automated quality threshold enforcement

### CI/CD Integration
- **Automated Testing** - GitHub Actions workflows for all environments
- **Quality Monitoring** - Real-time quality metrics and reporting
- **Security Scanning** - Automated security vulnerability detection
- **Deployment Automation** - Staging and production deployment

## 🧪 Testing

### Quick Start
```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test:smart:all

# Run with coverage
pnpm test:smart:coverage

# Run specific test suite
pnpm test:algorithms
pnpm test:integration
pnpm test:performance
pnpm test:quality
pnpm test:edge-cases
pnpm test:monitoring
```

### CI/CD Commands
```bash
# Validate (lint, type-check, basic tests)
pnpm ci:validate

# Full CI pipeline
pnpm ci:full

# Individual CI components
pnpm ci:test
pnpm ci:coverage
pnpm ci:performance
pnpm ci:security
pnpm ci:quality
```

## 📊 Quality Metrics

### Coverage Requirements
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum
- **Statements**: 80% minimum

### Performance Thresholds
- **Small Files** (< 100 lines): < 100ms
- **Medium Files** (< 1000 lines): < 1s
- **Large Files** (< 5000 lines): < 5s
- **Memory Usage**: < 200MB under load

### Quality Gates
- **Test Coverage**: ≥ 80%
- **Code Complexity**: ≤ 10
- **Performance Score**: ≥ 0.8
- **Reliability Score**: ≥ 0.9
- **Maintainability Score**: ≥ 0.8
- **Security Score**: ≥ 0.9

## 🛠️ Development

### Prerequisites
- Node.js 18+
- pnpm 8+
- TypeScript 5+

### Setup
```bash
# Clone repository
git clone https://github.com/oliver-os/smart-assistance.git
cd smart-assistance

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test:smart:all
```

### Project Structure
```
src/
├── core/                 # Core system components
├── services/            # Smart assistance services
│   ├── memory/          # Memory and learning services
│   ├── review/          # Quality review services
│   └── monster-mode/    # Advanced orchestration
├── tests/               # Comprehensive test suites
│   └── smart-assistance/
│       ├── algorithm-tests.ts
│       ├── integration-tests.ts
│       ├── performance-tests.ts
│       ├── quality-gates.ts
│       ├── edge-case-tests.ts
│       └── quality-monitoring.ts
└── examples/            # Usage examples
```

## 🔧 Configuration

### Environment Variables
```bash
# Smart Assistance Configuration
SMART_ASSISTANCE_ENABLED=true
QUALITY_THRESHOLD=0.8
PERFORMANCE_THRESHOLD=1000
MEMORY_THRESHOLD=200

# CI/CD Configuration
GITHUB_TOKEN=your_github_token
SNYK_TOKEN=your_snyk_token
SLACK_WEBHOOK=your_slack_webhook
```

### Quality Configuration
See `ci-cd-config.yml` for detailed configuration options including:
- Quality thresholds
- Performance requirements
- Security settings
- Notification preferences

## 📈 Monitoring

### Real-time Metrics
- **Performance** - Analysis speed and efficiency
- **Memory Usage** - Heap usage and leak detection
- **Error Rates** - Failure tracking and recovery
- **Suggestion Quality** - Accuracy and relevance scoring
- **Learning Effectiveness** - Pattern recognition success rates

### Quality Dashboard
Access the quality dashboard at `/quality` to view:
- Live quality metrics
- Performance trends
- Alert notifications
- System health status

## 🚀 Deployment

### Staging
```bash
# Deploy to staging
pnpm deploy:staging

# Run staging tests
pnpm test:staging
```

### Production
```bash
# Deploy to production
pnpm deploy:production

# Run production tests
pnpm test:production
```

### Docker
```bash
# Build Docker image
docker build -t smart-assistance .

# Run with Docker
docker run -p 3000:3000 smart-assistance

# Run tests in Docker
docker run --rm smart-assistance pnpm test:smart:all
```

## 📚 Documentation

- **[Quality Assurance](QUALITY_ASSURANCE_README.md)** - Comprehensive testing and quality documentation
- **[CI/CD Pipeline](CI_CD_README.md)** - Complete CI/CD setup and configuration
- **[API Documentation](docs/api.md)** - API reference and usage examples
- **[Contributing](CONTRIBUTING.md)** - Development guidelines and contribution process

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test:smart:all`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with TypeScript and modern development practices
- Follows BMAD principles for systematic development
- Comprehensive testing and quality assurance
- CI/CD integration with GitHub Actions
- Real-time monitoring and alerting

---

*For more information, see the [documentation](docs/) or [open an issue](https://github.com/oliver-os/smart-assistance/issues).*
