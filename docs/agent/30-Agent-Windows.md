# Windows operations

## Zakres

Stosuj dla usług, procesów, rejestru, harmonogramu zadań, certyfikatów, ścieżek i diagnostyki Windows.

## Uprawnienia

- Najpierw sprawdź, czy operacja rzeczywiście wymaga podniesionych uprawnień.
- Nie uruchamiaj całej sesji jako administrator, jeżeli wystarczy pojedyncza kontrolowana operacja.
- Nie wyłączaj UAC, Defendera, firewalla ani polityk wykonania w celu obejścia problemu.

## Usługi i procesy

- Rozróżniaj nazwę usługi, DisplayName, nazwę procesu i nazwę pliku wykonywalnego.
- Przed restartem wykryj rzeczywistą nazwę usługi.
- Po zmianie sprawdź status usługi, proces, port lub endpoint oraz właściwy log.
- Nie kończ procesu siłowo, jeżeli istnieje bezpieczny mechanizm zatrzymania.

## Ścieżki

- Używaj pełnych, rozpoznanych ścieżek dla operacji zmieniających stan.
- Nie wykonuj rekurencyjnego usuwania na podstawie nierozwiązanej zmiennej, globu albo szerokiego katalogu.
- Przed usunięciem lub przeniesieniem potwierdź, że ścieżka znajduje się w zamierzonym katalogu.
- Poprawnie obsługuj spacje, ścieżki UNC i różnice między slashami.

## Rejestr i konfiguracja systemowa

- Odczytuj konkretny klucz lub wartość.
- Przed zmianą eksportuj lub zapisz poprzednią wartość, jeżeli rollback jest praktyczny.
- Nie przeszukuj ani nie modyfikuj całego rejestru bez potrzeby.
- Zmiana wymaga jawnego związku z poleceniem użytkownika.

## Logi i diagnostyka

Preferuj `Get-Service`, `Get-Process`, `Get-WinEvent`, `Test-NetConnection` i właściwe cmdlety zamiast parsowania tekstu. Zawężaj Event Log po czasie, providerze i poziomie.

## Encoding

Przy pracy z Windows PowerShell 5.1 i narzędziami natywnymi jawnie uwzględniaj encoding. Nie uznawaj błędnego wyświetlania znaków za uszkodzenie pliku bez sprawdzenia bajtów lub odczytu UTF-8.

## Weryfikacja

Po zmianie systemowej sprawdź rzeczywisty stan niezależnym poleceniem. Sam kod wyjścia skryptu nie jest wystarczający, jeśli można potwierdzić usługę, proces, plik, port lub ustawienie.
