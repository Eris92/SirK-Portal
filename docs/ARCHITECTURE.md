# Architektura MeshCentral-MyCompany

## Cel

Jedna wtyczka MeshCentral z niezależnymi modułami `scripts`, `commands`, `approvals` i `move`.

## Warstwy

- `core/` — lifecycle, config, storage, permissions, audit, API i wspólne error handling.
- `modules/` — wyłącznie logika domenowa modułów.
- `public/` — wspólny frontend i style.
- `settings/` — schema oraz wartości domyślne.
- `legacy/` — niezmienione repozytoria źródłowe jako Git submodules.

## Reguły zależności

- Moduły mogą zależeć od `core`, ale nie bezpośrednio od innych modułów.
- Approval workflow jest usługą core udostępnianą modułom Commands, Scripts i Move.
- Frontend korzysta z jednego namespace i jednego bootstrapu.
- Jedna konfiguracja przechowuje osobne sekcje ustawień modułów.

## Bezpieczeństwo approval

Brak przypisanej grupy jest błędem konfiguracji. Automatyczne wykonanie jest dozwolone wyłącznie, gdy administrator jawnie ustawi `allowNoApproval=true` dla właściwego zakresu.
