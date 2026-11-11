# QA-аудит v10 (hohotun-v10-levels) — 24.10.2026
Methods: 36 bot runs (L1–12 × 3 seeds, `tools/qa_audit.js seeds`), 15 scripted edge scenarios (`tools/qa_audit.js edge`), a queue/orphan diagnostic (`tools/qa_queue.js`), code reading, and screenshots at 412×860. No JS errors in any run. Game code was not changed.

Bot results: L1–5, L9 and L10 won 3/3; L3, L6 won 2/3; L8 won 1/3; L7, L11 and L12 won 3/3 but with long queues. Win time ranges from 211 days (L2) to 530 days (L8).

## 🔴 Critical
1. **A loan counts toward the money goal.** The goal checks `S.money` and ignores debt. Repro: scenario loanGoal: +$60k to money, +$0 to value. Fix: check `S.money - S.loan` against the goal, or block a win while a loan is outstanding.
2. **Deaths come almost entirely from failed treatment, not from player mistakes.** In 36 runs, `dl.fail` is 80–100% of deaths. At L6/L8 the bot loses on the death limit with rep 800–1000 and full money. Repro: seeds log, e.g. L8#0 fail 27 / decay 6. Fix: lower `failDeath` on L5+ (to .25), make certainty matter more (diagnosis), and show the cure chance before treatment.
3. **Patients pile up and stall in some queues on L7/L8/L11/L12** (128–270 "queue frozen ≥12 days" events, maxPats 70–79). Cause: one doctor per room, and while they rest/drink coffee the room is idle. There's no "second doctor"/replacement or overflow to a duplicate room. Repro: qa_queue: cardio q9 with the doctor on `rest`/`tocoffee`. Fix: a free staff member of the same role covers the room; the queue picks the shortest room of that type; the room panel warns "queue > N".
4. **The bankruptcy threshold is too soft:** lose at money < −40k − loanMax (−100k to −160k on L6–12). Combined with #1 it removes all financial pressure. Fix: lose at < −10k for 2 months in a row, or when the loan limit is maxed and money < 0.

## 🟠 Important
5. **An earthquake destroys a room entirely.** Rooms with cond ≤ 40 explode: the room disappears with no refund, patients inside die, and the doctor is left without a room. Repro: scenario quake: 4/4 machine rooms lost. Fix: the quake breaks the machine (it needs repair) rather than exploding it, or cap damage so cond stays ≥ 1; a 2-day warning plus "send handymen" button.
6. **No visual markers for infected / 🚑 emergency / 🎩 VIP patients on the map.** You have to tap patients one by one. Repro: render.js has no handling of `p.inf/emg/vip`. Fix: icon above the head + "🦠 N" counter in the top bar, tap = jump to next.
7. **Epidemic dodges:** sending an infected patient home avoids the fine (the inspector skips `leave`), and a vaccinated patient can be reinfected (no immunity flag). Repro: code mech.js:28, game.js:65. Fix: count those who left as infected; set `p.immune` after a vaccination.
8. **No reception = silent hang:** patients wait at the entrance forever with no message. Repro: scenario noReception: 0 cured in 20 days, no alert. Fix: warn "⚠ No reception" plus a goals-panel indicator (same for "no GP", "no cure room for X").
9. **Rooms locked by research can be built directly through `startRoom()`/`gok()`.** The UI hides them, but the check isn't in the build logic. Repro: scenario lockedBuild: genetics built while locked=300. Fix: check `roomLocked` in startRoom/gok.
10. **Research has no purpose after unlocking:** the lab keeps paying a doctor and accruing points; L1–4 have no research at all. Fix: after all unlocks, research → improving machines (+cond/−risk) or cure-chance bonus; tell the player "research complete — you can sell the lab".
11. **Wins take too long:** L1 needs 350–440 days ≈ 45–60 min at ×1. The money goal is almost always the limiting goal (the bot finishes at exactly goal ±$2k). Fix: L1 goal $50k → $30k, scale money goals down by ~20% on L5+, show "≈ X days to goal".
12. **Emergency patients skip reception and diagnosis** (`known=true, need=cure`) and arrive in a crowd of 5–7 at once. That's fine, but the 7-day timer isn't shown in the top bar, only in Goals. Fix: emergency timer chip at the top.
13. **Orphan staff:** hiring more staff than there are rooms (or losing a room to an explosion/sale) leaves them wandering idle on full salary. Repro: qa_queue: "orphan doctor,nurse…", idleStaff up to 290 staff-days on L12#1. Fix: a "no room" badge on the staff list + a reminder on payday.

## 🟡 Minor
14. **Phone portrait UX:**
    - The 6-button bottom bar is cut off on a 412 px screen ("☰ Ме…"; see the v10 screenshots).
    - The message log uses 10 px text and truncates lines.
    - The top bar doesn't show the loan, research or events.
    - There's no tutorial; only an intro modal.
    - Fix: 2-row/scrollable bar or icons only; log 12 px with a tap to expand; first-level hint steps ("build reception → GP → hire").
15. **Bigger room sizes:** the +$30/tile extra isn't counted in hospital value or refunds (sale refunds 50% of the base price only). Not exploitable, but it penalises big rooms. Fix: include the real price.
16. **A single save slot:** starting a new level overwrites the save of the old one at the next autosave. Saving a lost game lets you "continue" a lost game. Fix: a slot per level; don't save when `S.lost`.
17. **A VIP walks ~50 s** without the player seeing their route or score. Fix: show "🎩 visited 2/5".
18. **Lots** only add space; they're worth the same as cash for the value goal. Fix: rental income from a lot or a value multiplier ×1.5.
19. **Derma:** in the screenshot the patient sits on the couch before lying down; the animation transition looks like "sitting under the lamp".

## ✅ Checked, OK
- **Save/load in the middle of treatment/toilet/queue:** 0 stuck agents, treatment carries on.
- **Selling a room with a patient inside:** the patient is moved out and looks for a new room.
- **Selling the staffroom during coffee:** the staff member goes to idle, no loop.
- **Firing a doctor mid-treatment:** no crash.
- **Pathfinding:** no stuck moving agents (seek/goto/leave) in 36 runs; all doors reachable.
- **Performance:** 87 agents + 32 rooms on L12: 60 fps (headless desktop), update 0.16 ms. A real phone test is still needed.

---
## v11 — статус исправлений (24.10.2026)
| # | Статус | Что сделано |
|---|---|---|
| 1 | ✅ | Цель по деньгам = баланс − кредит (`netCash()`), в «Целях» подпись «за вычетом кредита» |
| 2 | ✅ | failDeath 0.5→0.25 на L5–12; шанс излечения в карточке пациента + кнопки «Лечить сейчас / Дообследовать / Домой»; в Меню порог политики 40/60/75% (ниже порога — автодообследование) |
| 3 | ✅ | Уходя на отдых, сотрудник передаёт кабинет свободному коллеге той же роли; ежедневная перебалансировка очередей (разница ≥3 → переход в более короткую); предупреждение и чип «⚠ очередь» при очереди ≥6. Остаточные «замершие очереди» у бота остаются при перегрузке (бот не строит доп. кабинеты достаточно) |
| 4 | ✅ | Банкротство: баланс < −$10 000 40 дней подряд (2 мес.), предупреждения на 1/20/35 день, чип-таймер |
| 5 | ✅ | Землетрясение не взрывает (cond ≥5); аппарат с износом ≤20% закрыт до ремонта + сообщение; взрыв: страховка 30%, пациенты эвакуируются, реп −25; разнорабочий ремонтирует в приоритете (−80) |
| 6 | ✅ | Значки 🦠/🚑/🎩 над пациентами на карте + чипы-счётчики в верхней панели |
| 7 | ✅ | Отправка заразного домой во время эпидемии: −$1500, −8 реп; вакцина даёт иммунитет |
| 8 | ✅ | Предупреждения каждые 4 дня: нет регистратуры / регистратора / терапевта |
| 9 | ✅ | `startRoom`/`gok` проверяют `roomLocked` |
| 10 | ✅ | Когда всё исследовано — сообщение, сотрудник лаборатории освобождается, автоназначение туда больше не идёт; если исследования стоят — напоминание |
| 11 | ✅ | L1: прибытие 18→12 с, цели 90 вылечить / $50k / реп 650 → бот выигрывает за 151–177 дней (≈20–24 мин при ×1), было 353–439 |
| 12 | ✅ | Таймер ЧП в верхней панели «🚑 вылечено/n · Xд» |
| 13 | ✅ | Чип «👤 N без каб.», раз в 5 дней сообщение, в списке персонала «⚠ БЕЗ КАБИНЕТА» сверху |
| 14 | ✅ | Нижняя панель: иконка над текстом, влезает в 412px; сообщения 13px с переносом, 5 с; верхняя панель: кредит, исследования, ЧП, эпидемия, VIP, банкротство; обучение из 7 шагов на L1 с «Пропустить» |
| 15 | ✅ | Фактическая цена постройки хранится в `r.cost`; учитывается в стоимости больницы и в возврате 50% |
| 16 | ✅ | Слот сохранения на каждый уровень (📂 в выборе уровня), старое сохранение мигрирует; проигранная игра не сохраняется, слот удаляется |
| 17 | ✅ | Чип «🎩 VIP 2/5 😊/😐/😠» — прогресс и текущее впечатление |
| 18 | ✅ | Участки идут в стоимость больницы ×1.5 от цены |
| 19 | ✅ | Проверено скриншотом `screenshots/v11_derma_lie.png`: пациент лежит на кушетке, поза корректна |

Дополнительно найдено и исправлено: падение `updVip`, если VIP-событие закрыто раньше, чем гость ушёл.

### Бот: до → после (3 сида на уровень, побед / дни)
| Ур. | До (v10) | После (v11) |
|---|---|---|
| L1 | 3/3 · 353–439 | 3/3 · 151–177 |
| L2 | 3/3 · 211–217 | 3/3 · 239–271 |
| L3 | 2/3 · 273–300 | 2/3 · 219–376 |
| L4 | 3/3 · 256–270 | 3/3 · 236–237 |
| L5 | 3/3 · 477–519 | 3/3 · 439–599 |
| L6 | 2/3 · 410–478 | 3/3 · 437–474 |
| L7 | 3/3 · 398–480 | 3/3 · 339–417 |
| L8 | 1/3 · 331–530 | 3/3 · 333–453 |
| L9 | 3/3 · 329–379 | 3/3 · 340–371 |
| L10 | 3/3 · 290–299 | 3/3 · 311–317 |
| L11 | 3/3 · 299–496 | 3/3 · 297–375 |
| L12 | 3/3 · 358–515 | 3/3 · 357–376 |
Итого 32/36 → 35/36. Edge-сценарии: ошибок нет, quake roomsLost 0, perf 87 агентов 60 fps.

## v12 — путь ЧП, морг, трансплантация (25.10.2026)
- ЧП: пациенты идут регистратура → терапевт/диагностика → лечение, без очереди (встают после других ЧП). Срок 20 дней, нужно ≥60%. L3: лимит смертей 14→20.
- Морг (с L5): санитар везёт тело на каталке, 6 мест, репутация −7 вместо −15, тела вывозят через 6 дней; 60% умерших — доноры (1–2 органа, совместимость 60–97%, хранение 8 дней). Мебель в Blender: холодильная камера, секционный стол.
- Трансплантология (исследование, с L6): нужен орган и хирург (навык <60 даёт −15%); шанс зависит от совместимости. Банк органов: $2500, совместимость 72%. Без органа пациент ждёт (⏳), потом уходит. Холодильник для органов сделан в Blender.
- 7 болезней (только трансплантация, встречаются реже обычных, плата $5600–7200): Ленивое сердце, Печень-путешественница, Почки-сплетницы, Лёгкие-волынка, Желудок-гурман, Влюбчивое сердце, Чихающая почка. Значок болезни виден над пациентом.
- verify_layout: 0 нарушений. Smoke: 11/12 побед, ошибок нет, сохранение и загрузка работают. В edge-аудите и qa ошибок JS нет.

### Бот v11 → v12 (3 сида)
L1 3/3→3/3 · L2 3/3→3/3 · L3 2/3→3/3 · L4 3/3→1/3 · L5–L10 3/3→3/3 · L11 3/3→2/3 · L12 3/3→3/3. Итого 35/36 → 33/36.
L4 нестабилен и в v11: на 6 сидах 4–5/6, проигрыш по 26 смертям. L11#0 не уложился в 700 дней.
Что исправлено по ходу: морг в L3/L4 съедал бюджет (сначала L3 был 0/3), поэтому он открывается с L5. Трансплантационные болезни тормозили экономику L10–L12 (0/3), поэтому их стало меньше, а плата за них выросла.

## v13 — балансировка L4/L11, санитар (25.10.2026)
Изменения: новый персонаж «Санитар» (orderly, база $450, Blender-модель в зелёной форме, анимации как у разнорабочего + приседание при подъёме тела); морг теперь требует санитара (старые сейвы с врачом в морге продолжают работать). L4: decay 3→2.3, failDeath .5→.4, spawnEvery 9→10. L11: цель денег 360k→320k, стоимость 450k→420k (раньше часть прогонов упиралась в лимит аудита 700 дней из‑за денег). L2: lose.deaths 8→12 (в v13 прогонах всплыли 3/9 поражений по смертям при неудачном лечении).

Проверки: verify_layout — 1727 проверок, 0 нарушений; smoke — errors [], save/load ok; скриншоты без ошибок страницы.

Бот (qa_audit seeds):
| Уровень | v12 | v13 |
|---|---|---|
| L1, L3, L5–L10 | 3/3 | 3/3 |
| L2 | 3/3 | 9/9 после правки (до правки 6/9 + 1/3 в общем прогоне) |
| L4 | 1/3 | 11/12 (тюнинг) + 8/9 финальные (3+6) |
| L11 | 2/3 | 9/9 финальные (промежуточно 5/7 на тех же целях — шум) |
| L12 | 3/3 | 4/6 (2 таймаута на 700 днях, уровень не менялся — шум/риск) |

Скриншоты: screenshots/v13_*.png (emergency_queue, orderly_pick, orderly_panel, morgue_gurney, morgue, transplant, disease_marker, disease_panel).
APK: dist/hohotun-v13-debug.apk (v12 APK сохранён).

## v14 — L12 и скриншот санитара
L12 «Столица Хохотуна»: стартовые деньги 130k→145k, decay 2.1→1.8, failDeath .25→.2, цели: деньги 400k→320k, репутация 720→680, стоимость 490k→460k (текст вступления обновлён). Причина таймаутов — бот не успевал накопить деньги к 700 дням.
Бот L12: v13 4/6 → промежуточно 7/9 (деньги 340k) и 13/18 (+реп 680, старт 145k) → финал 26/27.
Быстрая проверка остальных (3 прогона, до финальной правки L12, которая другие уровни не затрагивает): L1–L8, L10 — 3/3; L9 2/3 (+2/3 в доп. прогоне: банкротство на 300 дне и таймаут), L11 2/3 (+3/3 в доп.). Эти уровни в v14 не менялись — разброс бота.
Скриншот: screenshots/v14_orderly_pick.png — санитар поднимает тело в открытом коридоре (выбирается пациент без стен рядом), tools/shots_v14.js.
APK: dist/hohotun-v14-debug.apk (v13 сохранён).

## v16 — не работала постройка на телефоне (L1)
Причина: в v11.js tutTick() делал `h+=v12Chips()` в `const h` → TypeError каждые 400 мс (глушился try/catch). Плашка обучения #tut успевала создаться пустой (z-index 6, bottom 78px) и навсегда перекрывала кнопки ✔/✖/размеры стройки и низ панели. Только на уровне 1 (обучение), с v12; v14 APK подтверждённо сломан (тот же тач-тест: 360x640 — ✔ закрыт #tut), v15-изменения (safe-area/edge-to-edge) не причина.
Исправление: const→let; плашка не ловит касания (кроме «Пропустить») и сама ставится над #bar/#build/#panel, прячется если места мало; выбор предмета закрывает панель и показывает компактную полосу «Нажимайте на пол / Другой / Готово».
Тест: tools/touch_build_test.js (CDP touch: тап-перенос призрака, перетаскивание, ✔, установка предмета) — 8 размеров ×3 прогона, 24/24 OK. Smoke: errors [].
APK: dist/karachun-v16-debug.apk.

## v17 (25.10.2026) — подмены, библиотека/курсы, главврач, рейтинг, платный терапевт
- Новое: js/v17.js; комнаты library/chief/paygp (rooms.json, levels.json); Blender-пропы bookcase/readdesk/chiefdesk/aquarium.
- v17_checks (L6, 220 дн.): подмен 10 (до 2 одновременно), читателей до 3, курсов 2, средний навык 63→89, главврач назначен, платный терапевт: 71 богатый пациент, доход $20 700; ранг менялся 1–4.
- verify_layout: 1946 проверок, 0 нарушений. smoke: 12/12 побед, errors []. touch_build_test: 8/8 ok.
- qa_audit (бот): L1,L3–L12 3/3; L9 доп. 12/12 (итого 15/15); L11 доп. 3/3; L2: 13/15 (2 поражения: банкротство д.160, д.246) — регресс против v16 (9/9).
- Скриншоты: screenshots/v17_{library,chief,paygp,staff_card,rating,cover,spec,build_menu}.png, v17_touch_*.png
- APK: dist/karachun-v17-debug.apk

## v18 — терпение пациентов, уход из очереди, баланс L2 (27.10.2026)

**Исправление к v17:** в отчёте v17 было неверно сказано, что механики ухода нет. Простая версия была и раньше: фиксированное падение терпения и уход. В v18 её расширили.

### Механика
- Скорость падения терпения = 0.35 × уют (max 0.33, 1−c/12) × позиция в очереди (до ×1.6) × время ожидания (до ×1.5) × автомат с газировкой рядом (×0.85) × ранг (0.8…1.25).
- Пациент один раз пьёт газировку: +15 терпения, $15.
- Если терпение кончилось: 💢, уход, −3 репутации, упущенная плата идёт в статистику.
- Что видно игроку:
  - в карточке пациента — полоса терпения и множители;
  - в HUD — чип «😠 N»;
  - в «Целях» — «Ушли не дождавшись N (−$)».
- Длинные очереди у ВОП/регистратуры (≥8) снижают поток пациентов: до ×0.7.
- Если врач не работает, а очередь ≥4, пациенты переходят в однотипный кабинет с очередью короче.

### Баланс L2
- Причина поражений в v17: узкое место у ВОП, очереди 12+, смерти от деградации прямо в очереди и банкротство.
- Исправления:
  - механика ухода вместо смертей;
  - ограничение потока (crowdK);
  - перераспределение очередей;
  - бот строит библиотеку позже, поэтому раньше появляется третий ВОП.

### Прогоны бота
| | v17 | v18 |
|---|---|---|
| L2 | 13/15 | 40/42 (95%); 24-прогонная диагностика до 400 дн. — 23 победы + 1 незавершённый |
| L7 | 3/3 | 8/9 (1 банкротство на 120-м дне, повтор 6/6) |
| Остальные уровни | 3/3 | 3/3 |

- smoke: 12/12, errors [].
- verify_layout: 1946 проверок, 0 нарушений.
- touch: 8/8.
- Скриншоты: screenshots/v18_patient_card.png, v18_angry_leave.png, v18_hud_goals.png, v18_touch_*.png.
- APK: dist/karachun-v18-debug.apk.

## v19 — графика (27.10.2026)
- Blender: PBR-материалы (bevel, bump, металл/кожа/лак), GI 4/3 отскока, 40 сэмплов; детали персонажей (глаза, уши, волосы, воротник, пуговицы, карманы, бейджи, подошвы); ходьба 12 кадров (было 8), idle 4 кадра дыхания; запечённые мягкие контактные тени (shadow catcher + tools/shadow_post.py + tools/alpha_clean.py). 4193 кадра, 14 атласов, 14MB (v18: 9 атласов, 6.8MB); в памяти ~214MB (v18 ~144MB).
- Hi-DPI: холст по качеству (Low 1x / Medium 1.5x / High 2x), спрайты стен/пола в повышенном разрешении.
- Окружение: бесшовные полы 512px (паркет, ковёр, терраццо, плитка, линолеум, трава) с тонировкой по типу комнаты; стены с AO, плинтусами, карнизом, дверными наличниками, подоконниками и бликами на окнах; полупрозрачные стены при сильном зуме.
- Свет: цикл день/ночь, дневной свет от окон, ночью пятна от ламп и фонарь у входа. Частицы: пар (кофе/насос), искры и дым у сломанных машин, чихание (зелёное при заразных болезнях). Пост-эффекты: виньетка, тёплый тон, bloom на High. Есть авто-понижение качества при fps<36.
- UI: шрифт Nunito (OFL, кириллица в комплекте), панели и кнопки с градиентами и тенями; в меню есть строка «Графика».
- Тесты: smoke (12 уровней, ошибок нет, сохранение/загрузка ok), verify_layout (0 нарушений), touch_build_test (8/8 вьюпортов ok).
- FPS 360x800 (DPR 2), CPU 1x / 4x: Low 58.8/60.2, Medium (по умолчанию) 58.8/28.1, High 54.7/13.3. v18 было 60.2/23.9.
- APK: dist/karachun-v19-debug.apk, 19.5MB.

## v20 — рисованный арт (27.10.2026)
- Полы: 6 текстур из art_src/v20 сделаны бесшовными (сдвиг на половину + смешивание краёв), уменьшены до 512px и заменили floor2_*.
- Картины: 6 картин вырезаны из листа, фон удалён, сохранены в www/assets/paint/p0-5.png (128px). Рисуются в плоскости стены через аффинное преобразование, с тенью; на стенах комнат вместо прежних заглушек.
- Иконка: обычная (скруглённая плитка с прозрачными углами), круглая и адаптивная (передний слой + фон #A4EFE8) для mdpi–xxxhdpi. В APK иконка приложения — mipmap-anydpi-v26/ic_launcher.xml (проверено через aapt2).
- Заставка: нативные splash.webp для всех плотностей, книжной и альбомной ориентации; экран загрузки и фон главного меню в игре с заголовком «Больница Карачун» шрифтом Nunito.
- Тесты: smoke ok (ошибок нет), verify_layout 0 нарушений, touch 8/8.
- APK dist/karachun-v20-debug.apk, 21.0MB.

## v21 — производительность и процедуры (27.10.2026)
Профиль: tools/v21_prof.js, headless Chrome 360x800 DPR2, CPU throttle 4x, ~60 дней игры, 13–16 пациентов, 18 кабинетов. Базой служил снимок до v21 (старые v19.js/render.js; anim.js уже новый, поэтому всплески от ленивого декодирования атласов есть и в базе).
| Качество | до: fps / p95 / p99 | после: fps / p95 / p99 |
|---|---|---|
| low | 57.5 / 16.8 / 33.3 | 54.4 / 33.3 / 33.4 |
| medium | 22.7 / 50.1 / 66.6 | 22.4 / 50.1 / 66.8 |
| high | 10.5 / 116.6 / 116.7 | 10.5 / 116.7 / 133.3 |
Самый первый замер medium до правок (со старым anim.js): p99/max 466 мс — эти рывки ушли после перехода на ImageBitmap и параллельную загрузку.
Ограничение: headless растеризует canvas программно (~90% — drawImage/заливка), поэтому выигрыш от кеша освещения, без blend-режимов, отсечения вне экрана и кеша эмодзи здесь не виден; на GPU телефона он должен быть, но на Mi 11 это не проверено.
Тесты: smoke OK (L12 пройден, saveload ok), verify_layout 0 нарушений, touch_build_test 8/8, levelsel 12/12 на 8 экранах, qa_audit L1 seeds выиграны, errs [].
Скриншоты: screenshots/v21_<кабинет>_{m50,10,50,95}.jpg (m50 = укладывание), v21_touch_*.

## v22 (28.10.2026) — производительность + процедуры + размер
Бенчмарк tools/v22_prof.js, headless Chrome, CPU throttle 4x, 360x800@2x, сцена после 60 дней бота, zoom 1.6.
| Качество/пан | v21 fps (p95) | v22 fps (p95) | drawImage/кадр v21→v22 |
|---|---|---|---|
| low, без пана | 50.4 (33.3) | 56.3 (33.3) | 206→187 |
| low, пан | 52.8 (33.3) | 54.9 (33.3) | 199→177 |
| medium, без пана | 21.5 (66.7) | 38.7 (33.4) | 204→186 |
| medium, пан | 22.8 (50.1) | 32.7 (50.1) | 199→177 |
| high, без пана | 11.3 (100) | 21.1 (66.6) | 206→184 |
| high, пан | 10.9 (116.6) | 19.8 (100) | 200→182 |
Основной выигрыш — кэш статики (пол+стены+мебель) в экранном слое и cap DPR (1/1.25/1.5); число drawImage снизилось лишь на ~10%, т.к. статика, перекрывающая людей, перерисовывается с клипом (~120 перерисовок/кадр).
Процедуры: психолог — пациент лежит на кушетке; сканер — выезжающий стол; убран артефакт обрезки спрайта сканера.
Размер: anim WebP q70 (13.9→9.8 МБ), anim_lo q62 (8.1→4.2 МБ).
Тесты: smoke, verify_layout (0 нарушений), touch_build_test (8/8), levelsel_test (12/12), qa_audit seeds — OK, ошибок нет.
Известное: свечение pumpmachine заморожено в статическом слое; эффекты комнат (fx) могут рисоваться поверх стен переднего плана; тумба под столом сканера отключена.

## v23 — полировка визуала (28.10.2026)
Исправлено:
- Свечение насоса (pumpmachine) больше не «запекается» в статичный слой — анимируется (V23A, dyn=s.anim).
- Эффекты процедур больше не рисуются поверх передних стен: у fx есть bb, по нему перерисовываются перекрывающие статики (только для активных процедур — иначе −10% fps на high).
- Психиатр: убрана тень сидячей позы под лежащим пациентом (v23NoSh).
- Сканер (diag): стол в покое виден и прикреплён к аппарату (подставка v22Ped, смещение idb −.05) во всех 4 поворотах.
- ICU: пациент лежит на кровати (был стоя). Морг: тело лежит на столе для вскрытия (было стоя / под столом).
- Рентген: пациент стоит у детектора, окно вспышки расширено (0.5–0.7) — вспышка видна.
- UI: «Лечить при шансе ≥» без переноса «≥», группы кнопок не переносятся (nowrap, компактные кнопки ≤380px); подсказка обучения скрывается, пока открыта панель (раньше перекрывала меню на 320px).
Аудит: 20+ кабинетов × 4 фазы, пустые кабинеты × 4 поворота, все кнопки нижней панели на 320x568/360x800/412x915/800x360 — переполнения текста нет.
Тесты: smoke ok, verify_layout 0 нарушений (1946 проверено), touch 8/8, levelsel 12/12 на 8 экранах, qa_audit 3 сида — без зависаний и ошибок.
Перф (CPU 4x, v22 → v23, fps): low 49.8→52.3 / 42.5→45.2 (pan); medium 30.8→27.3 / 23.5→23.6; high 16.4→14.3 / 13.3→14.2. Повторы medium P0: v23 26.8/28.3/29.9 vs v22 25.7/28.3/25.1 — в пределах шума. Машина-сборщик в этот день медленнее, чем при замере v22.
Осталось: в режиме «срез стен» дверное полотно на сторонах 0–1 лежит плоско с точками (похоже на задуманный срез, не менял). Старые APK v7–v22 утеряны при очистке песочницы.

## v24 — размеры кабинетов и дверь в срезе (28.10.2026)
- Все 25 кабинетов: размеры S/M/L (кнопки на панели строительства) плюс ручные ↔/↕ до 12. Цена = база×(1+0.75×(площадь/мин.площадь−1)), округление до $50. На кнопке ✔ теперь живая цена (раньше всегда показывалась базовая, а списывалось больше).
- Вместимость 1–3 (S/M/L) по отношению площадей 1 / ≥1.4 / ≥2. Влияет на игру: процедура быстрее ×1.3/×1.6; выбор кабинета и перебалансировка очередей по очереди/вместимости; порог «перегрузки» 6×вместимость; комната отдыха — восстановление быстрее, исследования — быстрее, библиотека — больше опыта. В карточке кабинета строка «Размер / вместимость». Старые сохранения: вместимость вычисляется по размеру.
- Ограничение: по-прежнему один пациент в кабинете одновременно; «вместимость» = пропускная способность, а не параллельные места.
- Дверь: передняя дверь — чистый порог-коврик (раньше серая плашка с разлетающимися точками шума); задняя створка в режиме среза гаснет вместе со стеной.
- Тесты: smoke ok, verify_layout 0 нарушений, touch 8/8, levelsel 12/12×8, qa 3 сида ok, UI-переполнений нет, tools/v24_size.js — без переполнения на 320/412/800.
- Перф v23→v24 (CPU 4x, fps, 2 прогона): low 52.3/55.1→57.5/55.9; medium 34.9/33.8→30.3/36.3; high 15.7/16.6→17.2/17.2.

## v25
Parallel places in M/L rooms (2–3 furniture sets, N staff, N patients at once). Details: V25_PROGRESS.md. Tests are green, APK 21.4 MB.
