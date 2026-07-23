# MyCompany 1.5.134

Jeden skonsolidowany plugin MeshCentral zawierający backend, moduły administracyjne, biblioteki skryptów i opcjonalny SirK Portal.

## Dokumentacja

- [Aktualny stan projektu](docs/PROJECT-STATE.md)
- [Integracja MyCompany + SirK Portal](docs/portal-integration.md)
- [AGENTS.md](AGENTS.md)
- [Reguły agenta dla MyCompany](docs/agent/11-Agent-MyCompany.md)
- [Prompt startowy nowej rozmowy](docs/agent/Prompt-Start-MyCompany-Conversation.md)

Repozytorium jest kompletnym źródłem instalacyjnym. Runtime nie ładuje kodu z dawnych repozytoriów ani sąsiednich pluginów.

## Moduły

```text
MyCompany
├── My Scripts / Zarządzanie
├── My Commands / Automatyzacja
├── Approval Center / Akceptacje
├── Move Requests
├── My Jira / Assets
├── Defender Tools / Security
├── wspólne integracje i encrypted secrets
└── SirK Portal (opcjonalny frontend)
```

`MyScripts`, `MyCommands`, `MyJira`, `DefenderTools`, `ApprovalCenter` i `MoveRequests` są modułami wewnętrznymi, a nie osobnymi pluginami.

## SirK Portal

SirK Portal jest niezależnym dokumentem frontendowym udostępnianym przez MyCompany. Nie modyfikuje core MeshCentral, nie podmienia natywnych plików i nie rejestruje globalnych `domain.customFiles`.

Nie uruchamiaj jednocześnie osobnej wtyczki `SirKPortal`.

Włączenie:

```text
MyCompany → Settings → SirK Portal → Enable SirK Portal
```

Główne widoki:

- Przegląd;
- Urządzenia;
- Akceptacje;
- Automatyzacja;
- Monitoring;
- Zasoby;
- Zarządzanie;
- Raporty;
- Bezpieczeństwo;
- Ustawienia;
- MeshCentral.

Każdy widok może zostać ukryty albo ograniczony do grup użytkowników MeshCentral. Backend ponownie sprawdza dostęp do endpointów i zasobów; ukrycie elementu UI nie jest jedyną kontrolą bezpieczeństwa.

## Zakładki hostów i trwałe sesje

Widok Urządzenia posiada dwa poziomy nawigacji:

1. górne zakładki `Wszystkie / All + otwarte hosty`;
2. podzakładki aktywnego hosta:

```text
Ogólne | Pulpit | Terminal | Polecenia | Pliki | Rejestr | Oprogramowanie | Intel AMT
```

Każdy otwarty host ma osobny iframe umieszczony w stałej warstwie sesji. Przełączenie hosta, `All` albo innego widoku Portalu nie powinno usuwać ani przeładowywać iframe.

Aktywny host i jego podzakładka są zapisywane. Po `F5` Portal ma wrócić bezpośrednio do właściwego hosta i podzakładki, bez pośredniego pokazania `Overview` lub `Ogólne`.

Szczegółowy kontrakt znajduje się w [docs/PROJECT-STATE.md](docs/PROJECT-STATE.md).

## Start Portalu po F5

Przed pierwszą widoczną klatką Portal powinien:

- pobrać bootstrap i access state;
- zastosować widoczność pozycji menu;
- ustalić aktywny widok;
- odtworzyć aktywnego hosta i jego workspace;
- zastosować zapisany język, motyw i branding.

Nie powinny pojawiać się:

- wyłączone funkcje menu;
- chwilowy inny widok;
- biały ekran;
- sekwencja `Overview → host → zniknięcie → host`;
- długie oczekiwanie wynikające wyłącznie z timeoutu.

## PL/EN, motyw i branding

PL/EN oraz jasny/ciemny są wspólne dla głównego Portalu i otwartych workspace’ów hostów. Zmiana nie powinna wymagać wyjścia z hosta ani przeładowania iframe.

`Settings → SirK Portal → Portal interface` zawiera między innymi:

- nazwę witryny;
- adres ikony witryny i favicon;
- widoczność przycisku resetu hasła;
- adres resetu hasła;
- widoczność, nazwy i akcenty pozycji menu;
- wymuszenie nowego ekranu logowania;
- wymuszenie nowego interfejsu;
- utrzymywanie sesji po restarcie MeshCentral.

## Desktop i Terminal

Desktop i Terminal używają natywnej logiki MeshCentral przez plugin-local bridge.

Menu strzałki obok `Połącz / Connect` jest renderowane nad iframe i nie może być przycinane przez toolbar. Przełączanie metod połączenia nie powinno przeładowywać aktywnego workspace.

Przycisk trybu widoku:

- lewy klik przełącza widok szeroki;
- prawy klik otwiera menu:
  - Widok szeroki;
  - Widok szeroki + tryb pełnoekranowy;
  - Pełny ekran połączenia;
  - Pełny ekran połączenia + tryb pełnoekranowy.

## Zarządzanie

Zarządzanie korzysta z trzykolumnowego układu:

- pierwsza kolumna: kolorowe ikony głównych kategorii;
- druga kolumna: foldery i skrypty;
- trzecia kolumna: wykonanie, edycja albo wyniki.

Zwinięcie pierwszej kolumny ma zmieniać jej rzeczywistą szerokość, a nie tylko ukrywać nazwy.

My Scripts obsługuje:

- PL/EN nazw, opisów, zmiennych i opcji;
- Favorites;
- Edit Mode;
- Credentials i Secrets;
- potwierdzenie wykonania;
- Approval Levels;
- Results i Debug.

## My Commands

My Commands obsługuje:

- wbudowane polecenia oraz skrypty PowerShell;
- osobne ikony kategorii i poleceń;
- PL/EN;
- Edit i Favorites;
- Multi dla wielu urządzeń;
- parametry i potwierdzenia;
- approval workflow.

Multi wysyła `commandId` dla wbudowanego polecenia i `scriptPath` dla skryptu.

## Approval Center i Results

Approval Center jest wspólnym workflow dla providerów MyCompany.

`core/approval-service.js` usuwa prywatne `payload` przed zwróceniem publicznego rekordu. Widoki klienckie nie mogą filtrować publicznych wyników przez `request.payload`.

Management → Results i Approval korzystają z tego samego źródła danych oraz centralnej kontroli widoczności.

## Uprawnienia

Reguły lewego menu Portalu oraz folderów My Scripts i My Commands stosują deny-by-default.

- `enabled: false` ukrywa i blokuje zasób;
- `allowAll: true` nadaje dostęp wszystkim użytkownikom posiadającym dostęp do modułu;
- `groupIds` ogranicza dostęp do wybranych grup MeshCentral;
- pusta lista grup bez `allowAll=true` nie nadaje dostępu;
- Site Admin omija ograniczenie grupowe dla włączonych elementów.

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

Portal nie tworzy osobnego storage. Sekrety nie są wysyłane do przeglądarki. Panel administracyjny pokazuje wyłącznie stan `configured`.

## Dwujęzyczne metadane skryptów

```powershell
#PL Polska nazwa | Polski opis
#EN English name | English description

# VariableRequiredPL: $UserName, Użytkownik | Login użytkownika
# VariableRequiredEN: $UserName, User | User login
```

Folder może posiadać plik `<NazwaFolderu>.menu` oraz grafikę o tej samej nazwie bazowej. Obsługiwane grafiki: SVG, PNG, JPG, JPEG i WEBP.

## Instalacja z Git

Uruchom jako Administrator:

```powershell
.\Install-MyCompany-FromGit_RUN.ps1
```

Installer pobiera `main`, waliduje źródło, wykonuje atomową podmianę katalogu pluginu i uruchamia MeshCentral ponownie.

Instalacja ręczna:

```text
meshcentral-data/plugins/MyCompany
```

Nie nadpisuj `meshcentral-data/mycompany-data` podczas aktualizacji pluginu.

## Testy

```bash
npm test
```

Po zmianach Portalu obowiązkowa jest również ręczna kontrola:

1. `F5` na `All`;
2. `F5` na aktywnym hoście i aktywnej podzakładce;
3. `Devices → inny widok → Devices` bez utraty sesji;
4. przełączenie pomiędzy co najmniej dwoma hostami;
5. PL/EN bez opuszczania hosta;
6. jasny/ciemny bez opuszczania hosta;
7. Desktop i Terminal wraz z menu Connect;
8. tryby szerokie i pełnoekranowe;
9. widoczność tylko dozwolonych pozycji menu;
10. Management → Results z danymi widocznymi w Approval.

## Praca agenta

Każdy nowy wątek dotyczący MyCompany zaczyna się od `AGENTS.md` oraz `docs/agent/11-Agent-MyCompany.md`.

Najważniejsze Skills:

- `test-mycompany`;
- `check-mycompany-version`;
- `deploy-mycompany-local`;
- `read-meshcentral-log`;
- `restart-meshcentral-service`.

Zmiana runtime wymaga testów, spójnej wersji, changelogu, historii wersji oraz kontrolowanego deploymentu. Zmiana wyłącznie dokumentacji nie wymaga podnoszenia wersji pluginu.

## Repository policy

Repozytorium zawiera kompletny instalowalny plugin oraz biblioteki `seed/MyScripts` i `seed/MyCommands`. Runtime nie ładuje zewnętrznego źródła pluginów ani kodu legacy.
