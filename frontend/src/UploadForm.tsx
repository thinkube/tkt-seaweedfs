import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { TkCard, TkCardHeader, TkCardTitle, TkCardDescription, TkCardContent, TkCardFooter } from "thinkube-style/components/cards-data";
import { TkButton } from "thinkube-style/components/buttons-badges";
import { TkInput, TkLabel } from "thinkube-style/components/forms-inputs";
import { TkDropZone } from "thinkube-style/components/forms-inputs";
import { TkSelect, TkSelectTrigger, TkSelectValue, TkSelectContent, TkSelectItem } from "thinkube-style/components/forms-inputs";
import { TkSuccessAlert, TkErrorAlert } from "thinkube-style/components/feedback";
import { TkProgress } from "thinkube-style/components/feedback";
import { Upload, ArrowLeft } from "lucide-react";
import { parseProfileFromParams, uploadFiles, type UploadResult } from "./api";

export function UploadForm() {
  const [searchParams] = useSearchParams();

  const profile = useMemo(() => parseProfileFromParams(searchParams), [searchParams]);

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [progress, setProgress] = useState(0);

  // Form state
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const [metadata, setMetadata] = useState<Record<string, string>>(() => {
    // Pre-fill metadata from additional URL params not part of profile encoding
    const prefilled: Record<string, string> = {};
    if (profile) {
      for (const m of profile.metadata) {
        const val = searchParams.get(m.name);
        if (val) prefilled[m.name] = val;
      }
    }
    return prefilled;
  });
  const [tenant, setTenant] = useState(searchParams.get("tenant") ?? "default");

  const handleSubmit = async () => {
    if (!profile) return;

    const allFiles: File[] = [];
    for (const field of profile.files) {
      const files = selectedFiles[field.name] ?? [];
      if (field.required && files.length === 0) {
        setError(`${field.label} is required`);
        return;
      }
      allFiles.push(...files);
    }

    setError(null);
    setResult(null);
    setUploading(true);
    setProgress(20);

    try {
      const keyPrefix = profile.destination
        .replace("{doc_id}", "")
        .replace("{prefix}", metadata["prefix"] ?? "");
      setProgress(50);
      const uploadResult = await uploadFiles(allFiles, tenant, keyPrefix);
      setProgress(100);
      setResult(uploadResult);
      setSelectedFiles({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <TkErrorAlert title="Invalid profile">
          Missing or invalid profile parameters. A <code>title</code> and at least one <code>file</code> parameter are required.
        </TkErrorAlert>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to samples
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to samples
      </Link>

      <TkCard>
        <TkCardHeader>
          <TkCardTitle>{profile.title}</TkCardTitle>
          {profile.description && (
            <TkCardDescription>{profile.description}</TkCardDescription>
          )}
        </TkCardHeader>
        <TkCardContent className="space-y-6">
          {/* Tenant */}
          <div className="space-y-2">
            <TkLabel htmlFor="tenant">Tenant</TkLabel>
            <TkInput
              id="tenant"
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              placeholder="Tenant slug (e.g. default, myorg)"
            />
          </div>

          {/* File drop zones */}
          {profile.files.map((field) => (
            <TkDropZone
              key={field.name}
              label={field.label}
              accept={field.accept}
              multiple={field.multiple}
              required={field.required}
              files={selectedFiles[field.name] ?? []}
              onFilesChange={(files) =>
                setSelectedFiles((prev) => ({ ...prev, [field.name]: files }))
              }
              disabled={uploading}
            />
          ))}

          {/* Metadata fields */}
          {profile.metadata.map((field) => (
            <div key={field.name} className="space-y-2">
              <TkLabel htmlFor={field.name}>{field.label}</TkLabel>
              {field.type === "select" && field.options ? (
                <TkSelect
                  value={metadata[field.name] ?? ""}
                  onValueChange={(val) => setMetadata((prev) => ({ ...prev, [field.name]: val }))}
                >
                  <TkSelectTrigger>
                    <TkSelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </TkSelectTrigger>
                  <TkSelectContent>
                    {field.options.map((opt) => (
                      <TkSelectItem key={opt} value={opt}>
                        {opt}
                      </TkSelectItem>
                    ))}
                  </TkSelectContent>
                </TkSelect>
              ) : (
                <TkInput
                  id={field.name}
                  value={metadata[field.name] ?? ""}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  placeholder={field.label}
                />
              )}
            </div>
          ))}

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Uploading...</p>
              <TkProgress value={progress} />
            </div>
          )}

          {/* Error */}
          {error && (
            <TkErrorAlert title="Upload Error">{error}</TkErrorAlert>
          )}

          {/* Success */}
          {result && (
            <TkSuccessAlert title="Upload Complete">
              <p>Document ID: <code className="font-mono text-sm">{result.doc_id}</code></p>
              <ul className="mt-2 space-y-1 text-sm">
                {result.files.map((f) => (
                  <li key={f.full_ref} className="font-mono">{f.full_ref}</li>
                ))}
              </ul>
            </TkSuccessAlert>
          )}
        </TkCardContent>

        <TkCardFooter className="flex gap-2">
          <TkButton onClick={handleSubmit} disabled={uploading}>
            <Upload className="mr-1.5 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload"}
          </TkButton>
          <Link to="/">
            <TkButton variant="outline">Cancel</TkButton>
          </Link>
        </TkCardFooter>
      </TkCard>
    </div>
  );
}
