/** Moves the Canaries into open sea south-east of the Balearics, clear of the mainland coast, for the inset. */
export const CANARY_DX = 18.56;
export const CANARY_DY = 7.86;

export type Ring = number[][];
export type PolygonCoords = Ring[];
export type MultiPolygonCoords = PolygonCoords[];

export interface RegionFeature {
  type: "Feature";
  properties: { id: string; name: string; name_es: string };
  geometry:
    | { type: "Polygon"; coordinates: PolygonCoords }
    | { type: "MultiPolygon"; coordinates: MultiPolygonCoords };
}

export interface RegionCollection {
  type: "FeatureCollection";
  features: RegionFeature[];
}

function shiftRing(ring: Ring, dx: number, dy: number): Ring {
  return ring.map(([lon, lat]) => [lon + dx, lat + dy]);
}

export function shiftCanaries(feature: RegionFeature): RegionFeature {
  if (feature.properties.id !== "CN") return feature;
  if (feature.geometry.type === "Polygon") {
    return {
      ...feature,
      geometry: {
        type: "Polygon",
        coordinates: feature.geometry.coordinates.map((ring) => shiftRing(ring, CANARY_DX, CANARY_DY)),
      },
    };
  }
  return {
    ...feature,
    geometry: {
      type: "MultiPolygon",
      coordinates: feature.geometry.coordinates.map((polygon) =>
        polygon.map((ring) => shiftRing(ring, CANARY_DX, CANARY_DY)),
      ),
    },
  };
}

export function projectHq(
  hq: [number, number],
  region: string | null,
): [number, number] {
  if (region === "CN") return [hq[0] + CANARY_DX, hq[1] + CANARY_DY];
  return hq;
}
