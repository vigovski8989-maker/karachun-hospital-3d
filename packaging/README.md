# Сборка пробной версии 45

`trial45/` — Capacitor-проект текущей пробной сборки:

- `applicationId`: `com.hohotun.karachun3d.trial45`
- `versionName`: `45.0.4-trial`, `versionCode`: `4505`

Перед `npx cap sync android` выполните `./packaging/sync-www.sh` из корня репозитория. Каталог `trial45/www/` генерируется скриптом и в git не хранится.

Путь к Android SDK пишите только в локальный `android/local.properties`. Не кладите в репозиторий keystore, пароли и `.env`.
