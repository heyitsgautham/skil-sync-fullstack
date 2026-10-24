"""
Test script to verify that inactive students are filtered out from rankings
"""

import sys

sys.path.insert(0, '.')

from app.database.connection import get_db
from app.models.internship import Internship
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import User, UserRole

db = next(get_db())

print("=" * 80)
print("TESTING INACTIVE STUDENT FILTERING")
print("=" * 80)

# Get inactive students
inactive_students = db.query(User).filter(User.role == UserRole.student, User.is_active == 0).all()

print("\n🚫 Inactive Students (should NOT appear in rankings):")
print("-" * 80)
for student in inactive_students:
    print(f"  - ID: {student.id}, Name: {student.full_name}")

# Get a sample internship
internship = db.query(Internship).filter(Internship.is_active == 1).first()

if not internship:
    print("\n⚠️ No active internships found in database")
    db.close()
    sys.exit(1)

print(f"\n📋 Testing with Internship: {internship.title} (ID: {internship.id})")
print("-" * 80)

# Test Query 1: WITHOUT is_active filter (OLD BEHAVIOR)
print("\n❌ Query WITHOUT is_active filter (OLD - WRONG):")
matches_without_filter = (
    db.query(StudentInternshipMatch, User)
    .join(User, StudentInternshipMatch.student_id == User.id)
    .filter(StudentInternshipMatch.internship_id == internship.id)
    .all()
)

inactive_ids_in_results = set()
for match, user in matches_without_filter:
    if user.is_active == 0:
        inactive_ids_in_results.add(user.id)
        print(f"  🐛 BUG: Inactive student ID {user.id} ({user.full_name}) found in results!")

if not inactive_ids_in_results:
    print(f"  ✅ No inactive students found (Total results: {len(matches_without_filter)})")
else:
    print(f"  ❌ Found {len(inactive_ids_in_results)} inactive students in {len(matches_without_filter)} results")

# Test Query 2: WITH is_active filter (NEW BEHAVIOR)
print("\n✅ Query WITH is_active filter (NEW - CORRECT):")
matches_with_filter = (
    db.query(StudentInternshipMatch, User)
    .join(User, StudentInternshipMatch.student_id == User.id)
    .filter(
        StudentInternshipMatch.internship_id == internship.id,
        User.is_active == 1,  # Only show active students
    )
    .all()
)

inactive_ids_in_filtered = set()
for match, user in matches_with_filter:
    if user.is_active == 0:
        inactive_ids_in_filtered.add(user.id)
        print(f"  🐛 BUG: Inactive student ID {user.id} ({user.full_name}) STILL found!")

if not inactive_ids_in_filtered:
    print(f"  ✅ No inactive students found (Total results: {len(matches_with_filter)})")
    print("  ✅ Filter is working correctly!")
else:
    print(f"  ❌ PROBLEM: Found {len(inactive_ids_in_filtered)} inactive students")

# Summary
print("\n" + "=" * 80)
print("SUMMARY:")
print("=" * 80)
print(f"Total inactive students in DB: {len(inactive_students)}")
print(f"Results without filter: {len(matches_without_filter)}")
print(f"Results with filter: {len(matches_with_filter)}")
print(f"Difference: {len(matches_without_filter) - len(matches_with_filter)} students filtered out")

if len(inactive_ids_in_filtered) == 0 and len(matches_with_filter) < len(matches_without_filter):
    print("\n✅ SUCCESS: Inactive student filter is working correctly!")
else:
    print("\n❌ FAILURE: Filter is not working as expected!")

db.close()
