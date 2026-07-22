# Infrastructure and deployment

## Zakres

Stosuj dla Infrastructure as Code, CI/CD, kontenerów, chmury, sieci, wdrożeń i konfiguracji środowisk.

## Zasada nadrzędna

Najpierw ustal środowisko i blast radius. Nie wykonuj operacji typu apply, deploy, restart wielu usług albo zmiana infrastruktury bez jawnego polecenia.

## Rozpoznanie

Przed zmianą ustal:

- środowisko: local, test, staging czy production,
- konto, subscription, tenant, projekt lub cluster,
- używane narzędzie i wersję,
- źródło stanu oraz sposób blokowania,
- zależności i potencjalny zakres wpływu,
- mechanizm rollback.

Nie wnioskuj środowiska wyłącznie z nazwy katalogu albo hosta.

## Infrastructure as Code

- Zmieniaj deklaratywne źródło, nie tylko ręcznie istniejący zasób.
- Nie edytuj pliku stanu ręcznie.
- Najpierw wykonaj format, validate i plan lub ich odpowiednik.
- Przejrzyj plan pod kątem replace, destroy, zmian uprawnień i zmian sieci.
- Apply wymaga jawnego polecenia i zgodności planu z oczekiwanym zakresem.
- Po apply zweryfikuj stan rzeczywisty i zapisz istotne odchylenia.

## CI/CD

- Nie omijaj wymaganych checków.
- Nie zapisuj sekretów w definicji pipeline ani logu.
- Minimalizuj uprawnienia tokenów i runnerów.
- Zmianę pipeline testuj na bezpiecznej gałęzi lub środowisku, jeśli jest dostępne.
- Nie uruchamiaj publikacji lub deployu tylko po to, aby sprawdzić składnię.

## Kontenery

- Używaj jawnych tagów wersji; nie zmieniaj bez potrzeby na `latest`.
- Nie umieszczaj sekretów w obrazie ani warstwie build.
- Ograniczaj uprawnienia, capabilities i dostęp do hosta.
- Nie usuwaj wolumenów ani danych razem z kontenerem bez jawnego polecenia.

## Sieć i dostęp

Zmiany firewall, routingu, DNS, ingress, certyfikatów i publicznej ekspozycji traktuj jako wysokiego ryzyka. Sprawdź źródła, cele, porty, protokoły i wpływ na istniejące połączenia.

## Sekrety

Stosuj natywny secret store środowiska. Wyjątek dla jawnych lokalnych poświadczeń testowych nie upoważnia do zapisywania kluczy chmurowych, kubeconfigów, certyfikatów prywatnych ani tokenów deploymentowych w repozytorium.

## Drift i rollback

Nie naprawiaj driftu automatycznie bez zrozumienia jego źródła. Przed zmianą wysokiego ryzyka określ sposób wycofania i warunek przerwania.

## Raport

Podaj środowisko, zmienione zasoby, wynik planu i apply, wykonane kontrole, wpływ oraz możliwość rollback. Jeżeli wykonano tylko plan, nie przedstawiaj zasobów jako zmienionych.
