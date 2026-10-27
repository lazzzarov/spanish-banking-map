import { LocaleProvider, useLocale } from "./LocaleContext";
import { SiteHeader } from "./SiteHeader";

const COPY = {
  en: {
    p1: "This site is a consolidation genealogy, not a complete census of Spanish credit institutions. It follows the 2010–2012 caja restructuring and the bank-level deals on either side of it, through a failed 2025 bid and a 2026 minority stake.",
    p2: "Featured destination groups in this file are CaixaBank, Santander, BBVA, Sabadell, Unicaja, Ibercaja, Kutxabank and Abanca. They are not every surviving Spanish bank. The Banco de España register is the reference for the full population.",
    p3: "Known institutions on the official 2009–2021 Banco de España chart that are not separate nodes here include Banco Pastor, CajaSur, Caja Jaén, Caja Castilla-La Mancha and Banco de Valencia. We ship the curated tree first; we do not call it complete.",
    p4: "A relationship is an event with a mechanism and an outcome. Only completed lineage events — SIP, merger, absorption, activity transfer, resolution, rebrand — move an institution into a current group. A minority stake and a failed bid stay on the map and never reparent anyone. BPCE’s 7% holding does not make Sabadell a BPCE subsidiary.",
    p5: "Cajasol joined Banca Cívica’s SIP in 2010; the banking business reached CaixaBank in 2012 through that vehicle. The extra Cajasol→CaixaBank row is kept as a documented sequence with lineage turned off, so the family tree does not count it twice.",
    p6: "A caja’s founding year is not the incorporation year of the bank that later took its business. Regions on the map are approximate historical headquarters, not branch coverage, assets or market share. Those metrics need a different dataset.",
    p7: "Rows still marked check are visible as unverified. Cite the primary link on the event, or do not cite the row.",
  },
  es: {
    p1: "Este sitio es una genealogía de la consolidación, no un censo completo de las entidades de crédito españolas. Sigue la reestructuración de cajas de 2010–2012 y las operaciones bancarias de su entorno, hasta una OPA fallida en 2025 y una participación minoritaria en 2026.",
    p2: "Los grupos de destino destacados en este archivo son CaixaBank, Santander, BBVA, Sabadell, Unicaja, Ibercaja, Kutxabank y Abanca. No son todos los bancos españoles que siguen existiendo. El registro del Banco de España es la referencia de la población completa.",
    p3: "En el mapa oficial del Banco de España de 2009–2021 aparecen, entre otras, entidades que aquí no son nodos propios: Banco Pastor, CajaSur, Caja Jaén, Caja Castilla-La Mancha y Banco de Valencia. Publicamos primero el árbol curado; no lo presentamos como historia completa.",
    p4: "Cada relación es un hecho con un mecanismo y un resultado. Solo los hechos de linaje completados — SIP, fusión, absorción, cesión de negocio, resolución, cambio de marca — mueven una entidad a un grupo actual. Una participación minoritaria y una OPA fallida permanecen en el mapa y no cambian el padre de nadie. El 7% de BPCE no convierte a Sabadell en una filial de BPCE.",
    p5: "Cajasol entró en el SIP de Banca Cívica en 2010; el negocio bancario llegó a CaixaBank en 2012 a través de ese vehículo. La fila extra Cajasol→CaixaBank se conserva como secuencia documentada con el linaje desactivado, para que el árbol no la cuente dos veces.",
    p6: "El año de fundación de una caja no es el de constitución del banco que más tarde tomó su negocio. Las regiones del mapa son sedes históricas aproximadas, no red de oficinas, activos ni cuota de mercado. Esas métricas exigen otro dataset.",
    p7: "Las filas que siguen marcadas como check se muestran como no verificadas. Cita el enlace primario del hecho, o no cites la fila.",
  },
};

function Inner() {
  const { t, locale } = useLocale();
  const copy = COPY[locale];
  return (
    <div className="min-h-screen">
      <SiteHeader current="about" />
      <main className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.navAbout}</p>
        <h1 className="mt-3 text-3xl text-white md:text-4xl">{t.aboutTitle}</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-fog/90">
          <p>{copy.p1}</p>
          <p>{copy.p2}</p>
          <p>{copy.p3}</p>
          <p>{copy.p4}</p>
          <p>{copy.p5}</p>
          <p>{copy.p6}</p>
          <p>{copy.p7}</p>
        </div>
      </main>
    </div>
  );
}

export default function AboutPage() {
  return (
    <LocaleProvider>
      <Inner />
    </LocaleProvider>
  );
}
