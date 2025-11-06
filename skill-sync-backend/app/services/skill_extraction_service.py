"""
Skill Extraction Service - AI-powered skill extraction from job descriptions
Uses Gemini API to extract and categorize skills from job postings
"""

import json
import logging
import re
from typing import List, Dict, Optional, Tuple
from google.genai import types
from app.utils.gemini_key_manager import get_gemini_key_manager
from app.services.skill_taxonomy_service import get_skill_taxonomy_service

logger = logging.getLogger(__name__)


class SkillExtractionService:
    """Service for extracting skills from job descriptions using AI"""
    
    def __init__(self):
        """Initialize skill extraction service"""
        self.key_manager = get_gemini_key_manager()
        self.taxonomy_service = get_skill_taxonomy_service()
    
    def extract_skills_from_description(
        self, 
        title: str, 
        description: str, 
        num_suggestions: int = 15
    ) -> List[Dict]:
        """
        Extract skills from job title and description using Gemini AI
        
        Args:
            title: Job title
            description: Job description text
            num_suggestions: Maximum number of skills to extract
            
        Returns:
            List of skills with confidence scores, categories, and text spans
        """
        try:
            # Prepare the prompt
            prompt = self._build_extraction_prompt(title, description, num_suggestions)
            
            # Get Gemini client
            client = self.key_manager.get_client(purpose="skills_extraction")
            
            # Generate skills using Gemini
            logger.info(f"🔍 Extracting skills from job: {title}")
            
            # Define JSON schema for structured output
            response_schema = {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "skill": {"type": "string"},
                        "category": {"type": "string"},
                        "confidence": {"type": "number"},
                        "span": {
                            "type": "array",
                            "items": {"type": "integer"},
                            "minItems": 2,
                            "maxItems": 2
                        }
                    },
                    "required": ["skill", "category", "confidence", "span"]
                }
            }
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",  # Updated to current production model
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,  # Lower temperature for more consistent results
                    top_p=0.8,
                    top_k=40,
                    response_mime_type="application/json",
                    response_schema=response_schema  # Enforce JSON structure
                )
            )
            
            # Parse the response
            skills = self._parse_gemini_response(response.text, description)
            
            # Validate and enrich skills using taxonomy
            enriched_skills = self._enrich_with_taxonomy(skills)
            
            # Sort by confidence and limit to num_suggestions
            enriched_skills.sort(key=lambda x: x["confidence"], reverse=True)
            enriched_skills = enriched_skills[:num_suggestions]
            
            logger.info(f"✅ Extracted {len(enriched_skills)} skills")
            return enriched_skills
            
        except Exception as e:
            logger.error(f"❌ Skill extraction failed: {str(e)}")
            # Fallback to taxonomy-based extraction
            return self._fallback_extraction(description, num_suggestions)
    
    def _build_extraction_prompt(self, title: str, description: str, num_suggestions: int) -> str:
        """Build the Gemini prompt for skill extraction"""
        return f"""Extract up to {num_suggestions} relevant technical and soft skills from this job posting.

Job Title: {title}

Job Description:
{description}

Instructions:
1. Identify both hard skills (technical: programming languages, frameworks, tools) and soft skills (communication, teamwork, etc.)
2. For each skill, provide:
   - skill: The skill name (use standard names like "React" not "React.js")
   - category: "tech" for technical skills or "soft" for soft skills
   - confidence: A score from 0.0 to 1.0 indicating how clearly the skill is mentioned
   - span: The start and end character positions where the skill appears in the description (approximate)
3. Prioritize skills that are explicitly mentioned or strongly implied
4. Use confidence scoring:
   - 1.0 = Explicitly mentioned with exact name
   - 0.8-0.9 = Clearly mentioned but paraphrased
   - 0.6-0.7 = Strongly implied by context
   - Below 0.6 = Weakly implied

Return ONLY valid JSON in this exact format (no markdown, no explanations):
[
  {{"skill": "React", "category": "tech", "confidence": 0.95, "span": [145, 150]}},
  {{"skill": "Communication", "category": "soft", "confidence": 0.80, "span": [320, 333]}}
]"""
    
    def _parse_gemini_response(self, response_text: str, description: str) -> List[Dict]:
        """Parse Gemini's JSON response"""
        try:
            # With response_schema, the output is guaranteed to be valid JSON
            # No need for manual cleanup of markdown code blocks
            skills = json.loads(response_text)
            
            # Validate structure
            if not isinstance(skills, list):
                logger.warning("⚠️  Invalid response format, expected list")
                return []
            
            # Validate and fix each skill entry
            validated_skills = []
            for skill in skills:
                if not isinstance(skill, dict):
                    continue
                
                # Required fields
                if "skill" not in skill or "category" not in skill:
                    continue
                
                # Add defaults for missing fields
                if "confidence" not in skill:
                    skill["confidence"] = 0.7
                
                if "span" not in skill or not isinstance(skill["span"], list) or len(skill["span"]) != 2:
                    # Try to find the skill in the description
                    skill_name = skill["skill"].lower()
                    desc_lower = description.lower()
                    pos = desc_lower.find(skill_name)
                    if pos >= 0:
                        skill["span"] = [pos, pos + len(skill_name)]
                    else:
                        skill["span"] = [0, 0]
                
                validated_skills.append(skill)
            
            return validated_skills
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse Gemini response as JSON: {str(e)}")
            logger.error(f"Response text: {response_text[:500]}")
            return []
        except Exception as e:
            logger.error(f"❌ Error parsing Gemini response: {str(e)}")
            return []
    
    def _enrich_with_taxonomy(self, skills: List[Dict]) -> List[Dict]:
        """Enrich extracted skills with taxonomy information"""
        enriched = []
        
        for skill in skills:
            skill_name = skill.get("skill", "")
            
            # Normalize skill name using taxonomy
            normalized_name = self.taxonomy_service.normalize_skill_name(skill_name)
            
            # Get category from taxonomy (if available)
            taxonomy_category = self.taxonomy_service.categorize_skill(normalized_name)
            
            # Map category
            if taxonomy_category:
                # Use taxonomy category (more detailed)
                category = taxonomy_category
            else:
                # Use AI-provided category
                ai_category = skill.get("category", "tech")
                category = "Soft Skills" if ai_category == "soft" else "Other"
            
            enriched.append({
                "skill": normalized_name,
                "original_name": skill_name,
                "category": category,
                "confidence": skill.get("confidence", 0.7),
                "span": skill.get("span", [0, 0]),
                "in_taxonomy": self.taxonomy_service.is_valid_skill(skill_name)
            })
        
        return enriched
    
    def _fallback_extraction(self, description: str, num_suggestions: int) -> List[Dict]:
        """Fallback extraction using taxonomy-based matching"""
        logger.info("⚠️  Using fallback taxonomy-based extraction")
        
        matches = self.taxonomy_service.find_skill_matches(description, min_confidence=0.75)
        
        # Convert to expected format
        skills = []
        for match in matches[:num_suggestions]:
            # Find span in description
            skill_lower = match["skill"].lower()
            desc_lower = description.lower()
            pos = desc_lower.find(skill_lower)
            span = [pos, pos + len(skill_lower)] if pos >= 0 else [0, 0]
            
            skills.append({
                "skill": match["skill"],
                "original_name": match["skill"],
                "category": match["category"],
                "confidence": match["confidence"],
                "span": span,
                "in_taxonomy": True
            })
        
        return skills
    
    def highlight_skills_in_text(self, description: str, extracted_skills: List[Dict]) -> str:
        """
        Generate HTML with highlighted skills
        
        Args:
            description: Original job description
            extracted_skills: List of extracted skills with spans
            
        Returns:
            HTML string with highlighted skills
        """
        try:
            # Sort skills by span start position (reverse to avoid position shifts)
            sorted_skills = sorted(extracted_skills, key=lambda x: x["span"][0], reverse=True)
            
            # Build HTML
            html = description
            
            for skill in sorted_skills:
                span = skill["span"]
                confidence = skill["confidence"]
                skill_name = skill["skill"]
                
                # Skip if span is invalid
                if span[0] < 0 or span[1] > len(description) or span[0] >= span[1]:
                    continue
                
                # Determine CSS class based on confidence
                if confidence > 0.8:
                    css_class = "skill-highlight-high"
                elif confidence > 0.6:
                    css_class = "skill-highlight-medium"
                else:
                    css_class = "skill-highlight-low"
                
                # Get the text to highlight
                original_text = html[span[0]:span[1]]
                
                # Create highlighted version
                highlighted = f'<mark class="{css_class}" data-skill="{skill_name}" data-confidence="{confidence:.2f}">{original_text}</mark>'
                
                # Replace in HTML
                html = html[:span[0]] + highlighted + html[span[1]:]
            
            return html
            
        except Exception as e:
            logger.error(f"❌ Failed to highlight skills: {str(e)}")
            return description
    
    def categorize_extracted_skills(
        self, 
        skills: List[Dict], 
        required_threshold: float = 0.8
    ) -> Dict[str, List[str]]:
        """
        Categorize skills into must-have and preferred based on confidence
        
        Args:
            skills: List of extracted skills
            required_threshold: Confidence threshold for must-have skills
            
        Returns:
            Dictionary with 'must_have' and 'preferred' skill lists
        """
        must_have = []
        preferred = []
        
        for skill in skills:
            skill_name = skill["skill"]
            confidence = skill["confidence"]
            
            if confidence >= required_threshold:
                must_have.append(skill_name)
            elif confidence >= 0.6:
                preferred.append(skill_name)
        
        return {
            "must_have": must_have,
            "preferred": preferred
        }


# Singleton instance
_extraction_service = None


def get_skill_extraction_service() -> SkillExtractionService:
    """Get singleton instance of skill extraction service"""
    global _extraction_service
    if _extraction_service is None:
        _extraction_service = SkillExtractionService()
    return _extraction_service
