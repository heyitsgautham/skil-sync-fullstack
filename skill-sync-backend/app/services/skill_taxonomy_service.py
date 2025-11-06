"""
Skill Taxonomy Service - Manages skill vocabulary and categorization
Provides fuzzy matching and skill standardization for job postings
"""

import json
import os
import logging
from typing import List, Dict, Optional, Set
from fuzzywuzzy import fuzz, process

logger = logging.getLogger(__name__)


class SkillTaxonomyService:
    """Service for managing skill taxonomy and matching"""
    
    def __init__(self):
        """Initialize skill taxonomy from JSON file"""
        self.skills = []
        self.skill_map = {}  # Normalized name -> skill data
        self.alias_map = {}  # Alias -> canonical name
        self.category_map = {}  # Category -> list of skills
        self._load_taxonomy()
        
    def _load_taxonomy(self):
        """Load skill taxonomy from JSON file"""
        try:
            # Get the path to the skill taxonomy file
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            taxonomy_path = os.path.join(base_dir, "data", "skill_taxonomy.json")
            
            with open(taxonomy_path, 'r') as f:
                data = json.load(f)
                self.skills = data.get("skills", [])
            
            # Build lookup maps
            for skill in self.skills:
                name = skill["name"]
                normalized = name.lower()
                
                # Store in skill map
                self.skill_map[normalized] = skill
                
                # Store aliases
                for alias in skill.get("aliases", []):
                    self.alias_map[alias.lower()] = name
                
                # Store by category
                category = skill.get("category", "Other")
                if category not in self.category_map:
                    self.category_map[category] = []
                self.category_map[category].append(name)
            
            logger.info(f"✅ Loaded {len(self.skills)} skills from taxonomy")
            logger.info(f"✅ Categories: {list(self.category_map.keys())}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load skill taxonomy: {str(e)}")
            self.skills = []
    
    def find_skill_matches(self, text: str, min_confidence: float = 0.75) -> List[Dict]:
        """
        Find skills mentioned in text using fuzzy matching
        
        Args:
            text: Text to search for skills
            min_confidence: Minimum confidence threshold (0-1)
            
        Returns:
            List of matched skills with confidence scores
        """
        if not text:
            return []
        
        text_lower = text.lower()
        matches = []
        matched_names = set()
        
        # First pass: Exact matches (including aliases)
        for skill in self.skills:
            skill_name = skill["name"]
            skill_lower = skill_name.lower()
            
            # Check exact match
            if skill_lower in text_lower:
                if skill_name not in matched_names:
                    matches.append({
                        "skill": skill_name,
                        "category": skill["category"],
                        "confidence": 1.0,
                        "match_type": "exact"
                    })
                    matched_names.add(skill_name)
                    continue
            
            # Check aliases
            for alias in skill.get("aliases", []):
                if alias.lower() in text_lower:
                    if skill_name not in matched_names:
                        matches.append({
                            "skill": skill_name,
                            "category": skill["category"],
                            "confidence": 0.95,
                            "match_type": "alias"
                        })
                        matched_names.add(skill_name)
                        break
        
        # Second pass: Fuzzy matching for remaining skills
        words = text_lower.split()
        phrases = []
        
        # Generate 1-3 word phrases
        for i in range(len(words)):
            phrases.append(words[i])
            if i < len(words) - 1:
                phrases.append(f"{words[i]} {words[i+1]}")
            if i < len(words) - 2:
                phrases.append(f"{words[i]} {words[i+1]} {words[i+2]}")
        
        for skill in self.skills:
            skill_name = skill["name"]
            if skill_name in matched_names:
                continue
            
            skill_lower = skill_name.lower()
            
            # Check fuzzy match against phrases
            for phrase in phrases:
                ratio = fuzz.ratio(phrase, skill_lower) / 100.0
                if ratio >= min_confidence:
                    matches.append({
                        "skill": skill_name,
                        "category": skill["category"],
                        "confidence": ratio,
                        "match_type": "fuzzy"
                    })
                    matched_names.add(skill_name)
                    break
        
        # Sort by confidence (descending)
        matches.sort(key=lambda x: x["confidence"], reverse=True)
        
        return matches
    
    def categorize_skill(self, skill_name: str) -> Optional[str]:
        """
        Get the category of a skill
        
        Args:
            skill_name: Name of the skill
            
        Returns:
            Category name or None if not found
        """
        normalized = skill_name.lower()
        
        # Check direct match
        if normalized in self.skill_map:
            return self.skill_map[normalized]["category"]
        
        # Check alias match
        if normalized in self.alias_map:
            canonical_name = self.alias_map[normalized]
            return self.skill_map[canonical_name.lower()]["category"]
        
        return None
    
    def get_skill_aliases(self, skill_name: str) -> List[str]:
        """
        Get all aliases for a skill
        
        Args:
            skill_name: Name of the skill
            
        Returns:
            List of aliases
        """
        normalized = skill_name.lower()
        
        # Check direct match
        if normalized in self.skill_map:
            return self.skill_map[normalized].get("aliases", [])
        
        # Check alias match
        if normalized in self.alias_map:
            canonical_name = self.alias_map[normalized]
            return self.skill_map[canonical_name.lower()].get("aliases", [])
        
        return []
    
    def normalize_skill_name(self, skill_name: str) -> str:
        """
        Normalize a skill name to its canonical form
        
        Args:
            skill_name: Name or alias of the skill
            
        Returns:
            Canonical skill name
        """
        normalized = skill_name.lower()
        
        # Check if it's already canonical
        if normalized in self.skill_map:
            return self.skill_map[normalized]["name"]
        
        # Check if it's an alias
        if normalized in self.alias_map:
            return self.alias_map[normalized]
        
        # Return as-is if not found (with title case)
        return skill_name.title()
    
    def get_skills_by_category(self, category: str) -> List[str]:
        """
        Get all skills in a category
        
        Args:
            category: Category name
            
        Returns:
            List of skill names
        """
        return self.category_map.get(category, [])
    
    def get_all_categories(self) -> List[str]:
        """Get all available categories"""
        return list(self.category_map.keys())
    
    def is_valid_skill(self, skill_name: str) -> bool:
        """
        Check if a skill name is in the taxonomy
        
        Args:
            skill_name: Name of the skill
            
        Returns:
            True if skill exists in taxonomy
        """
        normalized = skill_name.lower()
        return normalized in self.skill_map or normalized in self.alias_map


# Singleton instance
_taxonomy_service = None


def get_skill_taxonomy_service() -> SkillTaxonomyService:
    """Get singleton instance of skill taxonomy service"""
    global _taxonomy_service
    if _taxonomy_service is None:
        _taxonomy_service = SkillTaxonomyService()
    return _taxonomy_service
