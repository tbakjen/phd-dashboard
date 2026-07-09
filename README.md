# PhD Dashboard v1.1

Et statisk PhD-dashboard, der kan hostes gratis på GitHub Pages.

## Indhold

- Dashboard
- ECTS/kursusoversigt
- Artikeltracker
- Disseminationtracker
- Backup/import/eksport

## Lokal test

Åbn `index.html` direkte i din browser.

## GitHub Pages

1. Opret et repository på GitHub, fx `phd-dashboard`.
2. Upload alle filer fra denne mappe.
3. Gå til **Settings → Pages**.
4. Vælg:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Gem.

Efter kort tid ligger siden på:

`https://DIT-BRUGERNAVN.github.io/phd-dashboard/`

## Data

Siden starter med data fra `data.js`.

Når du tilføjer ting via hjemmesiden, gemmes ændringer i browserens `localStorage`.
Brug **Backup**-siden til at eksportere/importere data som JSON.

## Næste version

Forslag til version 1.2:

- DM1-DM6 tracker
- Gantt/timeline
- Vejledermøder
- Next actions
