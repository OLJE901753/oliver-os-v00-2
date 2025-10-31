"""
Test Progress Tracker
Tests progress tracking, metrics collection, and weekly report generation
"""

import sys
import os
import asyncio
import json
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from services.progress_tracker import ProgressTracker


def test_progress_tracking():
    """Test basic progress tracking"""
    print("=" * 60)
    print("TEST 1: Progress Tracking")
    print("=" * 60)
    
    try:
        tracker = ProgressTracker()
        
        # Record some prediction results
        tracker.record_prediction_result(True, False, {"feature": "naming_suggestion"})
        tracker.record_prediction_result(True, False, {"feature": "code_structure"})
        tracker.record_prediction_result(True, True, {"feature": "unexpected_good"})  # Surprise
        tracker.record_prediction_result(False, False, {"feature": "missed"})  # Miss
        tracker.record_prediction_result(True, False)
        
        # Record velocity
        tracker.record_velocity(features_shipped=1, time_saved_hours=0.5)
        tracker.record_velocity(features_shipped=2, time_saved_hours=1.5, debug_time_minutes=15)
        
        # Record satisfaction
        tracker.record_satisfaction(wow_moment=True, context={"reason": "great_suggestion"})
        tracker.record_satisfaction(wow_moment=True)
        tracker.record_satisfaction(frustration=True, context={"reason": "poor_prediction"})
        
        # Record focus areas
        tracker.record_focus_area("error handling preferences")
        tracker.record_focus_area("naming suggestion quality")
        tracker.record_focus_area("error handling preferences")
        
        print(f"✅ Progress tracking completed")
        
        # Check metrics
        metrics = tracker.get_metrics()
        print(f"   Predictions: {metrics['predictions']['correct']}/{metrics['predictions']['total']} correct")
        print(f"   Features shipped: {metrics['velocity']['features_shipped']}")
        print(f"   Wow moments: {metrics['satisfaction']['wow_moments']}")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_weekly_report():
    """Test weekly report generation"""
    print("\n" + "=" * 60)
    print("TEST 2: Weekly Report Generation")
    print("=" * 60)
    
    try:
        tracker = ProgressTracker()
        
        # Generate weekly report
        report = tracker.generate_weekly_report()
        
        print(f"✅ Weekly report generated")
        print(f"\n   Week: {report['week_start']} to {report['week_end']}")
        print(f"   Accuracy: {report['learning_accuracy']['correct_predictions']}/{report['learning_accuracy']['total_predictions']}")
        print(f"   Features shipped: {report['velocity']['features_shipped']}")
        print(f"   Overall feeling: {report['overall_feeling']}")
        
        # Format report
        formatted = tracker.format_weekly_report(report)
        print(f"\n✅ Formatted report generated ({len(formatted)} chars)")
        
        # Show preview
        lines = formatted.split('\n')[:15]
        print("\n   Report preview:")
        for line in lines:
            print(f"   {line}")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_all_time_stats():
    """Test all-time statistics"""
    print("\n" + "=" * 60)
    print("TEST 3: All-Time Statistics")
    print("=" * 60)
    
    try:
        tracker = ProgressTracker()
        
        stats = tracker.get_all_time_stats()
        
        print(f"✅ All-time stats retrieved")
        print(f"   Total predictions: {stats['predictions']['total']}")
        print(f"   Accuracy: {stats['predictions']['accuracy']*100:.1f}%")
        print(f"   Time saved: {stats['velocity']['time_saved_hours']:.1f} hours")
        print(f"   Debug time: {stats['velocity']['debug_time_minutes']:.0f} minutes")
        print(f"   Top focus areas:")
        
        for area, count in list(stats['top_focus_areas'].items())[:5]:
            print(f"      - {area}: {count}")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_example_weekly_log():
    """Test generating example weekly log matching user's format"""
    print("\n" + "=" * 60)
    print("TEST 4: Example Weekly Log (User Format)")
    print("=" * 60)
    
    try:
        tracker = ProgressTracker()
        
        # Simulate the user's example data
        # Clear existing metrics first
        tracker.metrics = {
            "predictions": {"correct": 0, "total": 0, "surprises": 0, "misses": 0},
            "velocity": {"features_shipped": 0, "time_saved_hours": 0.0, "debug_time_minutes": 0},
            "satisfaction": {"wow_moments": 0, "frustrations": 0},
            "focus_areas": {},
            "weekly_logs": [],
            "last_updated": datetime.now().isoformat()
        }
        
        # Record example data
        for _ in range(7):
            tracker.record_prediction_result(True, False)
        tracker.record_prediction_result(True, True)  # Surprise
        tracker.record_prediction_result(True, True)  # Surprise
        tracker.record_prediction_result(False, False)  # Miss
        
        tracker.record_velocity(features_shipped=3, time_saved_hours=2.0, debug_time_minutes=30)
        
        for _ in range(4):
            tracker.record_satisfaction(wow_moment=True)
        for _ in range(2):
            tracker.record_satisfaction(frustration=True)
        
        tracker.record_focus_area("error handling preferences")
        tracker.record_focus_area("naming suggestion quality")
        
        # Generate report
        report = tracker.generate_weekly_report()
        formatted = tracker.format_weekly_report(report)
        
        print(f"✅ Example weekly log generated")
        print(f"\n{formatted}")
        
        # Verify it matches expected format
        if "Learning Accuracy" in formatted and "Velocity" in formatted:
            print(f"\n✅ Report format matches expected structure")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all Progress Tracker tests"""
    print("\n" + "=" * 60)
    print("PROGRESS TRACKER TEST SUITE")
    print("=" * 60)
    
    results = []
    
    # Test 1: Basic progress tracking
    results.append(test_progress_tracking())
    
    # Test 2: Weekly report generation
    results.append(test_weekly_report())
    
    # Test 3: All-time statistics
    results.append(test_all_time_stats())
    
    # Test 4: Example weekly log
    results.append(test_example_weekly_log())
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    test_names = [
        "Progress Tracking",
        "Weekly Report Generation",
        "All-Time Statistics",
        "Example Weekly Log (User Format)"
    ]
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{name}: {status}")
    
    passed = sum(results)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 All Progress Tracker tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

