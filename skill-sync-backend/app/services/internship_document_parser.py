"""
Internship Document Parser Service
Extracts internship details from uploaded documents (PDF, DOCX, TXT, etc.)
Uses Google Gemini AI for intelligent extraction
"""

import os
import json
import re
import logging
from typing import Dict, List, Optional
import fitz  # PyMuPDF
from docx import Document

from app.utils.gemini_key_manager import get_gemini_key_manager

logger = logging.getLogger(__name__)


class InternshipDocumentParser:
    """
    Service for parsing internship job description documents
    Supports PDF, DOCX, DOC, and TXT formats
    """
    
    def __init__(self):
        """Initialize Gemini AI key manager for intelligent extraction"""
        self.key_manager = get_gemini_key_manager()
        logger.info("✅ InternshipDocumentParser initialized with GeminiKeyManager")
    
    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        """
        Extract text from document file (PDF, DOCX, or TXT)
        
        Args:
            file_path: Path to the document file
            
        Returns:
            Extracted text content
        """
        file_extension = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_extension == '.pdf':
                return InternshipDocumentParser._extract_from_pdf(file_path)
            elif file_extension in ['.docx', '.doc']:
                return InternshipDocumentParser._extract_from_docx(file_path)
            elif file_extension == '.txt':
                return InternshipDocumentParser._extract_from_txt(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}. Supported: PDF, DOCX, DOC, TXT")
        except Exception as e:
            logger.error(f"  Error extracting text from {file_extension}: {e}")
            raise Exception(f"Failed to extract text from document: {str(e)}")
    
    @staticmethod
    def _extract_from_pdf(file_path: str) -> str:
        """Extract text from PDF using PyMuPDF"""
        try:
            text = ""
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text()
            return text.strip()
        except Exception as e:
            raise Exception(f"Error reading PDF: {str(e)}")
    
    @staticmethod
    def _extract_from_docx(file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            raise Exception(f"Error reading DOCX: {str(e)}")
    
    @staticmethod
    def _extract_from_txt(file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            return text.strip()
        except Exception as e:
            raise Exception(f"Error reading TXT: {str(e)}")
    
    def extract_internship_details(self, document_text: str) -> Dict:
        """
        Extract structured internship information from document text using Gemini AI
        
        Args:
            document_text: Raw text extracted from document
            
        Returns:
            Dictionary with internship details:
            - title: Job title/position
            - description: Full job description
            - required_skills: Empty array (skills should be manually added)
            - preferred_skills: Empty array (skills should be manually added)
            - location: Work location (city/remote/hybrid)
            - duration: Internship duration (e.g., "3 months", "Summer 2025")
            - stipend: Stipend/compensation information
            - min_experience: Minimum years of experience
            - max_experience: Maximum years of experience
            - required_education: Required education level
            - start_date: Expected start date
            - application_deadline: Application deadline
            - company_info: Brief company description if mentioned
            
        Note: Skills are NOT automatically extracted to ensure accuracy.
              Companies should manually input required and preferred skills.
        """
        prompt = f"""
You are an expert job description analyzer. Extract structured internship information from this document.

IMPORTANT RULES:
1. Extract the job TITLE/POSITION (e.g., "Software Engineering Intern", "Data Science Intern")
2. Extract FULL job DESCRIPTION (include responsibilities, qualifications, benefits)
3. DO NOT extract or categorize skills - leave required_skills and preferred_skills as empty arrays
4. Extract LOCATION (city, remote, hybrid, on-site)
5. Extract DURATION (e.g., "3 months", "6 months", "Summer 2025", "Jan-May 2025")
6. Extract STIPEND/COMPENSATION (monthly amount, total amount, or "Unpaid" if not mentioned)
7. Extract experience requirements in YEARS (0 for entry-level)
8. Extract required EDUCATION level (e.g., "Bachelor's in Computer Science", "Currently pursuing degree")
9. Extract START DATE and APPLICATION DEADLINE if mentioned
10. If information is not found, use null (not empty string)

Return ONLY valid JSON in this exact format:
{{
  "title": "Job Title",
  "description": "Full job description with responsibilities and qualifications",
  "required_skills": [],
  "preferred_skills": [],
  "location": "City, State or Remote or Hybrid",
  "duration": "Duration string (e.g., '3 months', 'Summer 2025')",
  "stipend": "Compensation details or 'Unpaid' or null",
  "min_experience": 0,
  "max_experience": 2,
  "required_education": "Education requirement or null",
  "start_date": "YYYY-MM-DD or null",
  "application_deadline": "YYYY-MM-DD or null",
  "company_info": "Brief company description if mentioned or null"
}}

Document Text:
{document_text}

Return ONLY the JSON object, no markdown, no explanation.
"""
        
        try:
            logger.info("📤 Extracting internship details using Gemini AI...")
            
            # Use key manager with retry logic
            result_text = self.key_manager.generate_content(
                prompt=prompt,
                model="gemini-2.5-flash",
                purpose="internship_parsing",
                temperature=0.1,
                max_output_tokens=8000,
                max_retries=3
            )
            
            # Clean up markdown code blocks if present
            result_text = re.sub(r'^```json\s*', '', result_text)
            result_text = re.sub(r'^```\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)
            result_text = result_text.strip()
            
            logger.info(f"📝 AI Response: {result_text[:300]}...")
            
            structured_data = json.loads(result_text)
            
            # Validate and set defaults
            structured_data = self._validate_and_normalize(structured_data, document_text)
            
            # Force empty skills arrays (skills should be manually added by user)
            structured_data['required_skills'] = []
            structured_data['preferred_skills'] = []
            
            logger.info(f"✅ Extracted internship: '{structured_data.get('title')}' (skills extraction skipped - will be manually added)")
            return structured_data
            
        except json.JSONDecodeError as e:
            logger.error(f"  JSON parsing error: {e}")
            logger.error(f"Response text: {result_text if 'result_text' in locals() else 'N/A'}")
            # Return fallback structure with original text
            return self._create_fallback_structure(document_text)
        except Exception as e:
            logger.error(f"  Error in internship extraction: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return self._create_fallback_structure(document_text)
    
    def _validate_and_normalize(self, data: Dict, original_text: str) -> Dict:
        """
        Validate and normalize extracted data
        
        Args:
            data: Extracted structured data
            original_text: Original document text
            
        Returns:
            Validated and normalized data
        """
        # Ensure title is present (required field)
        if not data.get('title') or len(str(data.get('title', '')).strip()) < 3:
            # Try to extract from first line or heading
            lines = original_text.split('\n')
            title = "Internship Position"
            for line in lines[:5]:  # Check first 5 lines
                line = line.strip()
                if line and len(line) > 5 and len(line) < 100:
                    # Likely a title if it's short and at the top
                    if any(keyword in line.lower() for keyword in ['intern', 'position', 'role', 'opportunity']):
                        title = line
                        break
            data['title'] = title
        
        # Ensure description is present (use original text if not extracted)
        if not data.get('description') or len(str(data.get('description', '')).strip()) < 50:
            data['description'] = original_text[:2000]  # Use first 2000 chars as description
        
        # Ensure skills are lists
        if not isinstance(data.get('required_skills'), list):
            data['required_skills'] = []
        if not isinstance(data.get('preferred_skills'), list):
            data['preferred_skills'] = []
        
        # Remove duplicates from skills (case-insensitive)
        required_lower = {s.lower(): s for s in data['required_skills']}
        data['required_skills'] = list(required_lower.values())
        
        # Remove preferred skills that are already in required
        data['preferred_skills'] = [
            s for s in data['preferred_skills'] 
            if s.lower() not in required_lower
        ]
        
        # Normalize experience values
        data['min_experience'] = float(data.get('min_experience', 0) or 0)
        data['max_experience'] = float(data.get('max_experience', 5) or 5)
        
        # Ensure max >= min
        if data['max_experience'] < data['min_experience']:
            data['max_experience'] = data['min_experience'] + 2
        
        # Clean up null vs None
        for key in ['location', 'duration', 'stipend', 'required_education', 
                    'start_date', 'application_deadline', 'company_info']:
            if data.get(key) == 'null' or data.get(key) == '':
                data[key] = None
        
        return data
    
    def _create_fallback_structure(self, document_text: str) -> Dict:
        """
        Create a fallback structure when AI parsing fails
        Uses basic text extraction
        """
        # Try to extract title from first meaningful line
        lines = document_text.split('\n')
        title = "Internship Position"
        for line in lines[:10]:
            line = line.strip()
            if line and len(line) > 5 and len(line) < 100:
                if any(keyword in line.lower() for keyword in ['intern', 'position', 'role']):
                    title = line
                    break
        
        logger.warning("⚠️ Using fallback structure - AI parsing failed (skills will be manually added)")
        
        return {
            "title": title,
            "description": document_text[:2000],  # Use first 2000 chars
            "required_skills": [],  # No auto-extraction, manual input required
            "preferred_skills": [],
            "location": None,
            "duration": None,
            "stipend": None,
            "min_experience": 0,
            "max_experience": 2,
            "required_education": None,
            "start_date": None,
            "application_deadline": None,
            "company_info": None,
            "parsing_status": "fallback"
        }
    
    def _extract_skills_basic(self, text: str) -> List[str]:
        """
        Basic skill extraction using keyword matching (fallback method)
        """
        skill_patterns = {
            'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust',
            'React', 'Angular', 'Vue.js', 'Node.js', 'Django', 'Flask', 'Spring',
            'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
            'Git', 'CI/CD', 'REST API', 'GraphQL', 'Microservices',
            'Machine Learning', 'Deep Learning', 'NLP', 'AI',
            'HTML', 'CSS', 'Tailwind', 'Bootstrap'
        }
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in skill_patterns:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return found_skills[:20]  # Limit to 20 skills
    
    def parse_from_file(self, file_path: str) -> Dict:
        """
        Complete parsing pipeline: extract text + parse internship details
        
        Args:
            file_path: Path to the internship document file
            
        Returns:
            Dictionary with complete internship details
        """
        logger.info(f"📄 Starting document parsing for: {file_path}")
        
        # Step 1: Extract text from file
        document_text = self.extract_text_from_file(file_path)
        logger.info(f"✅ Extracted {len(document_text)} characters from document")
        
        if len(document_text) < 50:
            raise ValueError("Document is too short or empty. Please provide a valid job description.")
        
        # Step 2: Extract structured internship details
        internship_details = self.extract_internship_details(document_text)
        
        # Add the original text for reference
        internship_details['original_document_text'] = document_text
        
        logger.info(f"🎉 Document parsing complete!")
        return internship_details


# Singleton instance
_internship_document_parser = None

def get_internship_document_parser() -> InternshipDocumentParser:
    """Get singleton instance of InternshipDocumentParser"""
    global _internship_document_parser
    if _internship_document_parser is None:
        _internship_document_parser = InternshipDocumentParser()
    return _internship_document_parser
