# arcgis-build

Angular repro that keeps **two production build pipelines** side-by-side:

- **A (esbuild)**: Angular `@angular/build:application` (default)
- **B (webpack)**: `@angular-builders/custom-webpack:browser` with a small merge focused on `@arcgis/*` and `@esri/*`

The goal is to **isolate runtime divergences** that appear when using the Esri stack (**ArcGIS JS API / Map Components / Calcite**) and are hard to narrow down when you only have one bundler.

## Purpose

When an issue reproduces only after deploy (or only on one build pipeline), this repo lets you ship the **same app** built in two ways and compare outputs and runtime behavior.

### Divergence isolated in this repro

This repro currently focuses on a divergence affecting the `arcgis-elevation-profile` component: when drawing lines on the map, the elevation graph can **fail to render or intermittently disappear**, causing inconsistent into the esbuild build.

Plausible cause: `@arcgis/core` is a very modular ESM dependency tree and, with Angular’s esbuild pipeline, it can end up **split into many small chunks**. A higher chunk count increases sensitivity to **load ordering/timing** (and to how CSS/assets/special chunks are emitted), which can surface as intermittent UI inconsistencies compared to a webpack build.

**Use cases:**
- Compare **local vs deployed** runtime behavior when dev-server doesn’t reproduce
- Reduce uncertainty around **bundling/splitting/asset handling** with ArcGIS/Calcite
- Validate whether problems are caused by **CSS imported from JS** (e.g. `@layer`)
- Validate **font/asset URLs** referenced by CSS (e.g. `.woff2`)
- Avoid transforming **special chunks** (e.g. asm.js) that can break when passed through Babel

## Core capabilities

### A/B build outputs (same source, two bundlers)
You can build both pipelines and serve them independently, enabling fast comparison without changing application code.

### “Deploy-like” comparison via Docker + nginx
Compose files build and serve each output as static files behind nginx, so you can compare behavior in an environment closer to typical hosting/CDN setups.

## Run the repro

### Requirements

- **Node.js** 20+
- **Docker**

### Compare via Docker + nginx (recommended for A/B)

```bash
npm run docker:prod
```

This starts:
- **esbuild** on `http://localhost:8080`
- **webpack** on `http://localhost:8081`

Single-pipeline variants:

```bash
npm run docker:prod-esbuild
npm run docker:prod-webpack
```

## What differs between the two builds

- **Build target**:
  - `arcgis-build:build:production` uses `@angular/build:application` (esbuild)
  - `arcgis-build:build-webpack:production` uses `@angular-builders/custom-webpack:browser`
- **Output paths**:
  - esbuild: `dist-esbuild/browser`
  - webpack: `dist-webpack`
- **Webpack merge**: `webpack.arcgis-css.cjs`
  - Excludes ArcGIS chunks from Angular’s Babel loader (when present)
  - Adds loader rules for ArcGIS/Esri CSS and font assets
  - Keeps the scope limited to `node_modules/@arcgis` and `node_modules/@esri`

## Technology stack

**Frontend:** Angular 20, TypeScript  
**Build:** `@angular/build` (esbuild), `@angular-builders/custom-webpack`, webpack loaders for ArcGIS/Esri CSS/assets  
**Esri:** `@arcgis/core` 4.34, `@arcgis/map-components` 4.34, `@esri/calcite-components`  
**Infrastructure:** Docker, nginx