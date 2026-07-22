# Documentation and state records

## Cel

Dokumentacja ma opisywać potwierdzony stan projektu, sposób użycia i istotne decyzje. Nie może zastępować weryfikacji.

## Kiedy aktualizować

Aktualizuj dokumentację, gdy zmieniły się:

- zachowanie lub publiczny kontrakt,
- instalacja, konfiguracja albo wymagania,
- procedura build, test, release lub wdrożenia,
- architektura albo zależności między komponentami,
- stan migracji, kompatybilność lub znane ograniczenia.

Nie aktualizuj dokumentacji tylko dlatego, że odczytałeś istniejący kod bez nowego ustalenia.

## Potwierdzony stan

Dla informacji zależnych od środowiska zapisuj, jeśli ma to znaczenie:

- wartość lub mechanizm,
- źródło potwierdzenia,
- wersję produktu,
- datę ostatniej weryfikacji,
- status: `verified`, `unverified`, `obsolete` albo `unknown`.

Nie przedstawiaj przypuszczeń jako faktów. Informację niepotwierdzoną oznacz jednoznacznie.

## Dokumenty stanu

Dokument taki jak `MESH_ARCHITECTURE.md` opisuje mechanizmy środowiska, a `PLUGINS_STATUS.md` stan poszczególnych pluginów. Aktualizuj tylko właściwą sekcję i nie kopiuj dużych fragmentów kodu.

## Sekrety i dane wrażliwe

Nie zapisuj w dokumentacji:

- haseł, tokenów i kluczy,
- pełnych connection strings,
- cookies, danych sesji i credentiali,
- pełnych danych osobowych,
- niezanonimizowanych payloadów uwierzytelniających.

Poświadczenia testowe dozwolone przez moduł `07-Agent-Konfiguracja-Sekrety.md` również nie mogą trafiać do dokumentacji ani przykładów.

## Przykłady

Przykład musi być możliwy do wykonania, ale powinien używać placeholderów i bezpiecznych wartości. Nie kopiuj rzeczywistych sekretów nawet z serwera testowego.

## Komentarze w kodzie

Komentarz opisuje przyczynę, ograniczenie, kontrakt albo nietypowe zachowanie. Nie przepisuje oczywistego kodu i nie przechowuje tymczasowych notatek z debugowania.

## Kontrola jakości

Po zmianie dokumentacji sprawdź nazwy plików, ścieżki, komendy, linki, wersje i zgodność z aktualnym kodem lub konfiguracją.
