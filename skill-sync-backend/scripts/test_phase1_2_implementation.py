#!/usr/bin/env python3
"""
Phase 1-2 Implementation Test Script
Tests database migrations, models, and core services
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.connection import get_db
from app.models import Internship, User, Resume
from app.models.explainability import CandidateExplanation, AuditLog, FairnessCheck
from sqlalchemy import inspect


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


def test_database_migrations():
    """Test Phase 1: Database migrations"""
    print_test("Phase 1: Database Migrations")
    
    try:
        db = next(get_db())
        inspector = inspect(db.bind)
        
        # Test Internship table enhancements
        print_info("Checking Internship table columns...")
        internship_columns = [col['name'] for col in inspector.get_columns('internships')]
        
        required_columns = [
            'preferred_years', 'rubric_weights', 'skill_weights',
            'top_responsibilities', 'key_deliverable', 'requires_portfolio',
            'role_level', 'extracted_skills_raw', 'skills_extraction_confidence'
        ]
        
        missing_columns = [col for col in required_columns if col not in internship_columns]
        
        if missing_columns:
            print_error(f"Missing columns in internships table: {', '.join(missing_columns)}")
            return False
        else:
            print_success(f"All {len(required_columns)} enhanced columns exist in internships table")
        
        # Test Explainability tables exist
        print_info("Checking explainability tables...")
        tables = inspector.get_table_names()
        
        required_tables = ['candidate_explanations', 'audit_logs', 'fairness_checks']
        missing_tables = [t for t in required_tables if t not in tables]
        
        if missing_tables:
            print_error(f"Missing tables: {', '.join(missing_tables)}")
            return False
        else:
            print_success(f"All {len(required_tables)} explainability tables exist")
        
        # Test Resume provenance fields
        print_info("Checking Resume provenance fields...")
        resume_columns = [col['name'] for col in inspector.get_columns('resumes')]
        
        provenance_fields = [
            'extraction_confidence', 'skill_evidences', 'experience_evidences',
            'project_evidences', 'extraction_metadata'
        ]
        
        missing_provenance = [col for col in provenance_fields if col not in resume_columns]
        
        if missing_provenance:
            print_error(f"Missing provenance fields in resumes table: {', '.join(missing_provenance)}")
            return False
        else:
            print_success(f"All {len(provenance_fields)} provenance fields exist in resumes table")
        
        print_success("Phase 1: Database migrations verified successfully")
        return True
        
    except Exception as e:
        print_error(f"Database migration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_model_creation():
    """Test Phase 1: Model instances can be created"""
    print_test("Phase 1: Model Creation")
    
    try:
        db = next(get_db())
        
        # Test CandidateExplanation model
        print_info("Testing CandidateExplanation model...")
        explanation = CandidateExplanation(
            candidate_id=999,
            internship_id=999,
            overall_score=85.5,
            confidence=0.92,
            recommendation="SHORTLIST",
            component_scores={"semantic": 80, "skills": 90},
            matched_skills=[{"skill": "Python", "confidence": 0.95}],
            missing_skills=[{"skill": "Docker", "impact": "medium"}],
            experience_analysis={"total_years": 3, "relevant_years": 2},
            education_analysis={"degree": "Bachelor's", "match_level": "exact"},
            project_analysis=[{"project": "Test", "relevance": 0.8}],
            ai_recommendation={"action": "SHORTLIST", "priority": "high"},
            provenance={"model": "gemini-2.5-flash"}
        )
        
        # Don't save to DB, just verify it can be instantiated
        print_success("CandidateExplanation model can be instantiated")
        
        # Test AuditLog model
        print_info("Testing AuditLog model...")
        audit = AuditLog(
            audit_id="TEST-2025-11-07-0001",
            user_id=1,
            action="test",
            internship_id=1,
            candidate_ids=[1, 2, 3],
            filters_applied={"min_score": 70},
            blind_mode=False,
            result_hash="test_hash_123"
        )
        print_success("AuditLog model can be instantiated")
        
        # Test FairnessCheck model
        print_info("Testing FairnessCheck model...")
        fairness = FairnessCheck(
            audit_id="TEST-2025-11-07-0001",
            internship_id=1,
            check_type="gini",
            metric_value=0.3,
            pass_threshold=0.4,
            passed=True,
            notes="Test check"
        )
        print_success("FairnessCheck model can be instantiated")
        
        print_success("Phase 1: All models can be instantiated correctly")
        return True
        
    except Exception as e:
        print_error(f"Model creation test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_component_score_service():
    """Test Phase 2: Component Score Service"""
    print_test("Phase 2: Component Score Service")
    
    try:
        from app.services.component_score_service import ComponentScoreService
        
        service = ComponentScoreService()
        
        # Test semantic score calculation
        print_info("Testing semantic score calculation...")
        # Create mock embeddings
        embedding1 = [0.1] * 384
        embedding2 = [0.15] * 384
        semantic_score = service.calculate_semantic_score(embedding1, embedding2)
        
        if 0 <= semantic_score <= 100:
            print_success(f"Semantic score calculated: {semantic_score:.2f}")
        else:
            print_error(f"Invalid semantic score: {semantic_score}")
            return False
        
        # Test skills score calculation
        print_info("Testing skills score calculation...")
        candidate_skills = ["Python", "React", "Node.js"]
        required_skills = ["Python", "JavaScript", "React", "Docker"]
        preferred_skills = ["AWS", "Kubernetes"]
        skill_weights = []
        
        skills_score, matched, missing = service.calculate_skills_score(
            candidate_skills, required_skills, preferred_skills, skill_weights
        )
        
        if 0 <= skills_score <= 100:
            print_success(f"Skills score calculated: {skills_score:.2f}")
            print_info(f"  Matched skills: {len(matched)}")
            print_info(f"  Missing skills: {len(missing)}")
        else:
            print_error(f"Invalid skills score: {skills_score}")
            return False
        
        # Test experience score calculation
        print_info("Testing experience score calculation...")
        candidate_exp = [
            {"title": "Software Engineer", "duration": "2 years", "skills": ["Python", "React"]}
        ]
        experience_score, exp_analysis = service.calculate_experience_score(
            candidate_exp, min_years=1, preferred_years=3, required_skills=required_skills
        )
        
        if 0 <= experience_score <= 100:
            print_success(f"Experience score calculated: {experience_score:.2f}")
            print_info(f"  Total years: {exp_analysis.get('total_years', 0)}")
            print_info(f"  Relevant years: {exp_analysis.get('relevant_years', 0)}")
        else:
            print_error(f"Invalid experience score: {experience_score}")
            return False
        
        # Test education score calculation
        print_info("Testing education score calculation...")
        candidate_edu = [{"degree": "Bachelor's in Computer Science", "institution": "MIT"}]
        education_score, edu_analysis = service.calculate_education_score(
            candidate_edu, required_education="Bachelor's"
        )
        
        if 0 <= education_score <= 100:
            print_success(f"Education score calculated: {education_score:.2f}")
            print_info(f"  Match level: {edu_analysis.get('match_level', 'N/A')}")
        else:
            print_error(f"Invalid education score: {education_score}")
            return False
        
        # Test projects score calculation
        print_info("Testing projects score calculation...")
        candidate_projects = [
            {"title": "Web App", "technologies": ["React", "Node.js"], "description": "Full-stack app"}
        ]
        projects_score, proj_analysis = service.calculate_projects_score(
            candidate_projects, required_skills
        )
        
        if 0 <= projects_score <= 100:
            print_success(f"Projects score calculated: {projects_score:.2f}")
            print_info(f"  Projects analyzed: {len(proj_analysis)}")
        else:
            print_error(f"Invalid projects score: {projects_score}")
            return False
        
        # Test final score calculation
        print_info("Testing final score calculation...")
        component_scores = {
            'semantic': semantic_score,
            'skills': skills_score,
            'experience': experience_score,
            'education': education_score,
            'projects': projects_score
        }
        rubric_weights = {
            'semantic': 0.30,
            'skills': 0.30,
            'experience': 0.20,
            'education': 0.10,
            'projects': 0.10
        }
        
        final_score = service.calculate_final_score(component_scores, rubric_weights)
        
        if 0 <= final_score <= 100:
            print_success(f"Final score calculated: {final_score:.2f}")
        else:
            print_error(f"Invalid final score: {final_score}")
            return False
        
        print_success("Phase 2: Component Score Service working correctly")
        return True
        
    except Exception as e:
        print_error(f"Component Score Service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_provenance_service():
    """Test Phase 2: Provenance Service"""
    print_test("Phase 2: Provenance Service")
    
    try:
        from app.services.provenance_service import ProvenanceService
        
        service = ProvenanceService()
        
        # Test with sample resume text
        print_info("Testing skill provenance extraction...")
        resume_text = """
        I have 3 years of experience with Python and React.
        Built multiple web applications using Django and Node.js.
        Strong knowledge of Docker and Kubernetes.
        """
        
        skills = ["Python", "React", "Django"]
        
        # This will use Gemini API
        provenances = service.extract_skill_provenance(resume_text, skills)
        
        if provenances and len(provenances) > 0:
            print_success(f"Extracted provenance for {len(provenances)} skills")
            # provenances is a dict where keys are skill names
            for skill_name in list(provenances.keys())[:2]:
                evidences = provenances[skill_name]
                print_info(f"  Skill: {skill_name}")
                if evidences and len(evidences) > 0:
                    print_info(f"  Evidences: {len(evidences)}")
                    print_info(f"  First evidence confidence: {evidences[0].get('confidence', 0):.2f}")
        else:
            print_error("No provenance extracted")
            return False
        
        print_success("Phase 2: Provenance Service working correctly")
        return True
        
    except Exception as e:
        print_error(f"Provenance Service test failed: {e}")
        print_info("This may fail if Gemini API is not available or rate limited")
        import traceback
        traceback.print_exc()
        return False


def test_audit_service():
    """Test Phase 2: Audit Service"""
    print_test("Phase 2: Audit Service")
    
    try:
        from app.services.audit_service import AuditService
        
        service = AuditService()
        
        # Test audit ID generation
        print_info("Testing audit ID generation...")
        audit_id = service.generate_audit_id()
        
        if audit_id.startswith("AUD-") and len(audit_id) > 15:
            print_success(f"Generated audit ID: {audit_id}")
        else:
            print_error(f"Invalid audit ID format: {audit_id}")
            return False
        
        # Test result hash calculation
        print_info("Testing result hash calculation...")
        results = [
            {"candidate_id": 1, "score": 85.5},
            {"candidate_id": 2, "score": 78.3}
        ]
        result_hash = service.calculate_result_hash(results)
        
        if result_hash and len(result_hash) == 64:  # SHA-256 produces 64 hex characters
            print_success(f"Generated result hash: {result_hash[:16]}...")
        else:
            print_error(f"Invalid result hash: {result_hash}")
            return False
        
        print_success("Phase 2: Audit Service working correctly")
        return True
        
    except Exception as e:
        print_error(f"Audit Service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all Phase 1-2 tests"""
    print("=" * 60)
    print(f"{Colors.BOLD}🚀 Phase 1-2 Implementation Test Suite{Colors.RESET}")
    print("=" * 60)
    
    results = {
        "Database Migrations": test_database_migrations(),
        "Model Creation": test_model_creation(),
        "Component Score Service": test_component_score_service(),
        "Provenance Service": test_provenance_service(),
        "Audit Service": test_audit_service()
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
        print(f"{Colors.GREEN}🎉 All Phase 1-2 tests passed!{Colors.RESET}\n")
        return 0
    else:
        print(f"{Colors.YELLOW}⚠️  Some tests failed. Please review the errors above.{Colors.RESET}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
