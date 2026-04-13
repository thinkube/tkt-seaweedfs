/** HTTP client for the SeaweedFS gateway backend. */

// ---------------------------------------------------------------------------
// Profile types
// ---------------------------------------------------------------------------

export interface ProfileFile {
  name: string;
  label: string;
  accept: string;
  required: boolean;
  multiple?: boolean;
}

export interface ProfileMeta {
  name: string;
  label: string;
  type: "text" | "select";
  options?: string[];
}

export interface UploadProfile {
  title: string;
  description: string;
  files: ProfileFile[];
  metadata: ProfileMeta[];
  destination: string;
}

// ---------------------------------------------------------------------------
// Parse profile from URL search params
// ---------------------------------------------------------------------------

/**
 * Parse an upload profile from URL query parameters.
 *
 * Encoding:
 *   ?title=...&description=...
 *   &file=name|label|accept|flags    (flags: required, multiple, required,multiple)
 *   &meta=name|label|type|options    (options comma-separated for selects)
 *   &dest=documents/{doc_id}/source/
 */
export function parseProfileFromParams(params: URLSearchParams): UploadProfile | null {
  const title = params.get("title");
  if (!title) return null;

  const files: ProfileFile[] = params.getAll("file").map((raw) => {
    const [name = "", label = "", accept = "*", flags = ""] = raw.split("|");
    return {
      name,
      label: decodeURIComponent(label),
      accept,
      required: flags.includes("required"),
      multiple: flags.includes("multiple"),
    };
  });

  const metadata: ProfileMeta[] = params.getAll("meta").map((raw) => {
    const [name = "", label = "", type = "text", optionsStr = ""] = raw.split("|");
    const entry: ProfileMeta = {
      name,
      label: decodeURIComponent(label),
      type: type === "select" ? "select" : "text",
    };
    if (type === "select" && optionsStr) {
      entry.options = optionsStr.split(",");
    }
    return entry;
  });

  return {
    title,
    description: params.get("description") ?? "",
    files,
    metadata,
    destination: params.get("dest") ?? "",
  };
}

/**
 * Encode a profile into URL search params string.
 */
export function encodeProfileToParams(profile: UploadProfile): string {
  const params = new URLSearchParams();
  params.set("title", profile.title);
  if (profile.description) params.set("description", profile.description);

  for (const f of profile.files) {
    const flags = [f.required ? "required" : "", f.multiple ? "multiple" : ""]
      .filter(Boolean)
      .join(",");
    params.append("file", `${f.name}|${f.label}|${f.accept}|${flags}`);
  }

  for (const m of profile.metadata) {
    const opts = m.type === "select" && m.options ? m.options.join(",") : "";
    params.append("meta", `${m.name}|${m.label}|${m.type}|${opts}`);
  }

  if (profile.destination) params.set("dest", profile.destination);

  return params.toString();
}

// ---------------------------------------------------------------------------
// Sample profiles for the test page
// ---------------------------------------------------------------------------

export const SAMPLE_PROFILES: Record<string, UploadProfile> = {
  aligner: {
    title: "Bilingual Document Alignment",
    description: "Upload source and target documents for alignment",
    files: [
      { name: "source", label: "Source document", accept: ".txt,.html,.xml", required: true },
      { name: "target", label: "Target document", accept: ".txt,.html,.xml", required: true },
    ],
    metadata: [
      { name: "source_lang", label: "Source language", type: "select", options: ["en", "es", "fr", "de", "pt", "it", "nl", "ru", "zh", "ja", "ko", "ar"] },
      { name: "target_lang", label: "Target language", type: "select", options: ["en", "es", "fr", "de", "pt", "it", "nl", "ru", "zh", "ja", "ko", "ar"] },
    ],
    destination: "documents/{doc_id}/source/",
  },
  texplitter: {
    title: "Document Splitting",
    description: "Upload a document for markup-aware splitting",
    files: [
      { name: "document", label: "Document to split", accept: ".html,.xml,.xliff,.dita", required: true },
    ],
    metadata: [],
    destination: "documents/{doc_id}/source/",
  },
  generic: {
    title: "File Upload",
    description: "Upload files to object storage",
    files: [
      { name: "files", label: "Files", accept: "*", required: true, multiple: true },
    ],
    metadata: [
      { name: "prefix", label: "Storage prefix", type: "text" },
    ],
    destination: "{prefix}/",
  },
};

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

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
