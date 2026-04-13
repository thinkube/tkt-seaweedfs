"""API endpoint tests for tkt-seaweedfs gateway.

Run against a live instance:
    GATEWAY_URL=http://localhost:8080 pytest tests/test_api.py -v
"""

import os
import uuid

import httpx
import pytest

GATEWAY_URL = os.environ.get("GATEWAY_URL", "http://localhost:8080")


@pytest.fixture
def client():
    return httpx.Client(base_url=GATEWAY_URL, timeout=30)


@pytest.fixture
def test_tenant():
    return f"test-{uuid.uuid4().hex[:8]}"


class TestHealth:
    def test_health_returns_200(self, client: httpx.Client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"


class TestRoundTrip:
    """Full upload → list → download → delete cycle."""

    def test_upload_download_delete(self, client: httpx.Client, test_tenant: str):
        content = b'{"test": "data", "value": 42}'
        filename = "test-doc.json"

        # Upload
        resp = client.post(
            "/api/upload",
            data={"tenant": test_tenant, "key_prefix": "tests/"},
            files=[("files", (filename, content, "application/json"))],
        )
        assert resp.status_code == 200
        upload_data = resp.json()
        assert len(upload_data["files"]) == 1
        full_ref = upload_data["files"][0]["full_ref"]
        assert full_ref.startswith(f"tenant-{test_tenant}/")

        # List
        resp = client.get("/api/list", params={"tenant": test_tenant, "prefix": "tests/"})
        assert resp.status_code == 200
        list_data = resp.json()
        assert list_data["count"] >= 1
        refs = [f["full_ref"] for f in list_data["files"]]
        assert full_ref in refs

        # Download
        resp = client.get(f"/api/download/{full_ref}")
        assert resp.status_code == 200
        assert resp.content == content

        # Delete
        resp = client.delete(f"/api/{full_ref}")
        assert resp.status_code == 200

        # Verify gone
        resp = client.get(f"/api/download/{full_ref}")
        assert resp.status_code == 404

    def test_upload_binary_file(self, client: httpx.Client, test_tenant: str):
        content = b"\x00\x01\x02\xff" * 100
        filename = "binary-test.bin"

        resp = client.post(
            "/api/upload",
            data={"tenant": test_tenant, "key_prefix": "tests/binary/"},
            files=[("files", (filename, content, "application/octet-stream"))],
        )
        assert resp.status_code == 200
        full_ref = resp.json()["files"][0]["full_ref"]

        # Download and verify
        resp = client.get(f"/api/download/{full_ref}")
        assert resp.status_code == 200
        assert resp.content == content

        # Cleanup
        client.delete(f"/api/{full_ref}")

    def test_upload_multiple_files(self, client: httpx.Client, test_tenant: str):
        files = [
            ("files", ("source.txt", b"Hello world", "text/plain")),
            ("files", ("target.txt", b"Hola mundo", "text/plain")),
        ]
        resp = client.post(
            "/api/upload",
            data={"tenant": test_tenant, "key_prefix": "tests/multi/"},
            files=files,
        )
        assert resp.status_code == 200
        upload_data = resp.json()
        assert len(upload_data["files"]) == 2

        # Cleanup
        for f in upload_data["files"]:
            client.delete(f"/api/{f['full_ref']}")


class TestBuckets:
    def test_create_bucket(self, client: httpx.Client, test_tenant: str):
        resp = client.post("/api/buckets", data={"tenant": test_tenant})
        assert resp.status_code == 200
        data = resp.json()
        assert data["bucket"] == f"tenant-{test_tenant}"
        assert data["created"] is True

    def test_create_bucket_idempotent(self, client: httpx.Client, test_tenant: str):
        client.post("/api/buckets", data={"tenant": test_tenant})
        resp = client.post("/api/buckets", data={"tenant": test_tenant})
        assert resp.status_code == 200
        assert resp.json()["created"] is False
