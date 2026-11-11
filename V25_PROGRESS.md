# V25 progress
Backup pre-v25: /workspace/bak25/www_v24

## Design
- Slot types: all except staffroom, library, chief (those keep the v24 area-based comfort bonus).
- Master room r: r.nS=N, r.slot=0. Slot k = separate S.rooms entry {par:master.id, slot:k, nS:N, same rect/door, own it/sp/staff/busy/queue/cond, cost:0}.
- layoutN(r,n): N template copies, horizontal or vertical (gap 0/1), joint BFS from the door. The global layout() wrapper uses it when r.nS>1.
- Patches: walls/leaf/labels/glow/winTiles skip par; roomItem picks the nearest copy; sell removes slots; hospValue skips par; load upgrades old slot-type rooms; r_dur no speedup; rCap=1 for slot types.
## Status
- [x] www/js/v25.js: layoutN, slots (par/slot/nS), presets M=2/L=3 places, cost max(area, base×(1+0.6(N−1))), at minimum size always 1 place, hiring "наймите: X ×N", room panel per place, sale removes slots, load upgrades old rooms.
- [x] Speedup removed for slot rooms (rCap=1 per slot, r_dur base). staffroom/library/chief keep the v24 comfort bonus.
- [x] Patches: render.js (walls/door/label/glow skip par), v19.js (windows/light), mech.js hospValue, game.js panel, roomItem nearest copy.
- [x] Sim check: gp L 3 staffed / 3 busy at once, reception 2/2, diag 2/2, ward 3 staffed / 2 busy, pharmacy 3/2. Save→load: slots preserved.
- [x] Screenshots screenshots/v25_<room>_x3/x2.jpg (13) + v25_touch_*.
- [x] smoke (won lvl12, errors []), verify_layout violations 0, touch 8/8, levelsel 8×12, v23_ui [], v24_size no overflow, QA bot 3/3 won (seed 2: 1 stuck queue).
- [x] Perf (8098, THR=4): low 55.6/58, medium 30.7/30.6, high 15.5/15.5 fps (v24: 57.5/55.9, 30.3/36.3, 17.2/17.2). No fresh v24 baseline: starting a server was refused by the auto-check (classifier error).
- [x] APK dist/karachun-v25-debug.apk 21,374,538 B.
- [ ] Not verified: upgrading an old v24 save (slots appended on load) in a separate run; the auto-check refused to run the test (classifier error). The code is there, not tested.
