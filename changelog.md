# Changelog

## 1.5.83

- Ukryto natywną ramkę MeshCentral w zakładkach połączenia do czasu przygotowania właściwego modułu urządzenia.
- Zakładka Pulpit przed kliknięciem `Połącz` pokazuje neutralny, lokalizowany komunikat SirK Portal zamiast strony głównej MeshCentral.
- Po rozłączeniu ramka sesji jest ponownie ukrywana, a widok wraca do stanu oczekiwania.
- Dodano walidację kontraktu widoczności osadzonej sesji.

## 1.5.82

- Podłączono stan Overview do rzeczywistej kompletności konfiguracji AD, Entra ID/AAD, Jira, Defender XDR i Zabbix.
- Brak wymaganych ustawień lub credentiali automatycznie wymusza `Critical`, nawet jeśli ręcznie wybrano `OK`.
- AD wymaga domeny, loginu i hasła; Entra oraz Defender wymagają Tenant ID, Client ID i sekretu.
- Jira wymaga URL, e-maila, Project Key i tokenu; Zabbix wymaga URL oraz tokenu albo użytkownika z hasłem.
- Ręczny stan operacyjny jest używany dopiero dla kompletnej integracji.
- Portal otrzymuje wyłącznie stan kompletności, status i komunikat PL/EN, bez wartości konfiguracji i sekretów.
- Rozszerzono testy stanu niekompletnego i kompletnego wszystkich integracji.

## 1.5.81

- Usunięto powtórzony nagłówek `My Company / Consolidated plugin administration` z portalowego widoku Settings.
- Usunięto drugą zewnętrzną ramkę administracji osadzonej w ramce Settings.
- Natywny panel administracyjny nadal zachowuje własną nazwę i obramowanie.

## 1.5.80

- Przebudowano `Resetuj hasło / Reset password` jako kontrastowy przycisk z pełnymi stanami interakcji.
- Dodano tłumaczenie błędu nieprawidłowej nazwy użytkownika lub hasła przy przełączaniu PL/EN.
- Tłumaczenie obejmuje także komunikat wstawiony przez MeshCentral dopiero po nieudanej próbie logowania.
- Komunikat błędu otrzymuje semantyczną rolę `alert` i zachowuje czytelny kontrast.
- Rozszerzono walidator wymuszonego ekranu logowania.

## 1.5.79

- Przebudowano całą powierzchnię Ustawień zgodnie ze stylem Zarządzania.
- Dodano wspólny toolbar, kodowe ikony SVG i trzykolumnowy układ `184px / 236px / minmax(0,1fr)`.
- Pierwsza kolumna zwija się do `56px`, zapamiętuje stan i pokazuje wyłącznie ikony.
- Aktywne elementy, obramowanie, odstępy, karty oraz tryb ciemny korzystają ze wspólnego kontraktu wizualnego.
- Dodano filtrowanie sekcji i odświeżanie, zachowując wszystkie dotychczasowe formularze, zapis i funkcje backendowe.
- Rozszerzono walidator architektury o kontrakt nowego shella administracyjnego.

## 1.5.78

- Dodano jednorazową migrację starszych reguł folderów i menu do jawnego pola `allowAll`.
- Starsza pusta lista grup jest migrowana do `allowAll=true`, dzięki czemu katalogi Commands nie znikają po aktualizacji.
- Starsza niepusta lista grup jest migrowana do `allowAll=false` i zachowuje ograniczenie grupowe.
- Nowe reguły nadal pozostają deny-by-default, jeśli przełącznik jest wyłączony i nie wybrano grupy.

## 1.5.77

- Ujednolicono ikony Results w Automatyzacji, Akceptacjach i Commands ze stylem Zarządzania.
- Statusy używają wspólnych kodowych SVG zamiast znaków zależnych od fontu.
- Ujednolicono rozmiar, kolumnę ikon, odstępy oraz zaznaczenie aktywnego statusu.

## 1.5.76

- Pusta lista grup nie nadaje już automatycznie dostępu do pozycji menu ani folderu.
- Dodano jawny przełącznik `Dostęp dla wszystkich użytkowników`.
- Po jego włączeniu wybór grup jest wyszarzony i wyłączony.
- Site Admin nadal omija reguły grup, ale respektuje wyłączenie pozycji lub folderu.
- Rozszerzono testy backendowych reguł dostępu o przypadek pustej listy grup.

## 1.5.75

- Karta Akceptacje w Overview pokazuje aktualną liczbę otwartych wniosków oczekujących na zatwierdzenie.
- Karta Integracje pokazuje zbiorczy stan oparty na najpoważniejszym problemie.
- Dodano trzykolorowy stan `OK`, `Warning`, `Critical` dla AD, Entra ID, Jira, Defender XDR i Zabbix.
- Stany Warning i Critical obsługują osobne komunikaty po polsku i angielsku.
- Dodano walidację backendu i test regresyjny stanu integracji.

## 1.5.74

- Dodano repozytoryjny prompt startowy nowej rozmowy MyCompany.
- Prompt wymusza odczyt `AGENTS.md`, dobranie instrukcji i Skills, ograniczenie zakresu do MyCompany, testy oraz lokalne wdrożenie.
- README wskazuje bezpośrednio dokument startowy.

## 1.5.73

- Link `Resetuj hasło` ma teraz pełną szerokość, kontrastowe tło, obramowanie i stany interakcji.
- Dodano przełącznik PL/EN na wymuszonym ekranie logowania.
- Wybór języka jest zapisywany w `sirkPortal.language`, czyli tym samym ustawieniu co aplikacja po zalogowaniu.
- Lokalizowane są treści ekranu, pola użytkownika i hasła, przycisk logowania, reset hasła oraz stopka.

## 1.5.72

- Zarządzanie korzysta z tego samego zewnętrznego hosta i obramowania co pozostałe widoki SirK Portal.
- Wewnętrzny shell Zarządzania nie rysuje drugiej ramki ani dodatkowego zaokrąglenia.
- Ujednolicono odstęp od sidebaru, krawędź oraz wysokość powierzchni modułu.

## 1.5.71

- Naprawiono błąd Commands `Cannot read properties of undefined (reading 'mount')`.
- Dodano brakujące ładowanie `shared-ui/catalog.js` po drzewie i przed modułem My Commands.
- Uzupełniono zależności katalogu, wyników i formularzy Commands także w natywnym bootstrapie MeshCentral.
- Dodano czytelny komunikat ochronny, gdy zależność katalogu nie jest dostępna.

## 1.5.70

- Wspólny toolbar Akceptacji, Automatyzacji i Commands używa tych samych ikon SVG co Zarządzanie.
- Usunięto stare glify tekstowe strzałki, gwiazdki, edycji, odświeżania i wyszukiwania.
- Ikona zwijania zmienia kierunek zgodnie z rzeczywistym stanem pierwszej kolumny.
- Ujednolicono rozmiar, grubość linii oraz aktywny stan ikon toolbara.

## 1.5.69

- Rozszerzono `Uprawnienia folderów` o wszystkie dziesięć pozycji lewego menu SirK Portal.
- Każdą pozycję można wyłączyć lub ograniczyć do wielu grup użytkowników MeshCentral.
- Site Admin omija ograniczenia grupowe, ale nie widzi pozycji całkowicie wyłączonych.
- Bootstrap Portalu jest filtrowany na backendzie dla bieżącego użytkownika; konfiguracja grup nie jest ujawniana klientowi.
- Endpoint urządzeń odrzuca użytkownika bez dostępu do widoku `Devices`.

## 1.5.68

- Dodano nową wektorową ikonę komputera zgodną ze stylem SirK Portal.
- Zastąpiono brakujący glif w nagłówku urządzenia, liście urządzeń i karcie szczegółów.

## 1.5.67

- Kolumna `Nazwa` w tabeli wtyczek nie zawija głównej ani technicznej nazwy.
- Kolumna `Opis` przejmuje elastyczne miejsce i zawija dłuższą treść.
- Kolumny wersji, stanu i akcji pozostają kompaktowe.

## 1.5.66

- Polska wersja głównego menu wyświetla `Bezpieczeństwo` zamiast `Security`.
- Poprawiono zarówno początkowy HTML, jak i słownik przełączania języka, aby uniknąć migania angielskiej nazwy.

## 1.5.65

- Przebudowano przycisk logowania: ma wyraźny kolor oraz stany hover, kliknięcia, focus i oczekiwania.
- Dodano pod formularzem link `Resetuj hasło` do oficjalnego portalu resetowania hasła Microsoft.

## 1.5.64

- Zastąpiono konturową ikonę motywu czytelnym, wypełnionym półksiężycem z gwiazdą.
- Strzałka głównego menu wskazuje w lewo po rozwinięciu i w prawo po zwinięciu, także podczas pierwszego renderowania.

## 1.5.63

- Zapisany stan zwinięcia głównego menu SirK Portal jest stosowany przed zbudowaniem elementów paska bocznego.
- Usunięto krótkie wyświetlanie rozwiniętego menu podczas odświeżania strony.

## 1.5.62

- Przebudowano Akceptacje, Automatyzację/My Commands oraz Ustawienia na jednym układzie wizualnym zakładki Zarządzanie.
- Odizolowano host każdego widoku, aby style i stan poprzednio otwartej zakładki nie wpływały na kolejną.
- Zablokowano starszym regułom `mc-shared-layout` i trybu edycji samoczynną zmianę szerokości kolumn Portalu.
- Poprawiono układ Commands przy urządzeniu: toolbar i trzy kolumny wykorzystują pełną wysokość bez nakładania się elementów.
- Zachowano dotychczasowe API, wykonywanie poleceń, akceptacje, wyniki i panel administracyjny.

## 1.5.61

- Dodano `Settings → Uprawnienia folderów` dla folderów głównych My Scripts i kategorii My Commands.
- Każdy folder można całkowicie wyłączyć albo ograniczyć do jednej lub wielu grup użytkowników MeshCentral.
- Site Admin omija ograniczenia grupowe, ale nie widzi folderu całkowicie wyłączonego.
- Reguły są egzekwowane przez backend dla drzewa, bezpośredniego odczytu skryptu, edycji, wykonania, wyników i żądań oczekujących na akceptację.
- Nieznane klucze folderów i nieistniejące identyfikatory grup są usuwane podczas zapisu ustawień.

## 1.5.60

- Dodano zakładkę `Polecenia / Commands` pomiędzy `Terminal` i `Pliki / Files` w widoku urządzenia SirK Portal.
- Zakładka montuje istniejący moduł My Commands dla wybranego urządzenia i korzysta ze wspólnego układu Zarządzania.
- Po połączeniu z pulpitem pojawia się niewielki wysuwany przycisk szybkich poleceń.
- Kompaktowy panel pozwala wyszukać, wybrać i uruchomić polecenie lub skrypt PowerShell bez renderowania Results i Output.
- Zachowano zmienne, wymagane potwierdzenie, approval workflow, uprawnienia backendowe oraz etykiety PL/EN.

## 1.5.59

- Dodano osobne ikony dla filtrów wyników: wszystkie, oczekujące, zatwierdzone, wykonywane, zakończone, nieudane i odrzucone.
- Dodano polskie i angielskie etykiety statusów, tytuł tabeli wyników oraz komunikaty pustego wyniku i oczekiwania na akceptację.
- Kolory ikon rozróżniają status informacyjny, oczekiwanie, sukces, wykonywanie oraz błąd lub odrzucenie.

## 1.5.58

- Dodano dwujęzyczne metadane skryptów `#PL Nazwa | opis` oraz `#EN Name | description`.
- Zmienne i sekrety obsługują pary dyrektyw z sufiksami `PL` i `EN`, włącznie z opisami i etykietami opcji.
- Edit Mode umożliwia edycję obu nazw, opisów i obu wersji metadanych zmiennych.
- Folder może zawierać plik `<NazwaFolderu>.menu` z nazwą i opisem PL/EN; opis jest pokazywany po najechaniu.
- Menu Zarządzania przełącza język nazw skryptów, folderów, parametrów i poleceń razem z językiem SirK Portal.
- Zachowano odczyt starszych, jednojęzycznych nagłówków skryptów jako fallback.

## 1.5.57

- Zmieniono ikonę skryptu wymagającego akceptacji na bardziej naturalną, lekko pochyloną klepsydrę.
- Nowy symbol ma zaokrąglony profil i zaznaczone sekcje piasku.
- Zachowano bursztynowy kolor oraz rozmiar zgodny z pozostałymi ikonami.

## 1.5.56

- Foldery drugiej kolumny są ponownie zwinięte przy każdym wejściu do `Zarządzanie`.
- Zmiana folderu głównego w pierwszej kolumnie resetuje rozwinięcia drugiej kolumny.
- Rozwinięcia nie są już utrwalane w `localStorage`; pozostają aktywne tylko dla bieżącego folderu i shella.
- Deep link nadal rozwija wyłącznie ścieżkę prowadzącą do wskazanego skryptu.

## 1.5.55

- Stan zwinięcia pierwszej kolumny `Zarządzanie` jest zapisywany w preferencjach przeglądarki.
- Po odświeżeniu strony kolumna wraca do ostatnio wybranego stanu.
- Odtwarzana ikona strzałki i opis przycisku odpowiadają zapamiętanemu stanowi.

## 1.5.54

- Aktywny przycisk klucza używa takiego samego bursztynowego tła, obramowania i koloru jak aktywna gwiazdka.
- Styl działa w jasnym i ciemnym motywie.
- Ikona klucza pozostaje konturowa dla zachowania czytelności.

## 1.5.53

- Zwiększono szerokość drugiej kolumny w `Edit mode` z `340px` do `440px`.
- Dodatkowe miejsce mieści nazwę skryptu obok pełnego zestawu przycisków akcji.
- Standardowy widok bez edycji pozostaje kompaktowy (`236px`).

## 1.5.52

- Przycisk rozwiniętej pierwszej kolumny pokazuje strzałkę w lewo.
- Po zwinięciu kolumny ikona zmienia się na strzałkę w prawo.
- Opis i `aria-label` przycisku odpowiadają aktualnie dostępnej akcji.

## 1.5.51

- Skrypty wymagające akceptacji używają ikony klepsydry zamiast ikony dokumentu.
- Klepsydra ma bursztynowy kolor w jasnym i ciemnym motywie.
- Zwykłe skrypty zachowują dotychczasową ikonę dokumentu.

## 1.5.50

- Druga kolumna `Zarządzanie` rozszerza się z `236px` do `340px` po włączeniu `Edit mode`.
- Po wyłączeniu trybu edycji kolumna wraca do kompaktowej szerokości.
- Zachowano responsywny układ jednokolumnowy na małych ekranach.

## 1.5.49

- Druga kolumna `Zarządzanie` ma kompaktową szerokość `236px`.
- Usunięto podwójny padding drugiej kolumny i zmniejszono wysokość wierszy.
- Zmniejszono odstępy i wcięcia folderów oraz skryptów, zachowując skracanie długich nazw.

## 1.5.48

- Aktywna gwiazdka ulubionego skryptu jest wypełniona i wyróżniona bursztynowym kolorem w jasnym oraz ciemnym motywie.
- Filtr ulubionych ogranicza również pierwszą i drugą kolumnę do katalogów prowadzących do ulubionych skryptów.
- Po włączeniu filtra wybierany jest pierwszy katalog zawierający ulubiony skrypt, jeżeli bieżący nie pasuje.

## 1.5.47

- Wybrany skrypt w drugiej kolumnie `Zarządzanie` korzysta z tego samego aktywnego zaznaczenia co elementy pierwszej kolumny i foldery.
- Dodano wspólne tło, pogrubienie i pasek akcentu po lewej stronie zaznaczonego skryptu.

## 1.5.46

- Foldery drugiej kolumny `Zarządzanie` są domyślnie zwinięte.
- Rozwinięcia użytkownika są zapisywane w nowej wersji preferencji przeglądarki.
- Wejście przez link do skryptu rozwija wyłącznie foldery prowadzące do wskazanego skryptu.

## 1.5.45

- Tabela `Wtyczki` dopasowuje się do szerokości panelu bez poziomego przewijania.
- Długi opis jest zawijany, a kolumny metadanych i akcji mają kontrolowane szerokości.
- Kontener tabeli uwzględnia obramowanie w swojej szerokości.

## 1.5.44

- Pierwsza kolumna `Zarządzanie` ma bardziej kompaktową szerokość i mniejsze odstępy.
- Przycisk zwijania zmniejsza teraz rzeczywistą szerokość pierwszej kolumny do widoku samych ikon.
- Usunięto podwójny padding listy w pierwszej kolumnie.

## 1.5.43

- Link `?myscript=...#management` odnajduje wskazany skrypt i rozpoczyna standardową ścieżkę uruchomienia.
- Skrypty z `Confirm execution before running` nadal wymagają jawnego potwierdzenia, weryfikowanego również przez backend.
- Parametr deep linku jest konsumowany po otwarciu, aby odświeżenie strony nie uruchamiało skryptu ponownie.
- Skrypt wymagający parametrów otwiera formularz zamiast wykonywać się z niezweryfikowanymi wartościami.

## 1.5.42

- Naprawiono dodawanie i usuwanie skryptów z ulubionych w `Zarządzanie`.
- Górny filtr ulubionych korzysta ze wspólnego mechanizmu i zachowuje stan w preferencjach przeglądarki.
- Zachowano kopiowanie linku przy konkretnym skrypcie bez przywracania tej akcji do górnego paska.

## 1.5.41

- Usunięto niepotrzebną akcję `Copy link` ze wspólnego górnego paska widoku `Zarządzanie`.
- Kopiowanie linków przy konkretnych elementach pozostaje dostępne.

## 1.5.40

- `Akceptacje` korzystają wyłącznie ze wspólnego układu modułów i nie mieszają już klas starszego widoku `Zarządzanie`.
- `Monitoring` oraz pozostałe widoki oczekujące korzystają z tej samej powierzchni i kolorystyki co reszta SirK Portal.
- Dodano test chroniący wspólne style przed ponownym dołączeniem klas starszego układu do `Approval Center`.

## 1.5.39

- Folder kliknięty w drugiej kolumnie `Zarządzanie` otrzymuje takie samo aktywne zaznaczenie jak pozycje pierwszej kolumny.
- Usunięto ikonę strzałki przy folderach; rozwijanie i zwijanie nadal działa po kliknięciu całego wiersza.

## 1.5.38

- Usunięto podwójną ramkę widoku `Zarządzanie` w nowym SirK Portal.
- Widok korzysta teraz z jednej wspólnej powierzchni bez dodatkowego wewnętrznego odstępu pochodzącego ze starszego stylu.

## 1.5.37

- Dodano w pierwszej kolumnie administracji pozycję `Wtyczki`, otwieraną bez drugiej kolumny.
- Dodano tabelę pluginów, przycisk dodawania konfiguracji HTTPS i rozwijane akcje włączania, wyłączania oraz usuwania.
- Usuwanie wykonuje backup katalogu pluginu, a MyCompany nie może wyłączyć ani usunąć samego siebie.
- Dodano pozycję `Serwer`, również bez drugiej kolumny, pokazującą usługi bieżącej instalacji i umożliwiającą potwierdzony restart.
- Backend ponownie sprawdza pełne uprawnienia administratora oraz ogranicza restart do usług należących do bieżącego katalogu MeshCentral.

## 1.5.36

- Tekst kafelka użytkownika zmienia się na biały po najechaniu, fokusie i otwarciu menu, zachowując kontrast na aktywnym tle.
- Naprawiono podstawianie adresu obrazu użytkownika, obrazu zastępczego i wylogowania w dokumencie nowego SirK Portal.
- Usunięto błędne podstawienia tych zmiennych z szablonu logowania, który ich nie używa.

## 1.5.35

- Menu profilu w nowym SirK Portal otwiera się wyłącznie po kliknięciu kafelka użytkownika.
- Usunięto otwieranie menu przez najechanie kursorem i sam fokus; zamykanie kliknięciem poza menu oraz klawiszem Escape pozostaje bez zmian.

## 1.5.34

- Dodano przełącznik `Utrzymuj sesje po restarcie MeshCentral` w ustawieniach SirK Portal.
- Włączenie tworzy silny stały `SessionKey`, backupuje `config.json` i wymaga restartu usługi.
- Sekret nie jest przekazywany do przeglądarki; wyłączenie usuwa tylko klucz utworzony i rozpoznany przez MyCompany, a klucze zarządzane zewnętrznie pozostają bez zmian.

## 1.5.33

- Dodano do nagłówka nowego SirK Portal kafelek bieżącego użytkownika: Prawdziwa Nazwa, a następnie obrazek, bez ikony rozwijania.
- Kafelek otwiera menu po najechaniu, fokusie lub kliknięciu; pierwszą pozycją jest `Wyloguj się`.
- Wylogowanie korzysta z natywnego endpointu MeshCentral i unieważnia tę samą sesję, również dla wspieranych zewnętrznych strategii uwierzytelniania.

## 1.5.32

- Usunięto mignięcie starego ekranu logowania przed wyświetleniem wymuszonego panelu SirK Portal.
- Zewnętrzna osłona logowania pozostaje widoczna do czasu potwierdzenia klasy `sirk-login-active`, nowego shella i przeniesionego natywnego formularza.
- Logowanie przez zewnętrznego dostawcę tożsamości nadal może bezpiecznie ujawnić natywny iframe.

## 1.5.31

- Dodano centralną obsługę utraty sesji w SirK Portal: odpowiedź API `401` otwiera ekran logowania zamiast komunikatu `invalid JSON response`.
- Po ponownym zalogowaniu użytkownik wraca do SirK Portal i poprzednio otwartej zakładki.
- Portal nadal korzysta wyłącznie z sesji MeshCentral i nie przechowuje haseł ani własnego tokenu sesyjnego.

## 1.5.30

- Zmieniono `Overview` w panelu administracyjnym na widok wyłącznie do odczytu.
- Usunięto z `Overview` checkboxy zmiany stanu modułów oraz przycisk `Save settings`.
- Każdy moduł nadal pokazuje ogólny stan `Enabled/Disabled` i stan gotowości.

## 1.5.29

- Zmieniono ikony natywnego Approval Center na wyraźniejsze symbole pasujące do menu My Scripts.
- Providery i statusy mają teraz spójne znaczenie kolorów: niebieski dla akcji, zielony dla powodzenia, bursztynowy dla oczekiwania i czerwony dla błędów lub odrzucenia.

## 1.5.28

- Ujednolicono zapis ustawień: każdy panel `Settings` ma jeden stale widoczny pasek `Save settings` bez przycisków wewnątrz sekcji zwijanych.
- SirK Portal korzysta z tego samego położenia i stylu zapisu co pozostałe moduły.
- Approval Center renderuje konfigurację My Scripts w głównym formularzu, dzięki czemu wspólny zapis obejmuje wszystkie providery.

## 1.5.27

- Dodano opcjonalne wymuszanie nowego ekranu logowania SirK Portal z osadzonym natywnym uwierzytelnianiem MeshCentral.
- Dodano opcjonalne przekierowanie wejść do starego interfejsu z powrotem do SirK Portal.
- Oba mechanizmy są domyślnie wyłączone, nie używają `customFiles` i nie tworzą alternatywnej sesji ani obsługi haseł.
- Usunięto komunikat o równoległym uruchamianiu starej wtyczki SirKPortal.

## 1.5.26

- Przywrócono zmianę ikony przełącznika motywu SirK Portal: księżyc w jasnym motywie i słońce w ciemnym.
- Etykieta dostępności przycisku opisuje teraz docelowy motyw i aktualizuje się również po zmianie języka.

## 1.5.25

- Ujednolicono styl wszystkich zakładek SirK Portal poza specjalistycznym widokiem `Urządzenia`.
- `Zarządzanie` korzysta teraz z tego samego kontraktu module shell, kolumn, toolbaru, kart i przycisków co pozostałe moduły.
- Dodano konfigurację każdej zakładki: widoczność, osobne włączenie personalizacji, własna etykieta i kolor akcentu.
- Ukryte widoki są blokowane również przy bezpośrednim wejściu przez hash URL, a nieprawidłowy widok startowy otrzymuje bezpieczny fallback.
- Backend waliduje etykiety i kolory oraz nie pozwala wyłączyć wszystkich widoków jednocześnie.

## 1.5.24

- Rozdzielono SirK Portal od natywnego interfejsu MeshCentral: osobny dokument, brak podmiany logowania, globalnego CSS i `domain.customFiles`.
- Usunięto pobieranie assetów Portalu podczas startu; wymagane zasoby są walidowane lokalnie.
- Launcher Portalu w natywnym UI jest teraz opcją domyślnie wyłączoną.
- Zablokowano anonimowy dostęp przy pustych listach grup.
- Nagłówki uwierzytelniające są usuwane przy przekierowaniu HTTP do innego origin, a downgrade HTTPS jest blokowany.
- Uszkodzony magazyn sekretów zgłasza błąd zamiast cicho przechodzić do pustej konfiguracji.
- MyScripts nie odczytuje bibliotek z katalogów dawnych wtyczek.
- Rozszerzono testy architektury i bezpieczeństwa uruchamiane przez `npm test`.

## 1.4.2

- `Zarządzanie` używa natywnego widoku `management` SirK Portal zamiast starej sekcji `Automation`.
- MyScripts jest montowany bezpośrednio w workspace Portalu, bez iframe i bez kopiowania logiki modułu.
- Zachowano pełny toolbar oraz wszystkie funkcje MyScripts: Collapse, Favorites, Credentials, Copy link, Edit, Refresh, Search, Results i formularze wykonania.
- Dodano theme adapter wykorzystujący kolory, borders, inputs, cards, toolbar i trzykolumnowy layout SirK Portal.
- Naprawiono podwójne etykiety menu, takie jak `PrzeglądPrzegląd`, przez aktualizowanie właściwego elementu `.sirk-menu-label`.
- Ukryto starą pozycję `Automation`, gdy dostępne jest zintegrowane `Zarządzanie`.
- Usunięto demonstracyjny workspace Zarządzania z Jira placeholderem po zamontowaniu MyScripts.
- Zachowano osobny host Portalu wokół `SharedPage`, aby jego klasy i CSS nie były nadpisywane podczas montowania modułu.

## 1.4.1

- MyCompany sam zapewnia komplet pinned assetów SirK Portal 0.3.17 w swoim katalogu vendor.
- Aktualizacja i instalacja nie wymagają aktywnej ani aktualizowanej osobnej wtyczki SirKPortal.
- Dodano cache invalidation oraz diagnostykę stanu vendor assets.

## 1.4.0

- SirK Portal został włączony do MyCompany jako opcjonalny moduł frontendowy, bez osobnego backendu, storage i lifecycle pluginu.
- Portal jest domyślnie wyłączony i można go włączyć lub wyłączyć w `Settings → SirK Portal`.
- `Zarządzanie` montuje istniejący moduł MyScripts bez kopiowania jego kodu i danych.
- `Akceptacje` montują istniejący Approval Center.
- `Ustawienia` osadzają panel administracyjny MyCompany i są dostępne tylko dla Site Admin.
- `Mesh` ukrywa portal i przywraca natywny interfejs MeshCentral; opcjonalny launcher pozwala ponownie otworzyć Portal.
- Dodano widoki Przegląd i Urządzenia korzystające z aktywnej sesji oraz widocznych danych MeshCentral.
- ModuleShell obsługuje teraz montowanie modułów wewnątrz innego interfejsu przez wspólny punkt `mount()`.
- Dodano wykrywanie konfliktu z osobną wtyczką SirKPortal; nie należy uruchamiać obu globalnych shelli równolegle.
- Dodano testy architektury pilnujące opcjonalności Portalu, mapowania MyScripts/Approval Center i przełącznika administracyjnego.

## 1.3.9

- Skrypt bez zmiennych po kliknięciu przechodzi bezpośrednio do statusu wykonania i wyniku, bez górnej karty z nazwą, opisem oraz przyciskiem `Run`.
- Formularz skryptu ze zmiennymi jest widoczny tylko przed wywołaniem i znika po kliknięciu `Run` albo `Request`.
- Po wykonaniu w panelu szczegółów pozostaje wyłącznie wynik, status oczekiwania na approval albo błąd wykonania.
- Przycisk `Copy` został przeniesiony pod wynik lub tabelę, bezpośrednio nad `Debug / raw output`.
- Ten sam mechanizm usuwa formularz wykonania po uruchomieniu skryptów i presetów w My Commands.
- Ponowne kliknięcie tego samego skryptu uruchamia nowe wykonanie zamiast wyświetlać wyłącznie poprzedni wynik.

## 1.3.8

- Skrypty bez zadeklarowanych zmiennych są wykonywane automatycznie po kliknięciu w My Commands i My Scripts.
- Skrypty wymagające zmiennych nadal otwierają formularz, aby użytkownik mógł podać wartości przed wykonaniem.
- W Edit Mode dodano opcję `Confirm execution before running`.
- Włączenie opcji zapisuje w nagłówku skryptu dyrektywę `# ConfirmExecution: true`.
- Skrypt z włączonym potwierdzeniem wyświetla użytkownikowi dodatkowe okno potwierdzenia przed utworzeniem requestu lub wysłaniem polecenia.
- Anulowanie potwierdzenia nie tworzy requestu i nie wykonuje skryptu.
- Backend My Scripts i My Commands odrzuca wywołania skryptów wymagających potwierdzenia, jeżeli request nie zawiera potwierdzonej flagi.
- Potwierdzenie działa również przy multi-device execution.

## 1.3.7

- `Results` jest ponownie pierwszą pozycją lewego menu My Commands.
- Kliknięcie presetu bez zmiennych wykonuje go bezpośrednio lub wysyła do akceptacji zgodnie z polityką providera.
- Presety wymagające zmiennych nadal otwierają formularz z przyciskiem `Run` albo `Request`.
- Przycisk `Save General` znajduje się wewnątrz rozwijanej sekcji General w Approval Center.
- Sekcja providera My Commands ma własny przycisk `Save My Commands`.
- Ustawienia host integration i execution limits My Commands mają lokalny przycisk zapisu.
- Dolny, odłączony pasek zapisu jest ukrywany tam, gdzie dostępny jest zapis wewnątrz sekcji.
