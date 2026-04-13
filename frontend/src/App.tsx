import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { TkThemeToggle } from "thinkube-style/components/theme";
import { TkCard, TkCardHeader, TkCardTitle, TkCardDescription, TkCardContent } from "thinkube-style/components/cards-data";
import { TkButton } from "thinkube-style/components/buttons-badges";
import { Upload, FolderOpen, HardDrive } from "lucide-react";
import { UploadForm } from "./UploadForm";
import { FileList } from "./FileList";
import { fetchProfiles, type UploadProfile } from "./api";

function NavBar() {
  const location = useLocation();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <HardDrive className="h-5 w-5" />
          SeaweedFS Gateway
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link to="/">
            <TkButton variant={location.pathname === "/" ? "default" : "ghost"} size="sm">
              <Upload className="mr-1.5 h-4 w-4" />
              Upload
            </TkButton>
          </Link>
          <Link to="/browse">
            <TkButton variant={location.pathname === "/browse" ? "default" : "ghost"} size="sm">
              <FolderOpen className="mr-1.5 h-4 w-4" />
              Browse
            </TkButton>
          </Link>
          <TkThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function HomePage() {
  const [profiles, setProfiles] = useState<Record<string, UploadProfile>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles()
      .then(setProfiles)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">File Upload</h1>
      <p className="mb-6 text-muted-foreground">
        Choose an upload profile to get started.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(profiles).map(([name, profile]) => (
          <Link key={name} to={`/upload/${name}`}>
            <TkCard className="h-full transition-colors hover:border-primary">
              <TkCardHeader>
                <TkCardTitle>{profile.title}</TkCardTitle>
                <TkCardDescription>{profile.description}</TkCardDescription>
              </TkCardHeader>
              <TkCardContent>
                <p className="text-sm text-muted-foreground">
                  {profile.files.length} file{profile.files.length > 1 ? "s" : ""}
                  {profile.metadata.length > 0 &&
                    ` + ${profile.metadata.length} metadata field${profile.metadata.length > 1 ? "s" : ""}`}
                </p>
              </TkCardContent>
            </TkCard>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload/:profileName" element={<UploadForm />} />
          <Route path="/browse" element={<FileList />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
