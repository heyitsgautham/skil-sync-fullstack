#!/usr/bin/env python3
"""
Phase 3 Implementation Test Script
Tests job posting skill extraction functionality
"""

import requests
import json
import sys
from datetime import datetime


# Configuration
BASE_URL = "http://localhost:8000"
COMPANY_EMAIL = "hr@techcorp.com"
COMPANY_PASSWORD = "TechCorp2024"


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
            return None
    except Exception as e:
        print_error(f"Login error: {e}")
        return None


def test_skill_extraction(token: str):
    """Test Phase 3: Skill extraction from job description"""
    print_test("Phase 3: Skill Extraction API")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Sample job description
    job_description = """
    We are looking for a Full Stack Software Engineer with strong experience in:
    - React and JavaScript for frontend development
    - Node.js and Express for backend APIs
    - PostgreSQL database design and optimization
    - Docker and Kubernetes for containerization
    - AWS cloud services (EC2, S3, Lambda)
    - Git version control and CI/CD pipelines
    
    Nice to have:
    - TypeScript
    - GraphQL
    - Redis caching
    - Microservices architecture
    """
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/internship/extract-skills",
            json={
                "title": "Full Stack Software Engineer Intern",
                "description": job_description,
                "num_suggestions": 15
            },
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            skills = data.get('skills', [])
            must_have = data.get('suggested_must_have', [])
            preferred = data.get('suggested_preferred', [])
            highlighted_html = data.get('highlighted_html', '')
            
            print_success(f"Skill extraction completed successfully")
            print_info(f"Total skills extracted: {len(skills)}")
            print_info(f"Suggested must-have skills: {len(must_have)}")
            print_info(f"Suggested preferred skills: {len(preferred)}")
            
            # Check if we extracted at least 10 skills
            if len(skills) >= 10:
                print_success(f"✓ Extracted {len(skills)} skills (≥10 required)")
            else:
                print_error(f"✗ Only extracted {len(skills)} skills (<10 required)")
                return False
            
            # Display top skills
            print_info("Top extracted skills:")
            for skill in skills[:5]:
                skill_name = skill.get('skill', 'N/A')
                confidence = skill.get('confidence', 0)
                category = skill.get('category', 'N/A')
                print(f"  - {skill_name} (Confidence: {confidence:.2f}, Category: {category})")
            
            # Check confidence scores
            high_confidence_count = sum(1 for s in skills if s.get('confidence', 0) >= 0.7)
            if high_confidence_count >= 5:
                print_success(f"✓ {high_confidence_count} skills with confidence ≥0.7")
            else:
                print_error(f"✗ Only {high_confidence_count} skills with confidence ≥0.7 (<5 required)")
                return False
            
            # Check if highlighting HTML is present
            if highlighted_html and len(highlighted_html) > 100:
                print_success("✓ Highlighting HTML generated")
            else:
                print_error("✗ Highlighting HTML not generated properly")
                return False
            
            # Check text spans are present
            skills_with_spans = sum(1 for s in skills if 'span' in s and s['span'])
            if skills_with_spans >= 5:
                print_success(f"✓ {skills_with_spans} skills have text span positions")
            else:
                print_info(f"ℹ️  Only {skills_with_spans} skills have text spans")
            
            print_success("Phase 3: Skill extraction API working correctly")
            return True
            
        else:
            print_error(f"Skill extraction failed: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print_error("Request timed out (skill extraction can take time)")
        return False
    except Exception as e:
        print_error(f"Skill extraction error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_job_posting_with_enhanced_fields(token: str):
    """Test Phase 3: Create job posting with enhanced fields"""
    print_test("Phase 3: Enhanced Job Posting Creation")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    job_data = {
        "title": "Test Backend Developer Intern",
        "description": "Test job for Phase 3 validation with Python, Django, and PostgreSQL skills.",
        "required_skills": ["Python", "Django", "PostgreSQL"],
        "preferred_skills": ["Redis", "Docker"],
        "min_experience": 1.0,
        "preferred_years": 2.0,
        "required_education": "Bachelor's",
        "location": "Remote",
        "duration": "3 months",
        "stipend": "$1500/month",
        "rubric_weights": {
            "semantic": 0.30,
            "skills": 0.35,
            "experience": 0.20,
            "education": 0.10,
            "projects": 0.05
        },
        "skill_weights": [
            {"skill": "Python", "weight": 1.5, "type": "must"},
            {"skill": "Django", "weight": 1.2, "type": "must"}
        ],
        "top_responsibilities": [
            "Build RESTful APIs",
            "Write unit tests",
            "Deploy to production"
        ],
        "key_deliverable": "Complete backend API for mobile app",
        "requires_portfolio": True,
        "role_level": "Intern",
        "extracted_skills_raw": [
            {"skill": "Python", "confidence": 0.95, "category": "Backend"},
            {"skill": "Django", "confidence": 0.90, "category": "Backend"},
            {"skill": "PostgreSQL", "confidence": 0.85, "category": "Database"},
            {"skill": "REST API", "confidence": 0.80, "category": "Backend"}
        ],
        "skills_extraction_confidence": {
            "Python": 0.95,
            "Django": 0.90,
            "PostgreSQL": 0.85
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/internship/post",
            json=job_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            internship_id = data.get('id')
            
            print_success(f"Job posting created successfully")
            print_info(f"Internship ID: {internship_id}")
            
            # The response is the internship object itself
            response_data = data
            
            checks = [
                ("preferred_years", response_data.get('preferred_years') == 2.0),
                ("rubric_weights", response_data.get('rubric_weights') is not None),
                ("skill_weights", response_data.get('skill_weights') is not None),
                ("top_responsibilities", response_data.get('top_responsibilities') is not None),
                ("key_deliverable", response_data.get('key_deliverable') is not None),
                ("requires_portfolio", response_data.get('requires_portfolio') == True),
                ("role_level", response_data.get('role_level') == "Intern"),
                ("extracted_skills_raw", response_data.get('extracted_skills_raw') is not None)
            ]
            
            passed_checks = sum(1 for _, check in checks if check)
            
            if passed_checks == len(checks):
                print_success(f"✓ All {len(checks)} enhanced fields saved correctly")
            else:
                print_error(f"✗ Only {passed_checks}/{len(checks)} enhanced fields saved")
                for field_name, check in checks:
                    if not check:
                        print_error(f"  - {field_name} not saved correctly")
                return False
            
            print_success("Phase 3: Enhanced job posting creation working correctly")
            return True
            
        else:
            print_error(f"Job posting failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Job posting error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all Phase 3 tests"""
    print("=" * 60)
    print(f"{Colors.BOLD}🚀 Phase 3 Implementation Test Suite{Colors.RESET}")
    print("=" * 60)
    print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"Base URL: {BASE_URL}")
    
    # Check server
    if not check_server():
        return 1
    
    # Login
    token = login_company()
    if not token:
        return 1
    
    # Run tests
    results = {
        "Skill Extraction API": test_skill_extraction(token),
        "Enhanced Job Posting": test_job_posting_with_enhanced_fields(token)
    }
    
    print("\n" + "=" * 60)
    print(f"{Colors.BOLD}📊 Test Summary{Colors.RESET}")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = f"{Colors.GREEN}✅ PASS{Colors.RESET}" if passed else f"{Colors.RED}❌ FAIL{Colors.RESET}"
        print(f"{status} - {test_name}")
    
    passed_count = sum(results.values())
    total_count = len(results)
    
    print(f"\nOverall: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print(f"{Colors.GREEN}🎉 All Phase 3 tests passed!{Colors.RESET}\n")
        return 0
    else:
        print(f"{Colors.YELLOW}⚠️  Some tests failed. Please review the errors above.{Colors.RESET}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
