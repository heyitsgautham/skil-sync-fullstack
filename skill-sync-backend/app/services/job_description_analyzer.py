"""
Job Description Analyzer Service
Extracts required and preferred skills from job descriptions using Gemini AI
"""

import json
import re
import logging
from typing import Dict, List
from app.utils.gemini_key_manager import get_gemini_key_manager

logger = logging.getLogger(__name__)


class JobDescriptionAnalyzer:
    """
    Service for analyzing job descriptions and extracting structured skill requirements
    """
    
    def __init__(self):
        """Initialize Gemini AI key manager for skill extraction"""
        self.key_manager = get_gemini_key_manager()
        logger.info("✅ JobDescriptionAnalyzer initialized with GeminiKeyManager")
    
    def extract_skills(self, job_description: str) -> Dict[str, List[str]]:
        """
        Extract required and preferred skills from job description using Gemini AI
        
        Args:
            job_description: The full job description text
            
        Returns:
            Dictionary with:
            - required_skills: List of must-have skills
            - preferred_skills: List of nice-to-have skills
        """
        prompt = f"""
You are an expert HR analyst. Analyze this job description and extract skills into two categories:

1. **REQUIRED SKILLS** - Must-have skills that are explicitly stated as required, mandatory, or essential
2. **PREFERRED SKILLS** - Nice-to-have skills that are mentioned as preferred, desirable, or a plus

IMPORTANT RULES:
1. Extract ONLY technical skills, tools, frameworks, programming languages, and methodologies
2. Do NOT include soft skills (communication, teamwork, etc.) unless they're highly specific technical certifications
3. Normalize skill names (e.g., "React.js" → "React", "Node" → "Node.js")
4. Include years of experience as a separate item if specified (e.g., "3+ years Python")
5. If a skill is mentioned without clear categorization, put it in PREFERRED
6. Be concise - extract 5-15 required skills and 5-10 preferred skills typically
7. Remove duplicates between required and preferred (keep in required if it appears in both)

Return ONLY valid JSON in this exact format:
{{
  "required_skills": ["skill1", "skill2", "skill3", ...],
  "preferred_skills": ["skill1", "skill2", "skill3", ...]
}}

Job Description:
{job_description}

Return ONLY the JSON object, no markdown, no explanation.
"""
        
        try:
            logger.info("📤 Extracting skills from job description using Gemini...")
            
            # Use key manager with retry logic
            result_text = self.key_manager.generate_content(
                prompt=prompt,
                model="gemini-2.5-flash",
                purpose="job_description_analysis",
                temperature=0.1,
                max_output_tokens=2000,
                max_retries=3
            )
            
            # Clean up markdown code blocks if present
            result_text = re.sub(r'^```json\s*', '', result_text)
            result_text = re.sub(r'^```\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)
            result_text = result_text.strip()
            
            # Parse JSON response
            extracted_data = json.loads(result_text)
            
            # Validate and clean data
            required_skills = extracted_data.get('required_skills', [])
            preferred_skills = extracted_data.get('preferred_skills', [])
            
            # Remove duplicates (case-insensitive)
            required_skills_lower = {s.lower(): s for s in required_skills}
            preferred_skills_cleaned = [
                s for s in preferred_skills 
                if s.lower() not in required_skills_lower
            ]
            
            result = {
                'required_skills': list(required_skills_lower.values()),
                'preferred_skills': preferred_skills_cleaned
            }
            
            logger.info(f"✅ Extracted {len(result['required_skills'])} required skills and {len(result['preferred_skills'])} preferred skills")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {e}")
            logger.error(f"Response text: {result_text}")
            # Return empty structure on error
            return {
                'required_skills': [],
                'preferred_skills': []
            }
        except Exception as e:
            logger.error(f"❌ Error extracting skills: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                'required_skills': [],
                'preferred_skills': []
            }
    
    def validate_and_enhance_skills(
        self, 
        required_skills: List[str], 
        preferred_skills: List[str]
    ) -> Dict[str, List[str]]:
        """
        Validate and enhance skill lists using Gemini AI
        - Normalize skill names
        - Remove duplicates
        - Categorize properly
        
        Args:
            required_skills: List of required skills (possibly user-edited)
            preferred_skills: List of preferred skills (possibly user-edited)
            
        Returns:
            Dictionary with validated and enhanced skill lists
        """
        prompt = f"""
You are an expert technical skill validator. Review and normalize these skill lists:

REQUIRED SKILLS:
{json.dumps(required_skills)}

PREFERRED SKILLS:
{json.dumps(preferred_skills)}

Tasks:
1. Normalize skill names (e.g., "react.js" → "React", "nodejs" → "Node.js")
2. Remove exact duplicates (case-insensitive)
3. If a skill appears in both lists, keep it ONLY in required_skills
4. Fix common misspellings
5. Merge similar skills (e.g., "JavaScript" and "JS" → "JavaScript")
6. Keep the lists concise but complete

Return ONLY valid JSON in this exact format:
{{
  "required_skills": ["skill1", "skill2", ...],
  "preferred_skills": ["skill1", "skill2", ...]
}}

Return ONLY the JSON object, no markdown, no explanation.
"""
        
        try:
            logger.info("📤 Validating and enhancing skills...")
            
            result_text = self.key_manager.generate_content(
                prompt=prompt,
                model="gemini-2.5-flash",
                purpose="skill_validation",
                temperature=0.1,
                max_output_tokens=1500,
                max_retries=3
            )
            
            # Clean up markdown
            result_text = re.sub(r'^```json\s*', '', result_text)
            result_text = re.sub(r'^```\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)
            result_text = result_text.strip()
            
            validated_data = json.loads(result_text)
            
            logger.info("✅ Skills validated and enhanced")
            return validated_data
            
        except Exception as e:
            logger.error(f"❌ Error validating skills: {e}")
            # Return original data on error
            return {
                'required_skills': required_skills,
                'preferred_skills': preferred_skills
            }


# Singleton instance
_job_description_analyzer = None

def get_job_description_analyzer() -> JobDescriptionAnalyzer:
    """Get singleton instance of JobDescriptionAnalyzer"""
    global _job_description_analyzer
    if _job_description_analyzer is None:
        _job_description_analyzer = JobDescriptionAnalyzer()
    return _job_description_analyzer
