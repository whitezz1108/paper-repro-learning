# Paper Repro Learning

Desktop paper-learning frontend with a five-screen video landing page, 222-paper catalogue, paper pages, experiment planning, recorded replay and result evidence.

## Build

Python 3 and Node.js are sufficient. Run:

```sh
mkdir -p dist
python scripts/build.py
```

Copy the contents of `dist/` into `docs/` to update the GitHub Pages deployment. Pages publishes `main:/docs`.

## Scope

This is a frontend design and historical-record viewer. Analysis/video generation, new experiment execution, result writeback and MCP are not connected. Existing runs are archived records, not fresh verification. Paper PDFs and excerpts retain their original authorship. PDF.js retains its bundled license notices. Likes and drafts are browser-local where supported.

The landing page embeds its assets so the isolated iframe does not depend on authenticated subresource requests. The paper workspace retains its sandbox and content security policy.
