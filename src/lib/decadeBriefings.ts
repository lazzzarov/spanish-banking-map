import type { Locale } from "./types";

const EN: Record<number, string> = {
  1920:
    "Before the merger era: rapid interwar growth, the 1920 Barcelona failure (liquidity vs solvency), and the 1921 banking law. The six large banks’ deposit share rose from about 48% in 1922 to 65% in 1934—concentration without encoded merger arrows in this dataset.",
  1930:
    "Autarky and wartime fragmentation: the Civil War split monetary authority. After 1946, mergers needed public authorization under a protected banking status quo.",
  1940:
    "State-controlled expansion: the 1959 Stabilization Plan opened the economy; the 1962 credit reform strengthened Banco de España’s central role.",
  1950:
    "Modernization and branch growth: cajas and private banks competed nationally as restrictions eased through the 1970s.",
  1960:
    "Liberalization and the 1978–85 banking crisis: failures and rescues reshaped private-bank ownership long before FROB.",
  1970:
    "Cajas catch up: deposit ratios tilt toward savings banks; Spain joins the EEC in 1986.",
  1980:
    "The modern large-bank era begins: Bilbao–Vizcaya (1988), then BBV–Argentaria and Santander–BCH in 1999.",
  1990:
    "European scale and caja competition at national level before property-linked balance sheets weakened the sector.",
  2000:
    "Property exposure and wholesale funding stress; FROB (2009) and the SIP / bank-transfer wave dismantle the old caja model.",
  2010:
    "Crisis integrations, EU MoU, SAREB asset transfers (not bank mergers), resolution of Popular (2017), and late-stage domestic mergers (Bankia–CaixaBank, Liberbank–Unicaja).",
  2020:
    "Digital restructuring, failed BBVA–Sabadell bid (2025), BPCE minority stake (2026), and Santander’s TSB acquisition—ownership moves that do not reparent Sabadell in this genealogy.",
};

const ES: Record<number, string> = {
  1920:
    "Antes de la era de fusiones: crecimiento interbélico, quiebra de Barcelona (1920) y ley bancaria de 1921. La cuota de depósitos de los seis grandes pasó de ~48% (1922) a ~65% (1934): concentración sin flechas de fusión en este dataset.",
  1930:
    "Autarquía y fragmentación bélica: la Guerra Civil partió la autoridad monetaria. Tras 1946, las fusiones requerían autorización pública.",
  1940:
    "Expansión bajo control estatal: Plan de Estabilización (1959) y reforma crediticia de 1962.",
  1950:
    "Modernización y red de oficinas: cajas y banca privada compiten a escala nacional.",
  1960:
    "Liberalización y crisis 1978–85: quiebras y rescates antes del FROB.",
  1970:
    "Las cajas ganan peso; adhesión a la CEE en 1986.",
  1980:
    "Empieza la era de grandes bancos: Bilbao–Vizcaya (1988), BBV–Argentaria y Santander–BCH (1999).",
  1990:
    "Escala europea y competencia caja–banco antes del boom inmobiliario.",
  2000:
    "Exposición inmobiliaria; FROB (2009) y oleada de SIPs y traspasos de negocio bancario.",
  2010:
    "Integraciones de crisis, SAREB, resolución de Popular (2017) y fusiones domésticas tardías.",
  2020:
    "Digitalización, OPA BBVA–Sabadell caducada (2025), participación BPCE (2026) y TSB en Santander.",
};

export function decadeBriefing(decadeFrom: number, locale: Locale): string {
  const table = locale === "es" ? ES : EN;
  return table[decadeFrom] ?? "";
}
