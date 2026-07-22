# MyCompany + SirK Portal

## Kierunek integracji

MyCompany jest właścicielem backendu, modułów, storage, permissions i konfiguracji.
SirK Portal jest opcjonalnym, całkowicie niezależnym dokumentem frontendowym udostępnianym przez MyCompany pod `/sirkportal/`.

Portal nie podmienia ekranu logowania, nie wstrzykuje layoutu ani CSS do stron Classic/Modern i nie dodaje globalnych `domain.customFiles`. Jedynym opcjonalnym elementem w natywnym UI jest prosty launcher, domyślnie wyłączony.

Nie należy uruchamiać równolegle osobnej wtyczki `SirKPortal`, ponieważ rejestruje ona własny globalny shell oraz `domain.customFiles`.

## Moduły

```text
MyCompany
├── Approval Center
├── Move Requests
├── My Commands
├── My Scripts
├── My Jira
├── Defender Tools
├── integrations / encrypted secrets
└── Portal (optional frontend)
```

Portal nie posiada osobnego storage ani kopii logiki modułów.

## Nawigacja Portalu

| Portal | Źródło |
|---|---|
| Przegląd | Portal shell + dane widoczne w aktywnej sesji MeshCentral |
| Urządzenia | widoczne urządzenia i grupy MeshCentral |
| Zarządzanie | montowany moduł MyScripts |
| Akceptacje | montowany Approval Center |
| Ustawienia | panel administracyjny MyCompany, tylko Site Admin |
| Mesh | natywny interfejs MeshCentral |

W szczegółach urządzenia zakładka `Polecenia / Commands` znajduje się pomiędzy
`Terminal` i `Pliki / Files`. Montuje moduł My Commands ze wskazanym `nodeId`.
Podczas aktywnego połączenia z pulpitem przy prawej krawędzi pojawia się mały
uchwyt szybkich poleceń. Otwiera on skondensowany katalog poleceń i skryptów,
który pozwala je uruchamiać z parametrami, potwierdzeniem i approval workflow,
ale nie pobiera ani nie pokazuje widoków Results oraz Output.

## Uprawnienia folderów

`Settings → Uprawnienia folderów` konfiguruje foldery główne My Scripts oraz
kategorie My Commands. Reguła folderu zawiera przełącznik `enabled` i listę
`groupIds` wskazującą grupy użytkowników MeshCentral. Pusta lista grup oznacza
dostęp dla wszystkich użytkowników, którzy mają dostęp do modułu. Site Admin
omija ograniczenie grup, ale folder z `enabled: false` pozostaje ukryty także
dla Site Admina. Backend ponownie sprawdza regułę przy bezpośrednim odczycie,
edycji, uruchomieniu, wyświetlaniu wyników oraz wykonaniu po approval workflow.

### Język menu Zarządzania

- język jest wspólny z przełącznikiem PL/EN SirK Portal;
- skrypty używają nagłówków `#PL Nazwa | opis` i `#EN Name | description`;
- zmienne i sekrety używają par dyrektyw zakończonych `PL` i `EN`;
- foldery używają opcjonalnego pliku `<NazwaFolderu>.menu` o tym samym formacie;
- opis skryptu lub folderu jest dostępny jako podpowiedź po najechaniu;
- brak tłumaczenia korzysta z metadanych drugiego języka albo starszego nagłówka.

## Lifecycle

- `modules.portal.enabled = false` jest ustawieniem domyślnym.
- Wyłączony Portal nie udostępnia niezależnego interfejsu użytkownikom.
- Włączenie lub wyłączenie wymaga przeładowania głównej karty MeshCentral.
- Zmiana nie usuwa danych ani konfiguracji MyCompany.
- Portal jest ładowany po MyScripts i Approval Center, dzięki czemu montuje gotowe moduły przez `module.mount()`.

## Permissions

Portal nie tworzy nowego modelu uprawnień.
Każdy widok korzysta z access state odpowiedniego modułu MyCompany.
Ustawienia są dostępne tylko dla Site Admin.

## Migracja ze standalone SirKPortal

1. Wyłącz lub odinstaluj standalone `SirKPortal`.
2. Zrestartuj MeshCentral i sprawdź, czy nie są już ładowane jego globalne assets/customFiles.
3. Zaktualizuj MyCompany do wersji `1.5.24` lub nowszej.
4. Otwórz `MyCompany → Settings → SirK Portal`.
5. Zaznacz `Enable SirK Portal` i zapisz.
6. Po automatycznym przeładowaniu sprawdź Zarządzanie, Akceptacje, Ustawienia i powrót do Mesh.

Backendowe dane MyScripts, Approval Center, provider settings i integracje pozostają w MyCompany i nie wymagają migracji.

## Wymuszanie interfejsu

- `Wymuszaj nowy ekran logowania` przekierowuje wejście na ekran logowania do
  `/sirkportal/login`. Strona osadza natywny formularz MeshCentral i nakłada
  wygląd SirK Portal bez przechwytywania credentials.
- `Wymuszaj nowy interfejs` przekierowuje wejścia do natywnego interfejsu na
  `/sirkportal/`.
- Oba ustawienia są domyślnie wyłączone. Ich włączenie automatycznie włącza
  moduł Portalu.
- Techniczny parametr `sirkAuth=1` służy wyłącznie do osadzenia natywnego
  uwierzytelniania i zapobiega pętli przekierowań.
