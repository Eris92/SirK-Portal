# AGENTS.md — router instrukcji projektu

## Język

- Komunikuj się z użytkownikiem po polsku.
- Kod i standardową nomenklaturę techniczną zapisuj zgodnie z konwencją projektu.

## Moduły instrukcji

Wszystkie ścieżki poniżej są względne wobec root repozytorium. Przed rozpoczęciem zadania przeczytaj i zawsze stosuj:

- `docs/agent/00-Agent-Core.md`
- `docs/agent/01-Agent-Tryby.md`
- `docs/agent/03-Agent-Jakosc-Bezpieczenstwo.md`

Dobieraj tylko moduły związane z bieżącym zadaniem. Jeżeli zadanie obejmuje kilka obszarów, połącz odpowiednie moduły.

Dla operacji powtarzalnych, administracyjnych, wersjonowania albo skryptów przeczytaj:

- `docs/agent/02-Agent-Automation.md`

Dla testów, walidacji zmian albo planowania zakresu weryfikacji przeczytaj:

- `docs/agent/04-Agent-Testy-Weryfikacja.md`

Dla Git, aktualizacji repozytorium, commit, push albo release przeczytaj:

- `docs/agent/05-Agent-Git-Release.md`

Dla dokumentacji, map architektury i rejestrów stanu przeczytaj:

- `docs/agent/06-Agent-Dokumentacja-Stanu.md`

Dla konfiguracji, credentiali, sekretów albo lokalnych poświadczeń testowych przeczytaj:

- `docs/agent/07-Agent-Konfiguracja-Sekrety.md`

Dla dodawania lub aktualizacji zależności przeczytaj:

- `docs/agent/08-Agent-Zaleznosci-Aktualizacje.md`

Dla logów, awarii, nieznanej przyczyny albo diagnostyki przeczytaj:

- `docs/agent/09-Agent-Logi-Diagnostyka.md`

Dla tworzenia lub modyfikacji pluginów MeshCentral przeczytaj:

- `docs/agent/10-Agent-MeshCentral-Plugin.md`

Dla każdej zmiany w pluginie MyCompany dodatkowo przeczytaj:

- `docs/agent/11-Agent-MyCompany.md`

Dla kodu PowerShell, JavaScript albo Python przeczytaj odpowiednio:

- `docs/agent/20-Agent-PowerShell.md`
- `docs/agent/21-Agent-JavaScript.md`
- `docs/agent/22-Agent-Python.md`

Dla operacji systemowych przeczytaj moduł właściwy dla środowiska:

- `docs/agent/30-Agent-Windows.md`
- `docs/agent/31-Agent-Linux.md`

Dla Infrastructure as Code, CI/CD, kontenerów, wdrożeń albo chmury przeczytaj:

- `docs/agent/40-Agent-Infrastructure.md`

Dla audytu bezpieczeństwa, threat modelingu, hardeningu, podatności, authentication albo authorization przeczytaj:

- `docs/agent/41-Agent-Security.md`

## Obowiązkowa kontrola zmian MyCompany

Przed modyfikacją interfejsu ustal faktyczny łańcuch ładowania:

1. znajdź HTML lub bootstrap dodający dany asset;
2. potwierdź nazwę pliku obsługującego widok;
3. potwierdź, że asset jest udostępniany przez `MyCompanyAdmin.js` albo `plugin-main.js`;
4. sprawdź bieżącą zawartość tego pliku przed zmianą;
5. po zmianie sprawdź diff i źródła wersji.

Nie zakładaj, że plik o podobnej nazwie jest używany przez runtime. Nie ogłaszaj poprawki, jeżeli zmieniony został wyłącznie plik, którego ładowania nie potwierdzono.

Dla zmian SirK Portal obowiązują dodatkowe kontrakty:

- nie ukrywaj całego `#sirkStandaloneRoot` ani całego dokumentu podczas `F5`;
- nie stosuj długich timeoutów jako podstawowego mechanizmu gotowości;
- wyłączone elementy menu nie mogą być widoczne przed zastosowaniem uprawnień;
- gotowy widok ma być podstawiany jednokrotnie, bez sekwencji `Overview → host → zniknięcie → host`;
- iframe aktywnej sesji hosta jest trwałym elementem DOM: nie przenoś go, nie usuwaj i nie zmieniaj `src` przy przełączaniu widoków;
- przełączanie hostów i sekcji może zmieniać wyłącznie widoczność, `pointer-events`, klasy i położenie trwałej warstwy sesji;
- aktywny host i jego podzakładka muszą być zapisywane osobno i odtwarzane bez zerwania sesji;
- PL/EN i jasny/ciemny muszą synchronizować się do wszystkich otwartych workspace’ów bez ich przeładowania.

Po zmianie UI wykonaj co najmniej:

- test jednostkowy lub kontraktowy obejmujący zmieniony mechanizm;
- `npm test` dla całego pluginu;
- kontrolę `F5` na `All`, aktywnym hoście i aktywnej sesji;
- kontrolę przejścia `Devices → inny widok → Devices` bez utraty iframe;
- kontrolę PL/EN i jasny/ciemny bez opuszczania bieżącego widoku.

Test tekstowy nie może sprawdzać nieistniejącej klasy lub starej implementacji. Każda asercja musi odpowiadać aktualnemu kodowi runtime.

Zmiana wyłącznie dokumentacji nie wymaga podnoszenia wersji pluginu. Zmiana runtime wymaga spójnej aktualizacji wszystkich źródeł wersji oraz dokumentacji wydania.

Nie wczytuj wszystkich instrukcji bez potrzeby. Dla prostego podzadania po zaklasyfikowaniu do `FAST_PATH` użyj właściwego Skill lub skryptu i nie analizuj pełnej architektury projektu.

Kontrolowany wyjątek pozwalający zapisać jawnie oznaczone poświadczenia testowe znajduje się wyłącznie w `07-Agent-Konfiguracja-Sekrety.md`. Nie rozszerzaj go na inne sekrety.

Pliki:

```text
docs/agent/Prompt-Bootstrap-Automation.md
docs/agent/Prompt-Bootstrap-MeshCentral-Architecture.md
```

są promptami jednorazowymi. Pierwszy wdraża automatyzację, a drugi buduje potwierdzoną dokumentację lokalnej architektury MeshCentral bez rozpoczynania migracji. Nie stosuj ich jako stałych instrukcji przy każdym zadaniu.
