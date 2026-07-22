# MyCompany project rules

## Start nowego wątku

Źródłem kodu i instrukcji dla bieżącego pluginu jest wyłącznie:

```text
C:\Users\Kris\Documents\MeshCentral-MyCompany
```

Nowy wątek rozpoczynający pracę nad MyCompany ma:

1. pracować w tym repozytorium, a nie w katalogu instalacyjnym;
2. odczytać root `AGENTS.md` i moduły dobrane przez jego router;
3. dla operacji powtarzalnej najpierw sprawdzić `.agents/skills`;
4. traktować `C:\Users\Kris\Documents\MeshCentral 2` jako repozytorium
   dokumentacji architektury i stanu, a nie źródło pluginu;
5. traktować `C:\Program Files\Open Source\MeshCentral\meshcentral-data\plugins\MyCompany`
   jako lokalny artefakt wdrożeniowy, a nie katalog roboczy.

Aktualne Skills Automation-first:

| Skill | Zastosowanie |
|---|---|
| `test-mycompany` | uruchomienie pełnego `npm test` po zmianach |
| `check-mycompany-version` | kontrola spójności wersji przed deploymentem, commit, push lub release |
| `deploy-mycompany-local` | backup i lokalne wdrożenie bez restartu i bez zmiany `mycompany-data` |
| `read-meshcentral-log` | ograniczony odczyt lokalnych logów i diagnostyka |
| `restart-meshcentral-service` | restart tylko po jawnym poleceniu użytkownika |

Każdy Skill ma własny kontrakt i polecenie w
`.agents/skills/<nazwa>/SKILL.md`. Nie odtwarzaj ręcznie procedury, którą
realizuje istniejący Skill.

## Zasada nadrzędna

`MyCompany` jest jedynym instalowanym pluginem. `MyScripts`, `MyCommands`,
`MyJira`, `DefenderTools`, `ApprovalCenter` i `MoveRequests` są modułami
wewnętrznymi.

## Domyślny zakres kontekstu

Jeżeli użytkownik zadaje pytanie albo zleca zmianę bez jawnego wskazania starych
lub innych wtyczek, ogranicz cały odczyt, wyszukiwanie, diagnostykę, porównania i
zmiany do:

```text
C:\Users\Kris\Documents\MeshCentral-MyCompany
C:\Program Files\Open Source\MeshCentral\meshcentral-data\plugins\MyCompany
C:\Program Files\Open Source\MeshCentral\meshcentral-data\mycompany-data
```

Nie przeszukuj repozytoriów legacy, katalogów innych pluginów ani ich historii
Git. Nie sprawdzaj ich kodu, wersji, konfiguracji, logów ani statusu. Samo użycie
nazwy modułu, takiej jak MyScripts, MyCommands, MyJira, Approval Center, Move
Request lub Defender XDR, oznacza moduł wewnętrzny MyCompany, a nie zgodę na
otwarcie dawnego repozytorium.

Rozszerz zakres na stare lub inne wtyczki wyłącznie wtedy, gdy użytkownik
jednoznacznie poleci ich sprawdzenie, porównanie, migrację albo audyt. Po
zakończeniu takiego podzadania wróć do domyślnego zakresu MyCompany.

Nie pobieraj ani nie ładuj kodu innych pluginów, nie rejestruj modułów jako
osobnych pluginów i nie duplikuj wspólnych procedur.

Migracja legacy jest operacją jawną i administracyjną. Runtime nie może
przeszukiwać starych katalogów ani wykonywać lub `require()` ich kodu.

Jeżeli procedura występuje w co najmniej dwóch modułach albo może być
sparametryzowana, przenieś ją do `core/` albo `public/core.js`.

## Wspólne elementy

- ustawienia: `core/settings-store.js`;
- sekrety: `core/secret-store.js`;
- integracje i maskowanie credentials: `core/integration-service.js`;
- HTTP/HTTPS API client: `core/http-client.js`;
- approval workflow: `core/approval-service.js`;
- urządzenia: `core/device-service.js`;
- parser skryptów: `core/script-library.js`;
- browser runtime: `public/core.js`, `public/runtime.js`;
- CSS: `public/main.css`.

Nie twórz osobnych klientów Jira, Graph ani Zabbix, jeżeli funkcjonalność może
użyć wspólnego `core/http-client.js` i `core/integration-service.js`.

Ciężkie operacje muszą być lazy-loaded. Nie uruchamiaj raportu Defender, AQL ani
pobierania Jira podczas startu MeshCentral.

## Walidacja i lokalne wdrożenie

Po każdej zmianie kodu lub konfiguracji użyj Skill `test-mycompany`. Przed
deploymentem, commit, push lub release dodatkowo użyj
`check-mycompany-version`.

Po pomyślnych testach zmian runtime użyj `deploy-mycompany-local`, aby
zsynchronizować bieżące lokalne źródło do:

```text
C:\Program Files\Open Source\MeshCentral\meshcentral-data\plugins\MyCompany
```

Przed podmianą wykonaj kopię poprzedniego katalogu w
`meshcentral-data\plugin-backups`. Nie nadpisuj `meshcentral-data\mycompany-data`
i nie restartuj usługi MeshCentral automatycznie, chyba że użytkownik jawnie o to
poprosi. Wdrożenie ma pozostawić plugin gotowy do ręcznego reloadu i testu UI.

Zmiana wyłącznie instrukcji agenta lub dokumentacji repozytorium nie wymaga
wdrożenia do katalogu instalacyjnego, ponieważ nowe wątki czytają źródłowy
`AGENTS.md`, `docs/agent` i `.agents/skills`.
