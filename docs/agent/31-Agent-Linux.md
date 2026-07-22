# Linux operations

## Zakres

Stosuj tylko dla środowisk Linux, kontenerów Linux i zdalnych hostów Linux objętych poleceniem.

## Uprawnienia

- Nie używaj `sudo`, jeżeli operacja go nie wymaga.
- Podnoś uprawnienia tylko dla konkretnego polecenia.
- Nie zmieniaj właściciela ani uprawnień szerokiego drzewa bez potwierdzenia dokładnego celu.
- Nie wyłączaj SELinux, AppArmor, firewalla ani polityk bezpieczeństwa jako skrótu diagnostycznego.

## Usługi i procesy

- Ustal używany init system przed użyciem `systemctl`.
- Rozróżniaj nazwę usługi, unit, proces i kontener.
- Po restarcie sprawdź status, ostatnie logi oraz endpoint albo port.
- Nie używaj `kill -9`, jeżeli proces można zakończyć kontrolowanie.

## Pliki

- Używaj rozpoznanych ścieżek absolutnych dla destrukcyjnych operacji.
- Nie wykonuj rekurencyjnego `rm`, `chown` ani `chmod` na podstawie nierozwiązanej zmiennej lub globu.
- Zachowuj prawa dostępu i ownera przy kontrolowanych kopiach konfiguracji.
- Plik konfiguracyjny zmieniaj atomowo, jeżeli częściowy zapis mógłby uszkodzić usługę.

## Pakiety

Najpierw wykryj dystrybucję i package manager. Nie mieszaj `apt`, `dnf`, `yum`, `apk` i innych mechanizmów. Instalacja albo aktualizacja pakietów wymaga związku z zadaniem oraz weryfikacji wersji.

## Logi

Zawężaj `journalctl` po unit, czasie i poziomie. Nie odczytuj całego journala. Maskuj sekrety i dane sesji.

## Zdalne hosty

Potwierdź host, użytkownika i środowisko przed zmianą. Nie zakładaj, że host o podobnej nazwie jest testowy. Operacje na wielu hostach wymagają jawnego zakresu.

## Weryfikacja

Po zmianie sprawdź kod wyjścia oraz rzeczywisty stan usługi, procesu, pliku, uprawnienia, portu lub endpointu.
