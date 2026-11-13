# Rename Field tutorial implementation plan

> For agentic workers: use subagent-driven-development, execute continuously within the authorized app/deployment scope.

**Goal:** Publish an interactive Korean Rename Field tutorial to GitHub Pages.
**Architecture:** Static ES modules, class screens/services, data JSON, build-named assets and an inherited version-aware router.
**Tech stack:** Browser APIs, Node24 built-in tests/build/server, GitHub Actions/Pages; no runtime package dependency.
**Spec:** `SPEC.md`.

## Global constraints

No Sites hosting/source storage. Only fictional cafe data. Text-safe DOM and no eval. Preserve drafts and async save states. Retain earlier assets. Browser via Aside only.

## Review focus

Invalid/unsafe field names; producer/consumer mismatch; meaning vs label or variable name; external contract handover; stored draft corruption and delayed save/version races.

## Tasks

- [ ] 1. Content/model: confirm Fowler original; write failing tests for producer/consumer states, field validation, contract previews and answer persistence; implement and pass. Assigned files `data/`, `src/tutorial/`, model/content tests.
- [ ] 2. UI: write meaningful screen behavior tests first; implement editorial responsive hero, seven routes, accessible interactive lab, contract and practice, layered styles. Assigned `index.html`, `src/screens/`, styles, shared route/shell tables and `assets/rf-mark.svg`.
- [ ] 3. Infrastructure: integrate selected services/build, meaningful build/server/update/storage tests and app-specific IDs. Run full local tests; fix review findings; perform actual Aside navigation, errors, race, update and keyboard/mobile checks.
- [ ] 4. Publication: independently review code/content, verify only public source, create Technoetic/rename-field-tutorial, enable Pages, publish A then reviewed B, verify already-open A transitions automatically to B and prior assets survive. Check public deep links/404s and record limitations.
- [ ] 5. Record six-field handoff and vault pointer, commit only own files; return public URL and performed checks.

## Decisions

Ruling: use a fresh isolated repository instead of altering the existing tutorial — prior app must remain usable; reusable public infrastructure is copied selectively.
Ruling: all learning scenes use one cafe order record; external consumers are modeled inside the lesson — real databases/APIs are not changed.
Ruling: no new framework or image-generation dependency — interactive record/key visuals are native HTML/SVG/CSS.
