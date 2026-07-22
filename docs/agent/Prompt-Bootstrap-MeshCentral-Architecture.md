# Jednorazowe rozpoznanie architektury pluginów MeshCentral

Przeanalizuj lokalną instalację i bieżące repozytorium wyłącznie w celu zbudowania potwierdzonej dokumentacji architektury pluginów.

To jest etap rozpoznania. Nie rozpoczynaj migracji ani przebudowy pluginów.

## Bezwzględne granice

Na tym etapie:

- nie migruj żadnych pluginów,
- nie modyfikuj głównej aplikacji MeshCentral,
- nie przebudowuj istniejących pluginów,
- nie zmieniaj zachowania, konfiguracji runtime ani danych,
- nie instaluj zależności i nie wykonuj operacji produkcyjnych,
- analizuj tylko elementy potrzebne do zrozumienia architektury pluginów,
- wszystkie informacje w dokumentacji potwierdzaj na podstawie aktualnego lokalnego kodu lub kontrolowanego odczytu lokalnego środowiska,
- nie opieraj ustaleń wyłącznie na pamięci, nazwie pliku, starej dokumentacji ani dokumentacji internetowej.

Jeżeli odczyt lokalnego kodu i istniejąca dokumentacja są sprzeczne, lokalny kod aktualnie zainstalowanej wersji jest źródłem prawdy. Zapisz rozbieżność.

## Najpierw ustal środowisko

Potwierdź i zapisz:

- root lokalnej instalacji MeshCentral,
- root pluginów,
- wersję MeshCentral i dokładne źródło jej wykrycia,
- rzeczywistą nazwę usługi Windows i DisplayName, jeśli instalacja działa jako usługa,
- ścieżki repozytorium oraz dokumentacji projektu,
- dostępne tryby UI określane w projekcie jako Classic i Modern.

Nie zakładaj znaczenia nazw Classic i Modern. Ustal z kodu, jak są wybierane, ładowane i czym różnią się w tej wersji.

## Minimalny zakres analizy

Przeanalizuj punktowo:

1. wykrywanie i ładowanie pluginów,
2. backend bootstrap, moduły, hooki, eventy i kolejność lifecycle,
3. udostępnianie oraz ładowanie assetów frontendowych,
4. integrację UI w trybie Classic i Modern,
5. komunikację frontend/backend oraz rejestrację API,
6. authentication, authorization, permissions i ochronę operacji zmieniających stan,
7. style, theme, klasy CSS i granice CSS pluginów,
8. settings, konfigurację, sekrety oraz wymagania restart/reload,
9. zależności między loaderem, backendem, frontendem, API, permissions, CSS i trybami UI,
10. minimalne mechanizmy potrzebne do zbudowania przenośnego pluginu działającego samodzielnie,
11. współdzielony Core po stronie backendu i frontendu, jego wersje, zgodność i kolejność ładowania,
12. kontrakty komunikacji plugin-plugin, opcjonalne zależności i zachowanie bez dostawcy usługi,
13. trwałe dane pluginów: pliki, bazy, ownership, migracje, backup i współbieżność,
14. wykonywanie poleceń i skryptów: powłoki, argumenty, środowisko, timeout, anulowanie, audyt i approval,
15. layout pakietu, źródła wersji, instalację, aktualizację, rollback i dołączone zależności.

Nie czytaj całej instalacji bez potrzeby. Najpierw znajdź loader, entry point, nazwę hooka, route, klasę albo symbol, a następnie odczytaj tylko powiązany fragment i jego bezpośrednie zależności.

## Classic i Modern

Zbuduj potwierdzoną mapę zgodności obu trybów.

Dla każdego mechanizmu UI i integracji zapisz osobno:

- `Classic: verified | unverified | not-applicable | unsupported`,
- `Modern: verified | unverified | not-applicable | unsupported`,
- pliki i symbole odpowiedzialne za dany tryb,
- sposób wykrycia lub wyboru trybu,
- entry point i kolejność ładowania,
- różnice DOM, hooków, assetów, CSS, komunikacji i cleanup,
- wspólną implementację możliwą do użycia w obu trybach,
- wymagany adapter albo rozdzielenie implementacji, jeśli wspólna ścieżka nie jest możliwa,
- sposób przyszłej weryfikacji obu trybów.

Każda przyszła zmiana pluginu musi być projektowana i weryfikowana dla obu trybów. Jeżeli jeden tryb nie może zostać sprawdzony, oznacz go jako `unverified`; nie uznawaj zgodności na podstawie działania tylko w drugim trybie.

## Mapa zależności

Zbuduj mapę przepływu i zależności, co najmniej:

```text
plugin discovery
    -> backend bootstrap
    -> hooks/events/routes
    -> authentication and authorization
    -> frontend asset loading
    -> Classic integration
    -> Modern integration
    -> API communication
    -> CSS/theme
    -> shared Core and plugin-plugin contracts
    -> storage and data lifecycle
    -> command/script execution
    -> packaging, update and rollback
    -> cleanup/reload/restart
```

Dla każdej zależności zapisz kierunek, warunek użycia, źródłowy plik lub symbol oraz wpływ na Classic i Modern.

Nie instaluj pakietów ani nie zmieniaj zależności projektu. W tym zadaniu słowo zależności oznacza mapę zależności architektonicznych.

## Dokumenty do utworzenia lub uzupełnienia

### MESH_ARCHITECTURE.md

Traktuj jako indeks i ogólną mapę architektury. Zawrzyj:

- środowisko i wersję,
- root instalacji i pluginów,
- skrócony przepływ ładowania,
- indeks dokumentów tematycznych,
- mapę zależności wysokiego poziomu,
- zasady źródeł prawdy,
- listę potwierdzonych mechanizmów,
- listę luk oznaczonych jako `unverified`,
- datę ostatniej weryfikacji.

Nie duplikuj w nim pełnej treści dokumentów tematycznych.

### MESH_ARCHITECTURE_CSS.md

Zawrzyj:

- źródła stylów i theme MeshCentral,
- potwierdzone klasy, selektory, zmienne i wzorce komponentów,
- różnice Classic/Modern,
- zasady używania istniejącego UI,
- zasady prefixów i scope CSS pluginu,
- elementy, których plugin nie powinien nadpisywać,
- obsługę dark/light theme, jeśli istnieje,
- przykładowe bezpieczne wzorce wynikające z lokalnego kodu,
- źródła dowodów i status weryfikacji.

Nie kopiuj dużych arkuszy CSS.

### MESH_ARCHITECTURE_PERMISSIONS.md

Zawrzyj:

- model użytkowników, ról i permissions istotny dla pluginów,
- miejsca definiowania i odczytu permissions,
- sposób sprawdzania authorization po stronie backendu,
- różnicę między ukrywaniem UI a egzekwowaniem uprawnień,
- mapping operacja -> wymagane permission -> backend check -> frontend visibility,
- zachowanie odmowy i format błędu,
- różnice Classic/Modern,
- źródła dowodów i status weryfikacji.

Używaj nazwy `MESH_ARCHITECTURE_PERMISSIONS.md`, a nie mieszanej formy `MESH_ARCHITECTURE_Permission.md`.

### MESH_ARCHITECTURE_API.md

Zawrzyj:

- potwierdzone mechanizmy rejestracji endpointów lub handlerów pluginu,
- transport i przepływ frontend/backend,
- authentication, session, authorization i ochronę operacji zmieniających stan,
- walidację request oraz kontrakt response i błędów,
- lifecycle oraz cleanup handlerów,
- różnice Classic/Modern po stronie klienta,
- wzorzec minimalnej integracji wynikający z lokalnego kodu,
- znane ograniczenia i wymagania restart/reload,
- źródła dowodów i status weryfikacji.

Nie dokumentuj endpointu jako dostępnego, jeżeli potwierdzono tylko nazwę bez ścieżki rejestracji i zabezpieczeń.

### MESH_ARCHITECTURE_UI_MODES.md

Zawrzyj pełną macierz Classic/Modern:

- definicję obu trybów potwierdzoną z kodu,
- wybór i wykrywanie trybu,
- templates, DOM roots i entry points,
- ładowanie JavaScript i CSS,
- dostępne hooki i eventy,
- komunikację z backendem,
- theme i komponenty UI,
- inicjalizację, ponowne wejście i cleanup,
- wspólne mechanizmy oraz wymagane adaptery,
- checklistę testów zgodności dla obu trybów.

### MESH_ARCHITECTURE_HOOKS.md

Zawrzyj:

- discovery i loader pluginów,
- backend i frontend hooks/events,
- kolejność rejestracji i wywołań,
- dostępny kontekst i argumenty,
- sync/async behavior, jeśli można je potwierdzić,
- lifecycle, ponowną rejestrację i cleanup,
- zależność od restartu lub reload,
- różnice Classic/Modern,
- źródła dowodów i status weryfikacji.

### MESH_ARCHITECTURE_SETTINGS.md

Zawrzyj:

- źródła konfiguracji i settings pluginów,
- schema, wartości domyślne i walidację,
- granicę między konfiguracją frontend/backend,
- mechanizm bezpiecznego odczytu sekretów bez zapisywania ich wartości,
- wymagania restart/reload po zmianie,
- różnice środowiskowe,
- źródła dowodów i status weryfikacji.

Nie zapisuj rzeczywistych sekretów.

### MESH_ARCHITECTURE_CORE.md

Zawrzyj:

- wszystkie potwierdzone implementacje współdzielonego Core po stronie backendu i frontendu,
- namespace, eksportowane funkcje, wersję API, wersję implementacji i hash pliku,
- pluginy korzystające z każdej implementacji,
- kolejność ładowania oraz zachowanie przy wielu zgodnych lub niezgodnych kopiach,
- reguły kompatybilności, fallback i wykrywanie konfliktu,
- źródło kanoniczne oraz potwierdzony sposób synchronizacji kopii, jeśli istnieje,
- różnice Classic/Modern,
- źródła dowodów i status weryfikacji.

Nie uznawaj plików o tej samej nazwie za zgodne bez porównania kontraktu, wersji i zawartości.

### MESH_ARCHITECTURE_INTERPLUGIN.md

Zawrzyj:

- potwierdzone rejestry, busy, providery, usługi i inne kontrakty plugin-plugin,
- producenta i konsumentów każdego kontraktu,
- sposób rejestracji, wykrywania, wywołania, wyrejestrowania i cleanup,
- kolejność ładowania i zachowanie przy braku opcjonalnego pluginu,
- format danych, walidację, błędy, timeout i idempotency,
- authentication, authorization, scopes i granice zaufania,
- wersjonowanie kontraktu oraz reguły kompatybilności,
- źródła dowodów i status weryfikacji.

### MESH_ARCHITECTURE_STORAGE.md

Zawrzyj:

- wszystkie potwierdzone magazyny danych pluginów: pliki, JSON, NeDB, MongoDB i inne backendy,
- właściciela danych, lokalizację, schema lub format oraz cykl życia,
- inicjalizację, odczyt, zapis, atomiczność, współbieżność i obsługę błędów,
- migracje danych, zgodność wsteczną i zachowanie po aktualizacji pluginu,
- backup, restore, retention i dane wymagające wykluczenia z repozytorium,
- ochronę danych wrażliwych bez zapisywania ich wartości,
- wymagania restart/reload,
- źródła dowodów i status weryfikacji.

### MESH_ARCHITECTURE_EXECUTION.md

Zawrzyj:

- miejsca uruchamiania poleceń, skryptów i procesów potomnych,
- obsługiwane systemy, powłoki, rozszerzenia i reguły wyboru interpretera,
- kontrakt argumentów, stdin/stdout/stderr, exit code i zmiennych środowiskowych,
- timeout, limity output, anulowanie, cleanup i zachowanie po restarcie,
- walidację wejścia, quoting/escaping i granice zaufania,
- wymagane permissions, approval, audit i ochronę sekretów,
- sposób prezentacji oraz uruchamiania operacji w Classic i Modern,
- źródła dowodów i status weryfikacji.

### MESH_ARCHITECTURE_PACKAGING.md

Zawrzyj:

- potwierdzone generacje i layouty pluginów oraz ich entry points,
- znaczenie `config.json`, `package.json`, `install-config.json`, historii wersji i innych metadanych,
- autorytatywne źródło wersji oraz wykryte rozbieżności między plikami,
- regułę, że przy podnoszeniu wersji pluginu posiadającego oba pliki pole `version` musi zostać zmienione równocześnie i identycznie w pluginowych `package.json` oraz `config.json`,
- kontrolę blokującą staging, commit, push i release przy rozbieżnych wersjach; brakującego pliku nie twórz automatycznie w pluginach, których potwierdzony layout go nie przewiduje,
- zależności runtime, dołączone biblioteki i assety wraz z licencjami,
- sposób instalacji, aktualizacji, restartu/reload, rollback i zachowania danych,
- wymagania kompatybilności z wersją MeshCentral, Classic i Modern,
- minimalną checklistę integralności pakietu przed wdrożeniem,
- źródła dowodów i status weryfikacji.

### PLUGINS_STATUS.md

Dla każdego istniejącego pluginu zapisz wyłącznie potwierdzone informacje:

- nazwę i lokalizację,
- wersję i status migracji,
- backend i frontend entry points,
- obsługiwane tryby: Classic i Modern,
- namespace, hooks, routes/API, permissions, settings, storage, execution i dependencies,
- wersję lub hash współdzielonego Core,
- kontrakty plugin-plugin oraz źródła wersji pakietu,
- wymagania restart/reload,
- znane problemy i luki weryfikacji,
- datę ostatniej weryfikacji.

Na tym etapie status migracji ma pozostać informacyjny. Nie rozpoczynaj migracji.

## Standard dowodu

Każdy opisany mechanizm powinien zawierać:

```text
Name:
Status: verified | unverified | obsolete | not-applicable
MeshCentral version:
Classic status:
Modern status:
Files involved:
Symbols or hooks:
Evidence:
Mechanism:
Dependencies:
Restart or reload:
Last verified:
Notes:
```

`Evidence` ma wskazywać lokalny plik oraz symbol, hook, route albo możliwie wąski zakres linii. Samo podobieństwo do innego pluginu nie jest dowodem.

## Dokumentacja jako cache wiedzy

Przy każdym przyszłym zadaniu:

1. najpierw sprawdź indeks w `MESH_ARCHITECTURE.md`,
2. odczytaj tylko dokument tematyczny związany z zadaniem,
3. użyj zapisanej informacji, jeśli jest `verified`, dotyczy tej samej wersji i zgadza się z bieżącym zachowaniem,
4. przeszukaj lokalny kod tylko wtedy, gdy informacji brakuje, jest nieaktualna, niepełna, sprzeczna albo zadanie dotyczy nowego mechanizmu,
5. po potwierdzeniu zaktualizuj istniejący właściwy dokument.

Nowy dokument `MESH_ARCHITECTURE_<TOPIC>.md` utwórz tylko wtedy, gdy:

- analizowany obszar jest odrębnym mechanizmem wielokrotnie używanym przez pluginy,
- nie pasuje do CSS, permissions, API, UI modes, hooks, settings, Core, integracji plugin-plugin, storage, execution, packaging ani głównej mapy,
- dokument ograniczy przyszłe przeszukiwanie kodu,
- można zapisać potwierdzone źródła i granice odpowiedzialności.

Nie twórz osobnego dokumentu dla pojedynczego błędu, jednego symbolu ani pojedynczego pluginu. Wiedzę specyficzną dla pluginu zapisuj w `PLUGINS_STATUS.md`. Każdy nowy dokument dodaj do indeksu w `MESH_ARCHITECTURE.md` oraz opisz, kiedy powinien zostać odczytany.

## Weryfikacja dokumentacji

Przed zakończeniem:

1. sprawdź, czy wszystkie wskazane pliki istnieją,
2. sprawdź, czy każdy dokument zawiera wersję i `Last verified`,
3. sprawdź, czy wpisy `verified` posiadają lokalne źródło dowodu,
4. sprawdź, czy Classic i Modern są opisane osobno,
5. sprawdź spójność nazw hooków, routes, permissions, klas i plików,
6. sprawdź, czy dokumentacja nie zawiera sekretów,
7. sprawdź, czy nie zmodyfikowano kodu MeshCentral ani pluginów.
8. porównaj wersje i hashe wszystkich znalezionych kopii współdzielonego Core,
9. sprawdź spójność wersji zapisanych w plikach metadanych każdego pluginu.

## Wynik

Po zakończeniu podaj krótko:

- wykrytą wersję i lokalizację MeshCentral,
- sposób discovery oraz ładowania pluginów,
- najważniejsze zależności backend/frontend,
- stan obsługi Classic i Modern,
- sposób integracji CSS, permissions i API,
- stan Core, kontraktów plugin-plugin, storage, execution i packaging,
- utworzone lub zaktualizowane dokumenty,
- obszary nadal `unverified`.

Nie rozpoczynaj migracji ani implementacji zmian w pluginach.
