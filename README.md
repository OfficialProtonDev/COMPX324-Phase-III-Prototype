# Finance app prototype (COMPX324 Phase III)

A clickable, single-screen phone prototype of a personal finance app: Home,
Goals, Insights, Transactions and Budget, plus the goal, insight and e-receipt
flows behind them.

**Live:** https://officialprotondev.github.io/COMPX324-Phase-III-Prototype/

## Using it

- On a desktop browser the app runs inside a phone frame. The panel beside it
  shows the current screen, lets you jump to any screen, and has
  **Restart prototype** to clear your changes.
- On a phone the app fills the screen.
- Browser Back/Forward move between screens, and every screen has its own URL
  (for example `#/Goal-details?id=road-trip`), so you can link straight to one.
- Goals you create, edit or pin are saved in your browser (localStorage) and
  show up on Home, Goals and Goal details.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Phone shell: frame, status bar, screen transitions, history and the side panel |
| `screens/*.dc.html` | One file per screen (390 × 844 design), rendered by the bundled `dc-runtime` |
| `screens/assets/proto.js` | Shared goals store and the link bridge that hands navigation to the shell |
| `screens/assets/` | React 18, the dc runtime and the Figtree/Jost fonts, all served locally |

Each screen also works on its own (open `screens/Main.dc.html` directly); links
then navigate as normal pages.

## Running locally

Any static server works, for example:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

Opening `index.html` straight from disk (`file://`) won't work, because the
screens are loaded into frames and need a same-origin server.

## Deploying

`.github/workflows/pages.yml` publishes the repository root to GitHub Pages on
every push to `main` (and the working branch). In **Settings → Pages**, the
source must be **GitHub Actions**.
