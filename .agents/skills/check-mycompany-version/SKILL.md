---
name: check-mycompany-version
description: Sprawdza spójność wersji MyCompany w `package.json`, `config.json`, `version-history.json`, `plugin-main.js`, `README.md` i `changelog.md`. Użyj przed deploymentem, commit, push lub release; nie używaj do automatycznego podnoszenia wersji ani modyfikowania metadanych.
---

# Check MyCompany Version

## Zakres

Używaj do odczytowej kontroli kontraktu wersji. Skrypt nie poprawia rozbieżności.

## Uruchomienie

```powershell
& '.\.agents\skills\check-mycompany-version\scripts\Test-MyCompanyVersion.ps1' `
  -ProjectPath 'C:\Users\Kris\Documents\MeshCentral-MyCompany'
```

Parametry:

- `ProjectPath` — root repozytorium MyCompany;
- `OutputFormat` — `Json` albo `Object`, domyślnie `Json`.

## Wynik i kody

Wynik zawiera `ExpectedVersion`, mapę `Versions`, `Mismatches` i `ExitCode`.

- `0` — wszystkie źródła wersji są zgodne;
- `1` — błąd odczytu lub parsowania;
- `3` — brak repozytorium albo wymaganego pliku;
- `5` — wykryto rozbieżność wersji.

## Bezpieczeństwo

Operacja jest tylko do odczytu. Przy kodzie `5` przerwij deployment, commit, push
i release do czasu świadomej naprawy wszystkich wskazanych plików.

## Przykład obiektowy

```powershell
& '.\.agents\skills\check-mycompany-version\scripts\Test-MyCompanyVersion.ps1' `
  -ProjectPath (Get-Location).Path -OutputFormat Object
```
