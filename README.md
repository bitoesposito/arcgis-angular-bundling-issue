# webpack-build

Angular repro that keeps **two production build pipelines** side-by-side:

- **A (esbuild)**: Angular `@angular/build:application` (default)
- **B (webpack)**: `@angular-builders/custom-webpack:browser` with a small merge focused on `@arcgis/*` and `@esri/*`

The goal is to **isolate runtime divergences** that appear when using the Esri stack (**ArcGIS JS API / Map Components / Calcite**) and are hard to narrow down when you only have one bundler.

## Purpose

When an issue reproduces only after deploy (or only on one build pipeline), this repo lets you ship the **same app** built in two ways and compare outputs and runtime behavior.

**Use cases:**
- Compare **local vs deployed** runtime behavior when dev-server doesn’t reproduce
- Reduce uncertainty around **bundling/splitting/asset handling** with ArcGIS/Calcite
- Validate whether problems are caused by **CSS imported from JS** (e.g. `@layer`)
- Validate **font/asset URLs** referenced by CSS (e.g. `.woff2`)
- Avoid transforming **special chunks** (e.g. asm.js) that can break when passed through Babel

## Core capabilities

### A/B build outputs (same source, two bundlers)
You can build both pipelines and serve them independently, enabling fast comparison without changing application code.

### Focused webpack merge for ArcGIS/Calcite
`webpack.arcgis-css.cjs` adds narrowly-scoped rules for ArcGIS/Esri CSS + fonts and excludes ArcGIS chunks from Angular’s Babel loader when needed.

### “Deploy-like” comparison via Docker + nginx
Compose files build and serve each output as static files behind nginx, so you can compare behavior in an environment closer to typical hosting/CDN setups.

## Architecture

### Feature-based organization

```text
.
├─ src/                      # Angular app source
├─ public/                   # Static assets copied by both builders
├─ webpack.arcgis-css.cjs    # Custom webpack merge (ArcGIS/Esri scoped)
├─ angular.json              # Two build targets: build + build-webpack
└─ .docker/                  # Dockerfiles + nginx + compose for A/B hosting
```

### Design principles

**Separation of concerns**
App code stays the same; the repo isolates differences at the build pipeline level (builder choice, loader rules, asset copying).

**Minimal surface area**
Webpack changes are scoped to `@arcgis/*` and `@esri/*` to reduce collateral effects on the rest of the dependency graph.

## Run the repro

### Requirements

- **Node.js** 20+
- Optional: **Docker** + Docker Compose v2 (for “deploy-like” static hosting)

### Build A (esbuild) and B (webpack)

```bash
npm ci
npm run build:esbuild   # output: dist/app/browser
npm run build:webpack   # output: dist-webpack
npm run build:all       # builds A then B
```

Serve the outputs locally (static hosting):

```bash
npm run serve:esbuild   # http://localhost:4201
npm run serve:webpack   # http://localhost:4202
```

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

Development container (Angular dev-server):

```bash
npm run docker:dev  # http://localhost:4200
```

## What differs between the two builds

- **Build target**:
  - `app:build:production` uses `@angular/build:application` (esbuild)
  - `app:build-webpack:production` uses `@angular-builders/custom-webpack:browser`
- **Output paths**:
  - esbuild: `dist/app/browser`
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

Key choices:
- **Two build targets in `angular.json`**: enables A/B without touching app code.
- **Separate output path (`dist-webpack`)**: avoids collisions and makes diffs explicit.
- **Scoped webpack rules**: reduces risk of changing behavior outside ArcGIS/Esri packages.
- **nginx static hosting**: approximates production serving semantics and caching behavior.

---

**Status**: Example repo for isolating ArcGIS/Calcite runtime divergences between Angular esbuild and webpack builds.
