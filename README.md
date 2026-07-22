# MyCompany 1.5.83

Prompt do rozpoczynania nowej rozmowy: [`docs/agent/Prompt-Start-MyCompany-Conversation.md`](docs/agent/Prompt-Start-MyCompany-Conversation.md).

One consolidated MeshCentral plugin. The repository is the complete install source; no legacy plugin code or submodules are loaded.

Portal Overview pokazuje liczbę otwartych wniosków Approval Center oraz zbiorczy stan integracji. Site Admin ustawia dla Active Directory, Entra ID, Jira, Defender XDR i Zabbix stan `OK`, `Warning` albo `Critical` oraz osobne komunikaty PL/EN.
Ręczne `OK` jest honorowane dopiero po potwierdzeniu kompletności wymaganej konfiguracji i credentiali; brak konfiguracji automatycznie wymusza `Critical` bez ujawniania sekretów.

Reguły lewego menu Portalu oraz folderów My Scripts i My Commands stosują zasadę deny-by-default: pusta lista grup nie nadaje dostępu. Dostęp bez przypisywania grup wymaga jawnego zaznaczenia `Dostęp dla wszystkich użytkowników`; Site Admin nadal omija ograniczenie grupowe dla włączonych pozycji.

Administracja MyCompany korzysta z powierzchni zgodnej z Zarządzaniem: wspólny toolbar, trzy kolumny `184px / 236px / minmax(0,1fr)`, zwinięta pierwsza kolumna `56px`, ikony SVG oraz jedno aktywne zaznaczenie. Istniejące formularze, zapis, walidacja, Wtyczki, Serwer i Debug zachowują swoje funkcje.

Wszystkie panele `Settings`, w tym SirK Portal, używają jednego paska `Save settings` bez przycisków zapisu wewnątrz sekcji zwijanych.

Administracja zawiera niezależne pozycje pierwszej kolumny `Wtyczki` i `Serwer`.
`Wtyczki` udostępnia tabelę pluginów, dodawanie konfiguracji HTTPS oraz potwierdzane
akcje włączania, wyłączania i usuwania z backupem. `Serwer` pokazuje wyłącznie
usługi Windows należące do bieżącej instalacji MeshCentral i pozwala zaplanować
ich potwierdzony restart. MyCompany nie może wyłączyć ani usunąć samego siebie.

## Optional SirK Portal

SirK Portal is embedded in MyCompany as a fully independent document and is disabled by default.
MyCompany remains the owner of backend modules, permissions, persistent data, encrypted secrets and integrations.
The Portal does not replace the native login screen, inject a global shell or CSS, or register MeshCentral `domain.customFiles`. An optional native launcher is disabled by default.

Portal navigation uses the existing modules:

- `Zarządzanie` → MyScripts;
- `Akceptacje` → Approval Center;
- `Ustawienia` → MyCompany administration for Site Admin;
- `Mesh` → native MeshCentral interface.

Enable it under:

```text
MyCompany → Settings → SirK Portal → Enable SirK Portal
```

Opcjonalne przełączniki `Wymuszaj nowy ekran logowania` i `Wymuszaj nowy
interfejs` kierują odpowiednio ekran logowania oraz wejścia do natywnego UI na
SirK Portal. Nowy ekran logowania osadza natywne uwierzytelnianie MeshCentral,
dzięki czemu nie przechowuje haseł ani nie tworzy alternatywnej sesji.

Po wygaśnięciu lub utracie sesji odpowiedź API `401` kieruje użytkownika do
ekranu logowania. Po poprawnym zalogowaniu Portal wraca do poprzedniej zakładki.

Nagłówek nowego Portalu pokazuje kafelek bieżącego użytkownika w kolejności
`Prawdziwa Nazwa → obrazek`. Menu otwierane najechaniem, fokusem lub kliknięciem
zawiera natywną akcję `Wyloguj się`, która unieważnia sesję MeshCentral.

Przełącznik `Utrzymuj sesje po restarcie MeshCentral` w ustawieniach SirK Portal
zarządza stałym `SessionKey`. MyCompany generuje sekret, tworzy backup
`config.json` i nigdy nie zwraca wartości klucza do przeglądarki. Zmiana wymaga
restartu usługi. Klucze skonfigurowane poza MyCompany nie są usuwane.

Do not run the standalone `SirKPortal` plugin at the same time. Disable or uninstall it before enabling the embedded Portal. See `docs/portal-integration.md`.

## Shared UI

All modules use `public/shared-ui/` for tabs, toolbar, layout, status navigation and settings sections. Approval Center is the reference layout. `ModuleShell.mount()` allows MyScripts and Approval Center to be embedded in the Portal without copying their code.

## Administration layout

Natywny panel MyCompany używa układu wzorowanego na My Scripts. Pierwsza kolumna zawiera `Overview`, `Settings` i `Debug`. Dla `Settings` druga kolumna zawiera `SirK Portal`, `Approval Center`, `Move Request`, `My Commands`, `My Scripts`, `My Jira` i `Defender XDR`; dla `Debug` zawiera `Config`, `Logi` i `Błędy`. Trzecia kolumna pokazuje wybrany formularz lub diagnostykę. `Overview` pomija drugą kolumnę i jest widokiem tylko do odczytu: pokazuje stan wszystkich modułów bez kontrolek zmiany i zapisu.

## SirK Portal view style and personalization

Wszystkie widoki SirK Portal poza `Urządzenia` używają jednego wspólnego
kontraktu powierzchni, toolbaru, nawigacji, kart, przycisków i akcentu. Widok
`Urządzenia` zachowuje własny układ inwentarza.

W `MyCompany → Settings → SirK Portal` każdą zakładkę można niezależnie:

- pokazać lub ukryć;
- pozostawić w stylu domyślnym;
- włączyć personalizację;
- nadać własną nazwę i sześciocyfrowy kolor akcentu.

Jeżeli wszystkie zakładki zostaną wyłączone, backend pozostawi włączony
`Przegląd`. Ukrytego widoku nie można otworzyć bezpośrednio przez hash URL, a
niedostępny widok startowy jest automatycznie zastępowany pierwszym widocznym.

## Codex and new-thread entrypoint

Każdy nowy wątek dotyczący MyCompany rozpoczyna pracę w tym repozytorium od
`AGENTS.md`. Reguły specyficzne dla pluginu znajdują się w
`docs/agent/11-Agent-MyCompany.md`, a powtarzalne operacje w `.agents/skills`:

- `test-mycompany` — pełna walidacja `npm test`;
- `check-mycompany-version` — kontrola wszystkich źródeł wersji;
- `deploy-mycompany-local` — backup i lokalne wdrożenie bez restartu;
- `read-meshcentral-log` — ograniczona diagnostyka logów;
- `restart-meshcentral-service` — restart wyłącznie po jawnej zgodzie.

Repozytorium `C:\Users\Kris\Documents\MeshCentral 2` przechowuje potwierdzoną
architekturę i status środowiska. Zainstalowany katalog
`meshcentral-data\plugins\MyCompany` jest artefaktem do reloadu/testu, nie
źródłem zmian.

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

Aktualna wersja nie odczytuje ani nie ładuje katalogów starych wtyczek w czasie działania. Dane ze starych repozytoriów należy przenieść kontrolowanym procesem przed ich wyłączeniem. Istniejący `legacy-migration.json` może pozostać jako historyczny rejestr wcześniejszej migracji, ale nie jest wykonywalną konfiguracją.

## Dane trwałe

```text
meshcentral-data/mycompany-data
├── settings.json
├── requests.json
├── secrets.json
├── .secret.key
├── defender/
└── scripts/
    ├── MyScripts/
    └── MyCommands/
```

Portal nie tworzy osobnego storage. Sekrety nie są wysyłane do przeglądarki. W panelu administracyjnym są prezentowane wyłącznie znaczniki `configured`.

## Approval API

Wersjonowane API serwer–serwer jest dostępne pod `/mycompany/api/v1/approval`; zachowany alias kompatybilności to `/approvalcenter/api/v1`. Udostępnia discovery providerów i ich zasobów, odczyt/składanie wniosków oraz decyzje. Tokeny mają scopes i opcjonalne ograniczenie providerów. Każdy POST wymaga `Idempotency-Key`, aby retry nie tworzył drugiego wniosku ani drugiego wykonania.

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

MyCompany zawiera pełny interfejs i backend My Scripts jako moduł wewnętrzny. Biblioteka użytkownika jest przechowywana wyłącznie w `mycompany-data`. Jeżeli migracja jest potrzebna, należy skopiować do niej kontrolowanie:

- `scripts`;
- `settings`;
- `data/credentials.json`;
- `data/folder-permissions.json`;
- `data/script-secrets.json`.

MyCompany nie przeszukuje już sąsiednich katalogów starych wtyczek i nie ładuje z nich kodu ani skryptów.

### Dwujęzyczne metadane My Scripts

Każdy skrypt może deklarować nazwę i opis w obu językach:

```powershell
#PL Polska nazwa | Polski opis widoczny w portalu
#EN English name | English description shown in the portal
```

Zmienne, listy i sekrety używają tej samej nazwy technicznej oraz par dyrektyw
z sufiksami `PL` i `EN`:

```powershell
# VariableRequiredPL: $UserName, Użytkownik | Login użytkownika
# VariableRequiredEN: $UserName, User | User login
# VariableSelectPL: $Limit=20, Limit | Liczba rekordów |20=20 rekordów|50=50 rekordów
# VariableSelectEN: $Limit=20, Limit | Number of records |20=20 records|50=50 records
```

Edit Mode zapisuje obie wersje językowe. Starsze jednojęzyczne nagłówki nadal
są odczytywane jako fallback, ale nowe i edytowane skrypty powinny używać par
`PL`/`EN`.

Folder może zawierać plik `<NazwaFolderu>.menu` obok opcjonalnego pliku ikony:

```text
Raporty/
├── Raporty.svg
├── Raporty.menu
└── Get-Report.ps1
```

Zawartość `.menu` używa nagłówków `#PL` i `#EN` jak skrypt. Nazwa jest widoczna
w menu, a opis pojawia się jako podpowiedź po najechaniu. Zmiana języka SirK
Portal przełącza foldery, skrypty, parametry, opcje i akcje bez przeładowania.

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
