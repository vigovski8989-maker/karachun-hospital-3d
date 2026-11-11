#!/usr/bin/env bash
# Copy v45 runtime files (no Blender sources) into packaging/trial45/www
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/prototypes/v45_reception"
DST="$ROOT/packaging/trial45/www"
if [[ ! -d "$SRC" ]]; then
  echo "Missing $SRC" >&2
  exit 1
fi
python3 - "$SRC" "$DST" <<'PY'
import sys, shutil
from pathlib import Path
src, dst = Path(sys.argv[1]), Path(sys.argv[2])
if dst.exists():
    shutil.rmtree(dst)
keep_dirs = ["assets", "data", "js", "js3d", "lib", "models"]
keep_files = ["index.html", "LICENSES.md"]
dst.mkdir(parents=True)
for name in keep_files:
    p = src / name
    if p.is_file():
        shutil.copy2(p, dst / name)
for name in keep_dirs:
    s, d = src / name, dst / name
    if s.is_dir():
        shutil.copytree(s, d, ignore=lambda _dir, names: [n for n in names if n.endswith((".blend", ".blend1", ".bak", ".phase2bak"))])
print("Copied to", dst)
PY
