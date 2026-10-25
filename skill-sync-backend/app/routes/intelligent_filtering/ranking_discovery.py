"""Discovery ranking: ranks every student from the pre-computed matches."""

from app.models.application import Application
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import User
from app.services.candidate_filters import CandidateFilters, apply_filters, attach_flag_info
from app.services.candidate_flagging_service import CandidateFlaggingService


def rank_discovery(
    db,
    internship,
    current_user,
    limit,
    include_explanations,
    min_match_score,
    max_match_score,
    min_experience,
    max_experience,
    filter_skills,
    education_level,
    exclude_flagged,
    logger,
):
    """Rank all matched students from student_internship_matches and mark who applied."""
    # Option 2: Rank ALL potential candidates using pre-computed base similarity
    logger.info("📊 Using pre-computed matches for discovery ranking...")
    base_matches = (
        db.query(StudentInternshipMatch, User, Resume)
        .join(User, StudentInternshipMatch.student_id == User.id)
        .join(Resume, StudentInternshipMatch.resume_id == Resume.id)
        .filter(
            StudentInternshipMatch.internship_id == internship.id,
            User.is_active == 1,  # Only show active students in rankings
        )
        .order_by(StudentInternshipMatch.base_similarity_score.desc())
        .limit(limit)
        .all()
    )

    if not base_matches:
        return {
            "success": True,
            "message": "No pre-computed matches found. Run batch computation first.",
            "total_candidates": 0,
            "ranked_candidates": [],
            "recommendation": "Call POST /api/filter/compute-matches to pre-compute similarities",
        }

    ranked_candidates = []
    for match, student, resume in base_matches:
        # Build component_scores for frontend display
        # No fallback values - expose real issues if data is missing
        component_scores = {
            'semantic_similarity': match.semantic_similarity,
            'skills_match': match.skills_match_score,
            'experience_match': match.experience_match_score,
            'overall_match': round(match.base_similarity_score, 2),
        }

        # Build match_details for frontend
        candidate_skills = resume.parsed_data.get('all_skills', []) if resume.parsed_data else []
        required_skills = internship.required_skills or []
        preferred_skills = internship.preferred_skills or []
        all_internship_skills = required_skills + preferred_skills

        # Separate matching for required and preferred skills
        matched_required_skills = [s for s in candidate_skills if s.lower() in [rs.lower() for rs in required_skills]]
        missing_required_skills = [
            s for s in required_skills if s.lower() not in [cs.lower() for cs in candidate_skills]
        ]

        matched_preferred_skills = [s for s in candidate_skills if s.lower() in [ps.lower() for ps in preferred_skills]]
        missing_preferred_skills = [
            s for s in preferred_skills if s.lower() not in [cs.lower() for cs in candidate_skills]
        ]

        # Legacy fields for backward compatibility
        matched_skills = [s for s in candidate_skills if s.lower() in [rs.lower() for rs in all_internship_skills]]
        missing_skills = [s for s in required_skills if s.lower() not in [cs.lower() for cs in candidate_skills]]

        candidate_exp = resume.parsed_data.get('total_experience_years', 0) if resume.parsed_data else 0
        min_exp = internship.min_experience or 0
        experience_gap = max(0, min_exp - candidate_exp)

        match_details = {
            'matched_skills': matched_skills,  # Legacy - all matched skills
            'missing_skills': missing_skills,  # Legacy - missing required skills
            'matched_required_skills': matched_required_skills,
            'missing_required_skills': missing_required_skills,
            'matched_preferred_skills': matched_preferred_skills,
            'missing_preferred_skills': missing_preferred_skills,
            'experience_gap': experience_gap,
        }

        # Generate explanation
        explanation = f"Candidate shows {round(match.base_similarity_score, 1)}% compatibility. "
        if len(matched_skills) > 0:
            explanation += f"Has {len(matched_skills)} matching skills. "
        if len(missing_skills) > 0:
            explanation += f"Missing {len(missing_skills)} required skills. "
        if experience_gap > 0:
            explanation += f"Needs {experience_gap} more years of experience. "
        else:
            explanation += "Meets experience requirements. "
        explanation += "Strong potential candidate for this position."

        ranked_candidates.append(
            {
                'candidate_id': student.id,  # Frontend expects candidate_id
                'candidate_name': student.full_name,  # Frontend expects candidate_name
                'student_id': student.id,  # Keep for backward compatibility
                'student_name': student.full_name,  # Keep for backward compatibility
                'linkedin_url': student.linkedin_url,  # Social profile links
                'github_url': student.github_url,  # Social profile links
                'resume_id': resume.id,
                'personal_info': resume.parsed_data.get('personal_info', {}) if resume.parsed_data else {},
                'skills': candidate_skills,
                'total_experience_years': candidate_exp,
                'match_score': round(match.base_similarity_score, 2),  # Frontend expects match_score
                'overall_score': round(match.base_similarity_score, 2),  # Keep for backward compatibility
                'component_scores': component_scores,  # Frontend expects this for breakdown display
                'match_details': match_details,  # Frontend expects this for skills analysis
                'explanation': explanation,  # Frontend expects this for AI analysis
                'has_applied': False,  # Can check applications table
                'scoring_breakdown': {
                    'semantic_similarity': match.semantic_similarity,
                    'skills_match': match.skills_match_score,
                    'experience_match': match.experience_match_score,
                    'last_computed': str(match.last_computed),
                },
            }
        )

    # Check if any of these candidates have applied (and check for tailored resumes)
    applicant_ids = [c['student_id'] for c in ranked_candidates]
    applications = (
        db.query(Application, Resume)
        .join(Resume, Application.resume_id == Resume.id)
        .filter(Application.internship_id == internship.id, Application.student_id.in_(applicant_ids))
        .all()
    )

    application_map = {}
    tailored_resume_map = {}
    for app, app_resume in applications:
        application_map[app.student_id] = app
        if app_resume.is_tailored == 1:
            tailored_resume_map[app.student_id] = app_resume

    for candidate in ranked_candidates:
        if candidate['student_id'] in application_map:
            candidate['has_applied'] = True
            candidate['application_status'] = application_map[candidate['student_id']].status

            # Add tailored resume indicator to scoring_breakdown
            has_tailored = candidate['student_id'] in tailored_resume_map
            candidate['scoring_breakdown']['has_tailored'] = has_tailored
            if has_tailored:
                candidate['scoring_breakdown']['tailored_resume_id'] = tailored_resume_map[candidate['student_id']].id
        else:
            candidate['scoring_breakdown']['has_tailored'] = False

    # Apply filters before limiting results
    filters = CandidateFilters(
        min_match_score=min_match_score,
        max_match_score=max_match_score,
        min_experience=min_experience,
        max_experience=max_experience,
        skills=filter_skills,
        education_level=education_level,
        exclude_flagged=exclude_flagged,
    )
    filtered_candidates = apply_filters(ranked_candidates, filters)

    # Add flag info before the exclude_flagged filter, which reads it
    candidate_ids = [c['candidate_id'] for c in filtered_candidates]
    flag_info = CandidateFlaggingService.get_flag_info_for_candidates(candidate_ids, db)
    attach_flag_info(filtered_candidates, flag_info)
    if exclude_flagged:
        filtered_candidates = [c for c in filtered_candidates if not c['is_flagged']]

    # Now apply limit
    filtered_candidates = filtered_candidates[:limit]

    # Count flagged in final results
    flagged_count = sum(1 for c in filtered_candidates if c['is_flagged'])
    logger.info(f"🚩 Final results contain {flagged_count} flagged candidates out of {len(filtered_candidates)}")

    filters_applied = filters.describe()

    return {
        "success": True,
        "message": f"Ranked {len(filtered_candidates)} candidates using pre-computed similarity (instant!)",
        "total_candidates": len(filtered_candidates),
        "total_before_filter": len(ranked_candidates),
        "filters_applied": filters_applied,
        "ranked_candidates": filtered_candidates,
        "anonymization_enabled": current_user.anonymization_enabled
        if hasattr(current_user, 'anonymization_enabled')
        else False,
        "performance_note": "⚡ Pre-computed base similarity: <200ms response time",
        "methodology": "Base similarity from batch computation",
        "flagged_candidates_count": flagged_count,
    }
