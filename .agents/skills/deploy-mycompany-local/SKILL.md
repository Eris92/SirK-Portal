---
name: deploy-mycompany-local
description: Testuje, wykonuje backup i atomowo synchronizuje lokalne źródło MyCompany do wskazanej instalacji MeshCentral bez restartu usługi i bez dotykania `mycompany-data`. Użyj po pomyślnych zmianach wymagających lokalnego reloadu; nie używaj do deploymentu Git, migracji danych, zmiany konfiguracji hosta ani automatycznego restartu.
---

# Deploy MyCompany Locally

## Zakres

Używaj do powtarzalnego wdrożenia bieżącego drzewa roboczego. Skrypt wyklucza
`.git`, `.codex-local` i `node_modules`, tworzy backup poprzedniego pluginu oraz
weryfikuje hash każdego wdrożonego pliku.

## Uruchomienie

Najpierw wykonaj symulację:

```powershell
& '.\.agents\skills\deploy-mycompany-local\scripts\Publish-MyCompanyLocal.ps1' `
  -SourcePath 'C:\Users\Kris\Documents\MeshCentral-MyCompany' `
  -MeshRoot 'C:\Program Files\Open Source\MeshCentral' -WhatIf
```

Następnie właściwe wdrożenie:

```powershell
& '.\.agents\skills\deploy-mycompany-local\scripts\Publish-MyCompanyLocal.ps1' `
  -SourcePath 'C:\Users\Kris\Documents\MeshCentral-MyCompany' `
  -MeshRoot 'C:\Program Files\Open Source\MeshCentral'
```

Parametry:

- `SourcePath` — root źródła MyCompany;
- `MeshRoot` — root konkretnej instalacji MeshCentral;
- `SkipTests` — pomija `npm test`; stosuj tylko po osobnej potwierdzonej walidacji;
- `OutputFormat` — `Json` albo `Object`.

## Wynik i kody

Wynik zawiera wersję, target, backup, liczbę zweryfikowanych plików oraz stan
rollbacku.

- `0` — wdrożenie i weryfikacja zakończone;
- `1` — nieobsłużony błąd;
- `2` — nieprawidłowy manifest albo zakres ścieżek;
- `3` — brak źródła, instalacji, wymaganych plików albo narzędzia;
- `4` — test, kopiowanie lub podmiana nie powiodły się;
- `5` — końcowa weryfikacja hash nie powiodła się;
- `10` — `-WhatIf`, bez zmiany stanu.

## Bezpieczeństwo

Skrypt nie restartuje MeshCentral i nigdy nie modyfikuje
`meshcentral-data\mycompany-data`. Nie uruchamiaj równolegle dwóch deploymentów.
Przy błędzie po podmianie skrypt odkłada wadliwy katalog i próbuje przywrócić backup.
