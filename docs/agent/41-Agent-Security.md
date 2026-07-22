# Security analysis and hardening

## Zakres

Stosuj dla audytu bezpieczeństwa, threat modelingu, podatności, hardeningu, uwierzytelniania, autoryzacji, kryptografii i incydentów. Podstawowe zasady bezpiecznej pracy nadal wynikają z modułu `03-Agent-Jakosc-Bezpieczenstwo.md`.

## Granice

- Działaj wyłącznie na systemach, kontach i danych objętych poleceniem użytkownika.
- Nie rozszerzaj testów na inne hosty, tenanty, użytkowników ani usługi.
- Nie wykonuj destrukcyjnego exploitation, utrzymywania dostępu, eksfiltracji ani testów powodujących niedostępność.
- Do proof of concept używaj najmniejszego bezpiecznego dowodu.
- Poświadczenia testowe są dozwolone tylko według modułu `07-Agent-Konfiguracja-Sekrety.md`.

## Threat model

Przed oceną wysokiego ryzyka ustal:

- chronione zasoby,
- aktorów i poziomy zaufania,
- punkty wejścia,
- granice zaufania,
- mechanizmy authentication i authorization,
- dane wrażliwe,
- zależności zewnętrzne,
- możliwy wpływ naruszenia.

Nie twórz rozbudowanego threat modelu dla małej poprawki, jeżeli wystarczy analiza zmienionej granicy.

## Kontrola aplikacji

Sprawdzaj odpowiednio do zakresu:

- walidację i canonicalization wejścia,
- authentication, session management i logout,
- authorization na poziomie serwera i obiektu,
- ochronę przed injection i wykonywaniem poleceń,
- bezpieczne renderowanie danych,
- CSRF, CORS i origin checks,
- obsługę plików i ścieżek,
- rate limits i ochronę przed nadużyciem,
- logowanie zdarzeń bez danych wrażliwych,
- konfigurację oraz domyślne uprawnienia.

Ukrycie elementu UI nie jest kontrolą autoryzacji.

## Kryptografia

Nie projektuj własnych algorytmów ani protokołów kryptograficznych. Używaj potwierdzonych bibliotek i mechanizmów platformy. Nie osłabiaj walidacji certyfikatów ani TLS w celu przejścia testu.

## Ocena znaleziska

Każde zgłoszenie powinno zawierać:

- konkretny komponent i lokalizację,
- warunek wykorzystania,
- wpływ,
- dowód możliwy do bezpiecznego odtworzenia,
- ocenę pewności,
- proponowaną minimalną poprawkę,
- sposób weryfikacji.

Nie zgłaszaj teoretycznej możliwości jako potwierdzonej podatności bez osiągalnej ścieżki.

## Priorytet

- Critical: bezpośrednie przejęcie systemu, szeroka utrata danych lub równoważny wpływ przy realistycznym scenariuszu.
- High: istotne naruszenie poufności, integralności lub uprawnień.
- Medium: ograniczony wpływ albo wymagające warunki wykorzystania.
- Low: hardening, ograniczone ujawnienie lub małe ryzyko.

Priorytet uzasadnij wpływem i prawdopodobieństwem, nie samą kategorią błędu.

## Naprawa

- Usuń przyczynę, a nie tylko widoczny symptom.
- Zachowaj kompatybilność, jeśli nie utrwala podatności.
- Nie wyłączaj kontroli bezpieczeństwa.
- Dodaj test regresyjny dla podatnej ścieżki i przypadku odmowy.
- Po zmianie powtórz bezpieczny dowód i sprawdź brak regresji.

## Incydent i ujawniony sekret

Nie kopiuj wrażliwych danych do raportu. Zabezpiecz dowody w minimalnym zakresie. Jeżeli sekret trafił do Git lub logów, zgłoś rotację; usunięcie wartości z bieżącego pliku nie unieważnia ujawnionego credentialu.

## Raport końcowy

Najpierw podaj potwierdzone problemy według priorytetu, potem niepewności i ograniczenia testu. Jeżeli nie znaleziono problemu, nie twierdź, że system jest całkowicie bezpieczny; podaj sprawdzony zakres.
