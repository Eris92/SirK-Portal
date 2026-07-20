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
npm run prepare:test
```

Dla istniejącego klona:

```powershell
git pull
git submodule sync --recursive
git submodule update --init --recursive
npm run sync:files
npm test
```

## Architektura docelowa

```text
MeshCentral-MyCompany/
├── core/
├── modules/
│   ├── scripts/
│   │   ├── index.js
│   │   └── Files/       # kopia źródeł MeshCentral-MyScripts
│   ├── commands/
│   │   ├── index.js
│   │   └── Files/       # kopia źródeł MeshCentral-MyCommands
│   ├── approvals/
│   └── move/
├── public/
├── settings/
├── legacy/
├── test/
└── docs/
```

Nazwa `Files` została użyta zamiast kolejnego katalogu `scripts`, żeby nie tworzyć nieczytelnej ścieżki `modules/scripts/scripts`.

`legacy/` zawiera niezmienione źródła dotychczasowych pluginów jako submodules. Polecenie:

```powershell
npm run sync:files
```

kopiuje pełne źródła:

```text
legacy/myscripts  -> modules/scripts/Files
legacy/commands   -> modules/commands/Files
```

Kopiowane są pliki wymagane do testów, bez `.git`, `node_modules`, logów i danych runtime. Moduły korzystają najpierw z katalogu `Files`, a gdy nie został jeszcze zsynchronizowany — z odpowiedniego katalogu `legacy`.

## Zasady migracji

1. Jedna instalacja i jedna wersja pluginu.
2. Moduły można niezależnie włączać w `UI integration`.
3. Ustawienia biznesowe pozostają osobne per moduł.
4. Wspólne UI, CSS, permissions, audit, storage i error handling.
5. Zachowanie kompatybilności ze starymi ustawieniami i danymi.
6. Brak automatycznej akceptacji bez jawnej opcji `allowNoApproval`.
