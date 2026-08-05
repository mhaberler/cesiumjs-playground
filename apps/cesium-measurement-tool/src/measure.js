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
  Math as CesiumMath,
  PointPrimitiveCollection,
  PolylineCollection,
  PolylineDashMaterialProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
} from "cesium";

const LINE_COLOR = Color.RED;
const GROUND_LINE_COLOR = Color.CYAN;

function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters.toFixed(2)} m`;
}

function formatBearing(radians) {
  const degrees = (CesiumMath.toDegrees(radians) + 360) % 360;
  return `${degrees.toFixed(1)}°`;
}

export function initMeasureTool(viewer) {
  const scene = viewer.scene;
  const geodesic = new EllipsoidGeodesic();

  const points = scene.primitives.add(new PointPrimitiveCollection());
  const polylines = scene.primitives.add(new PolylineCollection());
  let point1 = null;
  let point2 = null;
  let straightLine = null;
  let verticalLine = null;
  let horizontalLine = null;
  let groundLine = null;
  let distanceLabel = null;
  let horizontalLabel = null;
  let verticalLabel = null;
  let bearingLabel = null;
  let enabled = false;
  let straightLineVisible = true;
  let verticalLineVisible = true;
  let horizontalLineVisible = true;
  let groundLineVisible = true;

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
    clearLinesAndLabels();
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
      position: Cartesian3.fromRadians(
        carto2.longitude,
        carto2.latitude,
        midHeight,
      ),
      label: { ...labelStyle, text: formatDistance(verticalMeters) },
    });
    bearingLabel = viewer.entities.add({
      position: Cartesian3.fromRadians(
        carto1.longitude,
        carto1.latitude,
        carto1.height,
      ),
      label: {
        ...labelStyle,
        text: formatBearing(geodesic.startHeading),
        pixelOffset: new Cartesian2(0, -20),
      },
    });
  }

  function addLines(carto1, carto2) {
    const p1 = Cartesian3.fromRadians(
      carto1.longitude,
      carto1.latitude,
      carto1.height,
    );
    const p2 = Cartesian3.fromRadians(
      carto2.longitude,
      carto2.latitude,
      carto2.height,
    );
    const corner = Cartesian3.fromRadians(
      carto2.longitude,
      carto2.latitude,
      carto1.height,
    );

    straightLine = polylines.add({
      positions: [p1, p2],
      width: 1,
      show: straightLineVisible,
      material: new Material({
        fabric: { type: "Color", uniforms: { color: LINE_COLOR } },
      }),
    });
    verticalLine = polylines.add({
      positions: [p2, corner],
      width: 1,
      show: verticalLineVisible,
      material: new Material({
        fabric: { type: "PolylineDash", uniforms: { color: LINE_COLOR } },
      }),
    });
    horizontalLine = polylines.add({
      positions: [p1, corner],
      width: 1,
      show: horizontalLineVisible,
      material: new Material({
        fabric: { type: "PolylineDash", uniforms: { color: LINE_COLOR } },
      }),
    });

    groundLine = viewer.entities.add({
      show: groundLineVisible,
      polyline: {
        positions: [
          Cartesian3.fromRadians(carto1.longitude, carto1.latitude),
          Cartesian3.fromRadians(carto2.longitude, carto2.latitude),
        ],
        width: 4,
        clampToGround: true,
        material: new PolylineDashMaterialProperty({
          color: GROUND_LINE_COLOR,
          dashLength: 12,
        }),
      },
    });
  }

  function clearLinesAndLabels() {
    polylines.removeAll();
    straightLine = verticalLine = horizontalLine = null;
    if (groundLine) {
      viewer.entities.remove(groundLine);
    }
    groundLine = null;
    if (distanceLabel) {
      viewer.entities.remove(distanceLabel);
    }
    if (horizontalLabel) {
      viewer.entities.remove(horizontalLabel);
    }
    if (verticalLabel) {
      viewer.entities.remove(verticalLabel);
    }
    if (bearingLabel) {
      viewer.entities.remove(bearingLabel);
    }
    distanceLabel = horizontalLabel = verticalLabel = bearingLabel = null;
  }

  function updateMeasurement(cartesian) {
    point2.position = cartesian;
    const carto1 = Cartographic.fromCartesian(point1.position);
    const carto2 = Cartographic.fromCartesian(cartesian);

    clearLinesAndLabels();
    addLines(carto1, carto2);

    const midHeight =
      Math.min(carto1.height, carto2.height) +
      Math.abs(carto2.height - carto1.height) / 2;
    addLabels(carto1, carto2, midHeight);
  }

  let lineActive = false;

  const handler = new ScreenSpaceEventHandler(scene.canvas);
  handler.setInputAction((event) => {
    if (!enabled) {
      return;
    }
    const cartesian = viewer.scene.pickPosition(event.position);
    if (!cartesian) {
      return;
    }

    if (lineActive) {
      updateMeasurement(cartesian);
      lineActive = false;
      return;
    }

    clear();
    point1 = points.add({ position: cartesian, color: LINE_COLOR });
    point2 = points.add({ position: cartesian, color: LINE_COLOR });
    lineActive = true;
  }, ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((event) => {
    if (!enabled || !lineActive) {
      return;
    }
    const cartesian = viewer.scene.pickPosition(event.endPosition);
    if (!cartesian) {
      return;
    }
    updateMeasurement(cartesian);
  }, ScreenSpaceEventType.MOUSE_MOVE);

  return {
    setEnabled(value) {
      enabled = value;
      if (!enabled) {
        clear();
        lineActive = false;
      }
    },
    isEnabled() {
      return enabled;
    },
    setStraightLineVisible(value) {
      straightLineVisible = value;
      if (straightLine) {
        straightLine.show = value;
      }
    },
    setVerticalLineVisible(value) {
      verticalLineVisible = value;
      if (verticalLine) {
        verticalLine.show = value;
      }
    },
    setHorizontalLineVisible(value) {
      horizontalLineVisible = value;
      if (horizontalLine) {
        horizontalLine.show = value;
      }
    },
    setGroundLineVisible(value) {
      groundLineVisible = value;
      if (groundLine) {
        groundLine.show = value;
      }
    },
  };
}
