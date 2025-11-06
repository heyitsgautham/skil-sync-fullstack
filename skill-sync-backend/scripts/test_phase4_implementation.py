#!/usr/bin/env python3
"""
Phase 4 Implementation Test Script
Tests all enhanced explainability endpoints and features
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
COMPANY_EMAIL = "hr@techcorp.com"
COMPANY_PASSWORD = "TechCorp2024"
STUDENT_ID_1 = 5  # Priya Sharma (has active resume)
STUDENT_ID_2 = 6  # Rahul Verma (has active resume)
INTERNSHIP_ID = 1  # Full Stack Software Engineer Intern


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_test(name: str):
    """Print test name"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}🧪 Testing: {name}{Colors.RESET}")


def print_success(message: str):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {message}{Colors.RESET}")


def print_error(message: str):
    """Print error message"""
    print(f"{Colors.RED}❌ {message}{Colors.RESET}")


def print_info(message: str):
    """Print info message"""
    print(f"{Colors.YELLOW}ℹ️  {message}{Colors.RESET}")


def check_server():
    """Check if backend server is running"""
    print_test("Server Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print_success("Backend server is running")
            return True
        else:
            print_error(f"Server returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to backend at {BASE_URL}")
        print_info("Start the server with: uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print_error(f"Health check failed: {e}")
        return False


def login_company():
    """Login as company and return token"""
    print_test("Company Login")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": COMPANY_EMAIL,
                "password": COMPANY_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print_success(f"Login successful")
            print_info(f"Company: {COMPANY_EMAIL}")
            return token
        else:
            print_error(f"Login failed: {response.status_code} - {response.text}")
            print_info(f"Attempting to login with: {COMPANY_EMAIL}")
            return None
    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to {BASE_URL}")
        print_info("Make sure the backend server is running: uvicorn app.main:app --reload")
        return None
    except Exception as e:
        print_error(f"Login error: {e}")
        return None


def test_candidate_explanation(token: str, candidate_id: int, internship_id: int):
    """Test Task 4.1: Get candidate explanation"""
    print_test(f"Task 4.1: Candidate Explanation (Candidate {candidate_id})")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/recommendations/candidates/{candidate_id}/explanation",
            params={"internship_id": internship_id},
            headers=headers,
            timeout=30  # Allow time for generation
        )
    except requests.exceptions.Timeout:
        print_error("Request timed out (explanation generation can take time)")
        print_info("Try precomputing explanations first")
        return None
    except Exception as e:
        print_error(f"Request failed: {e}")
        return None
    
    if response.status_code == 200:
        data = response.json()
        
        print_success(f"Explanation retrieved successfully")
        print_info(f"Overall Score: {data.get('overall_score'):.2f}")
        print_info(f"Confidence: {data.get('confidence'):.2f}")
        print_info(f"Recommendation: {data.get('recommendation')}")
        print_info(f"Explanation ID: {data.get('explanation_id')}")
        
        # Check component scores
        component_scores = data.get('component_scores', {})
        print_info(f"Component Scores:")
        for component, score in component_scores.items():
            print(f"  - {component}: {score:.2f}")
        
        # Check matched skills
        matched_skills = data.get('matched_skills', [])
        print_info(f"Matched Skills: {len(matched_skills)}")
        for skill in matched_skills[:3]:
            print(f"  - {skill.get('skill')} ({skill.get('proficiency')}) - Confidence: {skill.get('confidence'):.2f}")
        
        # Check missing skills
        missing_skills = data.get('missing_skills', [])
        print_info(f"Missing Skills: {len(missing_skills)}")
        for skill in missing_skills[:3]:
            print(f"  - {skill.get('skill')} (Impact: {skill.get('impact')})")
        
        # Check AI recommendation
        ai_rec = data.get('ai_recommendation', {})
        if ai_rec:
            print_info(f"AI Recommendation:")
            print(f"  - Action: {ai_rec.get('action')}")
            print(f"  - Priority: {ai_rec.get('priority')}")
            print(f"  - Strengths: {len(ai_rec.get('strengths', []))}")
            print(f"  - Concerns: {len(ai_rec.get('concerns', []))}")
        
        # Check provenance
        provenance = data.get('provenance', {})
        print_info(f"Provenance:")
        print(f"  - Model: {provenance.get('extraction_model')}")
        print(f"  - Time: {provenance.get('extract_time')}")
        
        return data
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        return None


def test_candidate_comparison(token: str, candidate_id_1: int, candidate_id_2: int, internship_id: int):
    """Test Task 4.2: Compare candidates"""
    print_test(f"Task 4.2: Candidate Comparison ({candidate_id_1} vs {candidate_id_2})")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/recommendations/internship/{internship_id}/compare",
        params={"candidates": f"{candidate_id_1},{candidate_id_2}"},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        
        print_success(f"Comparison generated successfully")
        print_info(f"Better Candidate: {data.get('better_candidate')}")
        print_info(f"Score Difference: {data.get('score_difference'):.2f}")
        print_info(f"Audit ID: {data.get('audit_id')}")
        
        # Component differences
        component_diffs = data.get('component_differences', {})
        print_info(f"Component Differences:")
        for component, diff in component_diffs.items():
            print(f"  - {component}: {diff:+.2f}")
        
        # Summary
        summary = data.get('summary', '')
        print_info(f"Summary: {summary[:200]}...")
        
        # Next steps
        next_steps = data.get('next_steps', {})
        print_info(f"Next Steps for Candidate 1:")
        for step in next_steps.get('candidate_1', [])[:2]:
            print(f"  - {step}")
        
        return data
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        return None


def test_precomputation(token: str, internship_id: int, top_n: int = 10):
    """Test Task 4.4: Precomputation"""
    print_test(f"Task 4.4: Precomputation (Top {top_n} candidates)")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # First check status
    print_info("Checking precompute status...")
    status_response = requests.get(
        f"{BASE_URL}/api/internship/{internship_id}/precompute-status",
        headers=headers
    )
    
    if status_response.status_code == 200:
        status = status_response.json()
        print_info(f"Current Status:")
        print(f"  - Total Matches: {status.get('total_matches')}")
        print(f"  - Precomputed: {status.get('precomputed_count')}")
        print(f"  - Fresh: {status.get('fresh_count')}")
        print(f"  - Stale: {status.get('stale_count')}")
        print(f"  - Coverage: {status.get('coverage_percent')}%")
        print(f"  - Needs Refresh: {status.get('needs_refresh')}")
    
    # Trigger precomputation
    print_info(f"Triggering precomputation for {top_n} candidates...")
    response = requests.post(
        f"{BASE_URL}/api/internship/{internship_id}/precompute",
        params={"top_n": top_n, "force_refresh": False},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        
        print_success(f"Precomputation completed")
        print_info(f"Message: {data.get('message')}")
        print_info(f"Processed: {data.get('processed')}/{data.get('requested_count')}")
        print_info(f"New: {data.get('new')}, Cached: {data.get('cached')}, Errors: {data.get('errors')}")
        print_info(f"Duration: {data.get('duration_seconds')}s")
        
        if data.get('errors') > 0:
            print_error(f"Errors occurred:")
            for error in data.get('error_details', [])[:3]:
                print(f"  - {error}")
        
        return data
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        return None


def test_ranking_with_explanations(token: str, internship_id: int):
    """Test Task 4.5: Ranking with explanations"""
    print_test(f"Task 4.5: Ranking with Explanations")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/filter/rank-candidates/{internship_id}/filtered",
        params={"page": 1, "page_size": 5},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        
        print_success(f"Ranking retrieved successfully")
        print_info(f"Total Candidates: {data.get('total')}")
        print_info(f"Cached Explanations: {data.get('cached_explanations_count')}")
        print_info(f"Audit ID: {data.get('audit_id')}")
        
        candidates = data.get('ranked_candidates', [])
        print_info(f"Candidates in Page: {len(candidates)}")
        
        for i, candidate in enumerate(candidates[:3], 1):
            print(f"\n  Candidate {i}:")
            print(f"    - ID: {candidate.get('candidate_id')}")
            print(f"    - Name: {candidate.get('candidate_name')}")
            print(f"    - Match Score: {candidate.get('match_score')}")
            
            explanation = candidate.get('explanation', {})
            if explanation.get('cached'):
                print(f"    - Explanation: ✅ Cached")
                print(f"    - Overall Score: {explanation.get('overall_score')}")
                print(f"    - Recommendation: {explanation.get('recommendation')}")
                print(f"    - Short Reason: {explanation.get('short_reason')}")
            else:
                print(f"    - Explanation: ⚠️  Not cached")
        
        return data
    else:
        print_error(f"Failed: {response.status_code} - {response.text}")
        return None


def main():
    """Run all Phase 4 tests"""
    print(f"\n{Colors.BOLD}{'='*60}")
    print(f"🚀 Phase 4 Enhanced Explainability Test Suite")
    print(f"{'='*60}{Colors.RESET}\n")
    
    print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"Base URL: {BASE_URL}")
    
    # Check server health
    if not check_server():
        print_error("Backend server is not running")
        sys.exit(1)
    
    # Login
    token = login_company()
    if not token:
        print_error("Cannot proceed without authentication")
        print_info("Check if company credentials are correct:")
        print_info(f"  Email: {COMPANY_EMAIL}")
        print_info(f"  Password: {COMPANY_PASSWORD}")
        sys.exit(1)
    
    # Test Task 4.1: Candidate Explanation
    print_info(f"Using Student ID: {STUDENT_ID_1}, Internship ID: {INTERNSHIP_ID}")
    explanation = None
    try:
        explanation = test_candidate_explanation(token, STUDENT_ID_1, INTERNSHIP_ID)
    except Exception as e:
        print_error(f"Task 4.1 failed with exception: {e}")
    
    # Test Task 4.2: Candidate Comparison
    print_info(f"Comparing Student IDs: {STUDENT_ID_1} vs {STUDENT_ID_2}")
    comparison = None
    try:
        comparison = test_candidate_comparison(token, STUDENT_ID_1, STUDENT_ID_2, INTERNSHIP_ID)
    except Exception as e:
        print_error(f"Task 4.2 failed with exception: {e}")
    
    # Test Task 4.4: Precomputation
    precompute = None
    try:
        precompute = test_precomputation(token, INTERNSHIP_ID, top_n=10)
    except Exception as e:
        print_error(f"Task 4.4 failed with exception: {e}")
    
    # Test Task 4.5: Ranking with Explanations
    ranking = None
    try:
        ranking = test_ranking_with_explanations(token, INTERNSHIP_ID)
    except Exception as e:
        print_error(f"Task 4.5 failed with exception: {e}")
    
    # Summary
    print(f"\n{Colors.BOLD}{'='*60}")
    print(f"📊 Test Summary")
    print(f"{'='*60}{Colors.RESET}\n")
    
    results = {
        "Task 4.1 - Candidate Explanation": explanation is not None,
        "Task 4.2 - Candidate Comparison": comparison is not None,
        "Task 4.4 - Precomputation": precompute is not None,
        "Task 4.5 - Ranking with Explanations": ranking is not None
    }
    
    passed = sum(results.values())
    total = len(results)
    
    for task, success in results.items():
        status = f"{Colors.GREEN}✅ PASS{Colors.RESET}" if success else f"{Colors.RED}❌ FAIL{Colors.RESET}"
        print(f"{status} - {task}")
    
    print(f"\n{Colors.BOLD}Overall: {passed}/{total} tests passed{Colors.RESET}")
    
    if passed == total:
        print(f"{Colors.GREEN}{Colors.BOLD}🎉 All Phase 4 tests passed!{Colors.RESET}\n")
        sys.exit(0)
    else:
        print(f"{Colors.RED}{Colors.BOLD}⚠️  Some tests failed. Please review the errors above.{Colors.RESET}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
