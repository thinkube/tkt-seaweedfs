# tkt-seaweedfs

A Thinkube template: a file gateway in front of SeaweedFS object storage.

It deploys a FastAPI backend and a React upload page. The backend holds the
storage credentials, so the apps that use it never do, and it is the single
place to change if the storage behind it changes. Upload profiles, defined in
`profiles.json`, decide what each workflow's form asks for: how many files,
which file types, and which metadata fields.

Deploy it from thinkube-control, or with `deploy_template` over MCP. The
walkthrough is on the documentation site, under Playbooks: "Store and fetch
files with the file gateway".

## What is here

| Path | What it is |
|---|---|
| `server.py` | the gateway's FastAPI backend |
| `profiles.json` | the upload profiles |
| `frontend/` | the React upload page |
| `manifest.yaml` | the template's metadata for the catalogue |
| `thinkube.yaml` | what gets deployed |
| `tests/` | the backend tests |

## License

MIT. Code generated from this template is yours: no attribution required, and
you may license the app you build however you choose. See [LICENSE](LICENSE).
