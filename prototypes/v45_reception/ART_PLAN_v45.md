# v45 reception vertical slice — art/implementation plan

## Reference (attachments unreadable on this agent mount)
Parent description: richly detailed stylized isometric Police Chief ad stills —
blue/white office reception, cream floor tile, blue panelled counter with white stone top,
monitor/keyboard/papers/phone/folders/drawers/filing, noticeboard+signs, leafy plants,
glazed frames, soft directional daylight + contact shadows, rounded cartoon characters.
Borrow richness/material/light — NOT police branding / ad UI / grime.
Target tone: welcoming clean hospital («Больница Карачун»).

## Scope (phase 1, ~12–15 min)
1. Isolated copy `prototypes/v45_reception` from stable v38 (gameplay/r3d hash preserved at fork).
2. Highest-impact reception set dressing:
   - Rebuild `recdesk`: blue panelled body, stone top, drawers, dual monitors, keyboard/mouse, phone, papers, folders, medical cross accent.
   - Richer `plant` (more leaves).
   - New `noticeboard` + reception layout adds (plant, cabinet/filing, noticeboard).
   - Creamer reception floor tint; soft baseboard trim on reception walls; slightly warmer/softer lights.
3. Engine before/after same-camera screenshots under `screenshots/v45_reception/`.
4. Preserve patient-triggered reception greet/typing (v26) — no random wave changes.
5. Character face/model upgrade = later phase (not claimed here).

## Out of scope this phase
APK/Windows packaging, git/publish, whole-hospital roll-out, character mesh upgrade, paid assets.

## Free/licensed assets
This phase uses only procedural THREE.js primitives (no downloads). Any later texture packs must be CC0/CC-BY free; sources recorded in LICENSES.md.


## Phase 5 motion checkpoint
See review/PHASE5_CHECKPOINT.md and authoritative review/phase5_verified/. Natural-cycle dense motion evidence is ready for videoReview; static shirt/backrest overlap and broader character/furniture art remain. Stable v44 untouched; no packages.

## Phase 6 character/seating checkpoint
See review/PHASE6_CHECKPOINT.md, review/phase6_after/before_after_all.jpg and final review/phase6_motion/natural_dual.mp4. Visible model/face/uniform improvement; motion review and remaining contact/art limitations are explicitly tracked. Stable builds untouched.

## Phase8 finishing checkpoint
Phase6 independent video review subsequently succeeded: attached glasses/bun, no arm/neck/shoulder tears or blouse/backrest clipping; smooth head return and contextual timing. Open: finger stiffness/hover and patient sliding pivot. This supersedes older pending-review notes.
Phase7 missing comparisons/checkpoint were actually reconciled from saved raw renders at phase8 start. Phase8 focuses on clean original botanical geometry, monitor hardware, local parked-open portal and reception daylight. See review/PHASE8_CHECKPOINT.md once finalized; no trial builds yet.
