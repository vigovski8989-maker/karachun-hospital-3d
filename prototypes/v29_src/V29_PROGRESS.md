# v29 progress (resumable notes)
Art direction (22:48 Kyiv): bright stylized cartoon 3D, refs in art_src/ref_v29 (style only).
## Done
- build_char.py: 10 roles (doctor nurse orderly receptionist bighead invisible rocker mummy patient_a patient_b), skinned UBC CC0 bases,
  shells clothes + baked/painted textures, blink/brow/smile morphs. Receptionist: procedural curls (Hair_Curls, MI_Curls).
  Build: `blender -b -P build_char.py -- <role> out/<role>.glb`; views: `views.py -- out/<role>.blend`.
- props.py -> out/props.glb (clipboard mop plunger phone glasses hat guitar syringe nurse_cap orderly_cap), origin = grip.
- anims.py -> out/anims.glb (15 UAL clips, scale tracks stripped, frame_step 2). Head scale 1.3 / hands 1.2 applied at runtime.
## Next
rooms.py (4 diorama rooms, single atlas material, baked LM) -> v29_3d runtime -> capture MP4/stills -> APK -> LICENSES/report.

## Статус 30.10, ~23:45 Киев — шаги 1–5 выполнены
- props.glb, anims.glb (15 клипов UAL), rooms.glb + 4 лайтмапы (Cycles) — в v29_3d/models.
- v29_3d: toon+outline, ACES, bloom, MSAA, HUD fps, кнопка качества, голова 1.3x / руки 1.22x, look-at, процедурные write/exam/phone/guitar, сценарий 40 с по 4 комнатам. Правки после первого запуска: PROPS = дети сцены (не только Mesh), швабра повернута, регистратор лицом к камере.
- Захват: shot.mjs (кадр), rec.mjs (1200 кадров) -> dist/v29_tour.mp4; скрины в screenshots/v29.
- APK: /workspace/proto3d-build-v29 (appId com.hohotun.proto3d29, JAVA_HOME=/home/box/jdk21) -> dist/proto3d-v29-debug.apk 15.0 МБ.
- ВНИМАНИЕ: бокс был восстановлен ~23:11 Киев — потеряны v29_src/out/ (исходные glb/blend лайтмап), /tmp, node_modules. Копии моделей целы в v29_3d/models. Для пересборки: заново запустить build_char.py/props.py/anims.py/atlas.py/rooms.py.
- Не сделано: меш-LOD, тест на реальном устройстве, тонкая подгонка процедурных поз; окна на стенах чёрные (слоты пустые); cast-стоп-кадр в cmp_ref_chars — старая версия до кудрей.

## v30 — ноги (по отзыву «у многих с ногами проблемы»)
Код: `v30_3d/` (main.js: методы `legs/ik/seatTop/strideOf/mop`), исходники `v30_src/`. `?legacy` в URL отключает правку ног (для сравнения).
Аудит: `v30_src/metrics.mjs` (числовой, 40 с сценария, каждые 0.1 с), `audit.mjs`+`sheet.py` (2 ракурса × 4 момента на персонажа), до/после — `screenshots/v30/legs_*.jpg`.

Что нашлось (v29) → что сделано:
- Стопы проваливались в пол на 2.5+ см почти всё время у всех стоящих/идущих (8 из 11; счётчик кадров «провал» 96–400 из 400) — причина: ретаргет таза UAL→UBC + масштаб ступней ×1.1. Теперь: каждую кадр модель поднимается так, чтобы нижняя стопа (пятка/носок по bind-позе) стояла на полу (сглажено, ±15 см), вторая стопа при провале поднимается IK. Итог: 0 кадров провала/парения.
- Сидящие: таз висел за передним краем стула (доктор, пациент, регистратор) — бёдра в 0.5 м над сиденьем. Теперь луч вниз находит сиденье, модель сдвигается назад на сиденье и по высоте (бедро ≈ 9 см над верхом сиденья), стопы прижимаются к полу двухкостным IK (сохраняется плоскость сгиба колена, колено не выворачивается). Плавно в Sitting_Enter/Exit.
- Скольжение стоп при ходьбе: скорость клипа теперь = фактическая скорость / измеренная скорость опорной стопы клипа (а не 1 м/с). Кадров со скольжением >0.25 м/с: в среднем −50…−70%.
- Санитар со шваброй «шагал на месте» (Push_Loop без движения) — теперь реально ходит туда-обратно со скоростью шага клипа (скольжение 314→~108 кадров).
- Рокер сидел лицом к стене на дальнем краю кушетки, ноги за спинкой; в t=31 вставал НА кушетку. Теперь сидит лицом в комнату, встаёт, отходит, танцует, возвращается и садится. Гитара — тёмно-красная (была розовая).
- Колени «назад»: числовой аудит — 0 случаев и до, и после.
- Чёрные квадраты на стенах: у квадов левой стены (постер, аптечка, дверь) была обратная нормаль → чёрный bake. Исправлено в rooms.py, комнаты перезапечены.
Не сделано честно: веса юбки/халата не перестраивал (при ходьбе видимых проколов не нашёл на листах аудита); отдельных состояний «на коленях» и «лёжа» в сценарии нет — не добавлял; босые стопы мумии/большеголового не перемоделировал (провал в пол у них устранён).
- Итог v30: dist/proto3d-v30-debug.apk (15.1 МБ, com.hohotun.proto3d30), dist/v30_tour.mp4 (1200 кадров, 12 МБ), screenshots/v30/legs_*.jpg (11 шт., ДО/ПОСЛЕ). Гитара рокера теперь тёмно-красная.

## v31 (31.10.2026, ~07:40 Kyiv)
Feedback: legs through chairs; king's guitar dangling under arm.
- Root cause (legs): doc, rec, big were seated FACING the chair backrest (yaw opposite to chair rz), so shins/knees went through the backrest. Fixed yaws: doc π→0 (incl. return at 19.5s), rec -2.3→-0.4, big π→0. Rule: seated yaw = chair rz.
- Seat logic rewritten: seatTop scans seat front/back edge along forward; pelvis shifted forward so knees clear seat front edge (+7 cm); calfAim() hangs shin forward-down to floor, foot flat.
- Penetration metric window.__pen / __pend (raycast thigh/shin/foot segments vs room meshes), /workspace/pen.mjs, 40 s loop:
  static sitting: doc 0, rec 0, psy 0, big 0, rock 0, pa 0 (Talk at t12: 2 frames). Remaining: 5–7 frames per actor during sit-down/stand-up transitions (doc, pa, rock) – brief, not yet fixed.
- Guitar: now parented to spine_02 (belly/hip, neck up-left), procedural strap (tube over left shoulder, across back), 2-bone arm IK (ik2) puts left hand on neck and right at strings in all states (sit, talk, walk, dance); strum amplitude via rock.gplay.
- Shots: screenshots/v31/seat_*.jpg, guitar_rock_*.jpg (top v30 / bottom v31, 3 angles, near-clip).
- APK /workspace/hospital-game/dist/proto3d-v31-debug.apk (com.hohotun.proto3d31), video /workspace/hospital-game/dist/v31_tour.mp4.
