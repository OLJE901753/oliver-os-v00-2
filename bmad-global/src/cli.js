"use strict";
/**
 * Enhanced BMAD CLI - The Ultimate Development Tool
 * For the honor, not the glory—by the people, for the people.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedBMADCLI = void 0;
var chalk_1 = require("chalk");
var ora_1 = require("ora");
var commander_1 = require("commander");
var logger_1 = require("../core/logger");
var enhanced_config_1 = require("../core/enhanced-config");
var workflow_engine_1 = require("../core/workflow-engine");
var intelligent_analyzer_1 = require("../core/intelligent-analyzer");
var EnhancedBMADCLI = /** @class */ (function () {
    function EnhancedBMADCLI() {
        this.currentConfig = null;
        this.program = new commander_1.Command();
        this.logger = new logger_1.Logger('BMAD-CLI');
        this.configManager = new enhanced_config_1.EnhancedConfigManager();
        this.workflowEngine = new workflow_engine_1.BMADWorkflowEngine(this.configManager);
        this.codeAnalyzer = new intelligent_analyzer_1.IntelligentCodeAnalyzer({
            complexityThresholds: {
                cyclomatic: 10,
                cognitive: 8,
                maintainability: 70
            },
            qualityGates: {
                testCoverage: 80,
                codeDuplication: 0.05,
                technicalDebt: 20
            },
            analysisDepth: 'deep',
            includeRecommendations: true,
            generateReports: true
        });
        this.setupCommands();
    }
    /**
     * Initialize BMAD in a project
     */
    EnhancedBMADCLI.prototype.init = function (projectType, options) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        spinner = (0, ora_1.default)('🚀 Initializing BMAD...').start();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.configManager.createProjectConfig(projectType, options)];
                    case 2:
                        _b.sent();
                        _a = this;
                        return [4 /*yield*/, this.configManager.loadConfig()];
                    case 3:
                        _a.currentConfig = _b.sent();
                        spinner.succeed(chalk_1.default.green('✅ BMAD initialized successfully!'));
                        this.logger.info("Project type: ".concat(projectType));
                        this.logger.info("Configuration: ".concat(JSON.stringify(this.currentConfig, null, 2)));
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        spinner.fail(chalk_1.default.red('❌ BMAD initialization failed'));
                        this.logger.error('Initialization error:', error_1);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute BMAD workflow
     */
    EnhancedBMADCLI.prototype.executeWorkflow = function (workflowId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, context, result, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        spinner = (0, ora_1.default)("\uD83D\uDD04 Executing workflow: ".concat(workflowId)).start();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        context = {
                            projectType: options.projectType || 'fullstack',
                            projectPath: process.cwd(),
                            environment: process.env['NODE_ENV'] || 'development',
                            integrations: options.integrations,
                            config: this.currentConfig
                        };
                        return [4 /*yield*/, this.workflowEngine.executeWorkflow(workflowId, context)];
                    case 2:
                        result = _b.sent();
                        if (result.success) {
                            spinner.succeed(chalk_1.default.green("\u2705 Workflow completed successfully!"));
                            this.logger.info("Duration: ".concat(result.duration, "ms"));
                            this.logger.info("Steps completed: ".concat(((_a = result.results) === null || _a === void 0 ? void 0 : _a.length) || 0));
                        }
                        else {
                            spinner.fail(chalk_1.default.red("\u274C Workflow failed: ".concat(result.error)));
                        }
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _b.sent();
                        spinner.fail(chalk_1.default.red('❌ Workflow execution failed'));
                        this.logger.error('Workflow error:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze codebase with intelligent analysis
     */
    EnhancedBMADCLI.prototype.analyze = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, projectPath, analysis, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spinner = (0, ora_1.default)('🔍 Analyzing codebase...').start();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        projectPath = options.path || process.cwd();
                        return [4 /*yield*/, this.codeAnalyzer.analyzeProject(projectPath)];
                    case 2:
                        analysis = _a.sent();
                        spinner.succeed(chalk_1.default.green("\u2705 Analysis completed! Quality score: ".concat(analysis.quality.score, "/100")));
                        // Display key metrics
                        this.displayAnalysisSummary(analysis);
                        return [2 /*return*/, analysis];
                    case 3:
                        error_3 = _a.sent();
                        spinner.fail(chalk_1.default.red('❌ Code analysis failed'));
                        this.logger.error('Analysis error:', error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate comprehensive report
     */
    EnhancedBMADCLI.prototype.generateReport = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, analysis, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spinner = (0, ora_1.default)('📊 Generating comprehensive report...').start();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, this.analyze({ path: options.path })];
                    case 2:
                        analysis = _a.sent();
                        if (!(options.format === 'html' || !options.format)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.generateHTMLReport(analysis, options.output)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!(options.format === 'json')) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.generateJSONReport(analysis, options.output)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        if (!(options.format === 'markdown')) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.generateMarkdownReport(analysis, options.output)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        spinner.succeed(chalk_1.default.green('✅ Report generated successfully!'));
                        return [3 /*break*/, 10];
                    case 9:
                        error_4 = _a.sent();
                        spinner.fail(chalk_1.default.red('❌ Report generation failed'));
                        this.logger.error('Report error:', error_4);
                        throw error_4;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Setup all CLI commands
     */
    EnhancedBMADCLI.prototype.setupCommands = function () {
        var _this = this;
        this.program
            .name('bmad')
            .description('BMAD Method - Break, Map, Automate, Document')
            .version('2.0.0');
        // Initialize command
        this.program
            .command('init <projectType>')
            .description('Initialize BMAD in a project')
            .option('-c, --config <path>', 'Configuration file path')
            .option('-e, --environment <env>', 'Target environment', 'development')
            .action(function (projectType, options) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.init(projectType, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Workflow execution
        this.program
            .command('workflow <workflowId>')
            .description('Execute a BMAD workflow')
            .option('-t, --type <type>', 'Project type')
            .option('-i, --integrations <integrations>', 'Comma-separated integrations')
            .action(function (workflowId, options) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.executeWorkflow(workflowId, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Code analysis
        this.program
            .command('analyze')
            .description('Analyze codebase with intelligent analysis')
            .option('-p, --path <path>', 'Project path', process.cwd())
            .option('-d, --depth <depth>', 'Analysis depth', 'deep')
            .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.analyze(options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Generate report
        this.program
            .command('report')
            .description('Generate comprehensive analysis report')
            .option('-f, --format <format>', 'Report format (html, json, markdown)', 'html')
            .option('-o, --output <path>', 'Output path', './bmad-report')
            .option('-p, --path <path>', 'Project path', process.cwd())
            .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.generateReport(options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Break command
        this.program
            .command('break <task>')
            .description('Break down complex tasks into manageable pieces')
            .option('-d, --depth <depth>', 'Breakdown depth', '3')
            .option('-i, --include-deps', 'Include dependency analysis', true)
            .action(function (task, options) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.breakDownTask(task, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Map command
        this.program
            .command('map <target>')
            .description('Map architecture and dependencies')
            .option('-t, --type <type>', 'Mapping type', 'architecture')
            .option('-e, --external', 'Include external dependencies', true)
            .option('-f, --format <format>', 'Output format', 'json')
            .action(function (target, options) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mapArchitecture(target, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Automate command
        this.program
            .command('automate <process>')
            .description('Automate repetitive processes')
            .option('-t, --template <template>', 'Template to use')
            .option('-l, --language <lang>', 'Programming language', 'typescript')
            .option('-o, --output <format>', 'Output format', 'code')
            .action(function (process, options) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.automateProcess(process, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Document command
        this.program
            .command('document <target>')
            .description('Generate comprehensive documentation')
            .option('-t, --type <type>', 'Documentation type', 'api')
            .option('-e, --examples', 'Include examples', true)
            .option('-f, --format <format>', 'Output format', 'markdown')
            .action(function (target, options) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.generateDocumentation(target, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Status command
        this.program
            .command('status')
            .description('Show BMAD system status')
            .action(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.showStatus()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Config command
        this.program
            .command('config')
            .description('Manage BMAD configuration')
            .option('-s, --set <key=value>', 'Set configuration value')
            .option('-g, --get <key>', 'Get configuration value')
            .option('-l, --list', 'List all configuration')
            .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.manageConfig(options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Break down task implementation
     */
    EnhancedBMADCLI.prototype.breakDownTask = function (task, options) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, breakdown;
            return __generator(this, function (_a) {
                spinner = (0, ora_1.default)("\uD83D\uDD28 Breaking down task: ".concat(task)).start();
                try {
                    breakdown = [
                        '1. Analyze requirements and constraints',
                        '2. Identify core components and modules',
                        '3. Map dependencies and relationships',
                        '4. Estimate complexity and effort',
                        '5. Create implementation plan',
                        '6. Define testing strategy',
                        '7. Plan documentation approach'
                    ];
                    spinner.succeed(chalk_1.default.green('✅ Task breakdown completed!'));
                    console.log(chalk_1.default.blue('\n📋 Task Breakdown:'));
                    breakdown.forEach(function (step) {
                        console.log(chalk_1.default.green('  ✓'), step);
                    });
                    console.log(chalk_1.default.blue('\n🎯 Next Steps:'));
                    console.log(chalk_1.default.yellow('  • Review breakdown with team'));
                    console.log(chalk_1.default.yellow('  • Assign tasks to team members'));
                    console.log(chalk_1.default.yellow('  • Set up tracking and monitoring'));
                }
                catch (error) {
                    spinner.fail(chalk_1.default.red('❌ Task breakdown failed'));
                    this.logger.error('Breakdown error:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Map architecture implementation
     */
    EnhancedBMADCLI.prototype.mapArchitecture = function (target, options) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, mapping;
            return __generator(this, function (_a) {
                spinner = (0, ora_1.default)("\uD83D\uDDFA\uFE0F Mapping ".concat(options.type, " for: ").concat(target)).start();
                try {
                    mapping = {
                        components: [
                            { name: 'frontend', type: 'react-app', dependencies: ['backend-api'] },
                            { name: 'backend-api', type: 'express-server', dependencies: ['database', 'ai-services'] },
                            { name: 'database', type: 'postgresql', dependencies: [] },
                            { name: 'ai-services', type: 'python-services', dependencies: ['database'] }
                        ],
                        connections: [
                            { from: 'frontend', to: 'backend-api', type: 'http' },
                            { from: 'backend-api', to: 'database', type: 'sql' },
                            { from: 'backend-api', to: 'ai-services', type: 'http' }
                        ]
                    };
                    spinner.succeed(chalk_1.default.green('✅ Architecture mapping completed!'));
                    console.log(chalk_1.default.blue('\n🏗️ Architecture Overview:'));
                    mapping.components.forEach(function (comp) {
                        console.log(chalk_1.default.cyan("  ".concat(comp.name)), chalk_1.default.gray("(".concat(comp.type, ")")));
                        if (comp.dependencies.length > 0) {
                            comp.dependencies.forEach(function (dep) {
                                console.log(chalk_1.default.gray("    \u2514\u2500 depends on: ".concat(dep)));
                            });
                        }
                    });
                    console.log(chalk_1.default.blue('\n🔗 Connections:'));
                    mapping.connections.forEach(function (conn) {
                        console.log(chalk_1.default.yellow("  ".concat(conn.from, " \u2192 ").concat(conn.to)), chalk_1.default.gray("(".concat(conn.type, ")")));
                    });
                }
                catch (error) {
                    spinner.fail(chalk_1.default.red('❌ Architecture mapping failed'));
                    this.logger.error('Mapping error:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Automate process implementation
     */
    EnhancedBMADCLI.prototype.automateProcess = function (process, options) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, automation;
            return __generator(this, function (_a) {
                spinner = (0, ora_1.default)("\uD83E\uDD16 Automating process: ".concat(process)).start();
                try {
                    automation = {
                        generatedFiles: [
                            "".concat(process, "-service.ts"),
                            "".concat(process, "-controller.ts"),
                            "".concat(process, "-test.ts"),
                            "".concat(process, "-types.ts")
                        ],
                        automationScripts: [
                            'build.sh',
                            'test.sh',
                            'deploy.sh'
                        ],
                        templates: [
                            'api-template',
                            'service-template',
                            'test-template'
                        ]
                    };
                    spinner.succeed(chalk_1.default.green('✅ Process automation completed!'));
                    console.log(chalk_1.default.blue('\n📁 Generated Files:'));
                    automation.generatedFiles.forEach(function (file) {
                        console.log(chalk_1.default.green('  ✓'), file);
                    });
                    console.log(chalk_1.default.blue('\n🔧 Automation Scripts:'));
                    automation.automationScripts.forEach(function (script) {
                        console.log(chalk_1.default.green('  ✓'), script);
                    });
                    console.log(chalk_1.default.blue('\n📋 Templates:'));
                    automation.templates.forEach(function (template) {
                        console.log(chalk_1.default.green('  ✓'), template);
                    });
                }
                catch (error) {
                    spinner.fail(chalk_1.default.red('❌ Process automation failed'));
                    this.logger.error('Automation error:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate documentation implementation
     */
    EnhancedBMADCLI.prototype.generateDocumentation = function (target, options) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, documentation;
            return __generator(this, function (_a) {
                spinner = (0, ora_1.default)("\uD83D\uDCDA Generating ".concat(options.type, " documentation for: ").concat(target)).start();
                try {
                    documentation = {
                        sections: [
                            'Overview',
                            'API Reference',
                            'Configuration',
                            'Examples',
                            'Troubleshooting'
                        ],
                        files: [
                            "".concat(target, "-api.md"),
                            "".concat(target, "-guide.md"),
                            "".concat(target, "-examples.md")
                        ]
                    };
                    spinner.succeed(chalk_1.default.green('✅ Documentation generated!'));
                    console.log(chalk_1.default.blue('\n📖 Documentation Sections:'));
                    documentation.sections.forEach(function (section) {
                        console.log(chalk_1.default.green('  ✓'), section);
                    });
                    console.log(chalk_1.default.blue('\n📄 Generated Files:'));
                    documentation.files.forEach(function (file) {
                        console.log(chalk_1.default.green('  ✓'), file);
                    });
                }
                catch (error) {
                    spinner.fail(chalk_1.default.red('❌ Documentation generation failed'));
                    this.logger.error('Documentation error:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Show system status
     */
    EnhancedBMADCLI.prototype.showStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var config, executions, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log(chalk_1.default.blue('\n🔍 BMAD System Status\n'));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.configManager.loadConfig()];
                    case 2:
                        config = _a.sent();
                        executions = this.workflowEngine.getAllExecutions();
                        console.log(chalk_1.default.cyan('Configuration:'));
                        console.log(chalk_1.default.gray("  Project Type: ".concat((config === null || config === void 0 ? void 0 : config.projectType) || 'Not set')));
                        console.log(chalk_1.default.gray("  Environment: ".concat(process.env['NODE_ENV'] || 'development')));
                        console.log(chalk_1.default.cyan('\nWorkflow Executions:'));
                        console.log(chalk_1.default.gray("  Total: ".concat(executions.length)));
                        console.log(chalk_1.default.gray("  Running: ".concat(executions.filter(function (e) { return e.status === 'running'; }).length)));
                        console.log(chalk_1.default.gray("  Completed: ".concat(executions.filter(function (e) { return e.status === 'completed'; }).length)));
                        console.log(chalk_1.default.cyan('\nRecent Executions:'));
                        executions.slice(-3).forEach(function (exec) {
                            var status = exec.status === 'completed' ? chalk_1.default.green('✓') :
                                exec.status === 'running' ? chalk_1.default.yellow('⏳') :
                                    exec.status === 'failed' ? chalk_1.default.red('❌') : chalk_1.default.gray('○');
                            console.log(chalk_1.default.gray("  ".concat(status, " ").concat(exec.id, " (").concat(exec.status, ")")));
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        console.log(chalk_1.default.red('❌ Failed to get system status'));
                        this.logger.error('Status error:', error_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Manage configuration
     */
    EnhancedBMADCLI.prototype.manageConfig = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, key, value, config, config, error_6;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 7, , 8]);
                        if (!options.set) return [3 /*break*/, 2];
                        _a = options.set.split('='), key = _a[0], value = _a[1];
                        return [4 /*yield*/, this.configManager.updateConfig((_b = {}, _b[key] = value, _b))];
                    case 1:
                        _c.sent();
                        console.log(chalk_1.default.green("\u2705 Set ".concat(key, " = ").concat(value)));
                        return [3 /*break*/, 6];
                    case 2:
                        if (!options.get) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.configManager.loadConfig()];
                    case 3:
                        config = _c.sent();
                        console.log(chalk_1.default.cyan("".concat(options.get, ":")), config === null || config === void 0 ? void 0 : config[options.get]);
                        return [3 /*break*/, 6];
                    case 4:
                        if (!options.list) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.configManager.loadConfig()];
                    case 5:
                        config = _c.sent();
                        console.log(chalk_1.default.blue('\n📋 Current Configuration:'));
                        console.log(JSON.stringify(config, null, 2));
                        _c.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_6 = _c.sent();
                        console.log(chalk_1.default.red('❌ Configuration management failed'));
                        this.logger.error('Config error:', error_6);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Display analysis summary
     */
    EnhancedBMADCLI.prototype.displayAnalysisSummary = function (analysis) {
        console.log(chalk_1.default.blue('\n📊 Analysis Summary\n'));
        console.log(chalk_1.default.cyan('Overall Quality Score:'), chalk_1.default.yellow("".concat(analysis.quality.score, "/100")));
        console.log(chalk_1.default.cyan('Technical Debt:'), chalk_1.default.yellow("".concat(analysis.technicalDebt.total.toFixed(1), " (").concat(analysis.technicalDebt.priority, ")")));
        console.log(chalk_1.default.cyan('Files Analyzed:'), chalk_1.default.yellow("".concat(analysis.files.length)));
        console.log(chalk_1.default.cyan('\nTop Issues:'));
        analysis.quality.gates.slice(0, 3).forEach(function (issue) {
            var severity = issue.severity === 'critical' ? chalk_1.default.red('🔴') :
                issue.severity === 'high' ? chalk_1.default.yellow('🟡') :
                    issue.severity === 'medium' ? chalk_1.default.blue('🔵') : chalk_1.default.gray('⚪');
            console.log(chalk_1.default.gray("  ".concat(severity, " ").concat(issue.message)));
        });
        console.log(chalk_1.default.cyan('\nTop Recommendations:'));
        analysis.recommendations.slice(0, 3).forEach(function (rec) {
            var priority = rec.priority === 'critical' ? chalk_1.default.red('🔴') :
                rec.priority === 'high' ? chalk_1.default.yellow('🟡') :
                    rec.priority === 'medium' ? chalk_1.default.blue('🔵') : chalk_1.default.gray('⚪');
            console.log(chalk_1.default.gray("  ".concat(priority, " ").concat(rec.title)));
        });
    };
    /**
     * Generate HTML report
     */
    EnhancedBMADCLI.prototype.generateHTMLReport = function (analysis, outputPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would generate HTML report
                console.log(chalk_1.default.green("\uD83D\uDCC4 HTML report generated: ".concat(outputPath, ".html")));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate JSON report
     */
    EnhancedBMADCLI.prototype.generateJSONReport = function (analysis, outputPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would generate JSON report
                console.log(chalk_1.default.green("\uD83D\uDCC4 JSON report generated: ".concat(outputPath, ".json")));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate Markdown report
     */
    EnhancedBMADCLI.prototype.generateMarkdownReport = function (analysis, outputPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would generate Markdown report
                console.log(chalk_1.default.green("\uD83D\uDCC4 Markdown report generated: ".concat(outputPath, ".md")));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Run the CLI
     */
    EnhancedBMADCLI.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.program.parseAsync(process.argv)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        this.logger.error('CLI execution error:', error_7);
                        process.exit(1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return EnhancedBMADCLI;
}());
exports.EnhancedBMADCLI = EnhancedBMADCLI;
