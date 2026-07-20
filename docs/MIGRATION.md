# Plan migracji

## Etap 0 — źródła referencyjne

Pełny kod istniejących wtyczek jest przypięty w `legacy/` jako submodules do konkretnych commitów.

## Etap 1 — wspólny core i My Scripts

- przenieść bootstrap, navigation, shared CSS i Settings z MyScripts;
- zachować istniejące ścieżki skryptów, favorites i wyniki;
- dodać migrator settings bez usuwania starych plików.

## Etap 2 — Commands

- przenieść execution pipeline, multi-host runs i Results;
- zunifikować katalog skryptów, variables, credentials i UI;
- zachować format istniejących definicji Commands.

## Etap 3 — Approval Center

- przenieść storage, API, approval levels i audit;
- naprawić constraint `activeKey` i idempotency;
- wymagać jawnego `allowNoApproval` przed auto-approval;
- brak grupy ma blokować submit z jednoznacznym błędem.

## Etap 4 — Move Requests

- przenieść device-group assignments i workflow;
- używać wspólnego Approval Service;
- zachować mapowanie grup urządzeń i poziomów approval.

## Etap 5 — cutover

- test migracji na kopii `meshcentral-data`;
- release candidate i rollback package;
- dopiero po akceptacji wyłączyć stare pluginy.
