# Tekst z ekranu

`Tekst z ekranu` to desktopowa aplikacja OCR dla Windows i macOS zbudowana w Electronie. Zaznacz dowolny fragment ekranu, a lokalny silnik Tesseract OCR rozpozna tekst po polsku i angielsku, po czym skopiuje wynik do schowka.

Aplikacja działa offline: obrazy ekranu są przetwarzane lokalnie w pamięci, nie są wysyłane do usług zewnętrznych ani zapisywane na dysku. Historia wyników jest domyślnie przechowywana wyłącznie w pamięci do chwili zamknięcia aplikacji. Możesz opcjonalnie włączyć jej lokalny zapis między uruchomieniami.

## Funkcje

- Lokalny OCR na urządzeniu, wykorzystujący Tesseract.js i WebAssembly.
- Rozpoznawanie języka polskiego i angielskiego, w tym polskich znaków diakrytycznych.
- Globalny skrót: `Win + Shift + Q` na Windowsie albo `⌥ + Shift + Q` na macOS.
- Obsługa wielu monitorów i skalowania DPI.
- Automatyczne kopiowanie wyniku do schowka.
- Opcjonalna historia odczytów, porządkowanie wyniku i automatyczne kopiowanie.
- Anulowanie zaznaczania klawiszem `Esc`, prawym przyciskiem myszy albo ponownym użyciem skrótu.
- Obsługa zasobnika systemowego: zamknięcie okna minimalizuje aplikację do zasobnika.
- Paczki Windows (`.exe`) i macOS (`.dmg`/`.zip`); nie trzeba osobno instalować Tesseracta.

## Pobranie i użycie

Pliki instalacyjne powstają w katalogu `dist/` po zbudowaniu projektu.

1. Uruchom aplikację.
2. Naciśnij skrót systemowy albo kliknij przycisk zaznaczania w aplikacji. Na Windowsie jest to `Win + Shift + Q`, a na macOS `⌥ + Shift + Q`.
3. Przeciągnij myszą po tekście, który chcesz rozpoznać. Zaznaczenie musi mieścić się na jednym monitorze.
4. Wklej rozpoznany tekst za pomocą `Ctrl + V` (na macOS `⌘ + V`).

Naciśnij `Esc` lub kliknij prawym przyciskiem myszy, aby anulować zaznaczanie. Aplikacja obsługuje wiele monitorów, także zaznaczenia obejmujące pasek zadań. Pierwszy odczyt może trwać dłużej z powodu inicjalizacji silnika OCR.

Po zamknięciu okna aplikacja pozostaje w zasobniku systemowym (na macOS w pasku menu). Kliknij ikonę zasobnika i wybierz **Zakończ**, aby całkowicie zamknąć program. Aplikacja nie uruchamia się automatycznie wraz z systemem.

Jeśli globalny skrót jest już używany, aplikacja wyświetli komunikat. Zamknij program, który zajmuje skrót, i uruchom `Tekst z ekranu` ponownie. Możesz też użyć przycisku zaznaczania w oknie albo menu zasobnika.

Pusty wynik OCR nie nadpisuje zawartości schowka.

## Prywatność

Całe rozpoznawanie tekstu odbywa się lokalnie. Dołączone dane językowe polskiego i angielskiego są przy pierwszym użyciu kopiowane do lokalnego cache aplikacji. Żaden obraz ekranu ani rozpoznany tekst nie jest wysyłany do internetu. Ustawienia są przechowywane lokalnie między uruchomieniami. Historia pozostaje tylko w pamięci, chyba że w ustawieniach włączysz jej lokalny zapis. Plik stanu ma limit 10 MB; gdy historia go przekroczy, aplikacja zapisuje najnowsze wpisy, które się mieszczą. Pozostałe są dostępne do końca bieżącej sesji.

## Rozwój projektu

Kod źródłowy jest podzielony według odpowiedzialności:

- `src/main/` — główny proces Electrona, OCR, przechwytywanie ekranu, historia i lokalny zapis.
- `src/main/platform/` — pomocnicze skrypty zależne od Windows; macOS korzysta z Electron `desktopCapturer`.
- `src/renderer/` — okna aplikacji, mostek preload, style i skrypty interfejsu.
- `src/shared/` — czyste funkcje współdzielone przez proces główny i testy.
- `src/assets/` — zasoby aplikacji, w tym ikony Windows i macOS.
- `test/` — testy jednostkowe; `scripts/` — pomocnicze skrypty budowania i E2E.

Wymagania:

- Windows 10/11 albo macOS 10.15+ dla pełnego działania aplikacji desktopowej.
- Node.js i npm.
- Dostęp do internetu przy pierwszej instalacji zależności.

Na macOS przy pierwszym zaznaczaniu trzeba zezwolić aplikacji na **Nagrywanie ekranu** w Ustawieniach systemowych → Prywatność i ochrona → Nagrywanie ekranu. Po zmianie uprawnienia uruchom aplikację ponownie.

Instalacja zależności i dostępne skrypty:

```powershell
npm ci
npm start
npm test
npm run dist:win
npm run dist:mac
```

Skrypty:

- `npm start` — uruchamia aplikację Electron.
- `npm test` — uruchamia testy automatyczne za pomocą test runnera Node.js.
- `npm run dist` lub `npm run dist:win` — buduje przenośny plik Windows w `dist/` i tworzy kopię `Tekst-z-ekranu.exe` bez numeru wersji.
- `npm run dist:mac` — buduje paczki macOS `.dmg` i `.zip` dla bieżącej architektury Maca. Budowanie macOS należy uruchomić na macOS.
- `npm run pack` — tworzy rozpakowaną paczkę Electron do inspekcji.
- `npm run pack:mac` — tworzy rozpakowaną paczkę macOS do inspekcji.
- `npm run test:e2e` — uruchamia test end-to-end na podłączonych monitorach.

Plik EXE i paczki macOS nie są podpisane cyfrowo. Przed `npm run test:e2e` zamknij działającą instancję aplikacji, aby zwolnić globalny skrót. Test end-to-end wymaga odblokowanego i widocznego pulpitu; po zakończeniu przywraca pierwotny tekst schowka.

## Testy

Testy automatyczne sprawdzają:

- przeliczanie współrzędnych z uwzględnieniem DPI,
- przycinanie obrazu przy jego krawędziach,
- błędne i puste zaznaczenia,
- porządkowanie tekstu OCR,
- kolejność, deduplikację, przywracanie, usuwanie i czyszczenie historii,
- dopasowanie monitorów do źródeł obrazu oraz limity czasu operacji.

Test end-to-end dodatkowo sprawdza globalny skrót, nakładki na całym ekranie, przeciąganie zaznaczenia, polskie znaki, integrację ze schowkiem, anulowanie i sprzątanie nakładek.

## Wersja 1.0.4

- Ujednolicono ikonę aplikacji w oknie, na pasku zadań, w widoku Alt+Tab i w zasobniku systemowym.
- Dodano natywne rozmiary ikony Windows od 16 do 256 px i poprawiono jej kolory BGRA.
- Zmieniono identyfikator aplikacji Windows, aby odłączyć ją od zapamiętanej grupy z ikoną Electron.

## Licencja

Projekt jest udostępniany na [licencji MIT](LICENSE). Metadane pakietu znajdują się w pliku `package.json`.

English documentation: [README.md](README.md).
