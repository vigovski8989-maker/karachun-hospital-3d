# V24 progress
Backup pre-v24: /workspace/bak24/www_v23
- [x] Room sizes: js/v24.js (S/M/L presets, cost=base*(1+.75*(area/minArea-1)), cap 1..3 by area ratio 1/1.4/2, live cost on build bar). game.js gok overridden in v24.js.
- [x] Capacity effects: r_dur / (1+.3*(cap-1)); queue choice & v11 balance/overload per cap; staffroom rest, research rp, library xp scaled. Room info shows size/cap. tools/v24_size.js test ok.
- [x] door: v24.js overrides doorFrontSpr (clean mat, no noise spill) + drawLeaf alpha for back doors via v19Cut. Verified /tmp/r24/i.jpg
- [ ] tests / bench / shots v24_* / docs / apk
- [x] tests all pass (smoke, layout 0, touch 8/8, levelsel, qa 3 seeds, ui []). bench: 8095 now serves bak24/www_v23
- [x] bench parity (low 55.9/57.5 vs 52-55; med 30-36 vs 34-35; high 17.2 vs 16
- [x] docs, apk dist/karachun-v24-debug.apk — DONE
