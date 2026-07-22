---
name: test-mycompany
description: Uruchamia potwierdzony zestaw `npm test` dla repozytorium MyCompany i zwraca wynik maszynowy. Użyj po zmianach JavaScript, konfiguracji, testów lub przed lokalnym wdrożeniem; nie używaj do restartu usługi, publikacji Git ani testów UI w przeglądarce.
---

# Test MyCompany

## Zakres

Używaj do deterministycznej walidacji repozytorium przez istniejącą komendę
`npm test`. Nie zastępuje smoke testu Classic, Modern ani SirK Portal.

## Uruchomienie

```powershell
& '.\.agents\skills\test-mycompany\scripts\Invoke-MyCompanyValidation.ps1' `
  -ProjectPath 'C:\Users\Kris\Documents\MeshCentral-MyCompany'
```

Parametry:

- `ProjectPath` — root repozytorium zawierający `package.json`;
- `OutputFormat` — `Json` albo `Object`, domyślnie `Json`.

## Wynik i kody

Skrypt zwraca jeden obiekt z `Success`, `ProcessExitCode`, `Output` i `ExitCode`.

- `0` — wszystkie testy przeszły;
- `1` — nieobsłużony błąd;
- `3` — brak repozytorium, `package.json` albo `npm.cmd`;
- `4` — `npm test` zakończył się błędem.

## Bezpieczeństwo

Skrypt nie zapisuje plików, nie instaluje zależności i nie uruchamia deploymentu.
Interpretuj zarówno kod procesu, jak i pole `ExitCode`.

## Przykład obiektowy

```powershell
& '.\.agents\skills\test-mycompany\scripts\Invoke-MyCompanyValidation.ps1' `
  -ProjectPath (Get-Location).Path -OutputFormat Object
```
