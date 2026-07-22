# Task execution router

## Zasada nadrzędna

Klasyfikuj każde podzadanie oddzielnie, a nie całe polecenie jako jeden poziom złożoności.

Złożone zadanie może zawierać proste podzadania. Proste, deterministyczne podzadanie wykonuj w `FAST_PATH`, nawet jeśli wcześniejsza część zadania wymagała `DEEP_PATH`.

Po rozwiązaniu części analitycznej wszystkie końcowe czynności deterministyczne ponownie wykonuj w `FAST_PATH`.

---

# FAST_PATH

Używaj dla operacji deterministycznych, takich jak:

- odczyt bieżącego statusu,
- sprawdzenie istnienia lub zawartości wskazanego pliku,
- pokazanie fragmentu logu,
- sprawdzenie wersji,
- podniesienie wersji według istniejącej procedury,
- restart i weryfikacja usługi,
- sprawdzenie procesu,
- sprawdzenie portu albo endpointu,
- build, lint lub wskazany test,
- `git status`, commit i push,
- uruchomienie istniejącego skryptu lub Skill,
- operacja opisana przez gotową, jednoznaczną procedurę.

## Zasady FAST_PATH

1. Najpierw sprawdź, czy istnieje odpowiedni Skill lub skrypt.
2. Jeżeli istnieje, uruchom go z właściwymi parametrami.
3. Jeżeli wynik można uzyskać poleceniem, pobierz rzeczywisty wynik zamiast analizować, jak powinien wyglądać.
4. Nie twórz rozbudowanego planu.
5. Nie uruchamiaj subagentów.
6. Nie analizuj architektury aplikacji bez rzeczywistej potrzeby.
7. Nie skanuj całego repozytorium.
8. Nie czytaj historii Git bez konkretnej potrzeby.
9. Nie czytaj plików niezwiązanych bezpośrednio z operacją.
10. Nie uruchamiaj pełnego zestawu testów, jeżeli istnieje test bezpośrednio związany ze zmianą.
11. Wykonaj minimalny zestaw bezpośrednich weryfikacji rezultatu.
12. Zwykle jedna weryfikacja powinna wystarczyć. Więcej stosuj tylko wtedy, gdy jedna kontrola nie potwierdza faktycznego działania.
13. Po potwierdzonym sukcesie zakończ podzadanie.
14. Nie szukaj dodatkowych problemów, jeżeli użytkownik nie poprosił o audyt lub code review.
15. Nie poprawiaj rzeczy niezwiązanych z poleceniem.
16. Nie twórz nowego Skill ani skryptu przed wykonaniem bieżącej operacji.
17. Tworzenie automatyzacji nie może opóźniać wykonania bieżącego zadania.

## Domyślny budżet FAST_PATH

Budżet jest celem operacyjnym, a nie bezwzględnym limitem:

- maksymalnie jedno wyszukiwanie `rg` lub równoważne,
- maksymalnie trzy odczytane pliki,
- maksymalnie trzy polecenia diagnostyczne przed właściwą operacją,
- minimalny zestaw końcowych weryfikacji.

Budżet można przekroczyć wyłącznie o minimalną liczbę operacji koniecznych do uzyskania jednoznacznego lub bezpiecznego wyniku, gdy:

- polecenie zwróciło błąd,
- wynik jest niejednoznaczny,
- brakuje wymaganego pliku lub zasobu,
- weryfikacja rezultatu nie powiodła się,
- operacja wymaga dodatkowej kontroli bezpieczeństwa.

## Operacje zmieniające środowisko

`FAST_PATH` nie oznacza automatycznej zgody na zmianę środowiska.

Commit, push, restart, usuwanie, nadpisywanie, migracja, instalacja i zmiana konfiguracji mogą być wykonywane tylko wtedy, gdy wynikają bezpośrednio z polecenia użytkownika albo z wcześniej zaakceptowanego planu.

Bez jawnego polecenia nie używaj:

- `git push --force` ani `--force-with-lease`,
- `git reset --hard`,
- `git clean -fd` lub wariantów destrukcyjnych,
- `--no-verify`,
- usuwania branchy,
- wyłączania zabezpieczeń,
- kasowania danych lub konfiguracji,
- nadpisywania plików bez możliwości odtworzenia.

---

# DEEP_PATH

Używaj dla:

- błędów o nieznanej przyczynie,
- zmian obejmujących wiele modułów,
- projektowania architektury,
- problemów bezpieczeństwa,
- migracji danych,
- zmian API,
- problemów współbieżności,
- trudnych błędów zależnych od stanu,
- sytuacji bez jednoznacznej reprodukcji,
- zmian, których wpływu nie można ustalić na podstawie ograniczonego kontekstu.

W `DEEP_PATH` dozwolone są:

- plan,
- analiza zależności,
- przeszukiwanie wielu plików,
- reprodukcja błędu,
- dodatkowe testy,
- analiza historii zmian, jeżeli jest potrzebna,
- subagenci, jeżeli podzadania są naprawdę niezależne.

Po znalezieniu rozwiązania przełącz wszystkie deterministyczne czynności końcowe z powrotem do `FAST_PATH`.

---

# Escalation rule

Jeżeli zadanie zostało początkowo zaklasyfikowane jako `FAST_PATH`, nie przechodź do `DEEP_PATH` prewencyjnie.

W takim przypadku przejdź do `DEEP_PATH` wyłącznie wtedy, gdy:

- operacja zwróci kod różny od zera,
- bezpośrednia weryfikacja nie potwierdzi sukcesu,
- wynik jest sprzeczny z oczekiwanym stanem,
- istnieje rzeczywista niejednoznaczność wymagająca analizy,
- wykryto ryzyko bezpieczeństwa albo utraty danych,
- wykonanie wymaga zmiany nieudokumentowanego mechanizmu.

Przed przejściem podaj krótko:

- co nie zadziałało,
- jaki wynik otrzymano,
- dlaczego potrzebna jest szersza analiza.

---

# Evidence-first rule

Polecenie pobierające bieżący stan jest źródłem prawdy.

Przykłady:

- status usługi: `Get-Service`,
- działający proces: `Get-Process`,
- wersja: odczyt konkretnego pola z konkretnego pliku,
- zmiany Git: `git status --short` i `git diff`,
- logi: odpowiedni skrypt odczytujący ostatnie linie,
- port: `Test-NetConnection`,
- endpoint HTTP: kontrolowane zapytanie HTTP,
- składnia PowerShell: parser PowerShell,
- składnia JavaScript: właściwy parser, linter albo uruchomienie kontrolne,
- stan pliku: `Test-Path`, hash albo ponowny odczyt wymaganej wartości.

Nie analizuj kodu implementującego daną funkcję, jeżeli użytkownik poprosił wyłącznie o pobranie jej aktualnego wyniku lub stanu.

---

# Completion rule

Operacja jest zakończona, gdy:

1. właściwe polecenie lub zmiana zostały wykonane,
2. polecenie zwróciło poprawny kod wyjścia albo operacja nie zgłosiła błędu,
3. bezpośrednia weryfikacja potwierdziła oczekiwany stan,
4. nie zmieniono niepowiązanych plików lub ustawień.

Po spełnieniu tych warunków nie wykonuj dodatkowego researchu ani audytu, chyba że użytkownik wyraźnie o to poprosił.

Jeżeli kod wyjścia jest różny od zera albo weryfikacja nie potwierdziła sukcesu, nie twierdź, że operacja zakończyła się poprawnie.
