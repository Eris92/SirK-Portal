---
name: read-meshcentral-log
description: Odczytuje ograniczony końcowy fragment wskazanego lokalnego logu MeshCentral lub MyCompany z opcjonalnym filtrem, trybem błędów i ograniczonym śledzeniem. Użyj do lokalnej diagnostyki logów; nie używaj do pełnego eksportu, modyfikacji logu ani odczytu plików zawierających sekrety.
---

# Read MeshCentral Log

## Zakres

Używaj do bezpiecznego odczytu końca konkretnego pliku. Zawsze podawaj dokładną
ścieżkę i ograniczoną liczbę linii.

## Uruchomienie

```powershell
& '.\.agents\skills\read-meshcentral-log\scripts\Get-LogTail.ps1' `
  -Path 'C:\Program Files\Open Source\MeshCentral\meshcentral-data\mesherrors.txt' `
  -Lines 200 -ErrorOnly
```

Parametry:

- `Path` — dokładna ścieżka pliku logu;
- `Lines` — od `1` do `5000`, domyślnie `200`;
- `Encoding` — kodowanie obsługiwane przez Windows PowerShell i PowerShell 7;
- `Match` — opcjonalny regex;
- `ErrorOnly` — filtruje typowe komunikaty błędów;
- `Follow` — śledzi log przez ograniczony czas;
- `FollowSeconds` — od `1` do `300`, domyślnie `10`;
- `OutputFormat` — `Json` albo `Object`.

## Wynik i kody

Wynik zawiera `ResolvedPath`, `LinesRead`, `LinesReturned`, `Content` i `ExitCode`.

- `0` — odczyt zakończony;
- `1` — błąd odczytu;
- `2` — nieprawidłowy regex;
- `3` — plik nie istnieje.

## Bezpieczeństwo

Nie kieruj skryptu do plików sekretów, kluczy ani credentials. Przed przekazaniem
wyniku użytkownikowi zamaskuj przypadkowo znalezione dane wrażliwe.
