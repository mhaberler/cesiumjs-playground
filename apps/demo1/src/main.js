import {
  Cartesian3,
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  Ion,
  Math as CesiumMath,
  OpenStreetMapImageryProvider,
  SceneMode,
  UrlTemplateImageryProvider,
  Viewer,
  createWorldTerrainAsync,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";

const REEARTH_TERRAIN_URL = "https://terrain.reearth.land/cesium-mesh/ellipsoid";
const PHOTON = "https://photon.komoot.io";
const SHOW_TIMELINE = false;

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
  baseLayerPicker: false,
  sceneModePicker: false,
  geocoder: false,
  homeButton: false,
  navigationHelpButton: false,
  fullscreenButton: false,
  infoBox: false,
  selectionIndicator: false,
  animation: SHOW_TIMELINE,
  timeline: SHOW_TIMELINE,
});
viewer.scene.globe.depthTestAgainstTerrain = true;

function goHome() {
  // Fly to Stiwoll, Austria to show off terrain relief.
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(15.2188, 47.1027, 3000),
    orientation: {
      heading: CesiumMath.toRadians(0.0),
      pitch: CesiumMath.toRadians(-30.0),
    },
  });
}
goHome();
document.getElementById("home").addEventListener("click", goHome);

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

// --- 2D/3D toggle ------------------------------------------------------
const sceneModeBtn = document.getElementById("scene-mode");
function updateSceneModeLabel() {
  sceneModeBtn.textContent = viewer.scene.mode === SceneMode.SCENE3D ? "2D" : "3D";
}
sceneModeBtn.addEventListener("click", () => {
  if (viewer.scene.mode === SceneMode.SCENE3D) {
    viewer.scene.morphTo2D(1.0);
  } else {
    viewer.scene.morphTo3D(1.0);
  }
});
viewer.scene.morphComplete.addEventListener(updateSceneModeLabel);
updateSceneModeLabel();

// --- Geocoder (Photon), ported from mhaberler/trajectories geocode.js --
function featureLabel(props) {
  const name = props.name || props.street || props.city || "Place";
  const crumbs = [props.city, props.county, props.state, props.country]
    .filter(Boolean)
    .filter((c, i, a) => a.indexOf(c) === i && c !== name);
  return { name, sub: crumbs.join(", ") };
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function photonSearch(q) {
  const url = `${PHOTON}/api/?${new URLSearchParams({ q, limit: "5", lang: "en" })}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Photon ${resp.status}`);
  const data = await resp.json();
  return Array.isArray(data.features) ? data.features : [];
}

function initGeocode() {
  const input = document.getElementById("geocode");
  const list = document.getElementById("geocode-results");

  let hits = [];
  let active = -1;

  function hide() {
    list.hidden = true;
    list.innerHTML = "";
    hits = [];
    active = -1;
  }

  function render() {
    list.innerHTML = "";
    if (!hits.length) {
      list.hidden = true;
      return;
    }
    hits.forEach((f, i) => {
      const { name, sub } = featureLabel(f.properties || {});
      const li = document.createElement("li");
      if (i === active) li.classList.add("active");
      li.appendChild(document.createTextNode(name));
      if (sub) {
        const span = document.createElement("span");
        span.className = "geo-sub";
        span.textContent = sub;
        li.appendChild(span);
      }
      li.addEventListener("mousedown", (e) => {
        e.preventDefault(); // keep focus; avoid blur-before-click
        pick(i);
      });
      list.appendChild(li);
    });
    list.hidden = false;
  }

  function pick(i) {
    const f = hits[i];
    if (!f?.geometry?.coordinates) return;
    const [lon, lat] = f.geometry.coordinates;
    const { name, sub } = featureLabel(f.properties || {});
    input.value = sub ? `${name}, ${sub}` : name;
    hide();
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(lon, lat, 3000),
      orientation: { heading: CesiumMath.toRadians(0.0), pitch: CesiumMath.toRadians(-30.0) },
    });
  }

  const runSearch = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      hide();
      return;
    }
    try {
      hits = await photonSearch(q);
      active = hits.length ? 0 : -1;
      render();
    } catch {
      hide();
    }
  }, 300);

  input.addEventListener("input", runSearch);
  input.addEventListener("keydown", (e) => {
    if (list.hidden || !hits.length) {
      if (e.key === "Escape") hide();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      active = (active + 1) % hits.length;
      render();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      active = (active - 1 + hits.length) % hits.length;
      render();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0) pick(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      hide();
    }
  });
  input.addEventListener("blur", () => {
    // Delay so mousedown on a result can fire first.
    setTimeout(hide, 150);
  });
}

initGeocode();
