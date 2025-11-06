"""
Component Score Calculator Service
Calculates individual component scores for candidate-internship matching
Components: Semantic, Skills, Experience, Education, Projects
"""

import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import numpy as np
from fuzzywuzzy import fuzz

logger = logging.getLogger(__name__)


class ComponentScoreService:
    """Service for calculating component-wise matching scores"""
    
    def __init__(self):
        """Initialize component score calculator"""
        logger.info("✅ ComponentScoreService initialized")
    
    def calculate_semantic_score(
        self, 
        resume_embedding: List[float], 
        job_embedding: List[float]
    ) -> float:
        """
        Calculate semantic similarity score using cosine similarity
        
        Args:
            resume_embedding: Resume embedding vector
            job_embedding: Job posting embedding vector
            
        Returns:
            Semantic score (0-100)
        """
        logger.debug("📊 Calculating semantic score")
        
        if not resume_embedding or not job_embedding:
            logger.warning("⚠️  Missing embeddings for semantic score calculation")
            return 0.0
        
        try:
            # Convert to numpy arrays
            resume_vec = np.array(resume_embedding)
            job_vec = np.array(job_embedding)
            
            # Calculate cosine similarity
            dot_product = np.dot(resume_vec, job_vec)
            resume_norm = np.linalg.norm(resume_vec)
            job_norm = np.linalg.norm(job_vec)
            
            if resume_norm == 0 or job_norm == 0:
                return 0.0
            
            cosine_similarity = dot_product / (resume_norm * job_norm)
            
            # Convert from [-1, 1] to [0, 100]
            # Typically cosine similarity for text is in [0, 1] range
            score = max(0, min(100, cosine_similarity * 100))
            
            logger.debug(f"✅ Semantic score: {score:.2f}")
            return score
            
        except Exception as e:
            logger.error(f"❌ Error calculating semantic score: {e}")
            return 0.0
    
    def calculate_skills_score(
        self,
        candidate_skills: List[str],
        required_skills: List[str],
        preferred_skills: Optional[List[str]] = None,
        skill_weights: Optional[List[Dict]] = None
    ) -> Tuple[float, List[Dict], List[Dict]]:
        """
        Calculate skills match score with detailed breakdown
        
        Args:
            candidate_skills: List of candidate's skills
            required_skills: List of required skills for the job
            preferred_skills: Optional list of preferred skills
            skill_weights: Optional list of skill weights: [{skill, weight, type}]
            
        Returns:
            Tuple of (score, matched_skills, missing_skills)
        """
        logger.debug(f"📊 Calculating skills score for {len(candidate_skills)} skills")
        
        if not candidate_skills or not required_skills:
            logger.warning("⚠️  Missing skills data")
            return 0.0, [], required_skills if required_skills else []
        
        preferred_skills = preferred_skills or []
        skill_weights = skill_weights or []
        
        # Create skill weight lookup
        weight_map = {
            sw.get('skill', '').lower(): {
                'weight': sw.get('weight', 1.0),
                'type': sw.get('type', 'standard')
            }
            for sw in skill_weights
        }
        
        # Normalize skills for comparison
        candidate_skills_lower = [s.lower() for s in candidate_skills]
        required_skills_lower = [s.lower() for s in required_skills]
        preferred_skills_lower = [s.lower() for s in preferred_skills]
        
        matched_skills = []
        missing_skills = []
        
        # Match required skills
        total_required_weight = 0
        matched_required_weight = 0
        
        for req_skill in required_skills:
            req_skill_lower = req_skill.lower()
            weight_info = weight_map.get(req_skill_lower, {'weight': 1.0, 'type': 'standard'})
            skill_weight = weight_info['weight']
            is_must_have = weight_info['type'] == 'must'
            
            total_required_weight += skill_weight
            
            # Try exact match first
            if req_skill_lower in candidate_skills_lower:
                matched_required_weight += skill_weight
                matched_skills.append({
                    'skill': req_skill,
                    'match_type': 'exact',
                    'weight': skill_weight,
                    'is_required': True,
                    'is_must_have': is_must_have
                })
            else:
                # Try fuzzy match
                best_match_ratio = 0
                best_match_skill = None
                
                for cand_skill in candidate_skills:
                    ratio = fuzz.ratio(req_skill_lower, cand_skill.lower())
                    if ratio > best_match_ratio:
                        best_match_ratio = ratio
                        best_match_skill = cand_skill
                
                if best_match_ratio >= 85:  # Fuzzy match threshold
                    matched_required_weight += (skill_weight * best_match_ratio / 100)
                    matched_skills.append({
                        'skill': req_skill,
                        'match_type': 'fuzzy',
                        'matched_as': best_match_skill,
                        'confidence': best_match_ratio / 100,
                        'weight': skill_weight,
                        'is_required': True,
                        'is_must_have': is_must_have
                    })
                else:
                    # Skill is missing
                    impact = 'critical' if is_must_have else 'high'
                    missing_skills.append({
                        'skill': req_skill,
                        'impact': impact,
                        'is_required': True,
                        'weight': skill_weight,
                        'reason': 'Not found in candidate resume',
                        'recommendation': f'Consider acquiring {req_skill} through courses or projects'
                    })
        
        # Match preferred skills
        total_preferred_weight = 0
        matched_preferred_weight = 0
        
        for pref_skill in preferred_skills:
            pref_skill_lower = pref_skill.lower()
            weight_info = weight_map.get(pref_skill_lower, {'weight': 0.5, 'type': 'preferred'})
            skill_weight = weight_info['weight']
            
            total_preferred_weight += skill_weight
            
            if pref_skill_lower in candidate_skills_lower:
                matched_preferred_weight += skill_weight
                matched_skills.append({
                    'skill': pref_skill,
                    'match_type': 'exact',
                    'weight': skill_weight,
                    'is_required': False,
                    'is_must_have': False
                })
            else:
                # Try fuzzy match
                best_match_ratio = 0
                best_match_skill = None
                
                for cand_skill in candidate_skills:
                    ratio = fuzz.ratio(pref_skill_lower, cand_skill.lower())
                    if ratio > best_match_ratio:
                        best_match_ratio = ratio
                        best_match_skill = cand_skill
                
                if best_match_ratio >= 85:
                    matched_preferred_weight += (skill_weight * best_match_ratio / 100)
                    matched_skills.append({
                        'skill': pref_skill,
                        'match_type': 'fuzzy',
                        'matched_as': best_match_skill,
                        'confidence': best_match_ratio / 100,
                        'weight': skill_weight,
                        'is_required': False,
                        'is_must_have': False
                    })
                else:
                    missing_skills.append({
                        'skill': pref_skill,
                        'impact': 'medium',
                        'is_required': False,
                        'weight': skill_weight,
                        'reason': 'Preferred skill not found',
                        'recommendation': f'{pref_skill} would strengthen your profile'
                    })
        
        # Calculate final score (weighted average)
        # Required skills: 70% weight, Preferred skills: 30% weight
        required_score = (matched_required_weight / total_required_weight * 100) if total_required_weight > 0 else 0
        preferred_score = (matched_preferred_weight / total_preferred_weight * 100) if total_preferred_weight > 0 else 0
        
        final_score = (0.7 * required_score) + (0.3 * preferred_score) if preferred_skills else required_score
        
        logger.debug(f"✅ Skills score: {final_score:.2f} (matched {len(matched_skills)}/{len(required_skills + preferred_skills)})")
        
        return final_score, matched_skills, missing_skills
    
    def calculate_experience_score(
        self,
        candidate_experience: List[Dict],
        min_years: float,
        preferred_years: Optional[float] = None,
        required_skills: Optional[List[str]] = None
    ) -> Tuple[float, Dict]:
        """
        Calculate experience match score
        
        Args:
            candidate_experience: List of candidate's work experiences
            min_years: Minimum required years of experience
            preferred_years: Preferred years of experience
            required_skills: Skills to look for in experience (for relevance)
            
        Returns:
            Tuple of (score, experience_analysis)
        """
        logger.debug(f"📊 Calculating experience score")
        
        if not candidate_experience:
            return 0.0, {
                'total_years': 0,
                'relevant_years': 0,
                'breakdown': []
            }
        
        required_skills = required_skills or []
        required_skills_lower = [s.lower() for s in required_skills]
        
        # Calculate total years and relevant years
        total_years = 0.0
        relevant_years = 0.0
        breakdown = []
        
        for exp in candidate_experience:
            # Calculate duration
            duration = exp.get('duration_years', 0)
            if duration == 0:
                # Try to calculate from dates
                start_date = exp.get('start_date')
                end_date = exp.get('end_date')
                if start_date and end_date:
                    try:
                        from dateutil import parser
                        start = parser.parse(start_date) if isinstance(start_date, str) else start_date
                        end = parser.parse(end_date) if isinstance(end_date, str) else end_date
                        duration = (end - start).days / 365.25
                    except:
                        duration = 0
            
            total_years += duration
            
            # Check if experience is relevant (mentions required skills)
            is_relevant = False
            matched_skills = []
            
            exp_text = f"{exp.get('role', '')} {exp.get('description', '')} {exp.get('technologies', [])}".lower()
            
            for skill in required_skills_lower:
                if skill in exp_text:
                    is_relevant = True
                    matched_skills.append(skill)
            
            if is_relevant:
                relevant_years += duration
            
            breakdown.append({
                'company': exp.get('company'),
                'role': exp.get('role'),
                'duration_years': round(duration, 1),
                'is_relevant': is_relevant,
                'matched_skills': matched_skills
            })
        
        # Calculate score
        preferred_years = preferred_years or min_years
        
        if total_years >= preferred_years:
            # Exceeds preferred years
            score = 100
        elif total_years >= min_years:
            # Between min and preferred
            score = 70 + (30 * (total_years - min_years) / (preferred_years - min_years))
        else:
            # Below minimum
            score = (total_years / min_years) * 70 if min_years > 0 else 0
        
        # Boost score if significant relevant experience
        if relevant_years > 0:
            relevance_boost = min(10, (relevant_years / total_years) * 20) if total_years > 0 else 0
            score = min(100, score + relevance_boost)
        
        experience_analysis = {
            'total_years': round(total_years, 1),
            'relevant_years': round(relevant_years, 1),
            'min_required': min_years,
            'preferred_required': preferred_years,
            'breakdown': breakdown
        }
        
        logger.debug(f"✅ Experience score: {score:.2f} ({total_years:.1f} years total, {relevant_years:.1f} relevant)")
        
        return score, experience_analysis
    
    def calculate_education_score(
        self,
        candidate_education: List[Dict],
        required_education: Optional[str] = None
    ) -> Tuple[float, Dict]:
        """
        Calculate education match score
        
        Args:
            candidate_education: List of candidate's education records
            required_education: Required education level
            
        Returns:
            Tuple of (score, education_analysis)
        """
        logger.debug("📊 Calculating education score")
        
        if not candidate_education:
            return 0.0, {
                'highest_degree': None,
                'match_level': 'none',
                'institutions': []
            }
        
        # Education level hierarchy
        education_levels = {
            'high school': 1,
            'diploma': 2,
            'associate': 3,
            'bachelor': 4,
            'master': 5,
            'phd': 6,
            'doctorate': 6
        }
        
        # Get candidate's highest education
        highest_level = 0
        highest_degree = None
        institutions = []
        
        for edu in candidate_education:
            degree = edu.get('degree', '').lower()
            institution = edu.get('institution', '')
            gpa = edu.get('gpa')
            
            # Determine education level
            level = 0
            for key, value in education_levels.items():
                if key in degree:
                    level = max(level, value)
            
            if level > highest_level:
                highest_level = level
                highest_degree = edu.get('degree')
            
            institutions.append({
                'institution': institution,
                'degree': edu.get('degree'),
                'gpa': gpa,
                'year': edu.get('graduation_year')
            })
        
        # Calculate score based on required education
        required_education = required_education or 'bachelor'
        required_level = education_levels.get(required_education.lower(), 4)
        
        if highest_level >= required_level:
            score = 100
            match_level = 'exceeds' if highest_level > required_level else 'meets'
        elif highest_level == required_level - 1:
            score = 70
            match_level = 'close'
        else:
            score = 50
            match_level = 'below'
        
        education_analysis = {
            'highest_degree': highest_degree,
            'match_level': match_level,
            'required': required_education,
            'institutions': institutions
        }
        
        logger.debug(f"✅ Education score: {score:.2f} ({match_level})")
        
        return score, education_analysis
    
    def calculate_projects_score(
        self,
        candidate_projects: List[Dict],
        required_skills: List[str]
    ) -> Tuple[float, List[Dict]]:
        """
        Calculate projects match score
        
        Args:
            candidate_projects: List of candidate's projects
            required_skills: Required skills for the job
            
        Returns:
            Tuple of (score, project_analysis)
        """
        logger.debug(f"📊 Calculating projects score for {len(candidate_projects)} projects")
        
        if not candidate_projects:
            return 0.0, []
        
        required_skills_lower = [s.lower() for s in required_skills]
        project_analysis = []
        
        total_skill_matches = 0
        projects_with_relevant_skills = 0
        
        for proj in candidate_projects:
            project_text = f"{proj.get('name', '')} {proj.get('description', '')} {' '.join(proj.get('technologies', []))}".lower()
            
            matched_skills = []
            for skill in required_skills:
                if skill.lower() in project_text:
                    matched_skills.append(skill)
                    total_skill_matches += 1
            
            if matched_skills:
                projects_with_relevant_skills += 1
            
            project_analysis.append({
                'name': proj.get('name'),
                'role': proj.get('role'),
                'technologies': proj.get('technologies', []),
                'matched_skills': matched_skills,
                'github_link': proj.get('github_link'),
                'is_relevant': len(matched_skills) > 0
            })
        
        # Calculate score based on:
        # 1. Number of projects (max 3 considered)
        # 2. Skill coverage (how many required skills are demonstrated)
        # 3. Project relevance
        
        project_count_score = min(30, len(candidate_projects) * 10)  # Up to 30 points
        skill_coverage_score = min(50, (total_skill_matches / len(required_skills)) * 50) if required_skills else 0  # Up to 50 points
        relevance_score = min(20, (projects_with_relevant_skills / len(candidate_projects)) * 20)  # Up to 20 points
        
        final_score = project_count_score + skill_coverage_score + relevance_score
        
        logger.debug(f"✅ Projects score: {final_score:.2f} ({projects_with_relevant_skills}/{len(candidate_projects)} relevant)")
        
        return final_score, project_analysis
    
    def calculate_final_score(
        self,
        component_scores: Dict[str, float],
        rubric_weights: Optional[Dict[str, float]] = None
    ) -> float:
        """
        Calculate final weighted score from component scores
        
        Args:
            component_scores: Dict of component scores {semantic, skills, experience, education, projects}
            rubric_weights: Optional custom weights for each component
            
        Returns:
            Final score (0-100)
        """
        logger.debug("📊 Calculating final weighted score")
        
        # Default weights if not provided
        default_weights = {
            'semantic': 0.35,
            'skills': 0.30,
            'experience': 0.20,
            'education': 0.10,
            'projects': 0.05
        }
        
        weights = rubric_weights or default_weights
        
        # Validate weights sum to 1.0
        total_weight = sum(weights.values())
        if abs(total_weight - 1.0) > 0.01:
            logger.warning(f"⚠️  Weights sum to {total_weight}, normalizing to 1.0")
            weights = {k: v / total_weight for k, v in weights.items()}
        
        # Calculate weighted score
        final_score = 0.0
        for component, score in component_scores.items():
            weight = weights.get(component, 0)
            final_score += score * weight
            logger.debug(f"  {component}: {score:.2f} × {weight:.2f} = {score * weight:.2f}")
        
        logger.debug(f"✅ Final score: {final_score:.2f}")
        
        return final_score
    
    def generate_confidence_score(
        self,
        component_confidences: Dict[str, float]
    ) -> float:
        """
        Generate overall confidence score from component confidences
        
        Args:
            component_confidences: Dict of confidence values per component
            
        Returns:
            Overall confidence (0-1)
        """
        logger.debug("📊 Calculating confidence score")
        
        if not component_confidences:
            return 0.5  # Default medium confidence
        
        # Average confidence across all components
        confidences = list(component_confidences.values())
        avg_confidence = sum(confidences) / len(confidences)
        
        logger.debug(f"✅ Confidence score: {avg_confidence:.2f}")
        
        return avg_confidence


# Singleton instance
_component_score_service_instance = None


def get_component_score_service() -> ComponentScoreService:
    """Get or create singleton ComponentScoreService instance"""
    global _component_score_service_instance
    if _component_score_service_instance is None:
        _component_score_service_instance = ComponentScoreService()
    return _component_score_service_instance
