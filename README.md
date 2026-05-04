# webpack-build

Sample Angular app using **ArcGIS Map Components** and **Calcite**, set up to compare an **esbuild** build (Angular’s default application builder) with a parallel **webpack** build (`@angular-builders/custom-webpack`). The repo is meant to **reproduce and narrow down runtime differences** between the two pipelines (bundling, CSS, fonts, special chunks) when integrating the Esri stack.

## Why two builds

- **esbuild** (`ng build`): default path, fast, aligned with typical deploys.
- **webpack** (`ng run app:build-webpack:production`): fallback to mitigate bundling/splitting issues, CSS from `node_modules` (`@layer` and similar), **woff2** fonts referenced from stylesheets, and sensitive chunks (e.g. asm.js) if they break when processed by Angular’s Babel pipeline.

Typical workflow: reproduce the issue with build A, compare with build B; if B fixes it, keep it as a temporary fallback while you track down the root cause on the esbuild side.

Implementation details: `build-webpack` target in `angular.json`, output under `dist-webpack/`, merged config in `webpack.arcgis-css.cjs` (rules scoped to `@arcgis/*` and `@esri/*`).

## Requirements

- **Node.js** 20 (matches Docker images).
- **Docker** and Docker Compose v2 for containerized production.

## Local builds

```bash
npm ci
npm run build:esbuild    # output: dist/app/browser
npm run build:webpack    # output: dist-webpack
npm run build:all        # runs both sequentially
```

## Production with Docker (nginx)

Run commands from the **repository root** (same as the `npm` scripts).

| Command | What it starts | URL |
|---------|----------------|-----|
| `npm run docker:prod` | **Both** images: esbuild on **8080**, webpack on **8081** | http://localhost:8080 and http://localhost:8081 |
| `npm run docker:prod-esbuild` | esbuild build + nginx only | http://localhost:8080 |
| `npm run docker:prod-webpack` | webpack build + nginx only | http://localhost:8080 |

Development in a container (`ng serve` with bind mounts):

```bash
npm run docker:dev       # http://localhost:4200
```

Scripts use `docker compose --project-directory . -f .docker/...` so paths and volumes resolve against the project root.

## Main stack

Angular 20, `@angular/build` (esbuild), `@angular-builders/custom-webpack`, `@arcgis/core` and `@arcgis/map-components` 4.34, `@esri/calcite-components`, `style-loader` / `css-loader` in the webpack merge.
