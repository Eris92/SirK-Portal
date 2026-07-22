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

Nie wczytuj wszystkich instrukcji bez potrzeby. Dla prostego podzadania po zaklasyfikowaniu do `FAST_PATH` użyj właściwego Skill lub skryptu i nie analizuj pełnej architektury projektu.

Kontrolowany wyjątek pozwalający zapisać jawnie oznaczone poświadczenia testowe znajduje się wyłącznie w `07-Agent-Konfiguracja-Sekrety.md`. Nie rozszerzaj go na inne sekrety.

Pliki:

```text
docs/agent/Prompt-Bootstrap-Automation.md
docs/agent/Prompt-Bootstrap-MeshCentral-Architecture.md
```

są promptami jednorazowymi. Pierwszy wdraża automatyzację, a drugi buduje potwierdzoną dokumentację lokalnej architektury MeshCentral bez rozpoczynania migracji. Nie stosuj ich jako stałych instrukcji przy każdym zadaniu.
