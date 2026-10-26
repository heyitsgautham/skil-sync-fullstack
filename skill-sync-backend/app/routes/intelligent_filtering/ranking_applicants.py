"""Applicant ranking: scores each applicant from their base and tailored resumes."""

from app.models.application import Application
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import User
from app.routes.intelligent_filtering.common import matching_engine
from app.services.candidate_filters import CandidateFilters, apply_filters, attach_flag_info
from app.services.candidate_flagging_service import CandidateFlaggingService
from app.services.rag_engine import rag_engine


def _application_score(application, student, logger):
    """Score an applicant who has no pre-computed match and no usable tailored embedding.

    This happens when a student applies before the next batch match run. The score stored on the
    application at apply time stands in, and the component scores read 0 until the batch run fills them.
    """
    logger.warning(f"No pre-computed match for student {student.id}, using the score stored when they applied")
    score = application.match_score if application.match_score is not None else 0
    return float(score), 0.0, 0.0, 0.0


def rank_applicants(
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
    """Rank the students who applied, blending a tailored resume score with the base match."""
    # Option 1: Only rank actual applicants with DUAL RESUME ANALYSIS
    logger.info("📊 Using dual resume analysis (base + tailored) for comprehensive ranking...")
    applications = (
        db.query(Application, User, Resume)
        .join(User, Application.student_id == User.id)
        .join(Resume, Application.resume_id == Resume.id)
        .filter(
            Application.internship_id == internship.id,
            User.is_active == 1,  # Only show active students in rankings
        )
        .all()
    )

    if not applications:
        return {
            "success": True,
            "message": "No applicants found for this internship",
            "total_candidates": 0,
            "ranked_candidates": [],
            "performance_note": "Used dual resume analysis",
        }

    # Build ranked list from applications with DUAL RESUME SCORING
    ranked_candidates = []
    for app, student, tailored_resume in applications:
        # Get base resume (non-tailored, active resume for this student)
        base_resume = (
            db.query(Resume)
            .filter(Resume.student_id == student.id, Resume.is_active == 1, Resume.is_tailored == 0)
            .first()
        )

        # Get pre-computed match for base resume
        base_match = (
            db.query(StudentInternshipMatch)
            .filter(
                StudentInternshipMatch.student_id == student.id,
                StudentInternshipMatch.internship_id == internship.id,
            )
            .first()
        )

        # DUAL RESUME SCORING: Compute real-time scores for tailored resume if it exists
        tailored_is_different = tailored_resume.is_tailored == 1

        if tailored_is_different and tailored_resume.embedding_id:
            # Recompute scores for tailored resume on-the-fly
            logger.info(f"🎯 Computing tailored resume scores for student {student.id}")

            # Prepare candidate and internship data
            tailored_data = {
                'all_skills': tailored_resume.parsed_data.get('all_skills', []) if tailored_resume.parsed_data else [],
                'total_experience_years': tailored_resume.parsed_data.get('total_experience_years', 0)
                if tailored_resume.parsed_data
                else 0,
                'education': tailored_resume.parsed_data.get('education', []) if tailored_resume.parsed_data else [],
                'certifications': tailored_resume.parsed_data.get('certifications', [])
                if tailored_resume.parsed_data
                else [],
            }

            internship_data = {
                'required_skills': internship.required_skills or [],
                'preferred_skills': internship.preferred_skills or [],
                'min_experience': internship.min_experience or 0,
                'max_experience': internship.max_experience or 10,
                'required_education': internship.required_education or '',
            }

            # Get embeddings from ChromaDB
            # Note: get_resume_embedding expects ID without "resume_" prefix
            try:
                tailored_chroma_id = (
                    tailored_resume.embedding_id.replace('resume_', '')
                    if tailored_resume.embedding_id
                    else str(tailored_resume.id)
                )
                retrieved_tailored_embedding = rag_engine.get_resume_embedding(tailored_chroma_id)
                tailored_embedding = retrieved_tailored_embedding if retrieved_tailored_embedding is not None else []
                logger.info(f"📊 Tailored resume embedding: {len(tailored_embedding)} dimensions")
            except Exception as e:
                logger.error(f"  Error retrieving tailored embedding: {e}")
                tailored_embedding = []

            try:
                retrieved_internship_embedding = rag_engine.get_internship_embedding(str(internship.id))
                internship_embedding = (
                    retrieved_internship_embedding if retrieved_internship_embedding is not None else []
                )
                logger.info(f"📊 Internship embedding: {len(internship_embedding)} dimensions")
            except Exception as e:
                logger.error(f"  Error retrieving internship embedding: {e}")
                internship_embedding = []

            # Check if tailored embedding is missing - fall back to base resume
            # Use proper None check for numpy arrays
            if tailored_embedding is None or len(tailored_embedding) == 0:
                logger.warning(
                    f"⚠️ Tailored resume {tailored_resume.id} has no embedding, falling back to base resume scoring"
                )
                # Treat as if no tailored resume exists - will use base match only below
                tailored_is_different = False

            # Only calculate tailored match if embedding exists
            # Use proper None check for numpy arrays
            if tailored_is_different and (tailored_embedding is not None and len(tailored_embedding) > 0):
                # Calculate match for tailored resume
                tailored_match_result = matching_engine.calculate_match_score(
                    candidate_data=tailored_data,
                    internship_data=internship_data,
                    candidate_embedding=tailored_embedding,
                    internship_embedding=internship_embedding,
                )

                # Weighted combination: 80% tailored + 20% base
                if base_match:
                    final_score = (tailored_match_result['overall_score'] * 0.8) + (
                        base_match.base_similarity_score * 0.2
                    )
                    semantic_similarity = (
                        tailored_match_result.get('component_scores', {}).get('semantic_similarity') * 0.8
                    ) + (base_match.semantic_similarity * 0.2)
                    skills_match = (tailored_match_result.get('component_scores', {}).get('skills_match') * 0.8) + (
                        base_match.skills_match_score * 0.2
                    )
                    experience_match = (
                        tailored_match_result.get('component_scores', {}).get('experience_match') * 0.8
                    ) + (base_match.experience_match_score * 0.2)
                else:
                    # No base match, use tailored only
                    logger.warning(f"⚠️ No base match found for student {student.id}, using tailored score only")
                    final_score = tailored_match_result['overall_score']
                    semantic_similarity = tailored_match_result.get('component_scores', {}).get('semantic_similarity')
                    skills_match = tailored_match_result.get('component_scores', {}).get('skills_match')
                    experience_match = tailored_match_result.get('component_scores', {}).get('experience_match')
            else:
                # No tailored embedding or same as base, use base match only
                if base_match:
                    final_score = base_match.base_similarity_score
                    semantic_similarity = base_match.semantic_similarity
                    skills_match = base_match.skills_match_score
                    experience_match = base_match.experience_match_score
                else:
                    final_score, semantic_similarity, skills_match, experience_match = _application_score(
                        app, student, logger
                    )
        else:
            # No tailored resume or same as base, use base match only
            if base_match:
                final_score = base_match.base_similarity_score
                semantic_similarity = base_match.semantic_similarity
                skills_match = base_match.skills_match_score
                experience_match = base_match.experience_match_score
            else:
                final_score, semantic_similarity, skills_match, experience_match = _application_score(
                    app, student, logger
                )

        # Build component_scores for frontend display (using computed/combined scores)
        component_scores = {
            'semantic_similarity': round(semantic_similarity, 2),
            'skills_match': round(skills_match, 2),
            'experience_match': round(experience_match, 2),
            'overall_match': round(final_score, 2),
        }

        # COMBINE SKILLS from both base and tailored resumes
        tailored_skills = tailored_resume.parsed_data.get('all_skills', []) if tailored_resume.parsed_data else []
        base_skills = base_resume.parsed_data.get('all_skills', []) if base_resume and base_resume.parsed_data else []

        # Merge skills (unique, case-insensitive)
        all_candidate_skills = []
        seen_skills = set()
        for skill in tailored_skills + base_skills:
            skill_lower = skill.lower()
            if skill_lower not in seen_skills:
                all_candidate_skills.append(skill)
                seen_skills.add(skill_lower)

        # Build match_details for frontend using COMBINED skills
        required_skills = internship.required_skills or []
        preferred_skills = internship.preferred_skills or []
        all_internship_skills = required_skills + preferred_skills

        # Separate matching for required and preferred skills
        matched_required_skills = [
            s for s in all_candidate_skills if s.lower() in [rs.lower() for rs in required_skills]
        ]
        missing_required_skills = [
            s for s in required_skills if s.lower() not in [cs.lower() for cs in all_candidate_skills]
        ]

        matched_preferred_skills = [
            s for s in all_candidate_skills if s.lower() in [ps.lower() for ps in preferred_skills]
        ]
        missing_preferred_skills = [
            s for s in preferred_skills if s.lower() not in [cs.lower() for cs in all_candidate_skills]
        ]

        # Legacy fields for backward compatibility
        matched_skills = [s for s in all_candidate_skills if s.lower() in [rs.lower() for rs in all_internship_skills]]
        missing_skills = [s for s in required_skills if s.lower() not in [cs.lower() for cs in all_candidate_skills]]

        # Use tailored resume experience (higher priority)
        candidate_exp = (
            tailored_resume.parsed_data.get('total_experience_years', 0) if tailored_resume.parsed_data else 0
        )
        if candidate_exp == 0 and base_resume and base_resume.parsed_data:
            candidate_exp = base_resume.parsed_data.get('total_experience_years', 0)

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
            'has_tailored_resume': tailored_is_different,
            'base_resume_id': base_resume.id if base_resume else None,
            'tailored_resume_id': tailored_resume.id if tailored_is_different else None,
        }

        # Generate comprehensive explanation using BOTH resumes
        if tailored_is_different:
            explanation = "✨ This candidate submitted a tailored resume specifically for this position. "
            explanation += "Analysis combines both base profile (20%) and tailored application (80%). "
        else:
            explanation = "This candidate applied with their standard resume. "

        explanation += f"Overall compatibility: {round(final_score, 1)}%. "

        if len(matched_skills) > 0:
            explanation += f"Has {len(matched_skills)}/{len(required_skills)} required skills ({', '.join(matched_skills[:5])}{'...' if len(matched_skills) > 5 else ''}). "

        if len(missing_skills) > 0:
            explanation += f"Missing {len(missing_skills)} key skills ({', '.join(missing_skills[:3])}{'...' if len(missing_skills) > 3 else ''}). "
        else:
            explanation += "Meets all skill requirements! "

        if experience_gap > 0:
            explanation += f"Needs {experience_gap:.1f} more years of experience. "
        else:
            explanation += "Exceeds experience requirements. "

        if tailored_is_different:
            explanation += "📝 Tailored resume shows strong interest and preparation for this specific role."

        ranked_candidates.append(
            {
                'candidate_id': student.id,  # Frontend expects candidate_id
                'candidate_name': student.full_name,  # Frontend expects candidate_name
                'student_id': student.id,  # Keep for backward compatibility
                'student_name': student.full_name,  # Keep for backward compatibility
                'linkedin_url': student.linkedin_url,  # Social profile links
                'github_url': student.github_url,  # Social profile links
                'resume_id': tailored_resume.id,
                'personal_info': tailored_resume.parsed_data.get('personal_info', {})
                if tailored_resume.parsed_data
                else {},
                'skills': all_candidate_skills,  # COMBINED skills from both resumes
                'total_experience_years': candidate_exp,
                'match_score': round(final_score, 2),  # Frontend expects match_score
                'overall_score': round(final_score, 2),  # Keep for backward compatibility
                'component_scores': component_scores,  # Frontend expects this for breakdown display
                'match_details': match_details,  # Frontend expects this for skills analysis
                'explanation': explanation,  # Frontend expects this for AI analysis
                'application_id': app.id,
                'application_status': app.status,
                'applied_at': str(app.created_at),
                'scoring_breakdown': {
                    'tailored_score': round(tailored_match_result['overall_score'], 2)
                    if tailored_is_different and 'tailored_match_result' in locals()
                    else None,
                    'base_similarity': base_match.base_similarity_score if base_match else None,
                    'final_weight': '80% tailored + 20% base'
                    if tailored_is_different and base_match
                    else (
                        'tailored only' if tailored_is_different else 'base only' if base_match else 'application score'
                    ),
                    'has_tailored': tailored_is_different,
                },
            }
        )

    # Sort by score
    ranked_candidates.sort(key=lambda x: x['overall_score'], reverse=True)

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

    # Count how many have tailored resumes
    tailored_count = sum(1 for c in filtered_candidates if c['scoring_breakdown']['has_tailored'])

    # Count flagged in final results
    flagged_count = sum(1 for c in filtered_candidates if c['is_flagged'])
    logger.info(f"🚩 Final results contain {flagged_count} flagged candidates out of {len(filtered_candidates)}")

    filters_applied = filters.describe()

    return {
        "success": True,
        "message": f"Ranked {len(filtered_candidates)} applicants using dual resume analysis",
        "total_candidates": len(filtered_candidates),
        "total_before_filter": len(ranked_candidates),
        "filters_applied": filters_applied,
        "ranked_candidates": filtered_candidates,
        "anonymization_enabled": current_user.anonymization_enabled
        if hasattr(current_user, 'anonymization_enabled')
        else False,
        "performance_note": f"✨ Dual resume analysis: {tailored_count} with tailored resumes, {len(filtered_candidates) - tailored_count} with base only",
        "methodology": "Combines base resume (20%) + tailored resume (80%) when available",
        "flagged_candidates_count": flagged_count,
    }
