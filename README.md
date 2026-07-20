# MeshCentral-MyCompany

Modularny pakiet pluginów MeshCentral łączący funkcje:

- My Scripts
- My Commands
- Approval Center
- Move Requests

## Pobranie pełnego kodu

Repozytorium korzysta z Git submodules, dzięki czemu zachowuje pełny kod i historię źródłowych pluginów na czas migracji:

```powershell
git clone --recurse-submodules https://github.com/Eris92/MeshCentral-MyCompany.git
cd MeshCentral-MyCompany
npm test
```

Dla istniejącego klona:

```powershell
git submodule update --init --recursive
```

## Architektura docelowa

```text
MeshCentral-MyCompany/
├── core/
├── modules/
│   ├── scripts/
│   ├── commands/
│   ├── approvals/
│   └── move/
├── public/
├── settings/
├── legacy/
├── test/
└── docs/
```

`legacy/` zawiera niezmienione źródła dotychczasowych pluginów jako submodules. Nowy kod należy przenosić etapami do `core/` i `modules/`, bez modyfikowania źródeł referencyjnych.

## Zasady migracji

1. Jedna instalacja i jedna wersja pluginu.
2. Moduły można niezależnie włączać w `UI integration`.
3. Ustawienia biznesowe pozostają osobne per moduł.
4. Wspólne UI, CSS, permissions, audit, storage i error handling.
5. Zachowanie kompatybilności ze starymi ustawieniami i danymi.
6. Brak automatycznej akceptacji bez jawnej opcji `allowNoApproval`.
