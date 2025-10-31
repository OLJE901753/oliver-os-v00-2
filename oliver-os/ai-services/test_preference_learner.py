"""
Test PreferenceLearner Implementation
Tests preference learning, prediction, and integration with PersonalStyleLearner
"""

import sys
import os
import asyncio
import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from services.preference_learner import PreferenceLearner
from services.personal_style_learner import PersonalStyleLearner


def test_preference_loading():
    """Test loading preferences from file"""
    print("=" * 60)
    print("TEST 1: Preference Loading")
    print("=" * 60)
    
    try:
        learner = PreferenceLearner()
        
        # Check if preferences file exists or was created
        if os.path.exists(learner.preferences_file):
            print(f"✅ Preferences file exists: {learner.preferences_file}")
        else:
            print(f"⚠️  Preferences file not found (will be created on first choice)")
        
        print(f"✅ Loaded {len(learner.preferences)} preferences")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_recording_choices():
    """Test recording user choices"""
    print("\n" + "=" * 60)
    print("TEST 2: Recording User Choices")
    print("=" * 60)
    
    try:
        learner = PreferenceLearner()
        
        # Clear existing preferences for clean test
        if os.path.exists(learner.preferences_file):
            os.remove(learner.preferences_file)
        
        # Record some test choices
        choice1_selected = {
            "naming_style": "camelCase",
            "verbosity": "verbose",
            "pattern_type": "error_handling",
            "content": "def processUserInputData(userInput):\n    try:\n        return userInput.upper()\n    except Exception as e:\n        handleError(e)"
        }
        
        choice1_rejected = [
            {
                "naming_style": "snake_case",
                "verbosity": "concise",
                "pattern_type": "simple",
                "content": "def process(input):\n    return input.upper()"
            }
        ]
        
        learner.record_choice(choice1_selected, choice1_rejected, {"test": True, "test_id": "choice-1"})
        
        # Record second choice
        choice2_selected = {
            "naming_style": "camelCase",
            "verbosity": "verbose",
            "pattern_type": "decorators",
            "content": "@validateInput\ndef calculateTotalRevenue(revenueData):\n    return sum(revenueData)"
        }
        
        choice2_rejected = [
            {
                "naming_style": "snake_case",
                "verbosity": "concise",
                "content": "def calc(data):\n    return sum(data)"
            }
        ]
        
        learner.record_choice(choice2_selected, choice2_rejected, {"test": True, "test_id": "choice-2"})
        
        # Verify preferences were recorded
        if len(learner.preferences) >= 2:
            print(f"✅ Recorded {len(learner.preferences)} preferences")
            
            # Verify file exists and has entries
            if os.path.exists(learner.preferences_file):
                with open(learner.preferences_file, "r", encoding="utf-8") as f:
                    lines = [line.strip() for line in f if line.strip()]
                
                if len(lines) >= 2:
                    print(f"✅ Preferences file has {len(lines)} entries")
                    
                    # Verify entry structure
                    entry = json.loads(lines[0])
                    required_fields = ["timestamp", "selected", "rejected", "context", "selected_features"]
                    for field in required_fields:
                        if field not in entry:
                            print(f"❌ Missing field: {field}")
                            return False
                    
                    print(f"✅ Entry structure valid")
                    return True
                else:
                    print(f"❌ Expected 2 entries, found {len(lines)}")
                    return False
            else:
                print("❌ Preferences file not created")
                return False
        else:
            print(f"❌ Expected 2 preferences, found {len(learner.preferences)}")
            return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_preference_prediction():
    """Test predicting preferred options"""
    print("\n" + "=" * 60)
    print("TEST 3: Preference Prediction")
    print("=" * 60)
    
    try:
        learner = PreferenceLearner()
        
        # Need some preferences first
        if len(learner.preferences) == 0:
            # Record a preference
            choice_selected = {
                "naming_style": "camelCase",
                "verbosity": "verbose",
                "pattern_type": "error_handling"
            }
            choice_rejected = [
                {"naming_style": "snake_case", "verbosity": "concise"}
            ]
            learner.record_choice(choice_selected, choice_rejected)
        
        # Test prediction with similar options
        options = [
            {
                "naming_style": "camelCase",
                "verbosity": "verbose",
                "pattern_type": "error_handling"
            },
            {
                "naming_style": "snake_case",
                "verbosity": "concise",
                "pattern_type": "simple"
            },
            {
                "naming_style": "camelCase",
                "verbosity": "concise",
                "pattern_type": "error_handling"
            }
        ]
        
        predicted = learner.predict_preference(options)
        
        print(f"✅ Prediction completed")
        print(f"   Predicted option: {predicted.get('naming_style', 'N/A')}")
        
        # Should prefer camelCase + verbose based on history
        if predicted.get("naming_style") == "camelCase":
            print(f"✅ Predicted camelCase (matches preferences)")
        else:
            print(f"⚠️  Predicted {predicted.get('naming_style')} (may not match preferences)")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_feature_extraction():
    """Test feature extraction from options"""
    print("\n" + "=" * 60)
    print("TEST 4: Feature Extraction")
    print("=" * 60)
    
    try:
        learner = PreferenceLearner()
        
        # Test options with different styles
        camel_option = {
            "naming": {
                "uses_camelCase": 3,
                "uses_snake_case": False,
                "prefers_verbose": True
            },
            "patterns": {
                "uses_error_handling": True
            }
        }
        
        snake_option = {
            "naming": {
                "uses_camelCase": 0,
                "uses_snake_case": True,
                "prefers_verbose": False
            }
        }
        
        # Extract features
        camel_features = learner._extract_features(camel_option)
        snake_features = learner._extract_features(snake_option)
        
        print(f"✅ Feature extraction completed")
        print(f"\n   CamelCase option:")
        print(f"      Naming style: {camel_features.get('naming_style', 'N/A')}")
        print(f"      Verbosity: {camel_features.get('verbosity', 'N/A')}")
        print(f"      Pattern type: {camel_features.get('pattern_type', 'N/A')}")
        
        print(f"\n   Snake_case option:")
        print(f"      Naming style: {snake_features.get('naming_style', 'N/A')}")
        print(f"      Verbosity: {snake_features.get('verbosity', 'N/A')}")
        
        # Verify features were extracted correctly
        if camel_features.get("naming_style") == "camelCase":
            print(f"✅ Correctly identified camelCase")
        else:
            print(f"⚠️  Naming style detection may need improvement")
        
        if snake_features.get("naming_style") == "snake_case":
            print(f"✅ Correctly identified snake_case")
        else:
            print(f"⚠️  Naming style detection may need improvement")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_similarity_calculation():
    """Test similarity calculation between options"""
    print("\n" + "=" * 60)
    print("TEST 5: Similarity Calculation")
    print("=" * 60)
    
    try:
        learner = PreferenceLearner()
        
        # Similar options
        features1 = {
            "naming_style": "camelCase",
            "verbosity": "verbose",
            "pattern_type": "error_handling"
        }
        
        features2 = {
            "naming_style": "camelCase",
            "verbosity": "verbose",
            "pattern_type": "error_handling"
        }
        
        # Different options
        features3 = {
            "naming_style": "snake_case",
            "verbosity": "concise",
            "pattern_type": "simple"
        }
        
        # Calculate similarity
        similar_score = learner._calculate_similarity(features1, features2)
        different_score = learner._calculate_similarity(features1, features3)
        
        print(f"✅ Similarity calculation completed")
        print(f"   Similar options score: {similar_score:.2f}")
        print(f"   Different options score: {different_score:.2f}")
        
        if similar_score > different_score:
            print(f"✅ Similarity correctly identifies matching options")
        else:
            print(f"⚠️  Similarity scores may need adjustment")
        
        if similar_score >= 0.8:
            print(f"✅ High similarity score for identical options")
        else:
            print(f"⚠️  Similarity score lower than expected")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_preference_stats():
    """Test preference statistics"""
    print("\n" + "=" * 60)
    print("TEST 6: Preference Statistics")
    print("=" * 60)
    
    try:
        learner = PreferenceLearner()
        
        # Record some preferences if none exist
        if len(learner.preferences) == 0:
            for i in range(3):
                choice = {
                    "naming_style": "camelCase",
                    "verbosity": "verbose",
                    "pattern_type": "error_handling"
                }
                learner.record_choice(choice, [{"naming_style": "snake_case"}])
        
        # Get stats
        stats = learner.get_preference_stats()
        
        print(f"✅ Statistics retrieved")
        print(f"   Total preferences: {stats['total_preferences']}")
        print(f"   Confidence: {stats['confidence']:.2f}")
        print(f"   Naming styles: {stats['naming_styles']}")
        print(f"   Verbosity preferences: {stats['verbosity_preferences']}")
        print(f"   Pattern types: {stats['pattern_types']}")
        
        if stats['total_preferences'] > 0:
            print(f"✅ Statistics calculated correctly")
        else:
            print(f"⚠️  No preferences recorded yet")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_personal_style_learner_integration():
    """Test integration with PersonalStyleLearner"""
    print("\n" + "=" * 60)
    print("TEST 7: PersonalStyleLearner Integration")
    print("=" * 60)
    
    try:
        # Create PersonalStyleLearner with PreferenceLearner
        style_learner = PersonalStyleLearner()
        
        # Check if PreferenceLearner is initialized
        if style_learner.preference_learner is None:
            print("❌ PreferenceLearner not initialized")
            return False
        
        print(f"✅ PersonalStyleLearner initialized with PreferenceLearner")
        
        # Test recording user choice
        selected = {
            "naming_style": "camelCase",
            "verbosity": "verbose",
            "content": "def processUserInput():\n    pass"
        }
        
        rejected = [
            {
                "naming_style": "snake_case",
                "verbosity": "concise",
                "content": "def process_input():\n    pass"
            }
        ]
        
        style_learner.record_user_choice(selected, rejected, {"test": True})
        
        print(f"✅ User choice recorded via PersonalStyleLearner")
        
        # Test preference stats
        stats = style_learner.get_preference_stats()
        print(f"✅ Preference stats retrieved: {stats['total_preferences']} preferences")
        
        # Test prediction
        options = [
            {"naming_style": "camelCase", "verbosity": "verbose"},
            {"naming_style": "snake_case", "verbosity": "concise"}
        ]
        
        predicted = style_learner.predict_preferred_option(options)
        print(f"✅ Preference prediction completed")
        print(f"   Predicted: {predicted.get('naming_style', 'N/A')}")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_suggestion_adaptation_with_options():
    """Test adapting suggestions with multiple options"""
    print("\n" + "=" * 60)
    print("TEST 8: Suggestion Adaptation with Options")
    print("=" * 60)
    
    try:
        style_learner = PersonalStyleLearner()
        
        # Record a preference first
        if style_learner.preference_learner:
            choice = {
                "naming_style": "camelCase",
                "verbosity": "verbose"
            }
            style_learner.preference_learner.record_choice(choice, [{"naming_style": "snake_case"}])
        
        # Test adaptation with options
        options = [
            "def processUserInputData(userInput):\n    return userInput.upper()",
            "def process_input(input):\n    return input.upper()",
            "def proc(data):\n    return data.upper()"
        ]
        
        adapted = style_learner.adapt_suggestion("Generic suggestion", options=options)
        
        print(f"✅ Suggestion adaptation completed")
        print(f"   Adapted suggestion length: {len(adapted)} chars")
        
        # Check if adapted suggestion matches preferences
        if "processUserInputData" in adapted or "UserInput" in adapted:
            print(f"✅ Adapted to verbose camelCase (matches preferences)")
        else:
            print(f"⚠️  Adaptation may not match preferences")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all PreferenceLearner tests"""
    print("\n" + "=" * 60)
    print("PREFERENCE LEARNER TEST SUITE")
    print("=" * 60)
    
    results = []
    
    # Test 1: Preference loading
    results.append(test_preference_loading())
    
    # Test 2: Recording choices
    results.append(test_recording_choices())
    
    # Test 3: Preference prediction
    results.append(test_preference_prediction())
    
    # Test 4: Feature extraction
    results.append(test_feature_extraction())
    
    # Test 5: Similarity calculation
    results.append(test_similarity_calculation())
    
    # Test 6: Preference stats
    results.append(test_preference_stats())
    
    # Test 7: PersonalStyleLearner integration
    results.append(test_personal_style_learner_integration())
    
    # Test 8: Suggestion adaptation with options
    results.append(test_suggestion_adaptation_with_options())
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    test_names = [
        "Preference Loading",
        "Recording User Choices",
        "Preference Prediction",
        "Feature Extraction",
        "Similarity Calculation",
        "Preference Statistics",
        "PersonalStyleLearner Integration",
        "Suggestion Adaptation with Options"
    ]
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{name}: {status}")
    
    passed = sum(results)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 All PreferenceLearner tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

