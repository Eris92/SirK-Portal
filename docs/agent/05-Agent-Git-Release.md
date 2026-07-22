# Git and release workflow

## Zasada nadrzędna

Operacje Git wykonuj świadomie na bieżącym repozytorium i aktualnej gałęzi. Nie zakładaj czystego working tree.

## Przed zmianą Git

1. Ustal root repozytorium.
2. Sprawdź aktywną gałąź i status.
3. Rozróżnij zmiany użytkownika od zmian wykonanych w bieżącym zadaniu.
4. Nie usuwaj, nie cofaj i nie nadpisuj istniejących zmian użytkownika.

## Aktualizacja repozytorium

Przed `pull`, rebase, merge, zmianą gałęzi lub inną operacją pobierającą nowy stan:

1. wykonaj procedurę usuwania lokalnych plików z poświadczeniami testowymi z modułu `07-Agent-Konfiguracja-Sekrety.md`,
2. sprawdź ponownie status,
3. zatrzymaj się, jeżeli lokalne zmiany mogłyby zostać nadpisane,
4. wykonaj tylko metodę aktualizacji zgodną z projektem,
5. po aktualizacji ponownie sprawdź status i podstawową walidację projektu.

Automatyczne usunięcie dotyczy wyłącznie literalnych ścieżek z projektowej allowlisty plików testowych. Brak allowlisty nie upoważnia do wyszukiwania i kasowania plików po nazwie.

## Staging i commit

- Dodawaj tylko pliki należące do uzgodnionego zakresu.
- Przed stagingiem sprawdź diff i `git diff --check`.
- Nie używaj szerokiego `git add .`, jeżeli w repozytorium istnieją niepowiązane zmiany.
- Nie commituj sekretów, logów, dumpów, artefaktów tymczasowych ani lokalnej konfiguracji.
- Commit wykonuj tylko na polecenie użytkownika albo jako jawny element zaakceptowanego workflow.
- Komunikat commita ma opisywać rzeczywistą zmianę.

## Push

- Push wymaga jawnego polecenia.
- Nie używaj force push ani `--no-verify` bez jednoznacznego polecenia i uzasadnienia.
- Przed push sprawdź aktywną gałąź, remote, zakres commitów, wynik wymaganych testów oraz spójność wersji we wszystkich plikach metadanych objętych zmianą.
- Dla pluginu MeshCentral zawierającego jednocześnie `package.json` i pluginowy `config.json` nie wypychaj zmiany wersji, jeżeli wartości pola `version` nie są identyczne w obu plikach.
- Po push potwierdź docelową gałąź i rezultat polecenia.

## Release

Przed release:

1. potwierdź źródło wersji i regułę jej zmiany,
2. sprawdź spójność wersji we wszystkich wymaganych plikach,
3. uruchom wymagane testy,
4. sprawdź changelog lub release notes, jeśli projekt ich używa,
5. nie twórz taga ani publikacji bez jawnego polecenia,
6. po publikacji zweryfikuj rzeczywisty artefakt albo wpis release.

Nie zmieniaj wersji, taga i changeloga niezależnie, jeżeli projekt definiuje je jako jeden kontrakt.

## Wersja pluginu MeshCentral

Przy podnoszeniu wersji pluginu MeshCentral:

1. ustal root konkretnego pluginu i nie pomyl jego `config.json` z głównym `config.json` MeshCentral,
2. odczytaj bieżące pole `version` z pluginowych `package.json` i `config.json`,
3. ustal nową wersję zgodnie z regułą projektu; nie zgaduj poziomu major/minor/patch,
4. jeżeli oba pliki istnieją, zmień `version` w obu w ramach tej samej zmiany,
5. jeżeli istnieje tylko jeden z tych plików, nie twórz drugiego automatycznie; zastosuj potwierdzony format danego pluginu i odnotuj brak drugiego źródła,
6. zaktualizuj historię wersji, changelog lub release notes, jeśli plugin ich używa,
7. przed stagingiem, commitem, tagiem i push ponownie odczytaj oba pliki i potwierdź identyczną wersję,
8. zatrzymaj publikację przy rozbieżności, braku oczekiwanej zmiany albo niejednoznacznym źródle wersji.

Nie podnoś wersji automatycznie przy każdym zwykłym pushu, chyba że użytkownik albo reguły projektu wyraźnie tego wymagają. Jeżeli jednak zakres zadania obejmuje podniesienie wersji, commit/push/release ma zawierać wszystkie wymagane pliki wersji razem.

## Konflikty

Nie rozwiązuj konfliktów mechanicznie przez wybór jednej strony. Ustal znaczenie obu zmian. Jeżeli konflikt obejmuje nieznane zmiany użytkownika lub decyzję biznesową, zatrzymaj się i poproś o kierunek.

## Zakazy

Bez jawnego polecenia nie używaj `reset --hard`, `clean`, usuwania branchy, przepisywania historii, kasowania tagów ani omijania hooków.
