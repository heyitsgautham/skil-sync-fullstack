"""Filters a company applies to a ranked candidate list.

The ranking endpoint builds candidate dicts with match_score, total_experience_years,
skills and personal_info.education, then narrows them with these functions.
"""

import logging
from dataclasses import dataclass

from app.services.candidate_flagging_service import CandidateFlaggingService

logger = logging.getLogger(__name__)

EDUCATION_LEVELS = {'bachelor': 1, 'master': 2, 'phd': 3, 'doctorate': 3}


@dataclass(frozen=True)
class CandidateFilters:
    min_match_score: float | None = None
    max_match_score: float | None = None
    min_experience: float | None = None
    max_experience: float | None = None
    skills: str | None = None  # comma-separated, every one must appear in the candidate's skills
    education_level: str | None = None  # minimum level, such as "Master"
    exclude_flagged: bool = False

    def describe(self) -> list[str]:
        """Human-readable summary of the active filters, in the order the API has always returned."""
        applied = []
        if self.min_match_score is not None:
            applied.append(f"match_score >= {self.min_match_score}%")
        if self.max_match_score is not None:
            applied.append(f"match_score <= {self.max_match_score}%")
        if self.min_experience is not None:
            applied.append(f"experience >= {self.min_experience} years")
        if self.max_experience is not None:
            applied.append(f"experience <= {self.max_experience} years")
        if self.skills:
            applied.append(f"skills contain: {self.skills}")
        if self.education_level:
            applied.append(f"education >= {self.education_level}")
        if self.exclude_flagged:
            applied.append("excluding flagged candidates")
        return applied


def highest_education_level(candidate: dict) -> int:
    """Rank the candidate's highest degree as 0 (none), 1 (bachelor), 2 (master) or 3 (doctorate)."""
    education = candidate.get('personal_info', {}).get('education', [])
    level = 0
    for entry in education or []:
        degree = entry.get('degree', '').lower()
        for name, value in EDUCATION_LEVELS.items():
            if name in degree:
                level = max(level, value)
    return level


def apply_filters(candidates: list[dict], filters: CandidateFilters) -> list[dict]:
    """Return the candidates that pass every score, experience, skill and education filter."""
    result = candidates
    if filters.min_match_score is not None:
        result = [c for c in result if c['match_score'] >= filters.min_match_score]
    if filters.max_match_score is not None:
        result = [c for c in result if c['match_score'] <= filters.max_match_score]
    if filters.min_experience is not None:
        result = [c for c in result if c['total_experience_years'] >= filters.min_experience]
    if filters.max_experience is not None:
        result = [c for c in result if c['total_experience_years'] <= filters.max_experience]
    if filters.skills:
        wanted = [s.strip().lower() for s in filters.skills.split(',')]
        result = [c for c in result if all(any(w in skill.lower() for skill in c['skills']) for w in wanted)]
    if filters.education_level:
        min_level = EDUCATION_LEVELS.get(filters.education_level.lower(), 0)
        result = [c for c in result if highest_education_level(c) >= min_level]
    logger.info("Filters %s left %d of %d candidates", filters.describe(), len(result), len(candidates))
    return result


def attach_flag_info(candidates: list[dict], flag_info: dict[int, dict]) -> None:
    """Set is_flagged, flag_reasons, flagged_with and flag_reason_text on each candidate in place."""
    for candidate in candidates:
        info = flag_info.get(candidate['candidate_id'])
        if info:
            candidate['is_flagged'] = True
            candidate['flag_reasons'] = info['reasons']
            candidate['flagged_with'] = info['flagged_with']
            candidate['flag_reason_text'] = CandidateFlaggingService.format_flag_reason(info['reasons'])
        else:
            candidate['is_flagged'] = False
            candidate['flag_reasons'] = []
            candidate['flagged_with'] = {}
            candidate['flag_reason_text'] = None


def experience_years(parsed_data_column):
    """SQL expression for parsed_data.total_experience_years as a number.

    SQLAlchemy renders it as CAST(parsed_data ->> 'total_experience_years' AS FLOAT) on Postgres and as
    JSON_EXTRACT on SQLite. A resume without the key yields NULL, which no comparison matches.
    """
    return parsed_data_column["total_experience_years"].as_float()


def resume_matches(parsed_data: dict | None, skills: str | None = None, education_level: str | None = None) -> bool:
    """Check the resume-level filters of the filtered ranking and export endpoints.

    skills is comma-separated, and a resume passes when any one of them appears inside one of its
    all_skills entries. education_level passes when it appears inside one of the education degrees.
    Both checks ignore case, as the original MySQL json_search filters did.
    """
    data = parsed_data or {}
    if skills:
        wanted = [s.strip().lower() for s in skills.split(',') if s.strip()]
        have = [str(s).lower() for s in data.get('all_skills') or []]
        if wanted and not any(w in h for w in wanted for h in have):
            return False
    if education_level:
        level = education_level.lower()
        degrees = [str((entry or {}).get('degree', '')).lower() for entry in data.get('education') or []]
        if not any(level in degree for degree in degrees):
            return False
    return True
