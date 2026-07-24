# Kanały aktualizacji i lifecycle SIRK Portal

## Zasada pracy

Od wersji `1.7.0-dev.1` domyślną gałęzią roboczą projektu jest `develop`.

| Tryb w Portalu | Gałąź Git | Zastosowanie |
|---|---|---|
| Normalny / Stable | `main` | wydania produkcyjne |
| Beta | `beta` | testy przed promocją do Stable |
| Developerski / Dev | `develop` | bieżący rozwój i pierwsze testy |

Każda nowa funkcja i poprawka rozpoczyna się od `develop`. Promocja odbywa się w kolejności:

```text
develop -> beta -> main
```

## Instalacja i późniejsze aktualizacje

Pierwsza instalacja może być wykonana przez mechanizm pluginów MeshCentral. Po instalacji lifecycle SIRK Portal nie jest już zarządzany przez manager pluginów MeshCentral.

Dalsze operacje wykonuje widok **Aktualizacje** w nowym Portalu:

- sprawdzenie wersji na wybranym kanale;
- wybór Stable, Beta lub Dev;
- ręczny backup;
- automatyczny backup przed aktualizacją;
- staging pobranej wersji;
- health-check stagingu;
- aktualizacja wykonywana przez osobny helper po zatrzymaniu procesu;
- restore wybranego backupu;
- safety backup przed restore;
- historia aktualizacji i przywróceń.

## Separacja procesu aktualizacji

Proces działającego Portalu ani MeshCentral nie podmienia własnych plików bezpośrednio.

Przebieg aktualizacji:

```text
Portal
  -> pobranie paczki z wybranej gałęzi
  -> backup bieżącej wersji
  -> rozpakowanie do stagingu
  -> health-check
  -> zapis operacji pending
  -> uruchomienie odłączonego update-helper
  -> restart hosta
  -> atomiczna podmiana katalogu aplikacji
  -> zapis historii
```

Dane, staging oraz backupy muszą znajdować się poza katalogiem kodu aplikacji.

## Lokalizacje danych

Dla procesu standalone domyślne dane znajdują się w katalogu `sirk-platform-data` obok katalogu aplikacji. Lokalizację można jawnie ustawić zmienną:

```text
SIRK_DATA_ROOT
```

W adapterze MeshCentral używany jest katalog:

```text
meshcentral-data/sirk-platform-data
```

## Odpowiedzialność MeshCentral

MeshCentral pozostaje:

- hostem pierwszej instalacji pluginu;
- opcjonalnym adapterem urządzeń i sesji;
- procesem, który można zrestartować po przygotowaniu aktualizacji.

MeshCentral nie jest właścicielem kanału aktualizacji, backupów, restore ani rollbacku SIRK Portal.
