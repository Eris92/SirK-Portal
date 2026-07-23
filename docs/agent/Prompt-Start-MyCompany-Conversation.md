# Prompt startowy nowej rozmowy — MyCompany

Skopiuj zawartość sekcji `Prompt do wklejenia` jako pierwszą wiadomość w nowej rozmowie prowadzonej w repozytorium `MeshCentral-MyCompany`.

## Prompt do wklejenia

```text
Pracujemy wyłącznie nad pluginem MeshCentral MyCompany.

Repozytorium źródłowe:
C:\Users\Kris\Documents\MeshCentral-MyCompany

Lokalna instalacja testowa, którą masz aktualizować po każdej zakończonej i zweryfikowanej zmianie runtime:
C:\Program Files\Open Source\MeshCentral\meshcentral-data\plugins\MyCompany

Dokumentacja środowiska MeshCentral:
C:\Users\Kris\Documents\MeshCentral 2

Zanim zaczniesz implementację:

1. Ustal root repozytorium i przeczytaj w całości `AGENTS.md` z repozytorium MyCompany.
2. Zgodnie z routerem przeczytaj obowiązkowe instrukcje:
   - `docs/agent/00-Agent-Core.md`
   - `docs/agent/01-Agent-Tryby.md`
   - `docs/agent/03-Agent-Jakosc-Bezpieczenstwo.md`
   - `docs/agent/11-Agent-MyCompany.md`
3. Dobierz wyłącznie dodatkowe moduły instrukcji potrzebne dla mojego zadania. Dla zmian pluginu JavaScript zwykle będą to co najmniej:
   - `docs/agent/04-Agent-Testy-Weryfikacja.md`
   - `docs/agent/10-Agent-MeshCentral-Plugin.md`
   - `docs/agent/21-Agent-JavaScript.md`
   - `docs/agent/30-Agent-Windows.md`
4. Sprawdź dostępne Skills w `.agents/skills` i używaj ich zgodnie z `SKILL.md`. W szczególności:
   - `test-mycompany` do walidacji,
   - `check-mycompany-version` do kontroli wersji,
   - `deploy-mycompany-local` do wdrożenia lokalnego,
   - `read-meshcentral-log` do diagnostyki,
   - `restart-meshcentral-service` tylko wtedy, gdy restart jest rzeczywiście potrzebny i mieści się w moim poleceniu.
5. Sprawdź `git status`, ale nie cofaj, nie usuwaj ani nie nadpisuj istniejących zmian. Brudny working tree jest dozwolony.
6. Nie wykonuj `git pull`, merge, rebase, commit, push ani release bez mojego jawnego polecenia. „Pliki są na Git” nie oznacza automatycznej zgody na publikację.
7. Przed zmianą UI ustal faktyczny łańcuch ładowania: HTML/bootstrap → asset → renderer → CSS → endpoint. Nie zmieniaj pliku tylko dlatego, że ma podobną nazwę.
8. Odczytaj bieżącą zawartość zmienianego pliku i po zmianie sprawdź diff. Nie deklaruj naprawy, dopóki nie potwierdzisz, że zmieniony asset jest faktycznie ładowany.

Stałe zasady zakresu:

- Jeżeli nie napiszę wyraźnie „sprawdź stare wtyczki”, pracuj tylko w `MeshCentral-MyCompany`. Nie przeszukuj repozytoriów legacy.
- Nie modyfikuj natywnych plików MeshCentral, `node_modules`, `public` hosta, `views` hosta ani głównego `config.json` bez mojej jawnej zgody. Zmiany mają pozostać plugin-local.
- SirK Portal ma całkowicie niezależny frontend i nie może zanieczyszczać CSS, DOM ani zachowania oryginalnego interfejsu MeshCentral.
- Zachowuj istniejące funkcje, autoryzację i dane. Ukrycie elementu UI nie zastępuje kontroli backendowej.
- Dla zmian interfejsu stosuj jeden wspólny system wizualny oparty na zakładce Zarządzanie, poza widokiem Urządzenia, który może mieć własny układ.
- Nie ukrywaj całego Portalu ani całego dokumentu przy `F5`. Wyłączone elementy menu nie mogą pojawić się przed zastosowaniem uprawnień.
- Nie używaj długiego timeoutu jako normalnego mechanizmu gotowości. Gotowość ma wynikać z konkretnych warunków runtime.
- Iframe aktywnej sesji hosta ma pozostać stale podłączony do DOM. Nie przenoś go, nie usuwaj, nie czyść jego rodzica i nie zmieniaj `src` przy przełączaniu widoków.
- Przełączenie `Devices → inny widok → Devices` nie może zerwać Desktop, Terminal ani Files.
- Aktywny host, jego podzakładka, PL/EN i motyw jasny/ciemny muszą być odtwarzane bez przeładowania child workspace.
- Testy regresji muszą sprawdzać aktualne funkcje i klasy runtime, nie pozostałości po starszej implementacji.
- Po zmianie runtime uruchom test celowany oraz pełne `npm test`, sprawdź spójność wersji i zaktualizuj changelog, historię wersji oraz właściwą dokumentację stanu.
- Następnie użyj Skill `deploy-mycompany-local`, aby wykonać backup, wdrożyć i zweryfikować lokalną instalację MyCompany. Nie restartuj usługi automatycznie, jeśli zmiana tego nie wymaga.
- Zmiana wyłącznie dokumentacji nie wymaga deploymentu ani podnoszenia wersji pluginu.
- W raporcie końcowym podaj: co zmieniono, wynik testów, wersję, ścieżkę backupu, liczbę zweryfikowanych plików, czy restart jest wymagany oraz co mam sprawdzić przez `Ctrl+F5`.

Obowiązkowa kontrola UI po zmianach Portalu:

1. `F5` na `All`.
2. `F5` na aktywnym hoście i aktywnej podzakładce.
3. `Devices → inny widok → Devices` bez utraty sesji.
4. Zmiana PL/EN bez opuszczania widoku.
5. Zmiana jasny/ciemny bez opuszczania widoku.
6. Widoczność tylko dozwolonych pozycji menu od pierwszej widocznej klatki.
7. Brak sekwencji `Overview → host`, białego ekranu i znikania całej strony.

Na początku odpowiedz krótko:

- jaki root repozytorium potwierdziłeś,
- jakie instrukcje i Skills przeczytałeś,
- jaki jest bieżący stan Git i wersja MyCompany,
- jaki zakres mojego zadania przyjmujesz.

Potem od razu diagnozuj i wykonaj zadanie. Nie zatrzymuj się na ogólnym planie, jeżeli bezpiecznie możesz działać.

Moje pierwsze zadanie:
[TU WPISZ KONKRETNE ZADANIE I DOŁĄCZ ZRZUTY EKRANU]
```

## Ważne

Prompt nie daje automatycznej zgody na commit, push, restart usługi ani modyfikowanie natywnego MeshCentral. Takie działania nadal wymagają zakresu wynikającego z konkretnego zadania użytkownika.
