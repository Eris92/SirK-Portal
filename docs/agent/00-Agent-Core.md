# Core agent rules

## Zakres

Ten moduł zawiera wspólne zasady obowiązujące przy każdym zadaniu. Szczegółowe moduły technologiczne rozszerzają go tylko w zakresie bieżącej operacji.

## Pierwszeństwo instrukcji projektu

Instrukcje platformy i bieżące polecenie użytkownika mają pierwszeństwo zgodnie z mechanizmem Codex.

W obrębie instrukcji projektu stosuj kolejność:

1. instrukcja najbardziej specyficzna dla bieżącego katalogu lub komponentu,
2. moduł domenowy, na przykład MeshCentral, Security albo Infrastructure,
3. moduł technologiczny, na przykład PowerShell, JavaScript, Python, Windows lub Linux,
4. wspólne moduły procesu,
5. ten moduł Core.

Jeżeli moduły są sprzeczne, zastosuj regułę bardziej specyficzną i krótko wskaż konflikt. Nie próbuj wykonywać obu sprzecznych instrukcji.

## Język i komunikacja

- Komunikuj się z użytkownikiem po polsku.
- Kod, nazwy symboli, komendy, API i standardową nomenklaturę techniczną zachowuj zgodnie z konwencją projektu.
- Prowadź zwięzłe aktualizacje podczas dłuższej pracy.
- Raportuj wynik, wykonane zmiany i dowody weryfikacji, bez ujawniania wewnętrznego toku rozumowania.

## Sposób pracy

1. Ustal rzeczywisty zakres polecenia.
2. Odczytaj tylko instrukcje i pliki potrzebne do zadania.
3. Sprawdź bieżący stan zamiast zgadywać.
4. Wykonaj najmniejszą zmianę realizującą cel.
5. Zweryfikuj rezultat adekwatnie do ryzyka.
6. Sprawdź, czy nie zmieniono rzeczy niepowiązanych.
7. Podaj jednoznaczny wynik.

## Granice uprawnień

- Odczyt i diagnostyka w zakresie projektu są dozwolone.
- Zapis plików jest dozwolony, gdy wynika z polecenia zmiany lub budowy.
- Operacje zewnętrzne, publikacja, restart, instalacja, migracja i działania destrukcyjne wymagają jawnego polecenia albo wcześniej zaakceptowanego planu.
- Nie rozszerzaj samodzielnie zakresu na inne repozytoria, środowiska ani konta.
- Nie obchodź sandboxa, polityk bezpieczeństwa, hooków ani zabezpieczeń projektu.

## Kontekst i minimalizm

- Nie skanuj całego repozytorium, jeżeli wystarczy wskazany plik, symbol lub moduł.
- Nie czytaj dużych logów w całości.
- Nie uruchamiaj szerokich testów, gdy test punktowy daje wystarczający dowód.
- Nie twórz dodatkowego frameworka, Skill, skryptu ani dokumentacji bez rzeczywistej potrzeby.
- Zauważone problemy poboczne zgłoś, ale nie poprawiaj ich bez polecenia.

## Stan niepełny i blokady

Jeżeli zadania nie można bezpiecznie zakończyć:

- wykonaj wszystkie bezpieczne kontrole w zakresie zadania,
- wskaż konkretny brak, błąd lub wymaganą decyzję,
- nie przedstawiaj częściowego wyniku jako pełnego sukcesu,
- nie zastępuj brakujących danych przypuszczeniem.

## Zakończenie

Zadanie jest zakończone, gdy żądany rezultat istnieje, został zweryfikowany, zakres zmian jest kontrolowany, a użytkownik otrzymał informację o wyniku i ograniczeniach.
