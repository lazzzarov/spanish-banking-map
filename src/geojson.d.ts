declare module "*.geojson" {
  const value: {
    type: "FeatureCollection";
    features: {
      type: "Feature";
      properties: { id: string; name: string; name_es: string };
      geometry: GeoJSON.Polygon;
    }[];
  };
  export default value;
}
