# cesiumjs-playground

Multiple CesiumJS + Vite apps, each based on [CesiumGS/cesium-vite-example](https://github.com/CesiumGS/cesium-vite-example), built and deployed to a single GitHub Pages site under separate subpaths.

## Live apps

- [main](https://mhaberler.github.io/cesiumjs-playground/)
- [demo1](https://mhaberler.github.io/cesiumjs-playground/demo1/)
- [demo2](https://mhaberler.github.io/cesiumjs-playground/demo2/)

## Structure

```text
apps/
  main/    → deployed to /
  demo1/   → deployed to /demo1/
  demo2/   → deployed to /demo2/
```

Each app is an independent Vite project with its own `package.json`. `vite.config.js` sets `base` and `CESIUM_BASE_URL` to match its deployed subpath.

## Local dev

```sh
cd apps/main && bun install && bun run dev
```

## Adding a new app

1. Copy an existing app folder, e.g. `cp -r apps/demo1 apps/demo3`.
2. Update `base` and `CESIUM_BASE_URL` in `apps/demo3/vite.config.js` to `/cesiumjs-playground/demo3/`.
3. Add a build step for it in `.github/workflows/deploy.yml`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds each app and publishes the combined output to GitHub Pages via GitHub Actions.
