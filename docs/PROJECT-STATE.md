# MyCompany — aktualny stan projektu

Stan dokumentacji: 2026-07-23  
Bieżąca wersja runtime: `1.5.137`

## Status

MyCompany jest pojedynczym pluginem MeshCentral zawierającym backend, moduły i opcjonalny SirK Portal. Repozytorium `Eris92/MeshCentral-MyCompany` jest źródłem instalacyjnym.

Wersja `1.5.137` ujednolica wszystkie podobne powierzchnie Portalu na jednym kontrakcie UI. Polecenia, Zarządzanie, Akceptacje, Ustawienia, My Jira i Defender korzystają z tego samego shella, toolbara, geometrii kolumn, nawigacji, kart, formularzy i tabel.

## Moduły

- My Scripts / Zarządzanie;
- My Commands / Automatyzacja i Polecenia urządzenia;
- Approval Center / Akceptacje;
- Move Requests;
- My Jira / Assets;
- Defender Tools / Security;
- wspólne integracje AD, Entra, Jira, Defender i Zabbix;
- opcjonalny SirK Portal.

## Kanoniczny kontrakt UI

Źródła kontraktu:

```text
public/vendor/sirk-portal/portal-ui-contract.css
public/vendor/sirk-portal/portal-ui-contract.js
```

Obowiązkowa struktura podobnych modułów:

```text
mc-portal-module-shell
├── mc-portal-module-toolbar
└── mc-portal-module-workspace
    └── mc-portal-module-layout
        ├── mc-portal-module-primary
        ├── mc-portal-module-secondary
        └── mc-portal-module-details
```

Obowiązkowe klasy komponentów:

```text
mc-portal-toolbar
mc-portal-toolbar-button
mc-portal-toolbar-icon
mc-portal-nav-item
mc-portal-nav-icon
mc-portal-nav-label
mc-portal-card
mc-portal-button
mc-portal-filter
mc-portal-table-wrap
mc-portal-table
```

Domyślna geometria:

| Element | Wartość |
|---|---:|
| pierwsza kolumna | 184 px |
| druga kolumna | 236 px |
| druga kolumna w Edit Mode | 440 px |
| pierwsza kolumna po zwinięciu | 56 px |
| toolbar | 48 px |
| pozycja nawigacji | 42 px |

Moduł może zmienić zmienne `--portal-primary-width`, `--portal-secondary-width` i akcent, ale nie może tworzyć konkurencyjnego systemu grid ani przechowywać swoich reguł w arkuszu innego modułu.

## Izolacja od starego interfejsu

- reguły Portalu są ograniczone do `#sirkPortalRoot`;
- stare klasy `mc-shared-*`, `sirk-management-*` i `mc-admin-*` są klasami funkcjonalnymi, a runtime dodaje im wspólne klasy `mc-portal-*`;
- `public/portal-device-tabs.css` zawiera wyłącznie reguły zakładek i sesji urządzeń;
- `portal-standalone-nav.js` nie przenosi iframe, nie usuwa klas Zarządzania, nie ukrywa widoku na 15 sekund i nie wstrzykuje własnego layoutu;
- natywny interfejs MeshCentral używany przez Desktop/Terminal działa wewnątrz osobnego iframe i nie przekazuje CSS do Portalu;
- Ustawienia są same-origin iframe, ale otrzymują końcowy arkusz kontraktu, klasy, akcent i jasny/ciemny z Portalu;
- iframe Ustawień nie może zmieniać stylu pozostałych widoków.

## Zachowanie wspólnego layoutu

Każdy moduł oparty na trzech kolumnach ma standardowo:

- taki sam toolbar i rozmiar przycisków;
- takie samo zaznaczenie aktywnej pozycji;
- taką samą szerokość kolumn;
- rzeczywiste zwijanie pierwszego tracku do 56 px;
- zwiększenie drugiego tracku do 440 px po włączeniu Edit Mode;
- takie same tabele, filtry, karty i przyciski;
- ten sam kontrakt responsive.

Nie każdy moduł musi udostępniać Edit, Favorites albo Multi. Dostępność funkcji wynika z konfiguracji toolbara modułu, ale funkcja o tej samej nazwie ma używać tego samego komponentu i zachowania.

## Najważniejsze pliki runtime Portalu

| Plik | Odpowiedzialność |
|---|---|
| `public/portal-standalone.html` | początkowy dokument i kolejność assetów |
| `public/standalone-core.js` | bootstrap, API i kontrolowane pierwsze pokazanie Portalu |
| `public/portal-standalone.js` | permissions, menu i renderowanie widoków |
| `public/portal-standalone-nav.js` | nawigacja, ładowanie kontraktu UI i kompaktowy nagłówek Devices |
| `public/portal-module-shell.css` | bazowy shell modułów |
| `public/vendor/sirk-portal/portal-ui-contract.css` | końcowy wspólny styl wszystkich modułów |
| `public/vendor/sirk-portal/portal-ui-contract.js` | mapowanie klas i synchronizacja osadzonych Ustawień |
| `public/portal-device-tabs.js` | zakładki `All + hosty`, trwałe iframe i warstwa sesji |
| `public/portal-device-workspace.js` | podzakładki i połączenia aktywnego hosta |
| `public/portal-management.js` | portalowy widok Zarządzania |
| `public/mycommands.js` | Commands, Edit, Multi, Favorites i PL/EN |
| `public/approvalcenter.js` | wspólny widok Approval Center |
| `web/admin-layout.js` | Ustawienia na wspólnym shellu Portalu |

## Trwałe sesje hostów

Zakładki hostów używają niezależnych iframe. Iframe ma pozostać stale podłączony do DOM od utworzenia zakładki do jej jawnego zamknięcia.

Dozwolone podczas przełączania:

- zmiana klas `is-active`;
- zmiana `aria-hidden`;
- zmiana `visibility`, `opacity` i `pointer-events` na stałej warstwie;
- aktualizacja położenia i rozmiaru warstwy sesji.

Niedozwolone:

- przenoszenie iframe przez `appendChild` do innego rodzica;
- `innerHTML = ...` na rodzicu iframe;
- usuwanie iframe przy wejściu do `All` albo innego widoku;
- zmiana `src` poza jawnym zamknięciem zakładki;
- odtwarzanie sesji przez ponowne utworzenie iframe.

## Odtwarzany stan

Portal przechowuje:

- aktywny widok główny;
- listę otwartych hostów;
- aktywnego hosta;
- aktywną podzakładkę osobno dla każdego hosta;
- stan zwinięcia menu i kolumn modułów;
- PL/EN;
- jasny/ciemny;
- branding Portalu.

Podzakładki hosta:

```text
general | desktop | terminal | commands | files | registry | software | amt
```

## Kontrakt F5

Po odświeżeniu:

1. bootstrap pobiera konfigurację i access state;
2. wyłączone pozycje menu są filtrowane przed pierwszą widoczną klatką;
3. odtwarzany jest zapisany widok;
4. dla Devices aktywowana jest właściwa stała warstwa hosta;
5. child workspace odtwarza ostatnią podzakładkę;
6. gotowy stan jest pokazywany jednokrotnie.

Nie powinny występować:

- chwilowe `Overview` lub `Ogólne` przed właściwym widokiem;
- biały ekran;
- zniknięcie całego Portalu po rozpoczęciu renderowania;
- pojawienie się wyłączonych pozycji menu;
- oczekiwanie wynikające wyłącznie z długiego timeoutu.

## Approval i Results

`core/approval-service.js` usuwa prywatny `payload` w `publicRequest()`. Widoki klienckie nie mogą filtrować publicznych rekordów po `request.payload`.

Widoczność rekordów jest kontrolowana centralnie:

- Site Admin widzi rekordy zgodnie z providerem;
- requester widzi własne wnioski;
- approver widzi wnioski, które może obsłużyć.

## Automatyczna walidacja

Repozytorium posiada workflow:

```text
.github/workflows/validate.yml
```

Każdy push i pull request wykonuje:

```text
npm test
node --check dla wszystkich plików JavaScript
```

Test `test/portal-ui-contract.test.js` sprawdza między innymi:

- jeden wspólny shell modułów;
- wspólne klasy toolbarów, nawigacji, kart i tabel;
- brak stylów Zarządzania w arkuszu Devices;
- brak starego mutatora DOM;
- ograniczenie obserwatora do `#sirkPortalRoot`;
- wspólny layout Ustawień;
- szerokości 184/236/440/56 px.

## Obowiązkowa walidacja ręczna

1. `F5` na `All`;
2. `F5` na aktywnym hoście i podzakładce Desktop lub Terminal;
3. `Devices → Zarządzanie → Devices` bez utraty sesji;
4. Polecenia, Zarządzanie, Akceptacje i Ustawienia w trybie rozwiniętym i zwiniętym;
5. Edit Mode i szerokość drugiej kolumny;
6. tabele, filtry, karty i przyciski w każdym module;
7. PL/EN bez opuszczania bieżącego widoku;
8. jasny/ciemny bez opuszczania bieżącego widoku;
9. menu Connect w Desktop i Terminal;
10. widoczność tylko dozwolonych pozycji menu.

## Zasady wydania

Zmiana runtime wymaga:

- testu celowanego;
- pełnego `npm test`;
- spójnej wersji w `config.json`, `package.json` i browser bootstrapie;
- dokumentacji zmiany;
- kontrolowanego deploymentu z backupem.
