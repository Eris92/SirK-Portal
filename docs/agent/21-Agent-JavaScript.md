# JavaScript engineering rules

## Zakres

Stosuj dla JavaScript działającego w Node.js albo przeglądarce. Najpierw ustal runtime i system modułów.

## Konwencja projektu

- Zachowuj istniejący styl, moduły CommonJS lub ESM oraz wersję runtime.
- Nie formatuj całych plików przy małej zmianie.
- Nie dodawaj transpilera, bundlera ani frameworka bez potrzeby.
- Nie zmieniaj publicznego API jako efekt uboczny.

## Frontend i backend

- Kod backendowy nie może zakładać istnienia `window` ani `document`.
- Kod frontendowy nie może używać modułów Node.js bez potwierdzonego bundlingu.
- Nie przenoś sekretów ani uprzywilejowanych decyzji do przeglądarki.
- Authorization zawsze ponownie sprawdzaj po stronie serwera.

## Asynchroniczność

- Obsługuj odrzucenia Promise i błędy `await`.
- Nie pozostawiaj nieobsłużonych operacji asynchronicznych.
- Stosuj timeout lub anulowanie dla operacji, które mogą trwać bez końca.
- Unikaj współdzielonego mutowalnego stanu; jeżeli jest konieczny, dokumentuj jego lifecycle.

## Wejście i DOM

- Waliduj dane wejściowe na granicy systemu.
- Do tekstu w DOM preferuj `textContent`.
- Nie używaj `innerHTML` z nieufnymi danymi bez potwierdzonej sanitizacji.
- Event listenery, timery, subskrypcje i obserwatory muszą mieć kontrolowany lifecycle i cleanup.
- Inicjalizacja wielokrotna nie może duplikować UI ani handlerów.

## Błędy i logowanie

- Nie ukrywaj wyjątków pustym `catch`.
- Błąd powinien zawierać kontekst operacji bez sekretów i pełnych wrażliwych payloadów.
- Klient nie powinien otrzymywać stack trace ani ścieżek systemowych.

## Zależności

Zachowuj lockfile i istniejący package manager. Nowe pakiety oraz aktualizacje prowadź według modułu `08-Agent-Zaleznosci-Aktualizacje.md`.

## Weryfikacja

1. Uruchom parser, `node --check`, linter lub komendę projektu odpowiednią dla pliku.
2. Wykonaj punktowy test zmienionej funkcji.
3. Dla frontendu sprawdź renderowanie, interakcję i ponowne wejście.
4. Dla backendu sprawdź sukces, istotny błąd wejścia oraz brak uprawnienia.
5. Sprawdź brak nieobsłużonych błędów w konsoli i logu.
