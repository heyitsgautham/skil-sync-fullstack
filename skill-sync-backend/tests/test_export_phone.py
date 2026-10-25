"""Phone numbers in the candidate export keep the digits the resume gave.

A resume phone without a country code, such as "98765 43210", used to come out as "+98765 43210",
which reads as a different international number.
"""

import csv
import io

import openpyxl
import pytest

from app.models.internship import Internship
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import UserRole
from app.routes.intelligent_filtering.export import format_phone_for_export


@pytest.fixture
def export_for_phone(client, db_session, make_user, auth_headers):
    """Export one candidate whose parsed resume carries the given phone, and return the Phone cell."""
    company = make_user(role=UserRole.company)
    internship = Internship(company_id=company.id, title="Intern", description="Work", required_skills=["Python"])
    db_session.add(internship)
    db_session.commit()

    def _export(phone, file_format):
        student = make_user(role=UserRole.student)
        resume = Resume(
            student_id=student.id,
            file_path="/tmp/cv.txt",
            file_name="cv.txt",
            is_active=1,
            parsed_data={"personal_info": {"phone": phone}, "all_skills": ["Python"]},
        )
        db_session.add(resume)
        db_session.commit()
        db_session.add(
            StudentInternshipMatch(
                student_id=student.id, internship_id=internship.id, resume_id=resume.id, base_similarity_score=80
            )
        )
        db_session.commit()

        response = client.get(
            f"/api/filter/export-candidates/{internship.id}",
            params={"format": file_format, "export_type": "all"},
            headers=auth_headers(company),
        )
        assert response.status_code == 200, response.text
        if file_format == "csv":
            rows = list(csv.DictReader(io.StringIO(response.text)))
            return rows[0]["Phone"]
        sheet = openpyxl.load_workbook(io.BytesIO(response.content)).active
        headers = [cell.value for cell in sheet[4]]
        return sheet.cell(row=5, column=headers.index("Phone") + 1).value

    return _export


@pytest.mark.parametrize(
    "phone,csv_cell,xlsx_cell",
    [
        ("98765 43210", '="98765 43210"', "98765 43210"),
        ("+91-9876543210", '="+91 9876543210"', "+91 9876543210"),
        ("+44 20 7946 0958", '="+44 20 7946 0958"', "+44 20 7946 0958"),
    ],
)
def test_export_keeps_the_phone_the_resume_gave(export_for_phone, phone, csv_cell, xlsx_cell):
    assert export_for_phone(phone, "csv") == csv_cell
    assert export_for_phone(phone, "xlsx") == xlsx_cell


@pytest.mark.parametrize("phone", [None, "", "N/A"])
def test_missing_phone_stays_as_given(phone):
    assert format_phone_for_export(phone, "csv") == phone
    assert format_phone_for_export(phone, "xlsx") == phone
