"""
Skill Proficiency Analyzer Service
Calculates skill proficiency levels based on experience, projects, and certifications
Provides evidence for each proficiency assessment
"""

import logging
from typing import List, Dict, Optional
import re

logger = logging.getLogger(__name__)


class SkillProficiencyService:
    """Service for analyzing skill proficiency levels"""
    
    # Proficiency thresholds
    EXPERT_THRESHOLD = 0.80
    ADVANCED_THRESHOLD = 0.60
    INTERMEDIATE_THRESHOLD = 0.35
    
    def __init__(self):
        """Initialize skill proficiency service"""
        logger.info("✅ SkillProficiencyService initialized")
    
    def calculate_proficiency(
        self,
        skill: str,
        resume_data: Dict
    ) -> str:
        """
        Calculate proficiency level for a skill
        
        Args:
            skill: Skill name
            resume_data: Parsed resume data with experiences, projects, certifications
            
        Returns:
            Proficiency level: Expert | Advanced | Intermediate | Beginner
        """
        logger.debug(f"📊 Calculating proficiency for skill: {skill}")
        
        skill_lower = skill.lower()
        
        # Extract relevant data
        work_experience = resume_data.get('work_experience', [])
        projects = resume_data.get('projects', [])
        certifications = resume_data.get('certifications', [])
        
        # Calculate factors
        years_experience = self._calculate_years_with_skill(skill_lower, work_experience)
        project_count = self._count_projects_with_skill(skill_lower, projects)
        has_certification = self._has_certification_for_skill(skill_lower, certifications)
        
        # Normalize factors (0-1 scale)
        # Years: 0-10+ years scale
        years_norm = min(1.0, years_experience / 10.0)
        
        # Projects: 0-5+ projects scale
        projects_norm = min(1.0, project_count / 5.0)
        
        # Certification: 0 or 1
        cert_flag = 1.0 if has_certification else 0.0
        
        # Calculate proficiency score using weighted formula
        # Years: 50%, Projects: 30%, Certification: 20%
        proficiency_value = (0.5 * years_norm) + (0.3 * projects_norm) + (0.2 * cert_flag)
        
        # Map to proficiency level
        proficiency_level = self.map_proficiency_score(proficiency_value)
        
        logger.debug(f"✅ Proficiency for {skill}: {proficiency_level} (score: {proficiency_value:.2f}, years: {years_experience}, projects: {project_count}, cert: {has_certification})")
        
        return proficiency_level
    
    def map_proficiency_score(self, proficiency_value: float) -> str:
        """
        Map proficiency score to string label
        
        Args:
            proficiency_value: Proficiency score (0-1)
            
        Returns:
            Proficiency label string
        """
        if proficiency_value >= self.EXPERT_THRESHOLD:
            return "Expert"
        elif proficiency_value >= self.ADVANCED_THRESHOLD:
            return "Advanced"
        elif proficiency_value >= self.INTERMEDIATE_THRESHOLD:
            return "Intermediate"
        else:
            return "Beginner"
    
    def _calculate_years_with_skill(
        self,
        skill: str,
        work_experience: List[Dict]
    ) -> float:
        """Calculate total years of experience using a specific skill"""
        
        total_years = 0.0
        skill_pattern = re.compile(r'\b' + re.escape(skill) + r'\b', re.IGNORECASE)
        
        for exp in work_experience:
            # Check if skill is mentioned in role description or technologies
            exp_text = f"{exp.get('role', '')} {exp.get('description', '')}".lower()
            technologies = exp.get('technologies', [])
            technologies_text = ' '.join([str(t).lower() for t in technologies])
            
            combined_text = f"{exp_text} {technologies_text}"
            
            if skill_pattern.search(combined_text):
                # Add duration of this experience
                duration = exp.get('duration_years', 0)
                
                if duration == 0:
                    # Try to calculate from dates
                    start_date = exp.get('start_date')
                    end_date = exp.get('end_date', 'Present')
                    
                    if start_date:
                        try:
                            from dateutil import parser
                            from datetime import datetime
                            
                            start = parser.parse(start_date) if isinstance(start_date, str) else start_date
                            
                            if end_date == 'Present' or end_date.lower() == 'current':
                                end = datetime.now()
                            else:
                                end = parser.parse(end_date) if isinstance(end_date, str) else end_date
                            
                            duration = (end - start).days / 365.25
                        except:
                            duration = 0
                
                total_years += duration
        
        return round(total_years, 1)
    
    def _count_projects_with_skill(
        self,
        skill: str,
        projects: List[Dict]
    ) -> int:
        """Count number of projects using a specific skill"""
        
        count = 0
        skill_pattern = re.compile(r'\b' + re.escape(skill) + r'\b', re.IGNORECASE)
        
        for proj in projects:
            proj_text = f"{proj.get('name', '')} {proj.get('description', '')}".lower()
            technologies = proj.get('technologies', [])
            technologies_text = ' '.join([str(t).lower() for t in technologies])
            
            combined_text = f"{proj_text} {technologies_text}"
            
            if skill_pattern.search(combined_text):
                count += 1
        
        return count
    
    def _has_certification_for_skill(
        self,
        skill: str,
        certifications: List[Dict]
    ) -> bool:
        """Check if candidate has certification related to skill"""
        
        skill_pattern = re.compile(r'\b' + re.escape(skill) + r'\b', re.IGNORECASE)
        
        for cert in certifications:
            cert_text = f"{cert.get('name', '')} {cert.get('issuer', '')} {cert.get('description', '')}".lower()
            
            if skill_pattern.search(cert_text):
                return True
        
        return False
    
    def get_skill_evidence(
        self,
        skill: str,
        resume_text: str,
        resume_data: Dict
    ) -> List[Dict]:
        """
        Get evidence snippets for a skill from resume
        
        Args:
            skill: Skill name
            resume_text: Full resume text
            resume_data: Parsed resume data
            
        Returns:
            List of evidence objects with text, source, confidence
        """
        logger.debug(f"📝 Getting evidence for skill: {skill}")
        
        evidences = []
        skill_lower = skill.lower()
        skill_pattern = re.compile(r'\b' + re.escape(skill) + r'\b', re.IGNORECASE)
        
        # 1. Evidence from work experience
        work_experience = resume_data.get('work_experience', [])
        for exp in work_experience:
            exp_text = f"{exp.get('role', '')} at {exp.get('company', '')}: {exp.get('description', '')}"
            
            if skill_pattern.search(exp_text.lower()):
                evidences.append({
                    'text': exp_text[:200] + '...' if len(exp_text) > 200 else exp_text,
                    'source': 'Work Experience',
                    'context': f"{exp.get('company', '')} ({exp.get('start_date', '')} - {exp.get('end_date', '')})",
                    'confidence': 0.9,
                    'type': 'experience'
                })
        
        # 2. Evidence from projects
        projects = resume_data.get('projects', [])
        for proj in projects:
            proj_text = f"{proj.get('name', '')}: {proj.get('description', '')}"
            technologies = proj.get('technologies', [])
            
            if skill_pattern.search(proj_text.lower()) or any(skill_lower in str(t).lower() for t in technologies):
                evidences.append({
                    'text': proj_text[:200] + '...' if len(proj_text) > 200 else proj_text,
                    'source': 'Projects',
                    'context': proj.get('name', ''),
                    'confidence': 0.85,
                    'type': 'project'
                })
        
        # 3. Evidence from certifications
        certifications = resume_data.get('certifications', [])
        for cert in certifications:
            cert_text = f"{cert.get('name', '')} - {cert.get('issuer', '')}"
            
            if skill_pattern.search(cert_text.lower()):
                evidences.append({
                    'text': cert_text,
                    'source': 'Certifications',
                    'context': cert.get('date', ''),
                    'confidence': 1.0,
                    'type': 'certification'
                })
        
        # 4. Evidence from skills section (if mentioned explicitly)
        skills_section = resume_data.get('skills', [])
        if skill_lower in [s.lower() for s in skills_section]:
            evidences.append({
                'text': f"Listed in skills section: {skill}",
                'source': 'Skills',
                'context': 'Technical Skills',
                'confidence': 0.7,
                'type': 'declaration'
            })
        
        # 5. Direct text search for additional context
        if resume_text:
            # Find sentences containing the skill
            sentences = re.split(r'[.!?]\s+', resume_text)
            for sentence in sentences:
                if skill_pattern.search(sentence) and len(sentence) > 20:
                    # Check if we don't already have this evidence
                    if not any(sentence[:50] in ev['text'] for ev in evidences):
                        evidences.append({
                            'text': sentence.strip(),
                            'source': 'Resume Text',
                            'context': 'Direct mention',
                            'confidence': 0.75,
                            'type': 'text_match'
                        })
                        
                        # Limit to avoid too many text matches
                        if len([e for e in evidences if e['type'] == 'text_match']) >= 2:
                            break
        
        logger.debug(f"✅ Found {len(evidences)} evidence items for {skill}")
        
        # Sort by confidence
        evidences.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Limit to top 5 evidences
        return evidences[:5]
    
    def analyze_skill_strength(
        self,
        skill: str,
        resume_data: Dict
    ) -> Dict:
        """
        Comprehensive skill strength analysis
        
        Args:
            skill: Skill name
            resume_data: Parsed resume data
            
        Returns:
            Detailed analysis dict
        """
        proficiency = self.calculate_proficiency(skill, resume_data)
        
        work_experience = resume_data.get('work_experience', [])
        projects = resume_data.get('projects', [])
        certifications = resume_data.get('certifications', [])
        
        years_experience = self._calculate_years_with_skill(skill.lower(), work_experience)
        project_count = self._count_projects_with_skill(skill.lower(), projects)
        has_certification = self._has_certification_for_skill(skill.lower(), certifications)
        
        return {
            'skill': skill,
            'proficiency': proficiency,
            'years_experience': years_experience,
            'project_count': project_count,
            'has_certification': has_certification,
            'strength_score': self._calculate_strength_score(
                years_experience, project_count, has_certification
            )
        }
    
    def _calculate_strength_score(
        self,
        years: float,
        projects: int,
        has_cert: bool
    ) -> float:
        """Calculate overall strength score (0-100)"""
        
        years_score = min(50, years * 5)  # Up to 50 points (10 years = 50)
        projects_score = min(30, projects * 6)  # Up to 30 points (5 projects = 30)
        cert_score = 20 if has_cert else 0  # 20 points for certification
        
        return years_score + projects_score + cert_score


# Singleton instance
_skill_proficiency_service_instance = None


def get_skill_proficiency_service() -> SkillProficiencyService:
    """Get or create singleton SkillProficiencyService instance"""
    global _skill_proficiency_service_instance
    if _skill_proficiency_service_instance is None:
        _skill_proficiency_service_instance = SkillProficiencyService()
    return _skill_proficiency_service_instance
