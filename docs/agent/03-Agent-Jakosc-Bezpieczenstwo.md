# Quality and safety baseline

## Zakres zmian

- Modyfikuj wyłącznie pliki niezbędne do wykonania bieżącego zadania.
- Nie wykonuj dodatkowego refactoru bez polecenia.
- Nie zmieniaj publicznego zachowania jako efekt uboczny.
- Nie zmieniaj nazw, struktury katalogów ani formatowania całych plików bez potrzeby.
- Nie dodawaj nowej zależności bez technicznego uzasadnienia.
- Nie aktualizuj zależności niezwiązanych z zadaniem.
- Nie usuwaj działających funkcji, parametrów ani konfiguracji bez wyraźnego polecenia.
- Zachowuj backward compatibility, jeżeli nie istnieje ważny powód bezpieczeństwa lub poprawności, aby ją zerwać.

## Bezpieczeństwo operacji

- Nie usuwaj danych ani plików bez jawnego polecenia.
- Przed zmianą destrukcyjną przygotuj możliwość rollback lub backup, jeżeli jest to praktyczne.
- Nie używaj force push, `reset --hard`, `clean`, `--no-verify` ani obchodzenia zabezpieczeń bez jawnego polecenia.
- Nie wyłączaj mechanizmów bezpieczeństwa tylko po to, aby test lub build przeszedł.
- Nie zapisuj sekretów w kodzie, dokumentacji, logach, diff ani przykładach. Jedyny wyjątek stanowią jawnie oznaczone lokalne poświadczenia testowe zapisane dokładnie według `07-Agent-Konfiguracja-Sekrety.md`.
- Nie wyświetlaj pełnych tokenów, haseł, private keys ani connection strings.
- Nie kopiuj sekretów do plików tymczasowych. Plik testowych credentiali dozwolony przez moduł `07` nie może być używany dla sekretów produkcyjnych ani nieoznaczonych.
- Nie zmieniaj produkcyjnego środowiska w ramach testu.
- Operacje zewnętrzne i destrukcyjne wykonuj tylko w zakresie zaakceptowanym przez użytkownika.

## Walidacja wejścia

- Traktuj dane z plików, API, użytkownika i środowiska jako nieufne.
- Waliduj typ, format, zakres i dozwolone wartości.
- Nie składaj poleceń shell przez niekontrolowaną konkatenację tekstu.
- Poprawnie cytuj ścieżki oraz argumenty.
- Preferuj API i natywne cmdlety zamiast budowania surowych poleceń tekstowych.
- Nie zakładaj istnienia pliku, usługi, procesu, branchy, endpointu ani uprawnienia — sprawdź je przed użyciem.

## Obsługa błędów

- Nie ignoruj wyjątków i kodów wyjścia.
- Nie używaj pustych `catch`.
- Nie uznawaj częściowego wykonania za sukces.
- Komunikat błędu ma wskazywać operację i obiekt, ale nie może ujawniać sekretów.
- Jeżeli rollback nie jest możliwy, jednoznacznie opisz stan częściowy.
- Po błędzie nie wykonuj kolejnych kroków zależnych od nieudanego wyniku.

## Minimalna weryfikacja

Po zmianie wybierz i wykonaj najmniejszy adekwatny zestaw spośród:

1. syntax check,
2. targeted lint albo test,
3. test zmienionej ścieżki,
4. bezpośrednią weryfikację rezultatu,
5. kontrolę `git diff` lub równoważną kontrolę zakresu zmian.

Nie uruchamiaj pełnego test suite, jeżeli nie jest potrzebny.

Pełny test suite wykonaj, gdy:

- zmiana dotyczy wspólnego Core lub publicznego API,
- zmieniono mechanizm ładowania, konfiguracji lub bezpieczeństwa,
- zmiana obejmuje wiele modułów,
- nie istnieje wystarczający test punktowy,
- użytkownik wyraźnie tego wymaga.

## Definition of Done

Zadanie jest zakończone dopiero, gdy:

- zmiana została zapisana,
- składnia jest poprawna,
- odpowiedni test przeszedł albo jasno wskazano, dlaczego nie mógł zostać wykonany,
- wynik został bezpośrednio zweryfikowany,
- nie zmieniono niepowiązanych plików,
- nie ujawniono sekretów,
- użytkownik otrzymał jednoznaczny wynik.

Jeżeli weryfikacja nie przeszła, nie twierdź, że zadanie zakończyło się sukcesem.

## Dokumentacja i komentarze

- Aktualizuj dokumentację tylko wtedy, gdy zmieniło się zachowanie, użycie, konfiguracja lub kontrakt.
- Nie twórz dokumentacji opisującej stan niepotwierdzony.
- Komentarze mają wyjaśniać przyczynę albo ograniczenie, a nie przepisywać kod.
- Nie pozostawiaj tymczasowych komentarzy, debug output ani danych testowych.
- Nie zapisuj dużych logów i dumpów do repozytorium.

## Raport końcowy

Podaj krótko:

- co zmieniono,
- które pliki zmieniono,
- jakie testy wykonano,
- wynik testów,
- czy wymagany jest restart lub reload,
- znane ograniczenia,
- czego nie udało się zweryfikować.

Nie opisuj długiego procesu rozumowania. Podawaj wynik, faktyczne zmiany i dowody weryfikacji.
