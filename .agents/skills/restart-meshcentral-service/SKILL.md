---
name: restart-meshcentral-service
description: Restartuje wskazaną usługę Windows MeshCentral i czeka na potwierdzony stan Running. Użyj wyłącznie po jawnej zgodzie na restart backendu; nie używaj do zwykłych zmian frontendowych, gdy wystarczy reload przeglądarki lub pluginu, ani do zatrzymywania procesu siłowo.
---

# Restart MeshCentral Service

## Zakres

Używaj tylko wtedy, gdy zmiana backendu rzeczywiście wymaga restartu i użytkownik
go zatwierdził. Najpierw wykonaj `-WhatIf`.

## Uruchomienie

```powershell
& '.\.agents\skills\restart-meshcentral-service\scripts\Restart-VerifiedService.ps1' `
  -ServiceName 'MeshCentral' -TimeoutSeconds 120 -WhatIf
```

Po jawnej zgodzie:

```powershell
& '.\.agents\skills\restart-meshcentral-service\scripts\Restart-VerifiedService.ps1' `
  -ServiceName 'MeshCentral' -TimeoutSeconds 120 -StartupDelaySeconds 3
```

Parametry:

- `ServiceName` — rzeczywista nazwa usługi, nie nazwa procesu;
- `TimeoutSeconds` — czas oczekiwania od `5` do `600`;
- `StartupDelaySeconds` — opcjonalne opóźnienie od `0` do `120`;
- `OutputFormat` — `Json` albo `Object`.

## Wynik i kody

Wynik zawiera stan przed i po operacji, czas oraz `ExitCode`.

- `0` — usługa osiągnęła `Running`;
- `1` — nieobsłużony błąd;
- `3` — usługa nie istnieje;
- `4` — restart nie został wykonany;
- `5` — restart wykonano, ale nie potwierdzono `Running`;
- `10` — `-WhatIf` albo odrzucona operacja.

## Bezpieczeństwo

Skrypt wymaga odpowiednich uprawnień Windows. Nie zmienia typu uruchomienia,
nie zabija procesu i nie wyłącza zabezpieczeń systemowych.
