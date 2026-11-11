# v38 — «Больница Карачун 3D» (полная игра на 3D-движке v37)
Старт: 1 ноя 2026 ~19:45 Киев.
## План (этап 1)
- prototypes/v38_game = копия 2D www (вся логика/UI/ввод/сохранения) + lib/models из v37.
- js/r3d.js (ES-модуль) подменяет draw(): ортокамера (yaw45°, elev30°) — пол совпадает с iso() 2D => toWorld/tap работают.
- Комнаты из тайлов (пол, стены с вырезом спереди, двери), мебель процедурно по ключам, персонажи = скин-GLB v37 по ролям, анимация из entVis().
- Оверлей 2D: подписи, эмодзи, призрак постройки.
## Журнал

### 01.11.2026, 19:56 (Киев, UTC+2) — Этап 1
- r3d.js + furn.js заработали: 3D-рендер поверх 2D-логики (ортокамера совпадает с изометрией, тапы и UI 2D работают).
- Исправлено: 3D-отрисовка падала до старта уровня (S без размеров) — теперь откат на 2D + try/catch; приглушён свет и пересвет пола.
- Проверено в браузере: 12 кабинетов, 14–17 персонажей, сканер затягивает пациента, мебель на местах.
- APK: dist/karachun3d-v38-debug.apk (16.9 МБ, com.hohotun.karachun3d). Видео dist/v38_tour.mp4 (слайд-шоу, ~1 кадр/с в swiftshader). Скрины screenshots/v38/.
- Не сделано/не проверено: IK ног и seatTop из v37; излечение (за 7 игровых дней cured=0); save/load в 3D; шланг на голову и печать у ресепшена визуально не проверялись; полы всё ещё бледные; FPS на телефоне не измерен.

### 01.11.2026, ~20:25 (Киев, UTC+2) — Этап 2 (v39)
- cured=0 — не баг: в swiftshader ~10 кадров/с при dt≤0.1 → за тест прошло лишь ~76 игровых секунд. Прямой прогон update(): 1200 с игры → 49 вылечено, 1 смерть. Логика 2D цела.
- Save/load: save(true) → newGame → load(0) восстанавливает деньги/кабинеты/персонал/пациентов; 3D пересобирается (33 персонажа, 13 комнат).
- Порт из v37: посадка по высоте сиденья (стул .5, диван .44, скамья .46, унитаз .5) + 2-звенный IK ног к полу; прижатие стоп к полу стоя. Raycast-сиденья v37 (seatTop по мешу) НЕ портирован — высоты табличные.
- Лёжа: ориентация по реальному повороту кровати/сканера, высота тела над матрасом (кровать .78, сканер .79, вскрытие 1.07) — раньше пациент был поперёк и утоплен в матрас.
- Шланг сдувательной идёт к клапану на голове — проверено на скрине. Ресепшен/терапевт сидят за столами; «печатание» — слой write, на статике не различить.
- Полы — цвета FLOORS из 2D, коридор темнее; задние стены 1.45 м (?wall=2.3 вернёт старые), дверная створка масштабируется.
- Видео: детерминированная запись (__fakeNow + ручной update), камера летит по всем кабинетам.
- Не сделано: повороты всей мебели не проверены поштучно; FPS на телефоне не измерен.
- 20:31: окна на низких стенах опущены (в видео v39 ещё старые, торчащие над стеной). APK пересобран.

## v40 — 21:07 Kyiv, 1 Nov
- Desks (desk/recdesk/chiefdesk): their yaw now comes from the staff spot. The back of the desk faces the staff and the front faces the patient. Before, `placeYaw` turned them towards the room centre, so the chairs and desks were mismatched.
- Monitor screen turned to −Z, towards the seated staff member.
- The white boxes were the `cabinet` (1×1 in gp/surgery/genetics/inflate/morgue/transplant). It is now a blue-grey filing cabinet, 1.3 m, with 3 drawers, handles, labels and folders on top.
- Removed the duplicate built-in chair from chiefdesk (the room already has its own chair_office).
- Reception: removed the `phone` layer (that was the "waving"). Staff use the `write` layer (typing) when a patient is in the room or queue.
- `write` layer reworked: small forearm movements over the keyboard. Before, the arms went up to the face. A seated person with a `write` layer no longer plays Sitting_Talking.
- Seated characters sat about 0.55 m behind the chair (behind the backrest). The model is now shifted along the facing direction so the pelvis lands on the seat (staff 2.40 vs 2.5, patient 4.58 vs 4.5).
- Economy: js/game.js and data/*.json are byte-identical to the 2D www (v27). Only anim.js differs (2D animation disabled). Monthly cost = Σ staff salaries + 50×rooms; "treatment didn't help" = game.js:108 (cureChance), same logic.

## v41 (2 Nov 2026)
- Синдром большой головы: голова ×2.3 (облачная ×2, статик ×1.6, плоская 1.7×0.6) — screenshots/v41/bighead.png
- Вылеченные пересоздаются обычным человеком (без короля/мумии/оттенка) со вспышкой — screenshots/v41/cured.png
- Месяц = 30 дней (зарплаты, кредит, банкротство 60 дн., главврач, календарь) — screenshots/v41/test_log.txt
- Врачи: v41.js — подмена уставших (fat≥75 после приёма / ≥92), сторож «застрял на стуле», новые кабинеты занимаются
- Автоповорот предметов коридора (спиной к стене) + кнопка «🔄 Поворот» / клавиша R; лавки с поворотом сажают правильно — autorotate.png
- Проверка пересечений костей ног с мебелью/аппаратами (все комнаты): единственное — лоток сканера, поднята высота лёжа .79→.9
- Windows: Electron 38 portable, dist/karachun3d-v41-windows.7z.001-004 (7-Zip), клавиатура WASD/+-/пробел/1-3/F11

## v42 (2 Nov 2026)
- Диван: после отдыха персонал сходит с мебели; 3-й отдыхающий при занятых местах стоит рядом (restSpot fallback). Поза сидя проверена (pelvisY≈.47, колени над сиденьем).
- Санитары (со шваброй) убирают: мусор/рвота (новое: пациенты с health<70 иногда тошнит) → подходят, стоят и машут шваброй (act 'mop'), вытряхивают урны (fill≥60, полоска заполнения), поливают растения; между заданиями — сразу следующее, иначе обратно в морг. Завхоз тоже машет шваброй при уборке.
- Шланг насоса: конец в мировых координатах от кости головы, радиус = HOSE_R(.17)×масштаб головы.
- Лишний персонал: снимается cover/чтение/зависшее место, когда есть свой свободный кабинет (лог: screenshots/v42/test_log.txt).
- Призрак предметов коридора (зелёный/красный, контур+стрелка направления, R/кнопка поворота); мышь — наведение+клик, тач — 1-е касание показывает, 2-е касание или «✔ Поставить» ставит.
- Кабинеты можно ставить вплотную к стене со стороны входа (нижний ряд), кроме клеток входа и соседних.
- Сборки: dist/karachun3d-v42-debug.apk, dist/karachun3d-v42-windows.7z (один файл).

## v43 (4 Nov 2026)
- Аптека: медсестра больше не играет Idle_Talking+operate («возмущается/поправляет волосы»). Спокойная стойка, кивок, достаёт коробочку, протягивает руку через стойку к пациенту; пациент тянется и забирает коробочку (переходит в его руку). Все медсёстры при процедурах теперь Idle_Loop вместо Idle_Talking. Кадры: screenshots/v43/pharm_*, sheet_pharmacy2.png
- Кровати (ward/cardio/surgery/icu/derma/transplant, тип bed*): пациент идёт к свободному боку кровати, садится на край спиной к ней, разворачивается и ложится; вставание — обратно. Сканер/секционный стол — как раньше. sheet_bed_new.png
- Швабра: act 'mop' — наклон, обе руки на черенке, головка лежит на полу (minY −3…−10 см) и ходит влево‑вправо; завхоз получает швабру на время уборки (вантуз прячется). Санитар может перехватить уборку у завхоза, если ближе. Уборка проверена в реальной игре (лог).
- Предметы появляются сразу: sig() учитывает S.items и предметы комнат.
- Посадка на любое сиденье: подход к точке перед сиденьем, разворот, опускание; вставание обратно; ноги больше не заходят в сиденье (chair 43→0, bench 36→0, sofa 76→1, psych 75→1 кадров). SEAT_T sit 1.2, lie 2.6.
- Сборки: dist/karachun3d-v43-debug.apk, dist/karachun3d-v43-windows.7z (один файл).

## v44 gap checks + seat support (2026-11-05 Europe/Kiev)
### Seat support (prior batch, retained)
- Air-sit fixed: spot-tile anchor, sitF/SEATH, via approach. Evidence `screenshots/v44/`. Residual: sofa-behind 2-frame foot touch.
### Gap checks
| Gap | Result | Coverage |
|-----|--------|----------|
| Hose head contact | PASS after narrow fix (scale→hose order) | pump+inflate phases; 1 scene |
| Salary/calendar | PASS | **all 12 levels**, days 29→30→60 via real onDay |
| Props next-frame mesh | PASS | bench/bin/soda + ghost + rot; 1 renderer scene |
### All-level coverage note
- Salary: every level config exercised in logic sim.
- Hose/props: one shared renderer codepath (representative scen), not 12 visual runs.
### Limitations / UNTESTED
- Campaign win, physical phone, Windows exe, APK device — **UNTESTED**.
- No build/publish this session.
### Packaging
Working tree ready for a packaging step; device claims deferred.

## v44 shipped (2026-11-05/06 Europe/Kiev)
### Packages
- `dist/karachun3d-v44-debug.apk` (16930427 bytes, versionCode 44 / 44.0.0, com.hohotun.karachun3d)
- `dist/karachun3d-v44-windows.7z` (89169013 bytes, single archive, product 44.0.0)
- Manifests: `screenshots/v44/BUILD_MANIFEST_v44.json`, `QA_SUMMARY_v44_RU.md`, `PACKAGE_SHA256.txt`, `HASH_VERIFY.txt`
- v43+ older dist files **preserved**

### Test distinction
- **All-12 levels:** completed on working source **before** focused seat/hose shared-code fixes (`screenshots/v43_recheck/`).
- **After fixes:** representative validation only (seat-support, hose contact, salary×12 configs, props mesh) — **not** a full 12-level visual re-run.

### Remaining defects (shipped-with)
- Sofa behind-approach: 2-frame foot touch during sit-down
- Slight scanner-body float above tray
- Bed get-up jerk / mop limitations (if still as prior notes)
- No full campaign victory test; no real phone / Windows exe runtime verification

### Packaging smoke
Packaged www boots: ready=true, money=40000, no harness/auto-grant.
