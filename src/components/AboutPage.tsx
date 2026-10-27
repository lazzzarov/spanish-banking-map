import { LocaleProvider, useLocale } from "./LocaleContext";
import { SiteHeader } from "./SiteHeader";

const COPY = {
  en: {
    p1: "This site is a curated historical banking genealogy, not a complete census of Spanish credit institutions and not a register of every bank since 1920. It follows the institutions that feed eight featured destination groups: CaixaBank, Santander, BBVA, Sabadell, Unicaja, Ibercaja, Kutxabank and Abanca.",
    p2: "The Banco de España register remains the reference for the full population. Cooperative groups such as Cajamar are out of scope here.",
    p3: "A relationship is a dated event with a mechanism and an outcome. Only completed events that transfer control or banking-business continuity move an institution into a current group. Minority stakes, failed bids, SAREB asset transfers and the 2026 TSB sale stay visible and never reparent Banco Sabadell.",
    p4: "Legal status and banking-business continuity are stored apart. Caja Madrid’s banking business reached CaixaBank through BFA and Bankia; that does not mean the original caja legal person was absorbed by CaixaBank.",
    p5: "Intermediate vehicles are kept on purpose: BFA, Banco CAM, Catalunya Banc, Novacaixagalicia, NCG Banco, Banco CEISS, Banco Grupo Caja3 and others. Acquisition and later legal absorption are two events.",
    p6: "Caixa Ontinyent and Colonya–Caixa Pollença remain as independent traditional cajas. Headquarters on the map are historical origin points, not branch coverage or market share.",
    p7: "Figures on the stats page keep their compiler and definition. Do not add FROB assistance, recoveries and remaining equity into one bailout-cost number, and do not compute concentration from the number of nodes in this file.",
    p8: "Rows still marked check are visible as unverified. Cite the primary link on the event, or do not cite the row.",
  },
  es: {
    p1: "Este sitio es una genealogía histórica curada, no un censo completo de las entidades de crédito españolas ni un registro de todos los bancos desde 1920. Sigue a las entidades que alimentan ocho grupos de destino: CaixaBank, Santander, BBVA, Sabadell, Unicaja, Ibercaja, Kutxabank y Abanca.",
    p2: "El registro del Banco de España sigue siendo la referencia de la población completa. Los grupos cooperativos como Cajamar quedan fuera de este recorte.",
    p3: "Cada relación es un hecho fechado con un mecanismo y un resultado. Solo los hechos completados que transfieren el control o la continuidad del negocio bancario mueven una entidad a un grupo actual. Las participaciones minoritarias, las OPA fallidas, las cesiones a SAREB y la venta de TSB en 2026 permanecen visibles y no cambian el padre de Banco Sabadell.",
    p4: "El estado jurídico y la continuidad del negocio bancario se guardan por separado. El negocio de Caja Madrid llegó a CaixaBank a través de BFA y Bankia; eso no significa que la persona jurídica original fuera absorbida por CaixaBank.",
    p5: "Los vehículos intermedios se conservan a propósito: BFA, Banco CAM, Catalunya Banc, Novacaixagalicia, NCG Banco, Banco CEISS, Banco Grupo Caja3 y otros. La adquisición y la absorción jurídica posterior son dos hechos.",
    p6: "Caixa Ontinyent y Colonya–Caixa Pollença siguen como cajas tradicionales independientes. Las sedes del mapa son orígenes históricos, no red de oficinas ni cuota de mercado.",
    p7: "Las cifras de la página de datos conservan su compilador y su definición. No sumes ayudas del FROB, recuperaciones y plusvalías en un único coste del rescate, ni calcules concentración a partir del número de nodos de este archivo.",
    p8: "Las filas que siguen marcadas como check se muestran como no verificadas. Cita el enlace primario del hecho, o no cites la fila.",
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
          <p>{copy.p8}</p>
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
