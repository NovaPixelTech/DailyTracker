# CalTrack

CalTrack is a static React application ready to deploy on GitHub Pages. It keeps the original calorie-tracking interface and calculations; profile and daily-entry data are stored in the visitor's browser with `localStorage`.

## Publish on GitHub Pages

1. Push this repository to GitHub on the `main` branch.
2. In **Settings → Pages**, set the build and deployment source to **GitHub Actions**.
3. The `Deploy to GitHub Pages` workflow builds and deploys the site on each push to `main`. It also supports **Run workflow** from the Actions tab.

The workflow selects `/CalCount/` for this project repository and `/` for a `<user>.github.io` repository. The app and its deep links (such as `/history` and `/log/YYYY-MM-DD`) are configured for both.

## Local development

```sh
cd site
npm ci
npm run dev
```

Create a production build with `npm run build`. For a project Pages deployment, the workflow sets `BASE_PATH` automatically; for a local root deployment, it defaults to `/`.

## Data storage

Each browser profile has its own data on that device. No account or server is required, and this static deployment does not sync data between devices or browsers. History can be exported from the app as CSV.
