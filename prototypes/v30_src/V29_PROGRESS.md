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
