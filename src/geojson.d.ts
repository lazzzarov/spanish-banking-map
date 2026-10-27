declare module "*.geojson" {
  const value: {
    type: "FeatureCollection";
    features: {
      type: "Feature";
      properties: { id: string; name: string; name_es: string };
      geometry:
        | { type: "Polygon"; coordinates: number[][][] }
        | { type: "MultiPolygon"; coordinates: number[][][][] };
    }[];
  };
  export default value;
}
