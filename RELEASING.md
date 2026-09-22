# Wydawanie aplikacji

## Lokalna weryfikacja

```powershell
npm ci
npm test
npm run pack
```

Test E2E wymaga prawdziwego pulpitu i odblokowanego ekranu. Jeżeli środowisko ma ustawione `ELECTRON_RUN_AS_NODE=1`, uruchom go po wyczyszczeniu tej zmiennej:

```powershell
$env:ELECTRON_RUN_AS_NODE=$null
npm run test:e2e
```

## Release przez GitHub Actions

Po zwiększeniu wersji w `package.json` utworzenie odpowiadającego taga, np. `v1.0.5`, uruchamia workflow `.github/workflows/ci.yml`. Workflow sprawdza zgodność taga z wersją pakietu i następnie:

1. uruchamia testy jednostkowe i audyt zależności,
2. buduje paczkę Windows (`.exe`),
3. buduje paczki macOS (`.dmg` i `.zip`),
4. tworzy GitHub Release z wygenerowanymi notatkami.

Bez certyfikatów build nadal może się zbudować, ale będzie niesygnowany. Przed publikacją produkcyjną dodaj do ustawień repozytorium sekrety:

- `WINDOWS_CSC_LINK` — certyfikat Windows w formacie obsługiwanym przez electron-builder,
- `WINDOWS_CSC_KEY_PASSWORD` — hasło certyfikatu Windows,
- `MACOS_CSC_LINK` — certyfikat macOS,
- `MACOS_CSC_KEY_PASSWORD` — hasło certyfikatu macOS,
- `APPLE_ID` — konto Apple Developer,
- `APPLE_APP_SPECIFIC_PASSWORD` — hasło aplikacyjne Apple,
- `APPLE_TEAM_ID` — identyfikator zespołu Apple.

Po usunięciu `signExecutable: false` z konfiguracji electron-builder podpisywanie jest automatycznie aktywowane, gdy odpowiednie sekrety są dostępne.

## Aktualizacje automatyczne

Nie są jeszcze włączone. Windows jest wydawany jako `portable`, a bezpieczne aktualizacje Electron wymagają najpierw wybrania instalatora i strategii aktualizacji, np. targetu NSIS oraz repozytorium wydań. Nie należy dodawać `electron-updater` do obecnego targetu bez tej decyzji.
