"""
Codebase Review Script using Minimax M2 Orchestrator
Reviews the ENTIRE Oliver-OS codebase (all Python, TypeScript, JavaScript files)
using multiple specialized agents
"""

import asyncio
import sys
from pathlib import Path
from typing import Dict, List, Any
import json
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from services.agent_orchestrator import AgentOrchestrator, SpawnRequest
from config.settings import Settings


def read_file_content(file_path: Path, max_lines: int = 500) -> str:
    """Read file content, limiting to first N lines"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            content = ''.join(lines[:max_lines])
            if len(lines) > max_lines:
                content += f"\n... (truncated, {len(lines) - max_lines} more lines)"
            return content
    except Exception as e:
        return f"Error reading file: {e}"


def get_codebase_structure() -> Dict[str, Any]:
    """Get complete structure of the entire codebase"""
    codebase_root = Path(__file__).parent.parent  # oliver-os root
    
    # Directories to exclude
    exclude_dirs = {
        '__pycache__', '.git', 'node_modules', 'dist', 'build', 
        'coverage', '.next', '.cache', 'test-results', 'test-backups',
        'temp', 'logs', 'prisma/migrations'
    }
    
    # File extensions to include
    code_extensions = {'.py', '.ts', '.tsx', '.js', '.jsx'}
    config_extensions = {'.json', '.yml', '.yaml', '.toml', '.ini', '.env.example'}
    doc_extensions = {'.md', '.txt', '.rst'}
    
    structure = {
        "python_files": [],
        "typescript_files": [],
        "javascript_files": [],
        "config_files": [],
        "documentation_files": [],
        "directories": [],
        "total_files": 0,
        "total_lines": 0
    }
    
    def should_skip(path: Path) -> bool:
        """Check if path should be skipped"""
        parts = path.parts
        return any(part in exclude_dirs for part in parts) or path.name.startswith('.')
    
    def scan_directory(directory: Path, relative_prefix: str = ""):
        """Recursively scan directory"""
        try:
            for item in directory.iterdir():
                if should_skip(item):
                    continue
                
                if item.is_dir():
                    structure["directories"].append({
                        "path": str(item.relative_to(codebase_root)),
                        "type": "directory"
                    })
                    scan_directory(item)  # Recursive scan
                elif item.is_file():
                    ext = item.suffix.lower()
                    rel_path = str(item.relative_to(codebase_root))
                    
                    try:
                        lines = len(item.read_text(encoding='utf-8', errors='ignore').splitlines())
                    except:
                        lines = 0
                    
                    file_info = {
                        "path": rel_path,
                        "lines": lines
                    }
                    
                    if ext in code_extensions:
                        if ext == '.py':
                            structure["python_files"].append(file_info)
                        elif ext in {'.ts', '.tsx'}:
                            structure["typescript_files"].append(file_info)
                        elif ext in {'.js', '.jsx'}:
                            structure["javascript_files"].append(file_info)
                        structure["total_files"] += 1
                        structure["total_lines"] += lines
                    elif ext in config_extensions:
                        structure["config_files"].append(file_info)
                    elif ext in doc_extensions:
                        structure["documentation_files"].append(file_info)
        except PermissionError:
            pass  # Skip directories we can't access
    
    # Scan from root
    scan_directory(codebase_root)
    
    return structure


def create_codebase_summary() -> str:
    """Create a comprehensive summary of the entire codebase for review"""
    codebase_root = Path(__file__).parent.parent  # oliver-os root
    
    summary_parts = []
    
    summary_parts.append("=" * 80)
    summary_parts.append("OLIVER-OS COMPLETE CODEBASE SUMMARY")
    summary_parts.append("=" * 80)
    summary_parts.append("")
    
    # Get complete structure
    print("Scanning entire codebase structure...")
    structure = get_codebase_structure()
    
    # Add structure overview
    summary_parts.append("=" * 80)
    summary_parts.append("CODEBASE STATISTICS")
    summary_parts.append("=" * 80)
    summary_parts.append(f"Total Python Files: {len(structure['python_files'])}")
    summary_parts.append(f"Total TypeScript Files: {len(structure['typescript_files'])}")
    summary_parts.append(f"Total JavaScript Files: {len(structure['javascript_files'])}")
    summary_parts.append(f"Total Config Files: {len(structure['config_files'])}")
    summary_parts.append(f"Total Documentation Files: {len(structure['documentation_files'])}")
    summary_parts.append(f"Total Code Files: {structure['total_files']}")
    summary_parts.append(f"Total Lines of Code: {structure['total_lines']}")
    summary_parts.append("")
    
    # Priority files to read (top files by size and importance)
    all_code_files = []
    all_code_files.extend([(f["path"], f["lines"], "python") for f in structure["python_files"]])
    all_code_files.extend([(f["path"], f["lines"], "typescript") for f in structure["typescript_files"]])
    all_code_files.extend([(f["path"], f["lines"], "javascript") for f in structure["javascript_files"]])
    
    # Sort by lines (largest first) and take top 50
    all_code_files.sort(key=lambda x: x[1], reverse=True)
    priority_files = all_code_files[:50]  # Top 50 largest files
    
    # Also include important config files
    config_files = sorted(structure["config_files"], key=lambda x: x["lines"], reverse=True)[:10]
    
    summary_parts.append("=" * 80)
    summary_parts.append("KEY CODE FILES (Top 50 by size)")
    summary_parts.append("=" * 80)
    summary_parts.append("")
    
    files_read = 0
    max_files_to_read = 30  # Limit number of files to avoid token limits
    
    for file_path_str, lines, file_type in priority_files[:max_files_to_read]:
        file_path = codebase_root / file_path_str
        if file_path.exists():
            try:
                # Read more lines for larger files
                max_lines = min(300, max(100, lines // 10))
                content = read_file_content(file_path, max_lines=max_lines)
                
                summary_parts.append(f"\n{'='*80}")
                summary_parts.append(f"FILE: {file_path_str} ({file_type.upper()}, {lines} lines)")
                summary_parts.append(f"{'='*80}")
                summary_parts.append(content)
                files_read += 1
            except Exception as e:
                summary_parts.append(f"\n{'='*80}")
                summary_parts.append(f"FILE: {file_path_str} - ERROR: {e}")
    
    # Add important config files
    summary_parts.append("\n" + "=" * 80)
    summary_parts.append("CONFIGURATION FILES")
    summary_parts.append("=" * 80)
    summary_parts.append("")
    
    for config_file in config_files[:5]:
        file_path = codebase_root / config_file["path"]
        if file_path.exists():
            try:
                content = read_file_content(file_path, max_lines=100)
                summary_parts.append(f"\n{'='*80}")
                summary_parts.append(f"CONFIG: {config_file['path']} ({config_file['lines']} lines)")
                summary_parts.append(f"{'='*80}")
                summary_parts.append(content)
            except Exception as e:
                pass
    
    # Add directory structure summary
    summary_parts.append("\n" + "=" * 80)
    summary_parts.append("DIRECTORY STRUCTURE")
    summary_parts.append("=" * 80)
    summary_parts.append(json.dumps({
        "directories": structure["directories"][:50],  # Top 50 directories
        "python_files_count": len(structure["python_files"]),
        "typescript_files_count": len(structure["typescript_files"]),
        "javascript_files_count": len(structure["javascript_files"]),
        "largest_python_files": sorted(structure["python_files"], key=lambda x: x["lines"], reverse=True)[:10],
        "largest_typescript_files": sorted(structure["typescript_files"], key=lambda x: x["lines"], reverse=True)[:10],
    }, indent=2))
    
    summary_parts.append(f"\n\nTotal files analyzed: {files_read}")
    summary_parts.append(f"Total codebase size: {structure['total_lines']} lines")
    
    return "\n".join(summary_parts)


async def review_code_quality(orchestrator: AgentOrchestrator, codebase_summary: str) -> Dict[str, Any]:
    """Review code quality using code-reviewer agent"""
    print("\n" + "="*80)
    print("CODE QUALITY REVIEW")
    print("="*80)
    
    prompt = f"""Review the following codebase for code quality, maintainability, and adherence to best practices.

Focus on:
- Code organization and structure
- Error handling
- Code duplication
- Naming conventions
- Documentation quality
- Type hints usage
- Code complexity

Codebase Summary:
{codebase_summary[:25000]}  # Increased for comprehensive review

Provide specific, actionable recommendations."""
    
    request = SpawnRequest(
        agent_type="code-reviewer",
        prompt=prompt,
        metadata={"review_type": "code_quality"}
    )
    
    result = await orchestrator.spawn_agent(request)
    
    return {
        "agent": result.agent_type,
        "status": result.status.value,
        "duration_ms": result.duration_ms,
        "result": result.result
    }


async def review_security(orchestrator: AgentOrchestrator, codebase_summary: str) -> Dict[str, Any]:
    """Review security using security-analyzer agent"""
    print("\n" + "="*80)
    print("SECURITY REVIEW")
    print("="*80)
    
    prompt = f"""Analyze the following codebase for security vulnerabilities and best practices.

Focus on:
- API key handling and exposure
- Input validation
- SQL injection risks
- Authentication/authorization
- Error message leakage
- Dependency vulnerabilities
- Secure configuration practices

Codebase Summary:
{codebase_summary[:25000]}

Provide specific security recommendations with severity levels."""
    
    request = SpawnRequest(
        agent_type="security-analyzer",
        prompt=prompt,
        metadata={"review_type": "security"}
    )
    
    result = await orchestrator.spawn_agent(request)
    
    return {
        "agent": result.agent_type,
        "status": result.status.value,
        "duration_ms": result.duration_ms,
        "result": result.result
    }


async def review_inefficiencies(orchestrator: AgentOrchestrator, codebase_summary: str) -> Dict[str, Any]:
    """Review for inefficiencies using bureaucracy-disruptor agent"""
    print("\n" + "="*80)
    print("EFFICIENCY REVIEW")
    print("="*80)
    
    prompt = f"""Identify bureaucratic inefficiencies and optimization opportunities in this codebase.

Focus on:
- Redundant code or processes
- Performance bottlenecks
- Unnecessary complexity
- Automation opportunities
- Resource usage optimization
- Code that could be simplified

Codebase Summary:
{codebase_summary[:25000]}

Provide specific recommendations for streamlining and optimization."""
    
    request = SpawnRequest(
        agent_type="bureaucracy-disruptor",
        prompt=prompt,
        metadata={"review_type": "efficiency"}
    )
    
    result = await orchestrator.spawn_agent(request)
    
    return {
        "agent": result.agent_type,
        "status": result.status.value,
        "duration_ms": result.duration_ms,
        "result": result.result
    }


async def review_architecture(orchestrator: AgentOrchestrator, codebase_summary: str) -> Dict[str, Any]:
    """Review architecture using thought-processor agent"""
    print("\n" + "="*80)
    print("ARCHITECTURE REVIEW")
    print("="*80)
    
    prompt = f"""Analyze the architecture and design patterns of this codebase.

Focus on:
- Overall architecture patterns
- Component separation and coupling
- Design principles adherence (BMAD, SOLID, etc.)
- Scalability considerations
- Maintainability
- Integration points

Codebase Summary:
{codebase_summary[:25000]}

Provide architectural insights and recommendations."""
    
    request = SpawnRequest(
        agent_type="thought-processor",
        prompt=prompt,
        metadata={"review_type": "architecture"}
    )
    
    result = await orchestrator.spawn_agent(request)
    
    return {
        "agent": result.agent_type,
        "status": result.status.value,
        "duration_ms": result.duration_ms,
        "result": result.result
    }


async def review_patterns(orchestrator: AgentOrchestrator, codebase_summary: str) -> Dict[str, Any]:
    """Review patterns using pattern-recognizer agent"""
    print("\n" + "="*80)
    print("PATTERN ANALYSIS")
    print("="*80)
    
    prompt = f"""Identify patterns, trends, and correlations in this codebase.

Focus on:
- Code patterns used throughout
- Consistent patterns vs inconsistencies
- Anti-patterns
- Design pattern usage
- Code style consistency

Codebase Summary:
{codebase_summary[:25000]}

Provide pattern analysis and recommendations."""
    
    request = SpawnRequest(
        agent_type="pattern-recognizer",
        prompt=prompt,
        metadata={"review_type": "patterns"}
    )
    
    result = await orchestrator.spawn_agent(request)
    
    return {
        "agent": result.agent_type,
        "status": result.status.value,
        "duration_ms": result.duration_ms,
        "result": result.result
    }


async def generate_review_report(reviews: Dict[str, Dict[str, Any]]) -> str:
    """Generate a comprehensive review report"""
    report_parts = []
    
    report_parts.append("\n" + "="*80)
    report_parts.append("COMPREHENSIVE CODEBASE REVIEW REPORT")
    report_parts.append("="*80)
    report_parts.append(f"Generated: {datetime.now().isoformat()}")
    report_parts.append("")
    
    for review_type, review_data in reviews.items():
        report_parts.append("\n" + "="*80)
        report_parts.append(f"{review_type.upper()} REVIEW")
        report_parts.append("="*80)
        report_parts.append(f"Agent: {review_data['agent']}")
        report_parts.append(f"Status: {review_data['status']}")
        report_parts.append(f"Duration: {review_data['duration_ms']:.0f}ms")
        report_parts.append("")
        
        if review_data.get('result'):
            result = review_data['result']
            if isinstance(result, dict):
                if 'raw_response' in result:
                    report_parts.append(result['raw_response'])
                else:
                    report_parts.append(json.dumps(result, indent=2))
            else:
                report_parts.append(str(result))
        
        report_parts.append("")
    
    return "\n".join(report_parts)


async def main():
    """Run comprehensive codebase review"""
    print("\n" + "="*80)
    print("STARTING COMPREHENSIVE OLIVER-OS CODEBASE REVIEW")
    print("Scanning entire codebase: Python, TypeScript, JavaScript, Config files")
    print("="*80)
    
    # Initialize orchestrator
    settings = Settings()
    orchestrator = AgentOrchestrator(settings)
    
    try:
        await orchestrator.initialize()
        
        # Create codebase summary
        print("\nCreating codebase summary...")
        codebase_summary = create_codebase_summary()
        
        # Run parallel reviews
        print("\nRunning parallel codebase reviews...")
        
        reviews = await asyncio.gather(
            review_code_quality(orchestrator, codebase_summary),
            review_security(orchestrator, codebase_summary),
            review_inefficiencies(orchestrator, codebase_summary),
            review_architecture(orchestrator, codebase_summary),
            review_patterns(orchestrator, codebase_summary),
            return_exceptions=True
        )
        
        # Organize results
        review_results = {
            "Code Quality": reviews[0] if not isinstance(reviews[0], Exception) else {"error": str(reviews[0])},
            "Security": reviews[1] if not isinstance(reviews[1], Exception) else {"error": str(reviews[1])},
            "Efficiency": reviews[2] if not isinstance(reviews[2], Exception) else {"error": str(reviews[2])},
            "Architecture": reviews[3] if not isinstance(reviews[3], Exception) else {"error": str(reviews[3])},
            "Patterns": reviews[4] if not isinstance(reviews[4], Exception) else {"error": str(reviews[4])}
        }
        
        # Generate report
        print("\nGenerating comprehensive report...")
        report = await generate_review_report(review_results)
        
        # Save report
        report_path = Path(__file__).parent.parent / "CODEBASE_REVIEW_CURSOR.md"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\nReview complete! Report saved to: {report_path}")
        print("\n" + "="*80)
        print("REVIEW SUMMARY")
        print("="*80)
        print(report)
        
        # Show metrics
        metrics = orchestrator.get_metrics()
        print("\n" + "="*80)
        print("REVIEW METRICS")
        print("="*80)
        print(f"Agents Spawned: {metrics['agents']['total']}")
        print(f"Completed: {metrics['agents']['completed']}")
        print(f"Failed: {metrics['agents']['failed']}")
        print(f"Average Duration: {metrics['performance']['avg_duration_ms']:.0f}ms")
        
    except Exception as e:
        print(f"\nReview failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await orchestrator.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
