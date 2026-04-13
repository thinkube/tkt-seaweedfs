import { useState } from "react";
import { TkCard, TkCardHeader, TkCardTitle, TkCardContent } from "thinkube-style/components/cards-data";
import { TkButton } from "thinkube-style/components/buttons-badges";
import { TkBadge } from "thinkube-style/components/buttons-badges";
import { TkInput, TkLabel } from "thinkube-style/components/forms-inputs";
import { TkTable, TkTableHeader, TkTableBody, TkTableRow, TkTableHead, TkTableCell } from "thinkube-style/components/tables";
import { TkErrorAlert } from "thinkube-style/components/feedback";
import { Search, Download, Trash2, FolderOpen } from "lucide-react";
import { listFiles, deleteFile, downloadUrl, type FileEntry } from "./api";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(key: string): string {
  const parts = key.split(".");
  return parts.length > 1 ? (parts.pop() ?? "").toUpperCase() : "FILE";
}

export function FileList() {
  const [tenant, setTenant] = useState("default");
  const [prefix, setPrefix] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const result = await listFiles(tenant, prefix);
      setFiles(result.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to list files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileRef: string) => {
    if (!confirm(`Delete ${fileRef}?`)) return;
    try {
      await deleteFile(fileRef);
      setFiles((prev) => prev.filter((f) => f.full_ref !== fileRef));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Browse Files</h1>

      {/* Search controls */}
      <TkCard className="mb-6">
        <TkCardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px] flex-1 space-y-2">
              <TkLabel htmlFor="browse-tenant">Tenant</TkLabel>
              <TkInput
                id="browse-tenant"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                placeholder="Tenant slug"
              />
            </div>
            <div className="min-w-[200px] flex-1 space-y-2">
              <TkLabel htmlFor="browse-prefix">Prefix filter</TkLabel>
              <TkInput
                id="browse-prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. documents/"
              />
            </div>
            <TkButton onClick={handleSearch} disabled={loading}>
              <Search className="mr-1.5 h-4 w-4" />
              {loading ? "Searching..." : "Search"}
            </TkButton>
          </div>
        </TkCardContent>
      </TkCard>

      {error && (
        <TkErrorAlert title="Error" className="mb-4">{error}</TkErrorAlert>
      )}

      {/* Results */}
      {searched && (
        <TkCard>
          <TkCardHeader>
            <TkCardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              tenant-{tenant}{prefix ? `/${prefix}` : ""}
              <TkBadge variant="secondary" className="ml-2">{files.length} files</TkBadge>
            </TkCardTitle>
          </TkCardHeader>
          <TkCardContent>
            {files.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No files found.</p>
            ) : (
              <TkTable>
                <TkTableHeader>
                  <TkTableRow>
                    <TkTableHead>File</TkTableHead>
                    <TkTableHead>Type</TkTableHead>
                    <TkTableHead>Size</TkTableHead>
                    <TkTableHead>Modified</TkTableHead>
                    <TkTableHead className="w-[100px]">Actions</TkTableHead>
                  </TkTableRow>
                </TkTableHeader>
                <TkTableBody>
                  {files.map((file) => (
                    <TkTableRow key={file.full_ref}>
                      <TkTableCell className="max-w-[300px] truncate font-mono text-sm">
                        {file.key}
                      </TkTableCell>
                      <TkTableCell>
                        <TkBadge variant="outline">{fileExtension(file.key)}</TkBadge>
                      </TkTableCell>
                      <TkTableCell>{formatSize(file.size)}</TkTableCell>
                      <TkTableCell className="text-sm text-muted-foreground">
                        {new Date(file.last_modified).toLocaleString()}
                      </TkTableCell>
                      <TkTableCell>
                        <div className="flex gap-1">
                          <a href={downloadUrl(file.full_ref)} download>
                            <TkButton variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </TkButton>
                          </a>
                          <TkButton
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(file.full_ref)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </TkButton>
                        </div>
                      </TkTableCell>
                    </TkTableRow>
                  ))}
                </TkTableBody>
              </TkTable>
            )}
          </TkCardContent>
        </TkCard>
      )}
    </div>
  );
}
