# Logs and diagnostics

## Cel

Diagnozuj na podstawie aktualnych dowodów, zaczynając od najmniejszego źródła, które może potwierdzić lub odrzucić hipotezę.

## Kolejność diagnostyki

1. Ustal objaw, czas wystąpienia i oczekiwany stan.
2. Sprawdź status procesu, usługi, endpointu lub zadania.
3. Odczytaj końcowy fragment właściwego logu.
4. Zawęź po czasie, poziomie, identyfikatorze korelacji lub komponencie.
5. Dopiero potem rozszerz zakres albo analizuj implementację.

## Odczyt logów

- Nie ładuj dużego logu w całości.
- Domyślnie pobierz ostatnie linie lub krótki przedział czasowy.
- Zachowaj informację o strefie czasowej i formacie timestampu.
- Nie modyfikuj ani nie obracaj logu podczas samej diagnostyki.
- Nie usuwaj logów bez jawnego polecenia i potwierdzenia dokładnej ścieżki.

## Dane wrażliwe

Przed pokazaniem logu sprawdź, czy nie zawiera tokenów, haseł, cookies, kluczy, pełnych connection strings albo danych osobowych. Maskuj wartości, zachowując tylko informacje potrzebne do korelacji.

Poświadczenia testowe również maskuj w raporcie, mimo że mogą być zapisane lokalnie zgodnie z modułem sekretów.

## Hipotezy

Oddzielaj:

- fakt potwierdzony logiem lub pomiarem,
- wniosek wynikający z kilku faktów,
- hipotezę wymagającą testu.

Nie ogłaszaj przyczyny na podstawie pojedynczego ogólnego komunikatu błędu.

## Minimalna reprodukcja

Jeżeli jest bezpieczna, wykonaj najmniejszą operację odtwarzającą problem. Nie generuj dużego obciążenia, nie zmieniaj produkcyjnych danych i nie powtarzaj operacji destrukcyjnej tylko w celu uzyskania logu.

## Po poprawce

Powtórz wcześniej nieudaną kontrolę, sprawdź brak nowego błędu oraz potwierdź oczekiwany stan. Sam brak komunikatu w logu nie dowodzi pełnego działania, jeżeli istnieje bezpośredni test funkcji.

## Raport

Podaj objaw, najważniejszy dowód, ustaloną lub najbardziej prawdopodobną przyczynę, wykonaną kontrolę oraz niepewności. Nie wklejaj dużych fragmentów logów.
