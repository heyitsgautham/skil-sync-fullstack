# SkillSync Backend - Copilot Instructions

## Project Overview
SkillSync is an intelligent internship matching platform that connects students with companies using AI-powered recommendations. The system uses RAG (Retrieval-Augmented Generation) with LLM to analyze student resumes and internship postings for optimal matching.

## Tech Stack
- **Backend Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI/ML**: Google Gemini API (gemini-2.5-flash/gemini-2.5-pro), RAG with ChromaDB
- **Authentication**: JWT-based auth with role-based access control
- **Embeddings**: ChromaDB for vector storage and semantic search

## Key Features
- **Student Management**: Profile creation, resume uploads, skill tracking, application management
- **Company Management**: Internship posting, student recommendations, applicant shortlisting
- **Admin Dashboard**: User management, analytics, RAG system controls
- **AI Matching Engine**: Resume parsing, skill extraction, semantic matching using RAG

## User Roles
1. **Student**: Register, build profile, apply for internships, receive AI recommendations
2. **Company**: Post internships, view matched candidates, manage applications
3. **Admin**: User management, system oversight, analytics, RAG maintenance

## Code Guidelines
- Follow RESTful API conventions
- Implement proper error handling and validation
- Use async/await for asynchronous operations
- Maintain clear separation of concerns (routes, controllers, services, models)
- Document API endpoints with clear comments
- Implement proper authentication and authorization middleware
- Write clean, maintainable code with meaningful variable names

## API Structure
- `/api/auth` - Authentication endpoints
- `/api/students` - Student profile and application management
- `/api/companies` - Company and internship management
- `/api/admin` - Admin operations and analytics
- `/api/recommendations` - AI-powered matching endpoints

## Security
- Validate all user inputs
- Implement rate limiting
- Secure file uploads (resume handling)
- Use environment variables for sensitive data
- Implement RBAC for all protected routes

## Google Gemini API Guidelines

### Model Selection
**ALWAYS use production-ready models:**
- **Primary Model**: `gemini-2.5-flash` - Fast, cost-effective, suitable for most tasks
- **Advanced Model**: `gemini-2.5-pro` - More powerful, use for complex reasoning tasks
- **NEVER use**: Experimental models (e.g., `gemini-2.0-flash-exp`) - they are outdated and unreliable

**When to use which model:**
- `gemini-2.5-flash`: Skill extraction, resume parsing, quick classifications, explanations
- `gemini-2.5-pro`: Complex reasoning, multi-step analysis, critical decision-making

### Structured Output (Critical)
**ALWAYS use `response_schema` for guaranteed valid JSON output:**

```python
from google import genai
from google.genai import types

# Define schema for structured output
response_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "skill": {"type": "string"},
            "confidence": {"type": "number"},
            "category": {"type": "string"}
        },
        "required": ["skill", "confidence", "category"]
    }
}

# Use in API call
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
        temperature=0.3,
        response_mime_type="application/json",
        response_schema=response_schema  # This guarantees valid JSON
    )
)

# Parse directly - no cleanup needed
data = json.loads(response.text)
```

**Benefits of structured output:**
- ✅ Guarantees valid JSON (99.9% reliability vs 95% with manual parsing)
- ✅ Eliminates need for markdown cleanup code
- ✅ Reduces code complexity (~40 lines saved per service)
- ✅ Better error handling and debugging
- ✅ Type-safe responses

### Configuration Best Practices

**Temperature settings:**
- `0.1-0.3`: Structured data extraction (skills, facts, classifications)
- `0.5-0.7`: Creative content generation (recommendations, explanations)
- `0.8-1.0`: Highly creative tasks (NOT recommended for our use case)

**Standard configuration template:**
```python
config = types.GenerateContentConfig(
    temperature=0.3,  # Adjust based on task
    response_mime_type="application/json",
    response_schema=response_schema,  # Always include for JSON
    max_output_tokens=2048,  # Adjust based on expected response size
    top_p=0.95,  # Keep default
    top_k=40  # Keep default
)
```

### API Key Management
- Use `GeminiKeyManager` singleton for automatic key rotation
- Store multiple API keys in environment variables: `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`
- Keys rotate automatically on rate limit (429) errors
- Never hardcode API keys in code

### Error Handling
```python
try:
    response = client.models.generate_content(...)
    data = json.loads(response.text)
except json.JSONDecodeError as e:
    logger.error(f"JSON parsing failed: {e}")
    # With response_schema, this should rarely happen
    return fallback_response
except Exception as e:
    logger.error(f"Gemini API error: {e}")
    # Implement fallback logic
    return fallback_response
```

### Prompt Engineering Best Practices

**1. Be specific and structured:**
```python
prompt = f"""
Task: Extract technical skills from the job description.

Job Title: {title}
Description: {description}

Requirements:
1. Identify ONLY technical skills (programming languages, frameworks, tools)
2. Assign confidence score 0.0-1.0 based on explicitness
3. Categorize each skill (Frontend, Backend, Database, etc.)
4. Extract exact text span [start, end] where skill appears

Output format: JSON array of objects with fields: skill, confidence, category, span
"""
```

**2. Provide examples in prompt for better results:**
```python
prompt = f"""
Task: Classify candidate recommendation.

Example:
- Input: Strong Python skills, 2 years experience, matches 80% requirements
- Output: {{"action": "SHORTLIST", "priority": "high", "justification": "..."}}

Now classify this candidate:
{candidate_details}
"""
```

**3. Use system instructions for consistency:**
```python
system_instruction = """
You are an expert technical recruiter analyzing candidates for software engineering roles.
Always be objective, fair, and focus on skills and qualifications.
Provide specific evidence for your assessments.
"""

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
    config=config,
    system_instruction=system_instruction
)
```

### Response Parsing (with structured output)

**DO THIS (with response_schema):**
```python
# Direct parsing - schema guarantees validity
data = json.loads(response.text)
skills = data  # Already in correct format
```

**DON'T DO THIS (manual cleanup - unnecessary with response_schema):**
```python
# ❌ AVOID: Manual markdown cleanup (obsolete with response_schema)
text = response.text.strip()
text = re.sub(r'^```json\s*', '', text)
text = re.sub(r'\s*```$', '', text)
data = json.loads(text)
```

### Common Patterns

**Pattern 1: Skill Extraction**
```python
response_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "skill": {"type": "string"},
            "confidence": {"type": "number"},
            "category": {"type": "string"}
        },
        "required": ["skill", "confidence", "category"]
    }
}
```

**Pattern 2: Classification with Explanation**
```python
response_schema = {
    "type": "object",
    "properties": {
        "action": {"type": "string", "enum": ["SHORTLIST", "MAYBE", "REJECT"]},
        "priority": {"type": "string", "enum": ["high", "medium", "low"]},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "concerns": {"type": "array", "items": {"type": "string"}},
        "justification": {"type": "string"}
    },
    "required": ["action", "priority", "strengths", "concerns", "justification"]
}
```

**Pattern 3: Evidence Extraction**
```python
response_schema = {
    "type": "object",
    "properties": {
        "skill": {"type": "string"},
        "evidence": {"type": "string"},
        "context": {"type": "string"},
        "confidence": {"type": "number"}
    },
    "required": ["skill", "evidence", "context", "confidence"]
}
```

### Performance Optimization
- **Batch requests** when possible (multiple candidates)
- **Cache responses** for identical inputs (use content hash)
- **Implement timeouts** (30-60 seconds for most requests)
- **Use async/await** for concurrent API calls
- **Monitor API usage** and implement rate limiting

### Testing Gemini Integration
```python
# Always test with real API calls in test scripts
def test_skill_extraction():
    service = SkillExtractionService()
    result = service.extract_skills_from_description(
        title="Backend Developer",
        description="Python, Django, PostgreSQL...",
        num_suggestions=10
    )
    assert len(result["skills"]) > 0
    assert all(0 <= s["confidence"] <= 1 for s in result["skills"])
    assert result["metadata"]["model"] == "gemini-2.5-flash"
```

### Migration Checklist (When updating Gemini code)
- [ ] Update model name to `gemini-2.5-flash` or `gemini-2.5-pro`
- [ ] Add `response_schema` to GenerateContentConfig
- [ ] Set `response_mime_type="application/json"`
- [ ] Remove manual markdown cleanup code
- [ ] Simplify JSON parsing to direct `json.loads()`
- [ ] Update metadata to reference correct model
- [ ] Test with real API calls
- [ ] Update documentation

### Current Implementation Status
**Services using Gemini:**
1. `app/services/skill_extraction_service.py` - Skill extraction from job descriptions
2. `app/services/provenance_service.py` - Evidence extraction from resumes (3 methods)
3. `app/services/match_explanation_service.py` - AI recommendations for candidates

**All services updated to:**
- ✅ Use `gemini-2.5-flash` model
- ✅ Implement structured output with `response_schema`
- ✅ Remove manual JSON cleanup code
- ✅ Achieve 99.9% reliability in JSON parsing

# SkillSync Frontend - Copilot Instructions

## Project Overview
SkillSync is an intelligent internship matching platform that connects students with companies using AI-powered recommendations. This is the frontend application that provides the user interface for students, companies, and administrators.

## Tech Stack
- **Frontend Framework**: React/Vue/Angular (TBD)
- **UI Library**: Material-UI/Ant Design/Tailwind CSS (TBD)
- **State Management**: Redux/Vuex/Context API (TBD)
- **HTTP Client**: Axios/Fetch API
- **Routing**: React Router/Vue Router/Angular Router
- **Form Handling**: React Hook Form/Formik/VeeValidate
- **Authentication**: JWT tokens stored securely

## Key Features
- **Student Portal**: Profile management, resume upload, internship search, application tracking, AI recommendations
- **Company Portal**: Internship posting, candidate viewing, application management, shortlisting
- **Admin Dashboard**: User management, analytics, system monitoring
- **Responsive Design**: Mobile-first approach for all user roles

## User Roles & Routes
1. **Student**: `/student/*` - Profile, applications, recommendations, search
2. **Company**: `/company/*` - Post internships, view candidates, manage applications
3. **Admin**: `/admin/*` - User management, analytics, system settings
4. **Public**: `/`, `/login`, `/register`, `/about`

## Code Guidelines
- Follow component-based architecture
- Use functional components with hooks (for React)
- Implement proper prop validation (PropTypes/TypeScript)
- Keep components small and focused (Single Responsibility Principle)
- Use meaningful component and variable names
- Implement proper error boundaries
- Follow accessibility best practices (ARIA labels, semantic HTML)
- Use CSS modules or styled-components for component styling
- Maintain consistent folder structure and naming conventions

## Component Structure
```
src/
├── components/          # Reusable components
│   ├── common/         # Buttons, inputs, cards, etc.
│   ├── layout/         # Header, footer, sidebar
│   └── features/       # Feature-specific components
├── pages/              # Page components (route handlers)
├── services/           # API calls and business logic
├── hooks/              # Custom hooks
├── context/            # Context providers
├── utils/              # Helper functions
├── constants/          # Constants and configurations
├── assets/             # Images, fonts, static files
└── styles/             # Global styles and themes
```

## API Integration
- Base API URL: `http://localhost:8000` (development)
- All API calls should go through service layer
- Implement proper error handling for API calls
- Use interceptors for authentication tokens
- Handle loading and error states in components

## API Endpoints
- `/api/auth/*` - Authentication endpoints
- `/api/students/*` - Student operations
- `/api/companies/*` - Company operations
- `/api/internships/*` - Internship management
- `/api/recommendations/*` - AI recommendations
- `/api/admin/*` - Admin operations

## Security
- Never store sensitive data in localStorage (use httpOnly cookies for tokens)
- Validate all user inputs on the frontend
- Sanitize user-generated content before rendering
- Implement proper CORS handling
- Use environment variables for API URLs and keys
- Implement route guards for protected routes
- Handle authentication token expiration gracefully

## State Management
- Keep global state minimal
- Use local state for component-specific data
- Implement proper loading and error states
- Cache API responses when appropriate
- Clear sensitive data on logout

## Styling Guidelines
- Use consistent spacing and typography
- Implement responsive breakpoints (mobile, tablet, desktop)
- Follow a consistent color scheme and design system
- Use CSS variables for theme management
- Ensure proper contrast ratios for accessibility
- Optimize images and assets

## General Rules
- Ensure code is modular, reusable, and simple to understand
- Write unit tests for critical components and utilities
- Don't create any .md files unless specifically instructed
- Never start a development server or kill a server, I will handle that
- Never change the application ports or API configurations
- Create all utility scripts inside the scripts/ directory
- Create all test files inside the tests/ or __tests__/ directory
- Never push anything directly to main branch, always create a new branch for changes and raise a PR
- Comment complex logic and business rules
- Use meaningful commit messages following conventional commits

## Performance
- Implement code splitting and lazy loading for routes
- Optimize bundle size (tree shaking, minification)
- Use React.memo/useMemo/useCallback to prevent unnecessary re-renders
- Implement pagination for large lists
- Optimize images (use WebP, lazy loading)
- Implement proper caching strategies

## Testing
- Write unit tests for utility functions
- Write component tests for critical UI components
- Test user interactions and form submissions
- Mock API calls in tests
- Maintain test coverage above 70%

## Error Handling
- Display user-friendly error messages
- Log errors for debugging
- Implement fallback UI for error states
- Handle network failures gracefully
- Provide retry mechanisms for failed requests

# General Rules
- Ensure code is modular, reusable and simple to understand 
- Write unit tests for critical components
- Don't create any .md files unless specifically instructed
- Never start a server or kill a server, I will handle that
- Never change the application ports or database configurations
- Create all scripts inside the scripts/ directory
- Create all test files inside the tests/ directory
- Never push anything directly to main branch, always create a new branch for changes and raise a PR