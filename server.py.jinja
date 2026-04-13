"""SeaweedFS File Gateway — FastAPI backend."""

import os
import uuid
from pathlib import Path
from typing import Annotated

import boto3
import uvicorn
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SEAWEEDFS_ENDPOINT = os.environ.get("SEAWEEDFS_ENDPOINT", "http://seaweedfs-s3.seaweedfs.svc.cluster.local:8333")
SEAWEEDFS_ACCESS_KEY = os.environ.get("SEAWEEDFS_ACCESS_KEY", "")
SEAWEEDFS_SECRET_KEY = os.environ.get("SEAWEEDFS_SECRET_KEY", "")

# ---------------------------------------------------------------------------
# S3 client
# ---------------------------------------------------------------------------


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=SEAWEEDFS_ENDPOINT,
        aws_access_key_id=SEAWEEDFS_ACCESS_KEY,
        aws_secret_access_key=SEAWEEDFS_SECRET_KEY,
        config=BotoConfig(signature_version="s3v4"),
        region_name="us-east-1",
    )


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SeaweedFS File Gateway",
    description="REST API and upload UI for SeaweedFS object storage",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health():
    """Health check — verifies SeaweedFS connectivity."""
    try:
        s3 = get_s3_client()
        s3.list_buckets()
        return {"status": "healthy", "seaweedfs": "connected"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"SeaweedFS unreachable: {exc}")


# ---------------------------------------------------------------------------
# Buckets
# ---------------------------------------------------------------------------


@app.post("/api/buckets")
async def create_bucket(tenant: Annotated[str, Form()]):
    """Create a tenant bucket with standard directory structure."""
    bucket_name = f"tenant-{tenant}"
    s3 = get_s3_client()
    try:
        s3.head_bucket(Bucket=bucket_name)
        return {"bucket": bucket_name, "created": False, "message": "Bucket already exists"}
    except ClientError as e:
        if e.response["Error"]["Code"] == "404":
            s3.create_bucket(Bucket=bucket_name)
            # Create placeholder directories
            for prefix in ["documents/", "sessions/"]:
                s3.put_object(Bucket=bucket_name, Key=prefix, Body=b"")
            return {"bucket": bucket_name, "created": True}
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------


@app.post("/api/upload")
async def upload_files(
    files: list[UploadFile] = File(...),
    tenant: str = Form(...),
    key_prefix: str = Form(""),
    doc_id: str = Form(""),
):
    """Upload one or more files to a tenant bucket.

    If ``doc_id`` is empty a new UUID is generated.  Files are stored under
    ``{key_prefix}{filename}`` inside bucket ``tenant-{tenant}``.
    """
    bucket_name = f"tenant-{tenant}"
    if not doc_id:
        doc_id = str(uuid.uuid4())

    s3 = get_s3_client()

    # Ensure bucket exists
    try:
        s3.head_bucket(Bucket=bucket_name)
    except ClientError:
        s3.create_bucket(Bucket=bucket_name)

    uploaded: list[dict] = []
    for upload_file in files:
        resolved_prefix = key_prefix.replace("{doc_id}", doc_id)
        if resolved_prefix and not resolved_prefix.endswith("/"):
            resolved_prefix += "/"
        object_key = f"{resolved_prefix}{upload_file.filename}"

        content = await upload_file.read()
        s3.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=content,
            ContentType=upload_file.content_type or "application/octet-stream",
        )
        uploaded.append({
            "bucket": bucket_name,
            "key": object_key,
            "full_ref": f"{bucket_name}/{object_key}",
            "size": len(content),
            "content_type": upload_file.content_type,
        })

    return {"doc_id": doc_id, "files": uploaded}


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------


@app.get("/api/download/{file_ref:path}")
async def download_file(file_ref: str):
    """Download a file by its full reference (``bucket/key``)."""
    parts = file_ref.split("/", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="file_ref must be bucket/key")
    bucket_name, object_key = parts

    s3 = get_s3_client()
    try:
        resp = s3.get_object(Bucket=bucket_name, Key=object_key)
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code in ("404", "NoSuchKey", "NoSuchBucket"):
            raise HTTPException(status_code=404, detail=f"File not found: {file_ref}")
        raise HTTPException(status_code=500, detail=str(e))

    content_type = resp.get("ContentType", "application/octet-stream")
    filename = object_key.rsplit("/", 1)[-1]

    return StreamingResponse(
        resp["Body"].iter_chunks(chunk_size=65536),
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@app.get("/api/list")
async def list_files(
    tenant: str = Query(...),
    prefix: str = Query(""),
    max_keys: int = Query(1000, ge=1, le=10000),
):
    """List files in a tenant bucket, optionally filtered by prefix."""
    bucket_name = f"tenant-{tenant}"
    s3 = get_s3_client()

    try:
        resp = s3.list_objects_v2(
            Bucket=bucket_name,
            Prefix=prefix,
            MaxKeys=max_keys,
        )
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code in ("404", "NoSuchBucket"):
            raise HTTPException(status_code=404, detail=f"Bucket not found: {bucket_name}")
        raise HTTPException(status_code=500, detail=str(e))

    files = []
    for obj in resp.get("Contents", []):
        if obj["Key"].endswith("/"):
            continue  # skip directory placeholders
        files.append({
            "key": obj["Key"],
            "full_ref": f"{bucket_name}/{obj['Key']}",
            "size": obj["Size"],
            "last_modified": obj["LastModified"].isoformat(),
        })

    return {
        "bucket": bucket_name,
        "prefix": prefix,
        "count": len(files),
        "files": files,
    }


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@app.delete("/api/{file_ref:path}")
async def delete_file(file_ref: str):
    """Delete a file by its full reference (``bucket/key``)."""
    parts = file_ref.split("/", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="file_ref must be bucket/key")
    bucket_name, object_key = parts

    s3 = get_s3_client()
    try:
        s3.head_object(Bucket=bucket_name, Key=object_key)
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code in ("404", "NoSuchKey"):
            raise HTTPException(status_code=404, detail=f"File not found: {file_ref}")
        raise HTTPException(status_code=500, detail=str(e))

    s3.delete_object(Bucket=bucket_name, Key=object_key)
    return {"deleted": file_ref}


# ---------------------------------------------------------------------------
# Serve React frontend (static files built at image build time)
# ---------------------------------------------------------------------------

FRONTEND_DIR = Path(__file__).parent / "static"
if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
