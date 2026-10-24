#!/usr/bin/env python3
"""
Backfill Student-Internship Matches Script
===========================================

This script populates the student_internship_matches table using EXISTING resume data.
NO RESUME REUPLOADS REQUIRED!

Purpose:
- Uses existing resume embeddings and parsed data
- Calculates base similarity scores for all student-internship pairs
- Populates the new hybrid matching table

Usage:
    python scripts/backfill_student_matches.py
"""

import sys
import os
import time

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.models.resume import Resume
from app.models.internship import Internship
from app.models.student_internship_match import StudentInternshipMatch
from app.services.batch_matching_service import BatchMatchingService


def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)


def check_existing_data():
    """Check what data we have to work with"""
    print_header("STEP 1: Checking Existing Data")

    db = next(get_db())

    # Count students with active resumes
    students_with_resumes = (
        db.query(User, Resume)
        .join(Resume, Resume.student_id == User.id)
        .filter(User.role == UserRole.student, Resume.is_active == 1)
        .count()
    )

    # Count active internships
    active_internships = db.query(Internship).filter(Internship.is_active == 1).count()

    # Count existing matches
    existing_matches = db.query(StudentInternshipMatch).count()

    print(f"\n📊 Current Database State:")
    print(f"   • Students with active resumes: {students_with_resumes}")
    print(f"   • Active internships: {active_internships}")
    print(f"   • Existing pre-computed matches: {existing_matches}")
    print(f"   • Potential new matches: {students_with_resumes * active_internships - existing_matches}")

    if students_with_resumes == 0:
        print("\n⚠️  WARNING: No students with active resumes found!")
        print("   Make sure students have uploaded resumes before running this script.")
        return False

    if active_internships == 0:
        print("\n⚠️  WARNING: No active internships found!")
        print("   Make sure companies have posted internships before running this script.")
        return False

    return True


def confirm_backfill():
    """Ask user to confirm backfill operation"""
    print("\n❓ This will compute similarity scores for all student-internship pairs.")
    print("   Depending on your data size, this may take a few minutes.")

    response = input("\n   Continue? (yes/no): ").lower().strip()
    return response in ['yes', 'y']


def run_backfill():
    """Run the backfill process"""
    print_header("STEP 2: Running Backfill Process")

    print("\n💡 Using EXISTING resume data - no reuploads needed!")
    print("   • Reading stored resume embeddings")
    print("   • Reading parsed resume data")
    print("   • Calculating similarities with matching engine")
    print("   • Storing in student_internship_matches table\n")

    try:
        db = next(get_db())
        batch_service = BatchMatchingService(db)

        start_time = time.time()

        # Run batch computation (force_recompute=False to skip existing)
        result = batch_service.compute_all_matches(force_recompute=False)

        duration = time.time() - start_time

        print("\n" + "=" * 70)
        print("🎉 Backfill Complete!")
        print("=" * 70)

        print(f"\n📊 Statistics:")
        print(f"   • Students processed: {result['students_processed']}")
        print(f"   • Internships processed: {result['internships_processed']}")
        print(f"   • Matches computed: {result['matches_computed']}")
        print(f"   • Matches failed: {result.get('matches_failed', 0)}")
        print(f"   • Total duration: {duration:.1f} seconds")
        print(f"   • Average per match: {result['avg_time_per_match']:.4f} seconds")

        return True

    except Exception as e:
        print(f"\n  Backfill failed: {str(e)}")
        import traceback

        traceback.print_exc()
        return False


def verify_backfill():
    """Verify the backfill was successful"""
    print_header("STEP 3: Verifying Backfill")

    try:
        db = next(get_db())

        # Count total matches
        total_matches = db.query(StudentInternshipMatch).count()
        print(f"\n✅ Total matches in database: {total_matches}")

        # Show sample of top matches
        from sqlalchemy import desc

        sample_matches = (
            db.query(StudentInternshipMatch, User, Internship)
            .join(User, StudentInternshipMatch.student_id == User.id)
            .join(Internship, StudentInternshipMatch.internship_id == Internship.id)
            .order_by(desc(StudentInternshipMatch.base_similarity_score))
            .limit(5)
            .all()
        )

        if sample_matches:
            print("\n📋 Top 5 Matches (Sample):")
            print("-" * 70)
            for match, student, internship in sample_matches:
                print(
                    f"   {student.full_name[:30]:<30} → {internship.title[:30]:<30} | Score: {match.base_similarity_score:.1f}%"
                )
            print("-" * 70)

        # Check average score
        from sqlalchemy import func

        avg_score = db.query(func.avg(StudentInternshipMatch.base_similarity_score)).scalar()

        if avg_score:
            print(f"\n📊 Average match score: {avg_score:.2f}%")

        return True

    except Exception as e:
        print(f"\n  Verification failed: {str(e)}")
        return False


def print_next_steps():
    """Print next steps after successful backfill"""
    print_header("✨ Next Steps")

    print("""
🚀 Your hybrid matching system is now ready with pre-computed matches!

📋 Test the performance improvements:

1. Test Student Recommendations (should be <200ms now):
   GET http://localhost:8000/recommendations/for-me
   (Use student auth token)

2. Test Company Candidate Ranking (should be <1s now):
   POST http://localhost:8000/api/filter/rank-candidates/{internship_id}?only_applicants=false
   (Use company auth token)

3. Test Application with Similarity:
   POST http://localhost:8000/api/internship/{internship_id}/apply
   (Use student auth token)

🔄 Ongoing Maintenance:

1. Schedule nightly updates (recommended):
   0 2 * * * curl -X POST http://localhost:8000/api/filter/compute-matches

2. After bulk operations:
   - Bulk student import → Run: POST /api/filter/compute-matches
   - Bulk internship import → Run: POST /api/filter/compute-matches

3. Individual updates (automatic):
   - New resume upload → Matches computed automatically
   - New internship post → Matches computed automatically

⚡ Expected Performance:
   • Recommendations: 5 minutes → 50-200ms (6000x faster!)
   • Ranking: 5 minutes → <1 second (300x faster!)

📚 Documentation:
   See HYBRID_MATCHING_IMPLEMENTATION.md for full details
    """)


def main():
    """Main backfill workflow"""
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║           BACKFILL STUDENT-INTERNSHIP MATCHES                      ║
║                                                                    ║
║  This script uses EXISTING resume data to populate the new        ║
║  student_internship_matches table for hybrid matching.           ║
║                                                                    ║
║  ✅ No resume reuploads required                                   ║
║  ✅ Uses stored embeddings and parsed data                         ║
║  ✅ One-time operation                                            ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    # Step 1: Check existing data
    if not check_existing_data():
        print("\n  Cannot proceed without data. Please ensure:")
        print("   1. Students have uploaded resumes")
        print("   2. Companies have posted internships")
        print("   3. Database migration has been run")
        sys.exit(1)

    # Step 2: Confirm with user
    if not confirm_backfill():
        print("\n  Backfill cancelled by user.")
        sys.exit(0)

    # Step 3: Run backfill
    if not run_backfill():
        print("\n  Backfill failed. Please check errors above and try again.")
        sys.exit(1)

    # Step 4: Verify
    if not verify_backfill():
        print("\n⚠️  Backfill completed but verification failed.")
        print("   Matches may still be usable. Check manually if needed.")

    # Step 5: Print next steps
    print_next_steps()

    print("\n" + "=" * 70)
    print("✨ Backfill completed successfully! System ready for hybrid matching.")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
