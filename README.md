# MyCompany 1.4.0

One consolidated MeshCentral plugin. The repository is the complete install source; no legacy plugin code or submodules are loaded.

## Optional SirK Portal

SirK Portal is embedded in MyCompany as an optional frontend shell and is disabled by default.
MyCompany remains the owner of backend modules, permissions, persistent data, encrypted secrets and integrations.

Portal navigation uses the existing modules:

- `Zarządzanie` → MyScripts;
- `Akceptacje` → Approval Center;
- `Ustawienia` → MyCompany administration for Site Admin;
- `Mesh` → native MeshCentral interface.

Enable it under:

```text
MyCompany → Settings → SirK Portal → Enable SirK Portal
```

Do not run the standalone `SirKPortal` plugin at the same time. Disable or uninstall it before enabling the embedded Portal. See `docs/portal-integration.md`.

## Shared UI

All modules use `public/shared-ui/` for tabs, toolbar, layout, status navigation and settings sections. Approval Center is the reference layout. `ModuleShell.mount()` allows MyScripts and Approval Center to be embedded in the Portal without copying their code.

## Direct Git installation

Run as Administrator:

```powershell
.\Install-MyCompany-FromGit_RUN.ps1
```

The installer clones `main`, validates it, stops MeshCentral only for the atomic directory swap, removes old plugin files, installs the exact Git checkout and starts MeshCentral again.

## Included modules

Jedna samodzielna wtyczka MeshCentral zawierająca moduły:

- My Scripts;
- My Commands;
- My Jira / Jira Assets;
- Microsoft Defender XDR;
- Approval Center;
- Move Requests;
- optional SirK Portal frontend.

Nie wymaga i nie ładuje osobnych wtyczek. Włączone moduły są uruchamiane wewnątrz jednego obiektu pluginu `MyCompany`.

## Instalacja ręczna

Skopiuj folder `MyCompany` do:

```text
meshcentral-data/plugins/MyCompany
```

Uruchom ponownie MeshCentral i zamknij oraz otwórz ponownie kartę przeglądarki.

## Migracja legacy

Przy pierwszym uruchomieniu na Windows wykonywany jest bezpieczny import istniejących ustawień ze starych katalogów, jeżeli nadal istnieją:

- My Scripts: AD, Entra i Jira credentials;
- My Jira: Jira Cloud i Assets settings;
- DefenderTools: Graph credentials i uprawnienia zakładek.

Import kopiuje wyłącznie dane konfiguracyjne. Nie ładuje kodu starych wtyczek i nie usuwa ich plików. Wynik jest zapisany w `mycompany-data/legacy-migration.json`.

## Dane trwałe

```text
meshcentral-data/mycompany-data
├── settings.json
├── requests.json
├── secrets.json
├── .secret.key
├── legacy-migration.json
├── defender/
└── scripts/
    ├── MyScripts/
    └── MyCommands/
```

Portal nie tworzy osobnego storage. Sekrety nie są wysyłane do przeglądarki. W panelu administracyjnym są prezentowane wyłącznie znaczniki `configured`.

## Specialist integrations

### My Jira

Obsługuje:

- New/My/All tickets;
- My/All tasks;
- komentarze, transitions i assignment;
- Jira Assets AQL;
- mapowanie Assets do MeshCentral po hostname;
- przejście do urządzenia i My Commands.

### Defender XDR

Obsługuje:

- raport incydentów Microsoft Graph;
- alerts_v2 i evidence;
- korelację MDCA, Entra provisioning i directory audit;
- filtry czasu, statusu, Incident ID i nazwy/usera;
- osobne grupy dostępu do Incidents, Email Explorer, Tenant Allow/Block List i Advanced Hunting.

Raport jest uruchamiany dopiero po kliknięciu `Refresh incidents`.

### Shared integration profiles

Panel administracyjny posiada wspólną konfigurację AD, Entra, Jira, Defender i Zabbix.

## Test

```bash
npm test
```

Test sprawdza składnię JavaScript, zgodność wersji, wymagane moduły, opcjonalność Portalu, mapowanie MyScripts/Approval Center, backendowe zabezpieczenia oraz zapis ustawień.

## My Scripts compatibility

MyCompany zawiera pełny interfejs i backend My Scripts jako moduł wewnętrzny. Podczas pierwszego uruchomienia migracji kopiuje ze starego katalogu `plugins/myscripts`:

- `scripts`;
- `settings`;
- `data/credentials.json`;
- `data/folder-permissions.json`;
- `data/script-secrets.json`.

Stara wtyczka nie jest ładowana ani wymagana po zakończeniu migracji.

## My Commands scripts

Canonical location:

```text
meshcentral-data\mycompany-data\scripts\MyCommands
```

Example:

```text
MyCommands
├── ActiveDirectory
│   ├── ActiveDirectory.svg
│   ├── Groups
│   │   ├── Groups.svg
│   │   └── Add-User-To-Group.ps1
│   └── Users
│       ├── Users.png
│       └── Get-User.ps1
└── Automation
    ├── Automation.svg
    └── Winget-Upgrade.ps1
```

A folder graphic must have the same base name as its directory. Supported formats: SVG, PNG, JPG, JPEG and WEBP.

## Repository policy

This repository contains the complete installable MyCompany plugin and the full embedded script libraries under `seed/MyScripts` and `seed/MyCommands`. No external plugin source is loaded at runtime.
