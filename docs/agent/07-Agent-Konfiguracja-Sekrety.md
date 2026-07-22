# Configuration, credentials and secrets

## Zasada domyślna

Sekretów produkcyjnych, prywatnych i nieoznaczonych nie zapisuj w repozytorium, dokumentacji, logach, promptach, diffach ani plikach tymczasowych. Używaj istniejącego mechanizmu credentiali, zmiennych środowiskowych, bezpiecznego magazynu albo ustawień lokalnych projektu.

## Jawny wyjątek dla środowiska testowego

Użytkownik zezwala agentowi na lokalne zapisanie poświadczeń wyłącznie wtedy, gdy wszystkie warunki są spełnione:

1. użytkownik jednoznacznie oznaczył konto i serwer jako testowe, lokalne lub jednorazowe,
2. konto zostało utworzone specjalnie do testów i nie daje dostępu do produkcji ani danych rzeczywistych,
3. plik znajduje się wewnątrz bieżącego projektu w katalogu przeznaczonym na lokalne dane,
4. plik jest ignorowany przez Git,
5. literalna ścieżka pliku znajduje się w projektowej allowliście `.codex/test-secret-files.txt`,
6. plik zawiera oznaczenie `TEST_ONLY` i nazwę docelowego środowiska,
7. poświadczenia nie są kopiowane do dokumentacji, raportu, commita ani logu.

Dla takiego konta dopuszczalny jest jawny tekst, na przykład lokalne konto typu `admin/admin` albo `user/user`, jeżeli użytkownik potwierdził jego testowy charakter. Nie rozszerzaj tego wyjątku na inne dane tylko dlatego, że znajdują się w tym samym pliku.

## Zalecana lokalizacja

Preferowana ścieżka pliku testowego:

```text
.codex-local/test-credentials.json
```

Repozytorium powinno zawierać wpis ignorujący `.codex-local/` oraz śledzony plik:

```text
.codex/test-secret-files.txt
```

Allowlista zawiera po jednej repozytoryjnej ścieżce względnej w każdym wierszu. Nie zawiera samych sekretów.

## Procedura zapisania konta testowego

Przed pierwszym zapisem:

1. potwierdź z użytkownikiem nazwę środowiska i testowy charakter konta,
2. sprawdź, że bieżący katalog należy do właściwego repozytorium,
3. dodaj `.codex-local/` do właściwego `.gitignore`, jeśli wpisu brakuje,
4. utwórz albo uzupełnij `.codex/test-secret-files.txt` literalną ścieżką `.codex-local/test-credentials.json`,
5. potwierdź przez `git check-ignore`, że docelowy plik będzie ignorowany,
6. zapisz wyłącznie minimalne dane wymagane do testu,
7. ogranicz prawa dostępu do pliku do bieżącego użytkownika, jeżeli system i środowisko na to pozwalają,
8. ponownie sprawdź `git status`, aby potwierdzić, że sam plik credentiali nie jest śledzony ani proponowany do commita.

Przykładowa struktura:

```json
{
  "classification": "TEST_ONLY",
  "environment": "local-test-server",
  "credentials": {
    "username": "<test-user>",
    "password": "<test-password>"
  }
}
```

Jeżeli nie można potwierdzić ignorowania pliku, jego bezpiecznej lokalizacji albo testowego charakteru konta, nie zapisuj wartości na dysku. Używaj jej tylko w bieżącej sesji i poinformuj użytkownika o brakującym warunku.

## Automatyczne usuwanie przy aktualizacji repozytorium

Przed każdym `git pull`, rebase, merge, zmianą gałęzi lub inną operacją aktualizującą pliki repozytorium usuń lokalne pliki testowych sekretów wskazane w `.codex/test-secret-files.txt`.

Jeżeli projekt posiada skonfigurowany skaner sekretów, uruchom go przed aktualizacją. Wykrycie innego pliku lub wartości zawierającej potencjalny sekret nie upoważnia do automatycznego usunięcia: zatrzymaj aktualizację, wskaż lokalizację bez ujawniania wartości i poproś użytkownika o decyzję.

Procedura jest automatycznie dozwolona wyłącznie dla tych plików i musi:

1. odczytać literalne ścieżki z allowlisty,
2. odrzucić ścieżki absolutne, puste, zawierające wildcard albo wychodzące poza root repozytorium,
3. potwierdzić przez Git, że każdy plik jest ignorowany i nie jest śledzony,
4. rozwiązać pełną ścieżkę i ponownie potwierdzić, że pozostaje wewnątrz bieżącego repozytorium,
5. usunąć tylko istniejący plik o dokładnie wskazanej ścieżce, bez usuwania nadrzędnego katalogu,
6. sprawdzić, że plik przestał istnieć,
7. krótko poinformować użytkownika, które pliki testowych sekretów usunięto.

Jeżeli plik jest śledzony, ścieżka jest niebezpieczna albo allowlista nie istnieje, nie wykonuj automatycznego wyszukiwania i kasowania. Zatrzymaj procedurę aktualizacji i zgłoś problem.

Nigdy nie używaj do tego celu globów takich jak `*secret*`, `*.env`, `*credential*`, rekursywnego kasowania ani wyszukiwania po nazwie. Nie usuwaj `.env`, konfiguracji, certyfikatów lub kluczy, jeśli ich dokładna ścieżka nie jest bezpiecznie dopuszczona powyższym mechanizmem.

## Pozostałe sekrety

Dla każdego sekretu, który nie spełnia warunków wyjątku testowego:

- nie zapisuj pełnej wartości,
- nie przenoś go do pliku testowego,
- nie pokazuj go użytkownikowi, jeśli wystarczy maska,
- nie przekazuj go w argumentach procesu, jeśli może trafić do historii,
- nie commituj nawet zaszyfrowanej wartości bez potwierdzonego mechanizmu projektu.

## Logowanie i raportowanie

W output pokazuj nazwę mechanizmu i miejsce przechowywania, ale maskuj wartość. Dopuszczalne jest pokazanie krótkiego identyfikatora lub końcowych znaków tylko wtedy, gdy pomaga to rozróżnić credentiale.

## Rotacja i utrata

Jeżeli sekret inny niż jawnie testowy trafił do Git, logu lub dokumentacji, traktuj go jako ujawniony. Samo usunięcie pliku nie wystarcza: zgłoś potrzebę unieważnienia lub rotacji i ocenę historii repozytorium.
