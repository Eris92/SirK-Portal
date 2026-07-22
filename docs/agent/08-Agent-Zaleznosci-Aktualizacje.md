# Dependencies and updates

## Zasada nadrzędna

Dodawaj i aktualizuj zależności tylko wtedy, gdy są potrzebne do bieżącego celu. Nie wykonuj zbiorczych aktualizacji przy okazji innej zmiany.

## Przed zmianą

1. Ustal rzeczywisty package manager i plik źródłowy zależności.
2. Sprawdź lockfile i zasady projektu.
3. Sprawdź wymagane wersje runtime.
4. Ustal, czy zależność jest runtime, development czy opcjonalna.
5. Sprawdź, czy potrzebną funkcję można zrealizować istniejącym kodem lub zależnością.

## Dodawanie zależności

- Wybieraj najmniejszą zależność realizującą cel.
- Preferuj aktywnie utrzymywane biblioteki o jasnej licencji.
- Nie dodawaj pakietu wyłącznie dla trywialnej funkcji.
- Nie uruchamiaj skryptów instalacyjnych z nieznanego źródła bez oceny.
- Nie zmieniaj package managera bez jawnego polecenia.

## Aktualizacje

- Aktualizuj punktowo, chyba że użytkownik zlecił pełną aktualizację.
- Zachowuj istniejące ograniczenia wersji, jeżeli nie ma powodu ich zmieniać.
- Przy zmianie major przeczytaj oficjalne informacje o migracji i sprawdź breaking changes.
- Nie edytuj lockfile ręcznie, jeżeli zarządza nim package manager.
- Nie aktualizuj zależności niezwiązanych z poprawką bezpieczeństwa lub celem zadania.

## Bezpieczeństwo

Wynik skanera zależności jest sygnałem do analizy, nie automatycznym upoważnieniem do masowej aktualizacji. Potwierdź, czy podatna ścieżka jest używana, jaki jest wpływ i czy poprawiona wersja jest kompatybilna.

Nie zapisuj tokenów rejestru pakietów w repozytorium ani w poleceniu. Używaj potwierdzonego mechanizmu uwierzytelnienia.

## Weryfikacja

Po zmianie:

1. sprawdź diff manifestu i lockfile,
2. uruchom instalację w sposób zgodny z projektem,
3. wykonaj build lub punktowy test,
4. sprawdź podstawowe uruchomienie,
5. potwierdź, że nie dodano nieoczekiwanych pakietów lub skryptów.

## Raport

Podaj nazwę zależności, wersję przed i po, powód zmiany, wpływ na lockfile, wykonane testy i znane wymagania migracyjne.
