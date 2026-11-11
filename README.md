# Больница Карачун 3D

Игра-симулятор больницы: строительство кабинетов, найм персонала, приём и лечение пациентов. Интерфейс на русском языке. Текущая линия разработки — трёхмерная изометрическая версия на Three.js.

**Актуальная версия исходников в этом репозитории: пробная сборка 45.0.4** (`prototypes/v45_reception`).

Готовые установочные файлы (Android APK и архив для Windows) лежат в [релизе v45.0.4-trial](https://github.com/vigovski8989-maker/karachun-hospital-3d/releases/tag/v45.0.4-trial). Пробные сборки ставятся поверх предыдущих пробных с тем же пакетом `com.hohotun.karachun3d.trial45` и сохраняют прогресс (ключ сохранения `hohotun_trial45_save_v1`).

## Как запустить в браузере

Нужны Node.js и npm.

```bash
npm install
npx http-server prototypes/v45_reception -p 8090
```

Откройте в браузере `http://127.0.0.1:8090`. Историческая двумерная ветка по-прежнему лежит в `www/` (`npx http-server www -p 8090`).

## Как собрать Android APK

Пробная обёртка Capacitor находится в `packaging/trial45/` (пакет `com.hohotun.karachun3d.trial45`, versionCode 4505, versionName `45.0.4-trial`).

Понадобятся JDK 21 и Android SDK. Путь к SDK задаётся только локально в `android/local.properties` (`sdk.dir=...`) — этот файл в репозиторий не входит.

```bash
# скопировать игровые файлы v45 в packaging/trial45/www
./packaging/sync-www.sh

cd packaging/trial45
npm install
npx cap sync android
# укажите свой Android SDK, например:
# echo "sdk.dir=$HOME/android" > android/local.properties
cd android
./gradlew assembleDebug --no-daemon
```

APK появится в `android/app/build/outputs/apk/debug/`. Подпись debug-сборки — стандартная debug-подпись Android SDK; файлы keystore и пароли в репозиторий не входят.

Скрипт `build-apk.sh` в корне относится к более ранней обёртке `android/` (пакет `com.hohotun.hospital`) и каталогу `www/`.

## Windows

Готовая пробная сборка Windows — это папка с приложением `Karachun3D_trial45` (оболочка на базе Chromium вокруг тех же веб-файлов игры), упакованная в `.7z`. Скачайте архив из релиза; исходники оболочки в git не включены (это готовый рантайм на сотни мегабайт).

## Структура репозитория

| Путь | Содержимое |
|---|---|
| `prototypes/v45_reception/` | Текущая игра 45.0.4: `js/`, `js3d/r3d.js`, модели, текстуры, данные уровней |
| `prototypes/v45_reception/models_build/` | Исходники персонажа в Blender (`.blend`) и связанные текстуры |
| `prototypes/v38_game/` и `prototypes/v28_3d`…`v37_3d` | Предыдущие прототипы 3D-ветки |
| `prototypes/v28_25d/`, `prototypes/v*_src/` | Более ранние прототипы и черновики |
| `www/` | Историческая canvas/2D-версия игры |
| `android/` | Ранняя Capacitor-обёртка (`com.hohotun.hospital`) |
| `packaging/trial45/` | Обёртка текущей пробной сборки (`com.hohotun.karachun3d.trial45`) |
| `tools/` | Скрипты сборки арта, проверки, Blender |
| `art_src/` | Референсы и исходники арта (без огромных каталогов готового рендера) |
| `ROADMAP.md`, `V*_PROGRESS.md`, `QA_REPORT.md` | История разработки и отчёты |

В git не входят: `node_modules`, каталоги `review/` и другие дампы кадров, видео и бенчмарки, готовые APK/7z, keystore и секреты, локальный `local.properties`.

## Лицензии сторонних ассетов

Базовые персонажи и библиотека анимаций — Quaternius (CC0 1.0); three.js — MIT; декодер Draco — Apache-2.0. Подробности: [`prototypes/v45_reception/LICENSES.md`](prototypes/v45_reception/LICENSES.md).
