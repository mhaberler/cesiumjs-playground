# cesiumjs-playground

Multiple CesiumJS + Vite apps, each based on [CesiumGS/cesium-vite-example](https://github.com/CesiumGS/cesium-vite-example), built and deployed to a single GitHub Pages site under separate subpaths.

## Live apps

- [main](https://mhaberler.github.io/cesiumjs-playground/)
- [cesium-measurement-tool](https://mhaberler.github.io/cesiumjs-playground/cesium-measurement-tool/)
- [demo2](https://mhaberler.github.io/cesiumjs-playground/demo2/)

## Structure

```text
apps/
  main/                      → deployed to /
  cesium-measurement-tool/   → deployed to /cesium-measurement-tool/
  demo2/                     → deployed to /demo2/
```

Each app is an independent Vite project with its own `package.json`. `vite.config.js` sets `base` and `CESIUM_BASE_URL` to match its deployed subpath.

## Local dev

```sh
cd apps/main && bun install && bun run dev
```

Cesium ion features (world terrain, OSM Buildings) need a Cesium ion access token. Copy `.env.local.example` to `.env.local` in each app and fill in `VITE_CESIUM_ION_TOKEN`. In CI the token comes from the `CESIUM_ION_TOKEN` repo secret.

## Adding a new app

Say the new app is called `demo3`.

1. Copy an existing app folder, then drop its lockfile and local env file (regenerated below):

   ```sh
   cp -r apps/demo2 apps/demo3
   rm -rf apps/demo3/node_modules apps/demo3/dist apps/demo3/bun.lock apps/demo3/.env.local
   ```

2. In `apps/demo3/vite.config.js`, update `base` and `CESIUM_BASE_URL` to the new subpath:

   ```js
   base: "/cesiumjs-playground/demo3/",
   // ...
   CESIUM_BASE_URL: JSON.stringify(`/cesiumjs-playground/demo3/${cesiumBaseUrl}`),
   ```

3. In `apps/demo3/package.json`, rename `"name"` to `"cesiumjs-playground-demo3"`.

4. Install deps and set up local dev's ion token:

   ```sh
   cd apps/demo3 && bun install
   cp .env.local.example .env.local   # fill in VITE_CESIUM_ION_TOKEN
   bun run dev
   ```

5. In `.github/workflows/deploy.yml`, add a build step for `demo3` (copy the `demo2` step, replace the path) and extend the "Assemble combined site" step:

   ```sh
   mkdir -p site/demo3
   cp -r apps/demo3/dist/. site/demo3/
   ```

6. Once deployed, add the new URL to "Live apps" and the new folder to "Structure" above.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds each app and publishes the combined output to GitHub Pages via GitHub Actions.
