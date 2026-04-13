import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { TkThemeToggle } from "thinkube-style/components/theme";
import { TkCard, TkCardHeader, TkCardTitle, TkCardDescription, TkCardContent } from "thinkube-style/components/cards-data";
import { TkButton } from "thinkube-style/components/buttons-badges";
import { TkBadge } from "thinkube-style/components/buttons-badges";
import { FolderOpen, HardDrive, FlaskConical } from "lucide-react";
import { UploadForm } from "./UploadForm";
import { FileList } from "./FileList";
import { SAMPLE_PROFILES, encodeProfileToParams } from "./api";

function NavBar() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isBrowse = location.pathname === "/browse";

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <HardDrive className="h-5 w-5" />
          SeaweedFS Gateway
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link to="/browse">
            <TkButton variant={isBrowse ? "default" : "ghost"} size="sm">
              <FolderOpen className="mr-1.5 h-4 w-4" />
              Browse
            </TkButton>
          </Link>
          <Link to="/">
            <TkButton variant={isHome ? "default" : "ghost"} size="sm">
              <FlaskConical className="mr-1.5 h-4 w-4" />
              Samples
            </TkButton>
          </Link>
          <TkThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function SamplesPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Sample Upload Profiles</h1>
      <p className="mb-6 text-muted-foreground">
        Test the gateway with these sample profiles. In production, calling services
        encode the profile configuration directly in the URL parameters.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(SAMPLE_PROFILES).map(([name, profile]) => (
          <Link key={name} to={`/upload?${encodeProfileToParams(profile)}`}>
            <TkCard className="h-full transition-colors hover:border-primary">
              <TkCardHeader>
                <TkCardTitle className="flex items-center gap-2">
                  {profile.title}
                  <TkBadge variant="outline">{name}</TkBadge>
                </TkCardTitle>
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
          <Route path="/" element={<SamplesPage />} />
          <Route path="/upload" element={<UploadForm />} />
          <Route path="/browse" element={<FileList />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
