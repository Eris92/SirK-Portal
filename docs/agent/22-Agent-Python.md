# Python engineering rules

## Zakres

Stosuj tylko w projektach używających Python albo gdy użytkownik jawnie zlecił utworzenie skryptu Python.

## Środowisko

- Ustal wspieraną wersję Python z plików projektu.
- Używaj istniejącego virtual environment i package managera.
- Nie instaluj pakietów globalnie bez jawnego polecenia.
- Nie twórz nowego środowiska, jeżeli istniejące jest poprawne.

## Styl i struktura

- Zachowuj istniejący formatter, linter i układ pakietów.
- Preferuj `pathlib` do ścieżek.
- Dodawaj type hints do nowych publicznych funkcji, jeśli projekt ich używa.
- Nie przechwytuj ogólnego `Exception` bez ponownego zgłoszenia albo uzasadnionej obsługi.
- Nie używaj mutowalnych wartości jako domyślnych argumentów.

## Procesy i dane wejściowe

- Do `subprocess` przekazuj listę argumentów zamiast polecenia składanego tekstowo.
- Nie używaj `shell=True` z danymi zewnętrznymi.
- Waliduj ścieżki, format, zakres i encoding wejścia.
- Pliki tekstowe otwieraj z jawnym encodingiem, gdy format go definiuje.

## Sekrety

Nie hardcoduj credentiali ani tokenów. Stosuj mechanizm projektu i moduł `07-Agent-Konfiguracja-Sekrety.md`. Nie zapisuj sekretów w tracebackach, fixture ani snapshotach.

## Zależności

Nie zmieniaj jednocześnie kilku formatów zarządzania zależnościami. Zachowuj `pyproject.toml`, requirements lub lockfile używany przez projekt.

## Weryfikacja

1. Sprawdź import lub kompilację zmienionego modułu.
2. Uruchom istniejący formatter lub linter tylko dla potrzebnego zakresu.
3. Uruchom punktowy test, na przykład odpowiedni test pytest.
4. Sprawdź istotny przypadek błędny.
5. Sprawdź diff pod kątem wygenerowanych plików i zmian lockfile.
