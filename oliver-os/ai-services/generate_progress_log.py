"""
Generate Oliver-OS Weekly Progress Log
Command-line tool to generate and display progress reports
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from services.progress_tracker import ProgressTracker


def generate_weekly_log(output_file: str = None):
    """Generate weekly progress log"""
    tracker = ProgressTracker()
    
    # Generate report
    report = tracker.generate_weekly_report()
    formatted = tracker.format_weekly_report(report)
    
    # Print to console
    print(formatted)
    
    # Save to file if requested
    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(formatted)
        print(f"\n✅ Saved to: {output_file}")
    
    return report


def show_all_time_stats():
    """Show all-time statistics"""
    tracker = ProgressTracker()
    stats = tracker.get_all_time_stats()
    
    print("\n" + "=" * 60)
    print("ALL-TIME STATISTICS")
    print("=" * 60)
    
    predictions = stats["predictions"]
    print(f"\n📊 Predictions:")
    print(f"   Total: {predictions['total']}")
    print(f"   Correct: {predictions['correct']} ({predictions['accuracy']*100:.1f}%)")
    print(f"   Surprises: {predictions['surprises']}")
    print(f"   Misses: {predictions['misses']}")
    
    velocity = stats["velocity"]
    print(f"\n🚀 Velocity:")
    print(f"   Features shipped: {velocity['features_shipped']}")
    print(f"   Time saved: {velocity['time_saved_hours']:.1f} hours")
    print(f"   Debug time: {velocity['debug_time_minutes']:.0f} minutes")
    print(f"   Net time saved: {velocity['time_saved_hours'] - (velocity['debug_time_minutes'] / 60):.1f} hours")
    
    satisfaction = stats["satisfaction"]
    print(f"\n😊 Satisfaction:")
    print(f"   Wow moments: {satisfaction['wow_moments']}")
    print(f"   Frustrations: {satisfaction['frustrations']}")
    
    if stats["top_focus_areas"]:
        print(f"\n🎯 Top Focus Areas:")
        for area, count in list(stats["top_focus_areas"].items())[:10]:
            print(f"   - {area}: {count} mentions")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate Oliver-OS Progress Log")
    parser.add_argument("--output", "-o", help="Output file path (default: stdout)")
    parser.add_argument("--stats", "-s", action="store_true", help="Show all-time statistics")
    parser.add_argument("--save", action="store_true", help="Save to logs/progress.md")
    
    args = parser.parse_args()
    
    if args.stats:
        show_all_time_stats()
    else:
        output_file = args.output
        if args.save and not output_file:
            output_file = "logs/progress.md"
        
        generate_weekly_log(output_file)


if __name__ == "__main__":
    main()

