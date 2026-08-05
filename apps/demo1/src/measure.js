// Distance measurement tool, ported from
// https://github.com/mokrayaGISka/cesium_measurementTool/blob/master/measurement.html
import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  EllipsoidGeodesic,
  HorizontalOrigin,
  Material,
  PointPrimitiveCollection,
  PolylineCollection,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
} from "cesium";

const LINE_COLOR = Color.RED;

function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters.toFixed(2)} m`;
}

export function initMeasureTool(viewer) {
  const scene = viewer.scene;
  const geodesic = new EllipsoidGeodesic();

  const points = scene.primitives.add(new PointPrimitiveCollection());
  const polylines = scene.primitives.add(new PolylineCollection());
  let point1 = null;
  let point2 = null;
  let distanceLabel = null;
  let horizontalLabel = null;
  let verticalLabel = null;
  let enabled = false;

  const labelStyle = {
    font: "14px monospace",
    showBackground: true,
    horizontalOrigin: HorizontalOrigin.CENTER,
    verticalOrigin: VerticalOrigin.CENTER,
    pixelOffset: new Cartesian2(0, 0),
    eyeOffset: new Cartesian3(0, 0, -50),
    fillColor: Color.WHITE,
  };

  function clear() {
    points.removeAll();
    polylines.removeAll();
    if (distanceLabel) viewer.entities.remove(distanceLabel);
    if (horizontalLabel) viewer.entities.remove(horizontalLabel);
    if (verticalLabel) viewer.entities.remove(verticalLabel);
    distanceLabel = horizontalLabel = verticalLabel = null;
    point1 = point2 = null;
  }

  function midpoint(carto1, carto2, height) {
    geodesic.setEndPoints(carto1, carto2);
    const mid = geodesic.interpolateUsingFraction(0.5, new Cartographic());
    return Cartesian3.fromRadians(mid.longitude, mid.latitude, height);
  }

  function addLabels(carto1, carto2, midHeight) {
    geodesic.setEndPoints(carto1, carto2);
    const horizontalMeters = geodesic.surfaceDistance;
    const verticalMeters = Math.abs(carto2.height - carto1.height);
    const totalMeters = Math.hypot(horizontalMeters, verticalMeters);

    horizontalLabel = viewer.entities.add({
      position: midpoint(carto1, carto2, carto1.height),
      label: { ...labelStyle, text: formatDistance(horizontalMeters) },
    });
    distanceLabel = viewer.entities.add({
      position: midpoint(carto1, carto2, midHeight),
      label: { ...labelStyle, text: formatDistance(totalMeters) },
    });
    verticalLabel = viewer.entities.add({
      position: Cartesian3.fromRadians(carto2.longitude, carto2.latitude, midHeight),
      label: { ...labelStyle, text: formatDistance(verticalMeters) },
    });
  }

  function addLines(carto1, carto2) {
    const p1 = Cartesian3.fromRadians(carto1.longitude, carto1.latitude, carto1.height);
    const p2 = Cartesian3.fromRadians(carto2.longitude, carto2.latitude, carto2.height);
    const corner = Cartesian3.fromRadians(carto2.longitude, carto2.latitude, carto1.height);

    polylines.add({
      positions: [p1, p2],
      width: 1,
      material: new Material({ fabric: { type: "Color", uniforms: { color: LINE_COLOR } } }),
    });
    polylines.add({
      positions: [p2, corner],
      width: 1,
      material: new Material({ fabric: { type: "PolylineDash", uniforms: { color: LINE_COLOR } } }),
    });
    polylines.add({
      positions: [p1, corner],
      width: 1,
      material: new Material({ fabric: { type: "PolylineDash", uniforms: { color: LINE_COLOR } } }),
    });
  }

  const handler = new ScreenSpaceEventHandler(scene.canvas);
  handler.setInputAction((click) => {
    if (!enabled) return;
    const cartesian = viewer.scene.pickPosition(click.position);
    if (!cartesian) return;

    if (points.length >= 2) clear();

    if (points.length === 0) {
      point1 = points.add({ position: cartesian, color: LINE_COLOR });
      return;
    }

    point2 = points.add({ position: cartesian, color: LINE_COLOR });
    const carto1 = Cartographic.fromCartesian(point1.position);
    const carto2 = Cartographic.fromCartesian(point2.position);

    addLines(carto1, carto2);

    const midHeight =
      Math.min(carto1.height, carto2.height) + Math.abs(carto2.height - carto1.height) / 2;
    addLabels(carto1, carto2, midHeight);
  }, ScreenSpaceEventType.LEFT_CLICK);

  return {
    setEnabled(value) {
      enabled = value;
      if (!enabled) clear();
    },
    isEnabled() {
      return enabled;
    },
  };
}
