# Tekst z ekranu

Aplikacja Electron dla Windows 10/11. Zaznacz fragment ekranu, a lokalny Tesseract OCR odczyta tekst po polsku i angielsku i skopiuje go do schowka. Obrazy nie są wysyłane do usług zewnętrznych ani zapisywane na dysku. Historia wyników jest przechowywana wyłącznie w pamięci do zamknięcia aplikacji.

## Uruchomienie

Gotowy plik: `dist/Tekst-z-ekranu-1.0.3.exe` (Windows x64, wersja przenośna).

1. Uruchom aplikację.
2. Naciśnij **Windows + Shift + Q**.
3. Przeciągnij myszą po tekście na wybranym monitorze.
4. Poczekaj na powiadomienie i wklej wynik przez **Ctrl + V**.

**Esc** lub prawy przycisk myszy anuluje zaznaczanie. Zaznaczenie musi mieścić się na jednym monitorze. Aplikacja obsługuje wiele monitorów i skalowanie DPI.

Zamknięcie okna pozostawia aplikację w zasobniku systemowym. Aby ją wyłączyć, kliknij prawym przyciskiem ikonę w zasobniku i wybierz **Zakończ**. Program nie uruchamia się automatycznie z systemem. Jeżeli skrót jest zajęty, aplikacja pokaże komunikat; można korzystać z przycisku w oknie lub menu zasobnika.

Silnik Tesseract (WebAssembly przez Tesseract.js) i modele językowe są dołączone do paczki. Nie trzeba instalować Tesseracta ani pobierać modeli podczas używania. Pierwszy odczyt trwa dłużej z powodu inicjalizacji silnika. Puste wyniki nie nadpisują schowka.

## Rozwój

Wymagany Node.js i npm. Instalacja zależności wymaga internetu.

```powershell
npm ci
npm start
npm test
npm run dist
```

`npm run dist` tworzy przenośny plik EXE w `dist/`. Paczka nie jest podpisana cyfrowo.

## Sprawdzenie

Testy automatyczne sprawdzają przeliczanie współrzędnych DPI, przycinanie przy krawędzi i błędne zaznaczenia. Dodatkowo sprawdzono lokalny OCR na obrazie z tekstem „Zażółć gęślą jaźń. Hello OCR 123.”.

Ręczny test pełnego przepływu: uruchom EXE, użyj skrótu nad inną aplikacją, zaznacz tekst, wklej wynik do Notatnika. Sprawdź Esc, drugi monitor i zamknięcie do zasobnika.

## Wersja 1.0.3

- Dodano nowy pulpit OCR inspirowany projektem Google Stitch.
- Dodano stany skanowania, sukcesu i błędu oraz czyszczenie wyniku.
- Dodano lokalną historię wyników, ustawienia OCR i działające widoki panelu bocznego.
- Dodano możliwość anulowania zaznaczania oraz czytelne potwierdzenia kopiowania.

## Poprawki 1.0.1

- Poprawiono błąd uniemożliwiający zaznaczanie, gdy Electron zwraca puste identyfikatory monitorów. W takiej sytuacji obrazy są pobierane lokalnie przez Windows PowerShell i System.Drawing, według fizycznych współrzędnych ekranów, bez zapisywania zrzutów na dysku.
- Nakładka obejmuje cały ekran, także pasek zadań, i pojawia się dopiero po załadowaniu obrazu.
- Okno aplikacji znika na czas przechwytywania. Esc lub ponowne Win + Shift + Q anuluje zaznaczanie; błędy i przekroczenie czasu przywracają możliwość kolejnej próby.
- Wynik jest zgłaszany dopiero po zakończeniu asynchronicznego zapisu do schowka.

`npm run test:e2e` otwiera planszę testową na każdym monitorze i sprawdza systemowy skrót, przeciąganie, pełne wymiary nakładki, OCR polskich znaków, schowek oraz anulowanie. Przed testem zamknij działającą aplikację, aby zwolnić skrót. Test potrzebuje odblokowanego pulpitu. Test odczytuje i przywraca tekst schowka; nie zachowuje jego formatowania.
