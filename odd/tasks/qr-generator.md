# QR generator — SPECS.md item 2

Branch: `feat/qr-generator` (from `chore/add-ci` HEAD `df82e8a`). Delivery: local work-unit commits; push and PR remain user decisions. Checks: `pnpm lint`, `pnpm test`, `pnpm build`.

## Specs

S1. Pestaña "Generar QR"
- Acceptance: the app exposes a tab named exactly "Generar QR" alongside the existing scanning view; switching tabs keeps both views usable and accessible.

S2. - Soporte para: URL, texto, WiFi, contacto (vCard), email, teléfono
- Acceptance: the generator has a form for each of the six formats and produces a payload that `parseQR` recognizes as the corresponding type.

S3. - Usar librería `qrcode` o `qrcode.react`
- Acceptance: QR rendering uses the `qrcode` npm package (with `@types/qrcode`), declared in `package.json`/lockfile.

S4. - Descargar imagen PNG/JPG
- Acceptance: the UI offers download actions for both `image/png` and `image/jpeg`; each downloads the current QR with the right extension and opaque background.

## Tasks

- T1 — S2, S3 — Add `qrcode` + `@types/qrcode`, implement and test payload builders for all six formats — inline — done — commits: `3240b2f`, `28a4c35` (verifier probes)
- T2 — S3, S4 — Implement QR data-URL generation and PNG/JPG download helpers with focused tests — inline — done — commit: `61aaa82`
- T3 — S1, S2, S4 — Add the "Generar QR" tab, generator form, preview, styles, docs, and mark spec 2 done — inline — done — commit: `c79593c`

## Log

L1: Hagamos la segunda spec del SPECS.md

L2 (2026-11-23): Explored the repo. `SPECS.md` section 2 contains the four verbatim strings above. Current branch before starting was `chore/add-ci` (`df82e8a`), based on `main` (`28b9f79`); it carries the CI workflow and the `test` script, so the new branch starts there. `qrcode` was chosen over `qrcode.react` because its browser `toDataURL` supports both `image/png` and `image/jpeg` directly, which matches S4. `qrcode@1.5.4` and `@types/qrcode@1.5.6` were the published versions checked before implementation. Repository has Vitest + jsdom but no React Testing Library, so tests cover pure builders/export helpers and tab behavior is checked through lint/build plus a lightweight DOM render where practical.

L3 (2026-11-23): T1 RED observed (`Failed to resolve import "./qrPayloads"`, 84 baseline tests passing). Installed `qrcode@1.5.4` and `@types/qrcode@1.5.6`; wrote `src/types/qrGenerator.ts` and `src/utils/qrPayloads.ts`. GREEN: 91 tests passing. `pnpm lint` passes with 4 pre-existing warnings in ignored `coverage/`; `pnpm build` passes. Committed as `3240b2f` (396 changed lines including lockfile). Risk: item 5 (dependency install) -> independent verifier pending. RDD assess with untracked doc excluded: risk `medium`, `review_due: false`, reason `under_budget`; reviewed boundary remains `df82e8a`. First assess attempt failed on untracked files; rerun with the tool-provided explicit declaration.

L4 (2026-11-23): T2 RED observed (`Failed to resolve import "./qrExport"`, 91 tests passing). Implemented `src/utils/qrExport.ts` with `generateQRDataUrl`, `downloadDataUrl`, and `downloadQR`; PNG uses `image/png`, JPG uses `image/jpeg` with quality 0.92 and opaque white modules. GREEN: 96 tests passing; lint/build unchanged. Committed as `61aaa82` (120 lines). RDD assess from the same boundary: risk `medium`, `review_due: false`, `under_budget`; boundary still `df82e8a`.

L5 (2026-11-23): T3 RED observed (no `[role="tab"]` elements, 96 tests passing). Added `QRGenerator` with six formats, live preview, PNG/JPG downloads, tabs in `App.tsx`, styles, README docs, and marked SPECS.md #2 done. First lint found `react-hooks/set-state-in-effect` in the preview effect; fixed by keying preview state to its payload and only setting it in the async callback. GREEN: 99 tests, lint (4 pre-existing coverage warnings), build. Committed as `c79593c`. RDD assess: `medium`, `under_budget`, no native review.

L6 (2026-11-23): Independent verifier for T1 returned no blockers: S2/S3 met for that candidate; S1/S4 were out of its candidate scope and later implemented. Its 10 durable probes were added as `src/utils/qrPayloads.verifier.test.ts` and committed as `28a4c35`. Verifier advisory: under vitest the Node renderer emits PNG for `image/jpeg`; checked the production bundle (`qrcode` browser field maps `lib/index.js` to `lib/browser.js`) and confirmed the built code uses `canvas.toDataURL(type, quality)`, so JPG MIME works in the browser; real-browser download remains unrun here. Verifier scratch dirs under `/tmp/opencode/qr-verify-scratch` removed. Final spot check: `pnpm lint` / `pnpm test` (109 passed) / `pnpm build` all exit 0. All RDD assessments in this feature: `medium`, `under_budget`, no native review.

L7 (2026-11-23): User authorized push and PR. Pushed `feat/qr-generator` with upstream tracking and opened PR #3 -> `main`: https://github.com/papulodev/qr-lector/pull/3 (OPEN, 4 commits). Reused this repo's established PR convention (Summary / Changes / Test plan / Checklist, no issue linkage or `type:*` label): there are no issues, no `status:approved` or `type:*` labels, no PR template and no PR-validation job; only `.github/workflows/ci.yml` runs lint/test/build, matching PRs #1 and #2. PR body records the unverified real-browser JPG download as an unchecked item. Untracked `odd/` stays local; no further commits intended.
