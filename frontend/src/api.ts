/** HTTP client for the SeaweedFS gateway backend. */

export interface UploadProfile {
  title: string;
  description: string;
  files: {
    name: string;
    label: string;
    accept: string;
    required: boolean;
    multiple?: boolean;
  }[];
  metadata: {
    name: string;
    label: string;
    type: "text" | "select";
    options?: string[];
  }[];
  destination: string;
}

export interface UploadedFile {
  bucket: string;
  key: string;
  full_ref: string;
  size: number;
  content_type: string | null;
}

export interface UploadResult {
  doc_id: string;
  files: UploadedFile[];
}

export interface FileEntry {
  key: string;
  full_ref: string;
  size: number;
  last_modified: string;
}

export interface FileListResult {
  bucket: string;
  prefix: string;
  count: number;
  files: FileEntry[];
}

export async function fetchProfiles(): Promise<Record<string, UploadProfile>> {
  const resp = await fetch("/api/profiles");
  if (!resp.ok) throw new Error(`Failed to fetch profiles: ${resp.status}`);
  return resp.json();
}

export async function fetchProfile(name: string): Promise<UploadProfile> {
  const resp = await fetch(`/api/profiles/${name}`);
  if (!resp.ok) throw new Error(`Profile not found: ${name}`);
  return resp.json();
}

export async function uploadFiles(
  files: File[],
  tenant: string,
  keyPrefix: string,
  docId?: string,
): Promise<UploadResult> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  form.append("tenant", tenant);
  form.append("key_prefix", keyPrefix);
  if (docId) form.append("doc_id", docId);

  const resp = await fetch("/api/upload", { method: "POST", body: form });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Upload failed: ${detail}`);
  }
  return resp.json();
}

export async function listFiles(
  tenant: string,
  prefix = "",
): Promise<FileListResult> {
  const params = new URLSearchParams({ tenant, prefix });
  const resp = await fetch(`/api/list?${params}`);
  if (!resp.ok) throw new Error(`List failed: ${resp.status}`);
  return resp.json();
}

export async function deleteFile(fileRef: string): Promise<void> {
  const resp = await fetch(`/api/${fileRef}`, { method: "DELETE" });
  if (!resp.ok) throw new Error(`Delete failed: ${resp.status}`);
}

export function downloadUrl(fileRef: string): string {
  return `/api/download/${fileRef}`;
}
