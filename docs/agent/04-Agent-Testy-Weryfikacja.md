# Testing and verification

## Cel

Dobieraj testy proporcjonalnie do rodzaju zmiany i ryzyka. Test ma dostarczać dowodu, a nie tylko generować aktywność.

## Kolejność

1. Sprawdź składnię lub możliwość załadowania zmienionego pliku.
2. Uruchom najbardziej punktowy istniejący test.
3. Sprawdź zmienioną ścieżkę działania.
4. Rozszerz testy tylko wtedy, gdy wpływ zmiany wykracza poza jeden komponent.
5. Na końcu sprawdź zakres zmian przez diff lub równoważną kontrolę.

## Dobór testu

- Dokumentacja: sprawdź linki, ścieżki, przykłady i zgodność z rzeczywistym zachowaniem.
- Skrypt: parser, bezpieczne dane wejściowe, błąd wejścia i bezpośrednia weryfikacja rezultatu.
- Backend: test jednostkowy lub integracyjny zmienionego endpointu i przypadek odmowy dostępu.
- Frontend: składnia, renderowanie, podstawowa interakcja, brak duplikacji handlerów i błąd odpowiedzi API.
- Konfiguracja: walidacja schematu, uruchomienie w trybie kontrolnym oraz sprawdzenie wartości domyślnych.
- Wspólny Core lub publiczne API: testy zależnych komponentów i pełny zestaw, jeśli jest dostępny i uzasadniony.

## Przypadki negatywne

Dla zmian w walidacji, bezpieczeństwie, uprawnieniach albo operacjach administracyjnych sprawdź co najmniej jeden istotny przypadek błędny, na przykład:

- brak wymaganego parametru,
- nieprawidłowy format,
- nieistniejący zasób,
- brak uprawnienia,
- timeout albo niedostępny endpoint,
- konflikt stanu.

## Środowisko testowe

- Nie testuj zmian destrukcyjnych na produkcji.
- Preferuj fixture, mock, plik tymczasowy, lokalną usługę albo jawnie wskazany serwer testowy.
- Po teście usuń utworzone dane tymczasowe, jeżeli są jednoznacznie rozpoznane i nie są potrzebnym artefaktem.
- Nie traktuj poświadczeń testowych jako produkcyjnych, ale stosuj zasady modułu Konfiguracja i Sekrety.

## Testy niedeterministyczne

Nie ukrywaj flaky testu przez wielokrotne ponawianie aż do sukcesu. Jedno kontrolne ponowienie jest dopuszczalne, jeżeli zapiszesz oba wyniki i wskażesz niestabilność.

## Gdy testu nie można wykonać

Podaj:

- którego testu nie wykonano,
- konkretną przyczynę,
- co sprawdzono zamiast niego,
- jakie ryzyko pozostaje.

Brak możliwości wykonania testu nie jest automatycznie porażką zadania, ale nie wolno twierdzić, że niezweryfikowana ścieżka została potwierdzona.

## Raport

Wynik powinien zawierać nazwę testu lub polecenie, kod wyjścia, krótki rezultat oraz informację, czego test dowodzi.
