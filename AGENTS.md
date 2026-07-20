# AGENTS.md — MeshCentral-MyCompany

- Komunikuj się po polsku.
- Przed zmianą przeczytaj `docs/ARCHITECTURE.md` i `docs/MIGRATION.md`.
- `legacy/` jest materiałem referencyjnym; nie poprawiaj submodules w tym repozytorium.
- Nową logikę implementuj w `core/` albo właściwym `modules/<name>/`.
- Zachowuj kompatybilność konfiguracji i danych istniejących pluginów.
- Nie wykonuj automatycznej akceptacji wyłącznie dlatego, że nie skonfigurowano grupy.
- Po zmianach uruchom `npm test`.
