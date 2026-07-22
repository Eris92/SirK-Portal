# Automation-first workflow

## Cel

Powtarzalne, deterministyczne operacje wykonuj przez istniejące Skills i skrypty zamiast każdorazowo analizować całe repozytorium i ręcznie odtwarzać tę samą procedurę.

Dotyczy to między innymi:

- podnoszenia wersji projektu,
- sprawdzania spójności wersji,
- commit i push zmian,
- restartu i weryfikacji usługi Windows,
- uruchamiania i sprawdzania procesu,
- przeglądania logów,
- pobierania ostatnich `N` linii pliku,
- sprawdzania składni,
- build, test i lint,
- backupu wskazanych plików,
- sprawdzania portów i endpointów,
- innych cyklicznych operacji administracyjnych.

---

# Kolejność działania

Przed wykonaniem powtarzalnej operacji:

1. Sprawdź, czy istnieje odpowiedni Skill.
2. Sprawdź, czy istnieje odpowiedni skrypt.
3. Jeżeli istnieje, uruchom go z właściwymi parametrami.
4. Nie przepisuj ręcznie logiki, która już znajduje się w skrypcie.
5. Nie analizuj całego repozytorium dla prostej czynności administracyjnej.
6. Nie twórz długiego planu przed operacją deterministyczną.
7. Zinterpretuj kod wyjścia i wynik skryptu.
8. Wykonaj bezpośrednią weryfikację rezultatu.
9. Zwróć użytkownikowi jednoznaczny wynik.

Jeżeli skrypt zwróci kod różny od zera albo weryfikacja nie potwierdzi sukcesu, nie twierdź, że operacja zakończyła się poprawnie.

---

# Kiedy tworzyć nową automatyzację

Najpierw wykonaj bieżące zadanie najprostszą bezpieczną metodą.

Po wykonaniu zadania oceń utworzenie Skill i skryptu, gdy:

- użytkownik określił operację jako cykliczną,
- ta sama lub bardzo podobna procedura została wykonana co najmniej drugi raz,
- bieżące zadanie jawnie dotyczy budowy automatyzacji,
- wejścia można przedstawić jako parametry,
- wynik można jednoznacznie zweryfikować,
- operacja ma ustalone kroki,
- operacja nie wymaga kreatywnego rozumowania przy każdym uruchomieniu,
- skrypt ograniczy czas analizy albo ryzyko błędu.

Nie twórz automatyzacji, gdy:

- zadanie jest jednorazowe,
- każdy przypadek wymaga innej analizy,
- operacja jest niebezpieczna i nie można zapewnić bezpiecznej walidacji,
- istniejący Skill lub skrypt już realizuje cel,
- zadanie wymaga przechowywania sekretów w repozytorium.

Tworzenie automatyzacji nie może blokować ani opóźniać wykonania bieżącego zadania.

---

# Lokalizacja Skills i skryptów

Domyślna struktura:

```text
.agents/
└── skills/
    └── <skill-name>/
        ├── SKILL.md
        └── scripts/
            └── <Verb-Noun>.ps1
```

Dla skryptów współdzielonych przez wiele Skills można użyć:

```text
tools/
└── codex/
    └── <Verb-Noun>.ps1
```

Jeżeli repozytorium posiada już własną strukturę Skills lub scripts, zachowaj istniejącą konwencję i nie twórz równoległej struktury bez potrzeby.

Przed utworzeniem nowego Skill:

1. Przeszukaj `.agents/skills`.
2. Przeszukaj istniejące katalogi skryptów, w tym `tools/codex`.
3. Sprawdź, czy można rozszerzyć istniejący skrypt o opcjonalny parametr.
4. Nie twórz kilku prawie identycznych skryptów.
5. Zachowaj single responsibility.
6. Wspólną logikę wyodrębniaj dopiero wtedy, gdy rzeczywiście zaczyna się powtarzać.

---

# Standard SKILL.md

Każdy `SKILL.md` powinien rozpoczynać się od front matter:

```yaml
---
name: read-log
description: Użyj, gdy trzeba odczytać końcowy fragment lokalnego logu; nie używaj do pełnego eksportu logów ani danych z systemu zewnętrznego.
---
```

`SKILL.md` ma zawierać:

- krótki cel,
- warunki użycia,
- warunki, kiedy Skill nie powinien być używany,
- ścieżkę do skryptu,
- dokładne polecenie uruchamiające,
- opis parametrów,
- format wyniku,
- kody wyjścia,
- sposób interpretacji wyniku,
- ograniczenia bezpieczeństwa,
- przykłady wywołania.

Skill nie powinien powielać implementacji skryptu. Ma wskazywać, kiedy uruchomić skrypt, z jakimi parametrami i jak zinterpretować rezultat.

---

# Standard skryptów PowerShell

Każdy nowy skrypt `.ps1` powinien:

- działać w PowerShell 7,
- jeżeli jest to praktyczne, działać również w Windows PowerShell 5.1,
- używać `[CmdletBinding()]`,
- mieć jawny blok `param()`,
- używać sensownych typów parametrów,
- stosować walidację wejścia,
- używać `$ErrorActionPreference = 'Stop'`,
- stosować `try/catch/finally`, gdy operacja może zgłosić błąd,
- nie używać `Write-Host` jako jedynego źródła wyniku,
- nie ukrywać błędów,
- nie zawierać sekretów,
- działać idempotentnie, gdy jest to możliwe,
- poprawnie obsługiwać ścieżki zawierające spacje,
- używać `-LiteralPath`, gdy wildcard nie jest wymagany,
- zawierać krótkie comment-based help i przykłady,
- obsługiwać `SupportsShouldProcess` i `-WhatIf` dla operacji zmieniających stan, gdy jest to technicznie uzasadnione,
- po wykonaniu niezależnie zweryfikować rezultat.

Jeżeli precyzyjny kod błędu walidacji jest wymagany, wykonuj krytyczną walidację również w ciele skryptu. Błąd PowerShell parameter binder może wystąpić przed wejściem do logiki skryptu.

---

# Format wyniku

Domyślny standard output skryptu ma zawierać jeden wynik w przewidywalnym formacie JSON.

Zalecany parametr:

```powershell
[ValidateSet('Json', 'Object')]
[string]$OutputFormat = 'Json'
```

Przykładowy wynik:

```powershell
$result = [pscustomobject]@{
    Success   = $true
    Changed   = $true
    Skipped   = $false
    SkipReason = $null
    Operation = 'Restart-Service'
    Target    = $ServiceName
    Status    = 'Running'
    Message   = 'Service restarted and verified successfully.'
    ExitCode  = 0
}
```

Dla `Json`:

```powershell
$result | ConvertTo-Json -Depth 6 -Compress
```

Dla `Object`:

```powershell
$result
```

Nie mieszaj na standard output:

- luźnych komunikatów tekstowych,
- obiektu PowerShell,
- kilku niezależnych dokumentów JSON.

Informacje diagnostyczne zapisuj przez `Write-Verbose` albo `Write-Information`. Błędy zapisuj przez `Write-Error`.

---

# Kody wyjścia

Stosuj, o ile skrypt nie wymaga innego, udokumentowanego kontraktu:

- `0` — operacja zakończona poprawnie, również gdy stan docelowy był już osiągnięty i zmiana nie była potrzebna,
- `1` — nieobsłużony błąd,
- `2` — błędne parametry lub walidacja wejścia,
- `3` — wskazany obiekt, plik, usługa albo zasób nie istnieje,
- `4` — wykonanie operacji nie powiodło się,
- `5` — operacja została wykonana, ale końcowa weryfikacja nie potwierdziła rezultatu,
- `10` — operacja została świadomie niewykonana przez `-WhatIf`, dry-run albo inny jawny tryb symulacji.

Kod wyjścia i pole `ExitCode` w wyniku muszą być zgodne.

Wynik powinien dodatkowo rozróżniać:

- `Changed` — czy stan został rzeczywiście zmieniony,
- `Skipped` — czy wykonanie zostało świadomie pominięte,
- `SkipReason` — dlaczego operacja nie została wykonana.

Idempotentny brak zmiany przy już osiągniętym stanie docelowym jest sukcesem z kodem `0`, `Success = $true`, `Changed = $false` i `Skipped = $false`. `-WhatIf` lub dry-run nie oznacza wykonania operacji i zwraca kod `10`, `Success = $false`, `Changed = $false` i `Skipped = $true`.

---

# Parametryzacja i bezpieczeństwo

Wszystkie wartości zależne od środowiska mają być parametrami lub ustawieniami projektu.

Nie hardcoduj:

- nazw usług,
- ścieżek,
- numerów wersji,
- nazw branchy,
- adresów serwerów,
- tokenów,
- haseł,
- sekretów,
- identyfikatorów tenantów,
- nazw użytkowników.

Nie przekazuj sekretów przez argumenty polecenia, jeżeli mogą zostać zapisane w historii procesu. Preferuj bezpieczne źródła credentiali dostępne w danym środowisku.

Nie wykonuj podczas testów:

- restartu prawdziwej usługi,
- `git push`,
- usuwania danych,
- zmiany produkcyjnej konfiguracji,

bez jawnego polecenia użytkownika.

---

# Weryfikacja nowej automatyzacji

Po utworzeniu lub zmianie Skill/skryptu:

1. Sprawdź składnię skryptu parserem PowerShell.
2. Uruchom bezpieczny test lub `-WhatIf`, jeżeli jest dostępny.
3. Sprawdź obsługę najważniejszych błędów wejścia.
4. Sprawdź, czy Skill wskazuje istniejący skrypt.
5. Sprawdź, czy przykładowe polecenia używają poprawnych parametrów.
6. Sprawdź, czy wynik ma jeden przewidywalny format.
7. Sprawdź zgodność kodu procesu z polem `ExitCode`.
8. Nie uruchamiaj operacji produkcyjnych bez jawnego polecenia.

Na końcu podaj:

- utworzone lub zmienione pliki,
- nazwę Skill,
- ścieżkę skryptu,
- wynik testu składni,
- wykonane bezpieczne testy,
- przykładowe polecenie użycia.
