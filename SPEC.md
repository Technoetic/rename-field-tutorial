# RENAME / FIELD

한국어 초보자가 카페 주문 데이터의 `amt`를 `totalAmount`로 바꾸며 Rename Field를 배우는 인터랙티브 튜토리얼. 기존 리팩토링 학습 앱의 검증된 정적 ES-module 인프라만 재사용한다. 새 GitHub Pages 저장소에 공개 배포한다. 카페·주문표를 일관된 주제로 쓴다.

## Learning journey

- Home `/`: striking editorial hero showing `amt → totalAmount`, unchanged 10000 value, a clear start action and map of the learning journey.
- Story `/story`: compare one record's label/key before and after, a name change rather than value conversion. Explain object field vs object variable vs visible label. Three short interactive steps.
- Rename lab `/lab`: user edits suggested newName, toggles producer/receipt/report updates, sees missing-field states for incomplete renames and preserved 10000 outputs after all align. One-click complete/reset; keyboard accessible. Invalid/reserved/colliding names do not modify a record. No arbitrary code evaluation.
- Contract `/contract`: old/new reader compatibility for old-only, new-only and temporary dual-key handover. Explain coordinating external consumers and eventually retiring old contract; no real API/database mutations.
- Practice `/practice`: six meaningful multiple-choice exercises, answer feedback, optional note, async browser-local save, failed-save state, unsaved work guard and reset confirmation. No remote personal data.
- Code `/code`: tiny actual object field examples, before/after switch and explanation. Source examples are newly written; no source copying from Fowler.
- Summary `/summary`: transferable checklist and original Fowler link. Unknown route `/missing` offers return; missing assets remain HTTP404.

## Saved lab checkpoint

The lab uses `ctx.labStorage`, a separate browser-local `LabStorageService` with key `rename-field-tutorial:lab-draft:v1`. Its snapshot is `{schema:1,newName,producer,receipt,report,savedAt}`. Raw invalid names up to 100 characters can be saved as drafts without executing them. Save captures its invocation-time snapshot; newer edits stay dirty. A saved checkpoint restores after document navigation. Failures keep the current edit protected. Practice data uses its own key and is not cleared by lab operations.

## Shared interface contract

Content files: `data/tutorial.json`, `practice.json`, `code.json`. `ContentService.load('tutorial'|'practice'|'code', {signal})` is inherited.

`tutorial`: schema1, meta `{appTitle,htmlTitle,tagline,description}`, routes `{path,title,shortTitle}` for `/`, `/story`, `/lab`, `/contract`, `/practice`, `/code`, `/summary`, screens keyed home/story/lab/contract/practice/code/summary with `{eyebrow,title,lead}`, story `{steps:[{title,body}],oldLabel,newLabel,value}`, summary `{points:[string],sources:[{title,url}]}`. UI may read known optional blocks or provide local component labels.

`code`: schema1, before `[string]`, after `[string]`, explanation string, output `10000`. Both examples use `const order`, one old `amt` vs new `totalAmount`. `practice`: schema1, draft `{noteMaxLength:1000}`, items6 `{id,title,story,question,choices:[{id,label}],answer,explanation}`. All choices use IDs safe for form attributes; correct answer is one ID.

`src/tutorial/content-model.js`: export `validateTutorial(data)`, `validatePractice(data)`, `validateCode(data)`, `validateBundle({tutorial,practice,code})`; validate structure, routes, counts, examples and required strings. Return original validated data. No DOM.

`src/tutorial/rename-model.js`: export `evaluateRename({newName='totalAmount',producer=false,receipt=false,report=false,value=10000}={})`. Return `{nameValid,error,fieldName,record,receipt:{key,ok,value},report:{key,ok,value},done,valuesUnchanged}`. producer toggles old/new record key; receipt/report toggles consumer keys. Avoid `__proto__`, constructor, prototype, same old key, invalid JS identifiers. When invalid, report error and preserve original record. Structurally done does not judge arbitrary name quality; UI reminds naming needs domain understanding. Export `contractPreview(mode)` modes `legacy`, `breaking`, `transition` -> `{payload,legacyReader:{ok,value},modernReader:{ok,value}}`; transition includes matching old and new keys.

`src/tutorial/practice-model.js`: export `validateDraftShape(draft)`, `validateDraft(draft,config)`, `PracticeSession(config,draft=null)`. Session has `select(id,choiceId)`, `setNote(text)`, `grade(id)` -> `{status:'unanswered'|'correct'|'wrong',correct}`, `summary()` -> `{correct,wrong,unanswered,total}`, `snapshot()` -> `{schema:1,answers,note}`, `markSaved(snapshot,savedAt)`, `discardChanges()`, `reset()`, `dirty` getter and `savedAt`. `validateDraft*` accepts savedAt; reject malformed/unknown item or choice and oversized note; clone state, no prototype pollution.

UI screen classes extend inherited `Screen` (`constructor(ctx,root,route,entry)`, async render(data), readState/save/discard). SCREENS mapping keys home/story/lab/contract/practice/code/summary/notFound. route-table `ROUTE_TABLE`, `routeFor`, `isScreenPath`; no old split-variable routes. Screen title metadata and navigation use entry.path. UI owns its short component labels, generic shell copy in `src/shared/shell-copy.js`. Required test selectors: lab input `[data-testid="rename-name"]`, checkboxes `[data-part="producer|receipt|report"]`, complete `[data-action="rename-all"]`, reset `[data-action="reset-lab"]`, results `[data-testid="lab-status|record-key|receipt-value|report-value"]`; practice radios under `[data-question="id"]`, actions `[data-action="check|save|reset"]`, textarea `[data-testid="practice-note"]`.

## Six principles and delivery

Inherited router/version/service handles async errors and safe A/B/rollback changes, full-document query `_rf`, fresh JSON, immutable build-named assets and retained previous assets. HTML build ID prefix rf; data-only changes do not change build. 404 for unknown assets/APIs. Pages cache maximum10min is a hosting limitation, version fetch fresh query prevents stale data; opened tab updates automatically at next safe navigation while drafts/saves remain protected. No Sites calls. No publication until local meaningful tests, browser tests and independent review pass. User has authorized final GitHub publication, so no extra approval gate.
