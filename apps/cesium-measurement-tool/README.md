# cesium-measurement-tool

Adds a click-to-measure distance tool (horizontal, vertical, 3D, and bearing) on top of the base [CesiumGS/cesium-vite-example](https://github.com/CesiumGS/cesium-vite-example) setup. The measurement logic in [`src/measure.js`](./src/measure.js) is ported from [mokrayaGISka/cesium_measurementTool](https://github.com/mokrayaGISka/cesium_measurementTool).

---

## cesium-vite-example base template

A minimal recommended setup for an applications using [Cesium](https://cesium.com) with [Vite](https://vitejs.dev/).

If you are using Webpack instead of Vite, check out our [`cesium-webpack-example`](https://github.com/CesiumGS/cesium-webpack-example) repo.

## UI framework support

This example was created to be the lowest common denominator in the Vite ecosystem and targets Vanilla JS. The same configuration has been tested with other UI frameworks in Vite (like Vue) by adding the relevant plugin. If you run into framework specific problems please [open an issue](https://github.com/CesiumGS/cesium-vite-example/issues/new).

If you create a new Vite project with [`create-vite`](https://vitejs.dev/guide/#scaffolding-your-first-vite-project) you can combine the `plugins` that it adds in `vite.config.js` with the ones in this example configuration.

## Running this application

```sh
bun install
bun run dev
```

For the built, production version

```sh
bun run build
bun run preview
```

Navigate to `localhost:5173`. For the built version navigate to `localhost:4173`

## Available scripts

- `bun run eslint` - Lint this project
- `bun run prettier` - Format all the code to a consistant style
- `bun run prettier-check` - Check the format of code but do not change it
- `bun run dev` - Starts the Vite development server server at `localhost:5173`
- `bun run build` - Runs the Vite production build
- `bun run preview` - Starts a local preview of the production build using [`vite preview`](https://vitejs.dev/guide/cli.html#vite-preview)

## Requiring Cesium in your application

We recommend [importing named exports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) from the Cesium ES module, via the `import` keyword.

### Import named modules from Cesium

```js
import { Color } from "cesium";
var c = Color.fromRandom();
```

### Import Cesium static asset files

```js
import "cesium/Build/Cesium/Widgets/widgets.css";
```

## Cesium sub-packages

CesiumJS requires a few static files to be hosted on your server, like web workers and SVG icons. This example is already set up to copy these directories if you install the whole `cesium` package.

```js
viteStaticCopy({
  targets: [
    { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
    { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
    { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
    { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
  ],
}),
```

However if you only install `@cesium/engine` then you should change the paths in [`vite.config.js`](./vite.config.js) to the ones below:

```js
viteStaticCopy({
  targets: [
    { src: 'node_modules/@cesium/engine/Build/Workers', dest: cesiumBaseUrl },
    { src: 'node_modules/@cesium/engine/Build/ThirdParty', dest: cesiumBaseUrl },
    { src: 'node_modules/@cesium/engine/Source/Assets', dest: cesiumBaseUrl },
  ],
}),
```

Additionally you will have to import a different widgets css file in `src/main.js`.

```js
// Change this import
import "cesium/Build/Cesium/Widgets/widgets.css";

// To this one from the cesium/engine package
import "@cesium/engine/Source/Widget/CesiumWidget.css";
```

## CesiumJS before version `1.114`

If you are using a version of CesiumJS before `1.114` you will need to modify the config to tell it to ignore some external node dependencies. Add the `build` section below:

```js
  build: {
    rollupOptions: {
      external: ["http", "https", "url", "zlib"],
    },
  },
```

See cesium PR [#11773](https://github.com/CesiumGS/cesium/pull/11773) for more information

## Contributions

Pull requests are appreciated. Please use the same [Contributor License Agreement (CLA)](https://github.com/CesiumGS/cesium/blob/master/CONTRIBUTING.md) used for [Cesium](https://cesium.com/).

---

Developed by the Cesium team.
