import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const META = {
  "Castilla-Leon": { id: "CL", name: "Castile and León", name_es: "Castilla y León" },
  Cataluña: { id: "CT", name: "Catalonia", name_es: "Cataluña" },
  Ceuta: { id: "CE", name: "Ceuta", name_es: "Ceuta" },
  Murcia: { id: "MC", name: "Murcia", name_es: "Murcia" },
  "La Rioja": { id: "RI", name: "La Rioja", name_es: "La Rioja" },
  Baleares: { id: "IB", name: "Balearic Islands", name_es: "Islas Baleares" },
  Canarias: { id: "CN", name: "Canary Islands", name_es: "Islas Canarias" },
  Cantabria: { id: "CB", name: "Cantabria", name_es: "Cantabria" },
  Andalucia: { id: "AN", name: "Andalusia", name_es: "Andalucía" },
  Asturias: { id: "AS", name: "Asturias", name_es: "Asturias" },
  Valencia: { id: "VC", name: "Valencian Community", name_es: "Comunidad Valenciana" },
  Melilla: { id: "ML", name: "Melilla", name_es: "Melilla" },
  Navarra: { id: "NC", name: "Navarre", name_es: "Navarra" },
  Galicia: { id: "GA", name: "Galicia", name_es: "Galicia" },
  Aragon: { id: "AR", name: "Aragon", name_es: "Aragón" },
  Madrid: { id: "MD", name: "Madrid", name_es: "Madrid" },
  Extremadura: { id: "EX", name: "Extremadura", name_es: "Extremadura" },
  "Castilla-La Mancha": { id: "CM", name: "Castilla-La Mancha", name_es: "Castilla-La Mancha" },
  "Pais Vasco": { id: "PV", name: "Basque Country", name_es: "País Vasco" },
};

function distPointSeg(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function simplifyRing(points, eps) {
  const closed =
    points.length > 1 &&
    points[0][0] === points[points.length - 1][0] &&
    points[0][1] === points[points.length - 1][1];
  const pts = closed ? points.slice(0, -1) : points.slice();
  if (pts.length <= 4) return points;

  const keep = Array.from({ length: pts.length }, () => false);
  keep[0] = true;
  keep[pts.length - 1] = true;

  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let maxD = -1;
    let idx = -1;
    for (let i = start + 1; i < end; i++) {
      const d = distPointSeg(pts[i], pts[start], pts[end]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > eps && idx !== -1) {
      keep[idx] = true;
      stack.push([start, idx], [idx, end]);
    }
  }

  const out = pts.filter((_, i) => keep[i]).map(([lon, lat]) => [round(lon), round(lat)]);
  if (out.length < 3) return points.map(([lon, lat]) => [round(lon), round(lat)]);
  out.push(out[0]);
  return out;
}

function round(n) {
  return Math.round(n * 10000) / 10000;
}

function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum) / 2;
}

function simplifyPolygon(polygon, eps, minArea) {
  const outer = simplifyRing(polygon[0], eps);
  if (ringArea(outer) < minArea) return null;
  const holes = polygon
    .slice(1)
    .map((ring) => simplifyRing(ring, eps))
    .filter((ring) => ringArea(ring) >= minArea * 0.15);
  return [outer, ...holes];
}

const raw = JSON.parse(readFileSync(resolve("tmp/spain-communities.geojson"), "utf8"));
const features = [];

for (const feature of raw.features) {
  const meta = META[feature.properties.name];
  if (!meta) throw new Error(`Unknown CCAA ${feature.properties.name}`);
  const eps = meta.id === "CN" || meta.id === "IB" || meta.id === "GA" || meta.id === "AS" ? 0.012 : 0.018;
  const minArea = meta.id === "CE" || meta.id === "ML" ? 0.00001 : 0.004;
  const polygons = [];
  for (const poly of feature.geometry.coordinates) {
    const simplified = simplifyPolygon(poly, eps, minArea);
    if (simplified) polygons.push(simplified);
  }
  if (!polygons.length) continue;
  features.push({
    type: "Feature",
    properties: meta,
    geometry: { type: "MultiPolygon", coordinates: polygons },
  });
}

const out = { type: "FeatureCollection", name: "spain-ccaa", features };
const json = `${JSON.stringify(out)}\n`;
writeFileSync(resolve("data/regions.json"), json);
writeFileSync(resolve("data/regions.geojson"), json);
console.log(`features=${features.length} bytes=${json.length}`);
