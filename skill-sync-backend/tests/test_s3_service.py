"""S3Service with a fake boto3 client: key layout, metadata, and graceful failure."""

import pytest
from botocore.exceptions import ClientError

from app.services import s3_service as s3_module
from app.services.s3_service import S3Service


class FakeS3Client:
    def __init__(self, fail=False):
        self.fail = fail
        self.uploads = []
        self.deleted = []
        self.downloads = []

    def _maybe_fail(self, op):
        if self.fail:
            raise ClientError({"Error": {"Code": "AccessDenied", "Message": "denied"}}, op)

    def upload_fileobj(self, fileobj, bucket, key, ExtraArgs=None):
        self._maybe_fail("PutObject")
        self.uploads.append((bucket, key, fileobj.read(), ExtraArgs))

    def delete_object(self, Bucket, Key):
        self._maybe_fail("DeleteObject")
        self.deleted.append((Bucket, Key))

    def download_file(self, bucket, key, path):
        self._maybe_fail("GetObject")
        self.downloads.append((bucket, key, path))
        with open(path, "wb") as handle:
            handle.write(b"%PDF")


@pytest.fixture
def configured(monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "AKIATEST")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "secret")
    monkeypatch.setenv("AWS_S3_BUCKET_NAME", "resumes-test")
    monkeypatch.setenv("AWS_REGION", "ap-south-1")

    def make(fail=False):
        client = FakeS3Client(fail=fail)
        monkeypatch.setattr(s3_module.boto3, "client", lambda *args, **kwargs: client)
        return S3Service(), client

    return make


def test_disabled_without_credentials(tmp_path):
    service = S3Service()
    assert service.is_enabled() is False
    assert service.upload_resume(str(tmp_path / "cv.pdf"), 1, "cv.pdf") is None
    assert service.generate_presigned_url("k") is None
    assert service.delete_resume("k") is False
    assert service.download_resume("k", str(tmp_path / "out.pdf")) is False


def test_disabled_when_the_client_cannot_be_built(monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "AKIATEST")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "secret")
    monkeypatch.setenv("AWS_S3_BUCKET_NAME", "resumes-test")

    def broken(*args, **kwargs):
        raise ValueError("bad region")

    monkeypatch.setattr(s3_module.boto3, "client", broken)
    assert S3Service().is_enabled() is False


def test_uploads_base_and_tailored_resumes(configured, tmp_path):
    service, client = configured()
    path = tmp_path / "cv.pdf"
    path.write_bytes(b"%PDF-1.4")

    base_key = service.upload_resume(str(path), 7, "cv.pdf")
    tailored_key = service.upload_resume(str(path), 7, "cv.docx", is_tailored=True, internship_id=3)

    assert base_key.startswith("resumes/7/base/") and base_key.endswith("_cv.pdf")
    assert tailored_key.startswith("resumes/7/tailored/3/")
    bucket, key, body, extra = client.uploads[0]
    assert (bucket, key, body) == ("resumes-test", base_key, b"%PDF-1.4")
    assert extra["ContentType"] == "application/pdf"
    assert extra["Metadata"] == {
        "student_id": "7",
        "original_filename": "cv.pdf",
        "is_tailored": "False",
        "internship_id": "",
    }
    assert client.uploads[1][3]["ContentType"].endswith("wordprocessingml.document")


def test_public_url_delete_and_download(configured, tmp_path):
    service, client = configured()

    assert service.generate_presigned_url("resumes/1/base/cv.pdf") == (
        "https://resumes-test.s3.ap-south-1.amazonaws.com/resumes/1/base/cv.pdf"
    )
    assert service.delete_resume("k1") is True
    assert client.deleted == [("resumes-test", "k1")]

    target = tmp_path / "nested" / "cv.pdf"
    assert service.download_resume("k2", str(target)) is True
    assert target.read_bytes() == b"%PDF"


def test_client_errors_return_failure(configured, tmp_path):
    service, _ = configured(fail=True)
    path = tmp_path / "cv.pdf"
    path.write_bytes(b"x")

    assert service.upload_resume(str(path), 1, "cv.pdf") is None
    assert service.upload_resume(str(tmp_path / "missing.pdf"), 1, "cv.pdf") is None
    assert service.delete_resume("k") is False
    assert service.download_resume("k", str(tmp_path / "o.pdf")) is False


@pytest.mark.parametrize(
    "name,expected",
    [
        ("a.PDF", "application/pdf"),
        ("a.doc", "application/msword"),
        ("a.txt", "text/plain"),
        ("a.bin", "application/octet-stream"),
    ],
)
def test_content_types(name, expected):
    assert S3Service()._get_content_type(name) == expected
