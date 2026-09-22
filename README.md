# tkt-seaweedfs

A Thinkube app template: an upload page and a REST gateway over the core
SeaweedFS object storage.

## What it does

It deploys one container on port 8080: a FastAPI backend that also serves a
React upload page. The backend holds the storage credentials, so the apps
that use it never do, and it is the single place to change if the storage
behind it changes.

- **Storage.** The backend talks S3 to the core SeaweedFS component. The
  platform gives it `SEAWEEDFS_ENDPOINT`, `SEAWEEDFS_ACCESS_KEY` and
  `SEAWEEDFS_SECRET_KEY`; without an endpoint it uses
  `http://seaweedfs-s3.seaweedfs.svc.cluster.local:8333` (`server.py:24`).
- **Tenants.** Each tenant has its own bucket, `tenant-<tenant>`.
- **REST API:**

  | Method | Path | What it does |
  |---|---|---|
  | GET | `/api/health` | checks that SeaweedFS answers |
  | POST | `/api/buckets` | creates `tenant-<tenant>` with `documents/` and `sessions/` |
  | POST | `/api/upload` | uploads files under `key_prefix`; `{doc_id}` in the prefix becomes the given or a new id |
  | GET | `/api/list` | lists a tenant's files, by prefix |
  | GET | `/api/download/<bucket>/<key>` | downloads a file |
  | DELETE | `/api/<bucket>/<key>` | deletes a file |

- **Upload page.** `/upload` builds its form from URL parameters: `title`,
  `description`, one `file=name|label|accept|flags` per file (flags
  `required`, `multiple`), one `meta=name|label|type|options` per metadata
  field, `dest`, the destination prefix, and `tenant`. A calling app sends a
  person to that URL. `/` lists sample profiles. `/browse` lists a tenant's
  files, with download and delete.

## How it reaches a user

A person deploys it from the Templates page in thinkube-control, part of
[Thinkube](https://github.com/thinkube/thinkube), or with `deploy_template`
over MCP. It talks to the core `seaweedfs` component, which the Thinkube
installer installs. It is not installed on its own.

The walkthrough is on the documentation site, under Playbooks:
[Store and fetch files with the file gateway](https://github.com/thinkube/thinkube.org/blob/main/modules/ROOT/pages/playbooks/store-and-fetch-files.adoc).

## What is here

| Path | What it is |
|---|---|
| `server.py` | the gateway's FastAPI backend |
| `profiles.json` | sample upload profiles (`aligner`, `texplitter`, `generic`), checked by `tests/test_profiles.py`; the page does not read this file |
| `frontend/` | the React upload page; its sample profiles are in `frontend/src/api.ts` |
| `manifest.yaml` | the template's metadata for the catalogue |
| `thinkube.yaml` | what gets deployed |
| `tests/` | the backend tests |

## Working on it

`tests/test_profiles.py` runs without a backend. `tests/test_api.py` runs
against a running gateway:

```bash
GATEWAY_URL=http://localhost:8080 pytest tests/test_api.py -v
```

The platform does not run these tests on deploy (`test.enabled: false` in
`thinkube.yaml`).

## License

MIT. Code generated from this template is yours: no attribution required, and
you may license the app you build however you choose. See [LICENSE](LICENSE).

Copyright Alejandro Martínez Corriá and the Thinkube contributors
