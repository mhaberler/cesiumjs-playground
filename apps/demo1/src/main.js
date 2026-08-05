import {
  Cartesian3,
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  Ion,
  Math as CesiumMath,
  OpenStreetMapImageryProvider,
  UrlTemplateImageryProvider,
  Viewer,
  createWorldTerrainAsync,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";

const REEARTH_TERRAIN_URL = "https://terrain.reearth.land/cesium-mesh/ellipsoid";

if (import.meta.env.VITE_CESIUM_ION_TOKEN) {
  Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
}

const noteEl = document.getElementById("note");

function setNote(msg) {
  noteEl.textContent = msg;
}

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer("cesiumContainer", {
  // Manage imagery ourselves so no ion imagery calls happen regardless of
  // which terrain source is active.
  baseLayer: false,
});
viewer.scene.globe.depthTestAgainstTerrain = true;

// Fly to Stiwoll, Austria to show off terrain relief.
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(15.2188, 47.1027, 3000),
  orientation: {
    heading: CesiumMath.toRadians(0.0),
    pitch: CesiumMath.toRadians(-30.0),
  },
});

function imageryLayers(kind) {
  if (kind === "osm") {
    return [new OpenStreetMapImageryProvider({ url: "https://tile.openstreetmap.org/" })];
  }
  return [
    new UrlTemplateImageryProvider({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      maximumLevel: 19,
      credit: "© Esri, USDA, USGS © OpenStreetMap contributors, and the GIS user community",
    }),
    new UrlTemplateImageryProvider({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      maximumLevel: 19,
    }),
  ];
}

function setImagery(kind) {
  viewer.imageryLayers.removeAll();
  for (const p of imageryLayers(kind)) viewer.imageryLayers.addImageryProvider(p);
}

async function setTerrain(kind) {
  let provider = new EllipsoidTerrainProvider();
  setNote("");
  try {
    if (kind === "reearth") {
      provider = await CesiumTerrainProvider.fromUrl(REEARTH_TERRAIN_URL);
    } else if (kind === "ion") {
      if (!import.meta.env.VITE_CESIUM_ION_TOKEN) throw new Error("Ion token missing");
      provider = await createWorldTerrainAsync();
    }
  } catch (err) {
    setNote(`Terrain unavailable (${err.message}) — showing flat.`);
  }
  viewer.terrainProvider = provider;
}

document.getElementById("terrain").addEventListener("change", (e) => {
  setTerrain(e.target.value);
});
document.getElementById("imagery").addEventListener("change", (e) => {
  setImagery(e.target.value);
});

setImagery("esri");
setTerrain("reearth");
