# PowerShell engineering rules

## Zakres

Stosuj przy tworzeniu, zmianie, uruchamianiu i review skryptów PowerShell.

## Kompatybilność

- Domyślnym runtime jest PowerShell 7.
- Zgodność z Windows PowerShell 5.1 zachowuj tylko wtedy, gdy wymaga jej projekt lub środowisko.
- Nie używaj składni niedostępnej w deklarowanej minimalnej wersji.
- Jeżeli skrypt zależy od konkretnego modułu, sprawdź jego obecność i wersję.

## Struktura skryptu

Nowy skrypt powinien:

- używać `[CmdletBinding()]`,
- posiadać jawny blok `param()`,
- używać typów, `ValidateSet`, `ValidateRange` lub własnej walidacji tam, gdzie poprawia to bezpieczeństwo,
- zawierać krótki comment-based help oraz przykład,
- używać `$ErrorActionPreference = 'Stop'`, gdy błędy mają przerywać operację,
- obsługiwać błędy bez pustych `catch`,
- zwracać przewidywalny wynik i jednoznaczny kod procesu.

## Ścieżki i procesy

- Używaj `-LiteralPath`, gdy wildcard nie jest celowy.
- Poprawnie obsługuj spacje i znaki specjalne.
- Nie buduj polecenia jako niekontrolowanego tekstu.
- Do natywnych procesów przekazuj argumenty w sposób ograniczający błędy cytowania.
- Po każdym istotnym programie natywnym sprawdź `$LASTEXITCODE`.

## Output

- Wynik danych kieruj do pipeline.
- Diagnostykę zapisuj przez `Write-Verbose` lub `Write-Information`.
- Ostrzeżenia używają `Write-Warning`, a błędy `Write-Error` albo wyjątku.
- Nie używaj `Write-Host` jako jedynego kontraktu wyniku.
- Jeżeli skrypt ma output maszynowy, nie mieszaj go z luźnym tekstem.

## Zmiana stanu

Operacje zmieniające stan powinny obsługiwać `SupportsShouldProcess` i `-WhatIf`, jeśli jest to praktyczne. `-WhatIf` nie oznacza wykonania operacji i musi być rozróżniony od idempotentnego sukcesu.

## Bezpieczeństwo

- Nie hardcoduj sekretów.
- Nie zapisuj credentiali w historii poleceń.
- Preferuj `PSCredential`, bezpieczny magazyn albo lokalny mechanizm z modułu sekretów.
- Wyjątek dla jawnych kont testowych stosuj tylko według `07-Agent-Konfiguracja-Sekrety.md`.
- Nie zmieniaj ExecutionPolicy ani zabezpieczeń systemowych tylko po to, aby skrypt się uruchomił.

## Weryfikacja

1. Sprawdź składnię parserem PowerShell.
2. Uruchom bezpieczny przypadek lub `-WhatIf`.
3. Sprawdź co najmniej jeden istotny błąd wejścia.
4. Sprawdź kod wyjścia i format wyniku.
5. Dla zmiany stanu niezależnie potwierdź stan końcowy.
