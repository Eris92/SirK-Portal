# MeshCentral Plugin Architecture

## Język pracy

- Komunikuj się z użytkownikiem po polsku.
- Dokumentację projektu twórz po polsku.
- Nazwy funkcji, zmiennych, klas, plików, API, hooków i standardową nomenklaturę techniczną zachowuj po angielsku.
- Nie tłumacz nazw własnych mechanizmów MeshCentral.
- Kod i logi zapisuj zgodnie z konwencją istniejącego projektu.

---

# Cel projektu

Budujemy od zera ustandaryzowaną architekturę pluginów do MeshCentral.

Nie przenoś automatycznie starego kodu ani logiki do nowego szkieletu. Najpierw zbuduj minimalną, poprawną i zweryfikowaną strukturę pluginu. Dopiero później przenoś funkcjonalność etapami.

Wszystkie pluginy mają:

- mieć spójną architekturę,
- współdzielić ustalony zestaw funkcji,
- korzystać ze stylu i mechanizmów UI głównego MeshCentral,
- nie powodować kolizji między pluginami,
- być łatwe do aktualizacji,
- być samowystarczalne i przenośne,
- nie wymagać patchowania głównej aplikacji,
- ograniczać zbędne ponowne analizowanie instalacji.

---

# Środowisko

```text
MeshCentral root:
C:\Program Files\Open Source\MeshCentral

Plugins root:
C:\Program Files\Open Source\MeshCentral\meshcentral-data\plugins

Executable/process:
meshcentral.exe

Windows service name:
wykryj i zapisz w MESH_ARCHITECTURE.md; nie zakładaj, że jest równa nazwie procesu

Windows service DisplayName:
wykryj i zapisz w MESH_ARCHITECTURE.md
```

Powyższe ścieżki traktuj jako domyślne środowisko projektu, dopóki lokalna instalacja nie potwierdzi innego stanu.

---

# Bezwzględna granica modyfikacji

Wszystkie trwałe zmiany funkcjonalne dotyczące MeshCentral realizuj wyłącznie wewnątrz pluginów.

Domyślnie wolno modyfikować runtime tylko w:

```text
C:\Program Files\Open Source\MeshCentral\meshcentral-data\plugins
```

Bez wyraźnej zgody nie modyfikuj między innymi:

```text
C:\Program Files\Open Source\MeshCentral\node_modules
C:\Program Files\Open Source\MeshCentral\views
C:\Program Files\Open Source\MeshCentral\public
C:\Program Files\Open Source\MeshCentral\meshcentral.js
C:\Program Files\Open Source\MeshCentral\config.json
```

ani innych plików głównej aplikacji.

Dozwolone jest odczytywanie i analizowanie:

- kodu głównej aplikacji,
- plugin loadera,
- hooków i eventów,
- templates i frontend JavaScript,
- CSS i theme,
- API,
- permissions,
- settings,
- komunikacji frontend/backend.

Główna instalacja MeshCentral jest źródłem informacji tylko do odczytu.

Nie rozwiązuj problemu przez:

- patchowanie MeshCentral,
- patchowanie `node_modules`,
- edycję głównych templates,
- edycję globalnego CSS lub JavaScript,
- dodawanie runtime dependencies poza katalogiem pluginu.

Poza katalogiem pluginów mogą być modyfikowane tylko pliki projektu i automatyzacji, takie jak:

```text
AGENTS.md
MESH_ARCHITECTURE.md
PLUGINS_STATUS.md
.agents/
tools/
tests/
docs/
```

o ile nie są częścią runtime głównej instalacji MeshCentral.

---

# Przenośność

Każdy plugin musi być samowystarczalny.

Po skopiowaniu całego katalogu pluginu do `Plugins root` powinien posiadać wszystkie wymagane:

- backend files,
- frontend files,
- helpery,
- assets,
- wymagany własny CSS,
- konfigurację pluginu,
- definicje permissions,
- mechanizmy integracji,
- zależności dopuszczone przez architekturę pluginu.

Nie twórz zależności od ręcznych zmian poza katalogiem pluginu.

Każda funkcja, poprawka UI, integracja, hook, override lub rozszerzenie zachowania musi być realizowane z poziomu pluginu.

Jeżeli istnieją dwa rozwiązania:

```text
A. modyfikacja głównego MeshCentral
B. implementacja wewnątrz pluginu
```

zawsze wybieraj `B`, nawet jeżeli wymaga więcej pracy.

---

# Dokumentacja lokalnej architektury

W workspace utrzymuj:

```text
MESH_ARCHITECTURE.md
MESH_ARCHITECTURE_CSS.md
MESH_ARCHITECTURE_PERMISSIONS.md
MESH_ARCHITECTURE_API.md
MESH_ARCHITECTURE_UI_MODES.md
MESH_ARCHITECTURE_HOOKS.md
MESH_ARCHITECTURE_SETTINGS.md
MESH_ARCHITECTURE_CORE.md
MESH_ARCHITECTURE_INTERPLUGIN.md
MESH_ARCHITECTURE_STORAGE.md
MESH_ARCHITECTURE_EXECUTION.md
MESH_ARCHITECTURE_PACKAGING.md
PLUGINS_STATUS.md
```

`MESH_ARCHITECTURE.md` jest indeksem i ogólną mapą potwierdzonego sposobu działania lokalnej instalacji.

Dokumenty `MESH_ARCHITECTURE_*.md` opisują konkretne mechanizmy bez duplikowania pełnej treści w głównym indeksie.

`PLUGINS_STATUS.md` opisuje aktualny stan zarządzanych pluginów.

Nie zapisuj w nich sekretów ani dużych fragmentów kodu.

## Warunkowe używanie dokumentacji

Przed każdym zadaniem stosuj `AGENTS.md`.

Najpierw przeczytaj indeks `MESH_ARCHITECTURE.md`, a następnie tylko dokument tematyczny związany z zadaniem:

- CSS, UI albo theme: `MESH_ARCHITECTURE_CSS.md`,
- permissions, role albo authorization: `MESH_ARCHITECTURE_PERMISSIONS.md`,
- routes, endpointy albo komunikacja frontend/backend: `MESH_ARCHITECTURE_API.md`,
- Classic, Modern albo kompatybilność UI: `MESH_ARCHITECTURE_UI_MODES.md`,
- loader, hooks, events albo lifecycle: `MESH_ARCHITECTURE_HOOKS.md`,
- settings, konfiguracja, sekrety albo restart/reload: `MESH_ARCHITECTURE_SETTINGS.md`,
- współdzielone helpery, backend/frontend Core, wersje albo konflikty: `MESH_ARCHITECTURE_CORE.md`,
- busy, providery, usługi i zależności plugin-plugin: `MESH_ARCHITECTURE_INTERPLUGIN.md`,
- pliki danych, bazy, migracje, backup albo retention: `MESH_ARCHITECTURE_STORAGE.md`,
- polecenia, skrypty, procesy, powłoki, timeout albo approval: `MESH_ARCHITECTURE_EXECUTION.md`,
- layout pluginu, metadane, wersje, zależności, instalacja albo aktualizacja: `MESH_ARCHITECTURE_PACKAGING.md`.

`PLUGINS_STATUS.md` czytaj tylko dla pluginów objętych bieżącym zadaniem.

Nie czytaj pełnego dokumentu, jeżeli potrzebna jest jedna sekcja. Najpierw znajdź nazwę pluginu, mechanizmu albo nagłówka i odczytaj właściwy fragment.

Nie analizuj ponownie całej instalacji, jeżeli wymagana informacja jest potwierdzona, aktualna i jednoznacznie zapisana.

Ponownie sprawdź kod głównej aplikacji, gdy:

- informacji brakuje,
- informacja jest niepełna lub oznaczona jako niezweryfikowana,
- zmieniła się wersja MeshCentral,
- zachowanie nie zgadza się z dokumentacją,
- implementowana jest nowa integracja,
- użytkownik prosi o ponowną weryfikację.

Nowo potwierdzoną wiedzę aktualizuj we właściwym dokumencie tematycznym, a w `MESH_ARCHITECTURE.md` zmieniaj indeks lub mapę wysokiego poziomu tylko wtedy, gdy jest to potrzebne.

Jeżeli przyszłe przeszukiwanie kodu dotyczy odrębnego, wielokrotnie używanego mechanizmu, który nie pasuje do istniejących dokumentów, utwórz `MESH_ARCHITECTURE_<TOPIC>.md`, zapisz lokalne źródła dowodów i dodaj dokument do indeksu. Nie twórz osobnego dokumentu dla pojedynczego błędu, symbolu ani jednego pluginu.

Wiedzę specyficzną dla jednego pluginu zapisuj w `PLUGINS_STATUS.md`.

---

# Minimalna struktura pluginu

Domyślna struktura:

```text
MyPlugin/
├── package.json
├── plugin.js
├── core.js
├── module.js
└── public/
    ├── core.js
    └── main.js
```

Opcjonalnie:

```text
public/
└── plugin.css
```

Nie twórz dodatkowych katalogów, managers, services, repositories ani helpers, jeżeli nie są rzeczywiście potrzebne.

Podział jest podziałem odpowiedzialności, a nie nakazem budowy rozbudowanego frameworka.

---

# Frontend i backend

Frontend działa w przeglądarce i może używać:

```js
window
document
```

Backend działa w Node.js i nie posiada `window` ani `document`.

Nie mieszaj kodu browser-side i server-side.

## plugin.js

Backend bootstrap pluginu.

Odpowiada za:

- inicjalizację pluginu,
- integrację z lifecycle MeshCentral,
- rejestrację wymaganych hooków,
- rejestrację backend API,
- załadowanie backend `core.js`,
- załadowanie `module.js`,
- udostępnienie frontend assets.

Nie umieszczaj w nim dużej logiki biznesowej.

## core.js

Backend helpery wspólne dla logiki pluginu, na przykład:

- validation,
- logging,
- response helpers,
- settings helpers,
- permission helpers,
- shared backend utilities.

Backend `core.js` nie może używać `window.MeshPluginCore`.

Ładuj go zgodnie z mechanizmem Node.js potwierdzonym dla lokalnej wersji MeshCentral.

## module.js

Logika specyficzna dla danego pluginu.

Przykłady:

```text
DefenderTools:
- getIncidents()
- revokeSessions()

DirectoryTools:
- getComputer()
- getUser()

JiraTools:
- getAsset()
- updateIssue()
```

Nie umieszczaj w `module.js` funkcji, które powinny być wspólne dla wielu pluginów.

## public/core.js

Frontend helpery współdzielone między pluginami.

Wspólny namespace:

```js
window.MeshPluginCore
```

Nie twórz globalnych funkcji bez namespace.

Zamiast:

```js
function createButton() {}
```

używaj:

```js
MeshPluginCore.createButton()
```

## public/main.js

Frontend konkretnego pluginu.

Odpowiada za:

- root element i zawartość zakładki,
- renderowanie danych,
- obsługę zdarzeń,
- komunikację z backendem,
- aktualizację UI,
- lazy loading,
- cleanup zasobów frontendu.

---

# Kontrakt Frontend Core

Każdy plugin może zawierać własną kopię `public/core.js`, aby działać samodzielnie. Wszystkie pluginy wdrażane razem muszą jednak zawierać identyczną wersję tego pliku.

Nie utrzymuj wspólnego runtime Core poza katalogami pluginów.

## Metadata Core

Core powinien posiadać co najmniej:

```js
MeshPluginCore.apiMajor
MeshPluginCore.version
MeshPluginCore.buildHash
```

Opcjonalnie:

```js
MeshPluginCore.functionVersions
```

Przykładowy kontrakt:

```js
window.MeshPluginCore = window.MeshPluginCore || {
    apiMajor: 1,
    version: '1.0.0',
    buildHash: 'sha256:<digest-implementacji-core>'
};
```

`buildHash` obliczaj z kanonicznej, znormalizowanej implementacji Core z wyłączeniem wartości samego pola `buildHash`, na przykład z szablonu źródłowego przed wstawieniem metadanych. Nie próbuj obliczać skrótu z pliku zawierającego już własny końcowy hash.

## Zasady kompatybilności

1. Wszystkie pluginy jednego zestawu release mają używać identycznego `apiMajor` i `version`.
2. Wszystkie pluginy jednego zestawu release mają używać identycznego `buildHash`; zgodny numer wersji przy różnym hash oznacza konflikt implementacji.
3. Aktualizacja implementacji istniejącej funkcji Core wymaga synchronizacji `public/core.js` we wszystkich pluginach korzystających z Core.
4. Plugin nie może po cichu korzystać z Core o innej wersji lub innym hash niż oczekiwane.
5. Przy konflikcie wersji lub hash:
   - nie nadpisuj istniejącej funkcji,
   - nie kontynuuj inicjalizacji zależnej części pluginu,
   - pokaż jednoznaczny błąd kompatybilności,
   - zapisz bezpieczny wpis w logu,
   - wskaż wersję oczekiwaną i wykrytą.
6. Dla niekompatybilnej major version użyj osobnego namespace, np. `MeshPluginCoreV2`, albo zaktualizuj cały zestaw pluginów.
7. Kolejność ładowania pluginów nie może wybierać implementacji funkcji.

Utrzymuj jedno kanoniczne źródło `public/core.js` w plikach projektu lub automatyzacji. Do katalogów pluginów kopiuj je kontrolowanym skryptem. Po synchronizacji porównuj surowy hash pliku każdej wdrażanej kopii z hashem kanonicznego pliku, niezależnie od runtime `buildHash`. W runtime każdy plugin nadal zawiera własną kopię Core i pozostaje samowystarczalny.

## Idempotentna rejestracja

Dla zgodnej wersji Core namespace i funkcje rejestruj idempotentnie:

```js
window.MeshPluginCore = window.MeshPluginCore || {};

if (!MeshPluginCore.createButton) {
    MeshPluginCore.createButton = function (...) {
        // implementation
    };
}
```

Sprawdzaj każdą funkcję osobno.

Nie używaj wyłącznie:

```js
if (!window.MeshPluginCore) {
    // register everything
}
```

Idempotencja nie zastępuje kontroli wersji. Funkcja o tej samej nazwie, ale innej implementacji, jest konfliktem kompatybilności.

---

# Namespace pluginu

Każdy plugin posiada własny frontend namespace:

```js
window.DefenderTools
window.DirectoryTools
window.MyScripts
window.Commands
window.JiraTools
```

Wspólne funkcje:

```js
MeshPluginCore.createButton()
```

Logika pluginu:

```js
DefenderTools.loadIncidents()
DirectoryTools.loadComputer()
JiraTools.loadAsset()
```

Nie umieszczaj funkcji pluginu bezpośrednio w global scope.

---

# Styl i CSS

Plugin ma wyglądać jak integralna część MeshCentral.

Preferuj:

- istniejące mechanizmy UI MeshCentral,
- potwierdzone klasy CSS,
- dziedziczenie fontów i kolorów,
- obsługę aktualnego theme,
- istniejące wzorce buttonów, dialogów i tabel.

Nie twórz własnego kompletnego systemu kolorów, buttonów, inputów, tabel ani dialogów, jeżeli można użyć UI MeshCentral.

Przed użyciem wewnętrznej klasy CSS potwierdź jej rzeczywiste użycie w lokalnej wersji i zapisz istotne ustalenie w `MESH_ARCHITECTURE_CSS.md`.

## Własny CSS

`public/plugin.css` jest opcjonalny.

Dodawaj go tylko dla:

- własnego gridu,
- układu,
- ograniczenia wysokości,
- scrollowania,
- elementów specyficznych dla pluginu.

Nie dodawaj globalnych reguł:

```css
button {}
body {}
input {}
table {}
div {}
```

Każda własna klasa ma posiadać unikalny prefix pluginu:

```css
.defendertools-grid {}
.jira-panel {}
.directorytools-result {}
```

CSS pluginu nie może zmieniać głównego UI ani innych pluginów.

---

# Frontend lifecycle

- Inicjalizacja UI musi być idempotentna.
- Nie twórz drugi raz tej samej zakładki, root elementu ani toolbaru.
- Każdy plugin ma posiadać jeden jednoznaczny root element z unikalnym ID.
- Nie rejestruj wielokrotnie tych samych event listenerów.
- Timery, `MutationObserver`, subskrypcje i globalne handlery muszą posiadać cleanup.
- Ponowne wejście do zakładki nie może zwielokrotniać requestów ani handlerów.
- Nie wykonuj ciężkich operacji, gdy zakładka jest nieaktywna.
- Przed ponownym renderem usuń lub wykorzystaj istniejące elementy zamiast tworzyć duplikaty.
- Nie zakładaj, że plugin zostanie załadowany tylko raz w całym cyklu strony.

---

# Wydajność

Największe ryzyka wydajnościowe to:

- API calls wykonywane przy starcie MeshCentral,
- polling,
- częste `setInterval`,
- wiele `MutationObserver`,
- wiele globalnych event listenerów,
- duże tabele renderowane jednorazowo,
- częste manipulacje DOM,
- pobieranie danych, których użytkownik aktualnie nie potrzebuje.

Preferowany model:

```text
MeshCentral startuje
        ↓
plugin rejestruje lekkie UI
        ↓
brak ciężkich operacji
        ↓
użytkownik otwiera zakładkę
        ↓
plugin pobiera wymagane dane
```

Stosuj lazy loading, debounce, pagination albo incremental rendering, gdy rozmiar danych tego wymaga.

Nie wprowadzaj pollingu, jeżeli wystarczy ręczny refresh, event albo odświeżenie po konkretnej akcji.

---

# Bezpieczeństwo API pluginu

- Każdy backend endpoint musi sprawdzać authentication i authorization.
- Nigdy nie polegaj wyłącznie na ukryciu przycisku lub zakładki w frontendzie.
- Permissions sprawdzaj ponownie po stronie serwera.
- Waliduj wszystkie dane wejściowe po stronie backendu.
- Nie przekazuj sekretów, tokenów ani credentiali do przeglądarki.
- Nie zapisuj sekretów ani pełnych payloadów uwierzytelniających w logach.
- Do wyświetlania tekstu preferuj `textContent`.
- Nie używaj `innerHTML` z danymi pochodzącymi od użytkownika lub API bez bezpiecznej sanitizacji.
- Dla operacji zmieniających stan używaj mechanizmu sesji i ochrony stosowanego przez aktualną wersję MeshCentral.
- Nie twórz własnego authentication, jeżeli można użyć mechanizmu MeshCentral.
- Komunikaty dla klienta nie mogą ujawniać stack trace, sekretów ani niepotrzebnych ścieżek systemowych.
- Nie wykonuj poleceń systemowych z niezwalidowanymi argumentami.
- Stosuj zasadę least privilege dla permissions pluginu.
- Loguj zdarzenia bezpieczeństwa bez zapisywania danych wrażliwych.

---

# Settings i sekrety

Nie hardcoduj:

- haseł,
- API tokens,
- OAuth secrets,
- private keys,
- credentiali,
- connection strings zawierających sekrety.

Nie zapisuj sekretów do:

```text
AGENTS.md
MESH_ARCHITECTURE.md
MESH_ARCHITECTURE_*.md
PLUGINS_STATUS.md
```

Zachowaj potwierdzony mechanizm settings używany przez pluginy. Nie kopiuj wartości sekretów do dokumentacji ani output.

Jeżeli konfiguracja ma zostać przeniesiona razem z pluginem, przenoś schema i mechanizm odczytu, ale nie rzeczywiste sekrety środowiska.

---

# Tworzenie nowego pluginu

1. Przeczytaj indeks `MESH_ARCHITECTURE.md` oraz właściwe dokumenty tematyczne.
2. Punktowo sprawdź lokalny kod tylko wtedy, gdy mapa jest niepełna.
3. Utwórz minimalny szkielet.
4. Nie kopiuj automatycznie starego pluginu.
5. Nie dodawaj starej logiki przed potwierdzeniem szkieletu.
6. Potwierdź, że plugin:
   - jest wykrywany,
   - ładuje backend,
   - ładuje frontend,
   - tworzy wymagany element UI,
   - respektuje permissions,
   - nie generuje błędów,
   - nie tworzy duplikatów po ponownym wejściu.
7. Zapisz stan w `PLUGINS_STATUS.md`.
8. Dopiero później przenoś funkcjonalność.

---

# Migracja starego pluginu

Migrację wykonuj etapami:

```text
stary plugin
    ↓
analiza odpowiedzialności
    ↓
nowy czysty plugin
    ↓
stopniowe przenoszenie funkcji
```

Podczas migracji:

1. Zidentyfikuj backend bootstrap.
2. Zidentyfikuj backend common helpers.
3. Zidentyfikuj logikę specyficzną.
4. Zidentyfikuj frontend shared helpers.
5. Zidentyfikuj frontend konkretnego pluginu.
6. Zidentyfikuj settings, permissions i dependencies.
7. Przenoś funkcjonalność małymi etapami.
8. Zachowuj działające funkcje biznesowe.
9. Nie zmieniaj zachowania bez wyraźnej potrzeby.
10. Usuń duplikaty dopiero po potwierdzeniu nowej implementacji.
11. Każdy etap zweryfikuj przed przejściem dalej.
12. Nie usuwaj starej implementacji, dopóki nowa ścieżka nie jest potwierdzona.

---

# Walidacja zmian

Przy każdej zmianie:

1. Ustal warstwę, której dotyczy zmiana.
2. Zmień tylko właściwe pliki.
3. Sprawdź składnię.
4. Wykonaj targeted test.
5. Zweryfikuj podstawową ścieżkę działania.
6. Sprawdź brak duplikacji UI i event listeners.
7. Dla API sprawdź authentication, authorization i validation.
8. Dla zmiany Core sprawdź wszystkie pluginy zależne.
9. Sprawdź zakres zmian przez `git diff` albo równoważne narzędzie.
10. Zaktualizuj dokumentację tylko wtedy, gdy zmieniła się architektura lub stan pluginu.

Nie wykonuj dużych refactorów ani reorganizacji przy okazji małej poprawki.

---

# Wersjonowanie pluginu i push

Wersję pluginu traktuj jako jeden kontrakt obejmujący wszystkie jego pliki metadanych.

Przy każdym zadaniu wymagającym podniesienia wersji:

1. pracuj na `package.json` i `config.json` znajdujących się w root tego samego pluginu,
2. nie modyfikuj głównego `config.json` instalacji MeshCentral,
3. jeżeli plugin posiada oba pliki, ustaw w obu identyczną wartość pola `version`,
4. wykonaj zmianę obu plików w tym samym commicie i nie wypychaj tylko jednego z nich,
5. jeżeli plugin zgodnie ze swoim potwierdzonym layoutem posiada tylko jeden plik wersji, nie twórz brakującego pliku bez potrzeby,
6. zaktualizuj `version-history.json`, changelog albo release notes, jeśli należą do kontraktu tego pluginu,
7. przed commit/push porównaj wartości wersji odczytane ponownie z dysku,
8. przy rozbieżności przerwij commit/push/release i najpierw napraw metadane,
9. po push sprawdź, czy wypchany commit zawiera oba pliki i oczekiwany numer wersji.

Zwykły push bez zleconego release nie oznacza automatycznego podniesienia wersji. Gdy wersja jest podnoszona, `package.json` i pluginowy `config.json` muszą pozostać zsynchronizowane.

---

# Restart i reload

Nie restartuj MeshCentral bez potrzeby.

Zmiany frontend-only testuj najpierw przez reload przeglądarki albo ponowne wejście do zakładki.

Restart backendu jest uzasadniony między innymi po zmianie:

- backend pluginu,
- plugin loader integration,
- backend hooków,
- backend modules,
- server-side settings wymagających ponownego odczytu.

Przed restartem wykryj rzeczywistą nazwę Windows service. Nie zakładaj, że `meshcentral.exe` jest nazwą usługi.

Po restarcie zweryfikuj:

- status usługi,
- istnienie procesu,
- brak krytycznych błędów w logu,
- wymagany endpoint albo działanie UI, jeżeli jest dostępne.

---

# Minimalizacja zakresu i kontekstu

- Nie czytaj wszystkich pluginów, jeżeli zadanie dotyczy jednego.
- Nie czytaj całego MeshCentral, jeżeli potrzebny jest jeden mechanizm.
- Nie odczytuj wielokrotnie tego samego dużego pliku.
- Nie wykonuj pełnego audytu przy prostej zmianie.
- Nie poprawiaj problemów niezwiązanych z bieżącym zadaniem.
- Zauważony problem poboczny zapisz jako `known issue`.
- Używaj potwierdzonej mapy architektury jako cache wiedzy.
- Nie zgaduj nazw hooków, eventów, klas CSS, API ani permissions.

Kolejność źródeł:

```text
1. instrukcje projektu
2. właściwy dokument MESH_ARCHITECTURE_*.md
3. odpowiedni wpis PLUGINS_STATUS.md
4. aktualny kod konkretnego pluginu
5. punktowo aktualny lokalny kod MeshCentral
6. dokumentacja zewnętrzna
```

Lokalny kod zainstalowanej wersji MeshCentral jest źródłem prawdy o rzeczywistym zachowaniu tej instalacji.

---

# Minimalna zawartość MESH_ARCHITECTURE.md

Dokumentuj wyłącznie informacje potwierdzone:

```text
Environment
MeshCentral version i źródło wykrycia
Windows service name oraz DisplayName
Plugin loading
Backend integration
Frontend integration
Permissions
Settings
UI and CSS
Theme behavior
Frontend/backend communication
Classic and Modern mode overview
Architecture documentation index
Restart requirements
Known verified mechanisms
Last verified
```

Dla mechanizmu zapisuj:

```text
Name:
Status: verified | unverified | obsolete | not-applicable
Classic status:
Modern status:
Files involved:
Symbols or hooks:
Evidence:
Mechanism:
Dependencies:
Version verified:
Restart or reload:
Last verified:
Notes:
```

Minimalna zawartość dokumentów tematycznych:

```text
MESH_ARCHITECTURE_CSS.md
- confirmed UI classes, theme, scope, prefixes, Classic/Modern differences

MESH_ARCHITECTURE_PERMISSIONS.md
- permission definitions, backend enforcement, frontend visibility, deny behavior

MESH_ARCHITECTURE_API.md
- route registration, transport, authentication, authorization, validation, errors

MESH_ARCHITECTURE_UI_MODES.md
- Classic/Modern detection, entry points, DOM, assets, hooks, cleanup, test matrix

MESH_ARCHITECTURE_HOOKS.md
- discovery, loader, hooks/events, call order, context, lifecycle

MESH_ARCHITECTURE_SETTINGS.md
- settings sources, schema, validation, secrets, restart/reload

MESH_ARCHITECTURE_CORE.md
- backend/frontend Core implementations, namespace, API and implementation versions, hashes, load-order conflicts

MESH_ARCHITECTURE_INTERPLUGIN.md
- buses, providers, services, producers/consumers, optional dependencies, contract compatibility

MESH_ARCHITECTURE_STORAGE.md
- stores, formats, ownership, concurrency, migrations, backup/restore, retention

MESH_ARCHITECTURE_EXECUTION.md
- shells, processes, arguments, environment, timeout, cancellation, permissions, approval, audit

MESH_ARCHITECTURE_PACKAGING.md
- plugin layouts, metadata, authoritative version, dependencies/assets, install/update/rollback
```

Każdy wpis `verified` musi wskazywać lokalny plik oraz symbol, hook, route albo możliwie wąski zakres linii. Dla mechanizmów frontendowych dokumentuj Classic i Modern osobno.

---

# Minimalna zawartość PLUGINS_STATUS.md

Dla każdego pluginu zapisuj:

```text
Plugin name:
Location:
Version:
Migration status:
Backend entry point:
Frontend entry point:
Frontend namespace:
Classic status:
Modern status:
Backend Core:
Frontend Core API major:
Frontend Core version:
Frontend Core hash:
Registered hooks:
Registered API/routes:
Permissions:
Settings files:
Storage:
Execution surface:
Inter-plugin contracts:
Package version sources:
Dependencies:
Known compatibility requirements:
Known issues:
Last verified:
```

Nie zapisuj dużych fragmentów kodu ani sekretów.

---

# Zasady końcowe

1. Wszystkie trwałe zmiany MeshCentral realizuj przez pluginy.
2. Nie patchuj głównej aplikacji.
3. Plugin musi być przenośny i samowystarczalny.
4. Plugin musi działać jako jedyny zainstalowany plugin.
5. Kolejność ładowania pluginów nie może wybierać implementacji Core.
6. Wszystkie wdrażane kopie Frontend Core muszą mieć zgodną, kontrolowaną wersję.
7. Nie twórz globalnych funkcji bez namespace.
8. Nie mieszaj frontendowego `window.MeshPluginCore` z backendem Node.js.
9. Korzystaj z UI i theme MeshCentral.
10. Własny CSS dodawaj tylko wtedy, gdy jest potrzebny.
11. Frontend initialization i cleanup muszą być idempotentne.
12. Preferuj lazy loading.
13. Nie wykonuj ciężkich operacji przy starcie.
14. Sprawdzaj authorization po stronie backendu.
15. Nie przekazuj sekretów do frontendu.
16. Najpierw buduj czysty szkielet.
17. Migrację wykonuj etapami.
18. Nie duplikuj wspólnych funkcji.
19. Nie analizuj całej instalacji przy każdym zadaniu.
20. Aktualizuj mapę architektury tylko potwierdzonymi informacjami.
21. Zmieniaj tylko to, czego wymaga bieżące zadanie.
22. Główna instalacja MeshCentral ma pozostać czysta i możliwa do aktualizacji.
23. Każdą przyszłą zmianę frontendową projektuj i weryfikuj osobno dla Classic i Modern.
24. Działanie w jednym trybie nie jest dowodem zgodności z drugim; brak weryfikacji oznaczaj jako `unverified`.
