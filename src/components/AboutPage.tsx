import { LocaleProvider, useLocale } from "./LocaleContext";
import { SiteHeader } from "./SiteHeader";

const SECTIONS = {
  en: [
    { title: "Scope", key: "p1" as const },
    { title: "Surviving heads", key: "p2" as const },
    { title: "What counts as an event", key: "p3" as const },
    { title: "Legal vs banking business", key: "p4" as const },
    { title: "Intermediate vehicles", key: "p5" as const },
    { title: "Independent cajas & the map", key: "p6" as const },
    { title: "How to read Figures", key: "p7" as const },
    { title: "Unverified rows", key: "p8" as const },
    { title: "Bubble sizes", key: "p9" as const, anchor: "sizes" },
  ],
  es: [
    { title: "Alcance", key: "p1" as const },
    { title: "Cabezas supervivientes", key: "p2" as const },
    { title: "Qué es un hecho", key: "p3" as const },
    { title: "Jurídico vs negocio bancario", key: "p4" as const },
    { title: "Vehículos intermedios", key: "p5" as const },
    { title: "Cajas independientes y el mapa", key: "p6" as const },
    { title: "Cómo leer Cifras", key: "p7" as const },
    { title: "Filas sin verificar", key: "p8" as const },
    { title: "Tamaño de las burbujas", key: "p9" as const, anchor: "sizes" },
  ],
};

const COPY = {
  en: {
    p1: "This site is a curated historical banking genealogy, not a complete census of Spanish credit institutions and not a register of every bank since 1920. It follows the institutions that feed eight featured destination groups — CaixaBank, Santander, BBVA, Sabadell, Unicaja, Ibercaja, Kutxabank and Abanca — plus a short list of surviving independents and cooperatives.",
    p2: "Cajamar, Grupo Caja Rural, Banca March, Caja Almendralejo, Banca Pueyo, Arquia Banca and Bankinter appear as surviving heads only. Their internal family trees are not encoded. The Banco de España register remains the reference for the full population.",
    p3: "A relationship is a dated event with a mechanism and an outcome. Only completed events that transfer control or banking-business continuity move an institution into a current group. Minority stakes, failed bids, SAREB asset transfers and the 2026 TSB sale stay visible and never reparent Banco Sabadell.",
    p4: "Legal status and banking-business continuity are stored apart. Caja Madrid’s banking business reached CaixaBank through BFA and Bankia; that does not mean the original caja legal person was absorbed by CaixaBank.",
    p5: "Intermediate vehicles are kept on purpose: BFA, Banco CAM, Catalunya Banc, Novacaixagalicia, NCG Banco, Banco CEISS, Banco Grupo Caja3 and others. Acquisition and later legal absorption are two events.",
    p6: "Caixa Ontinyent and Colonya–Caixa Pollença remain as independent traditional cajas. Headquarters on the map are historical origin points, not branch coverage or market share.",
    p7: "Figures on the stats page keep their compiler and definition. Do not add FROB assistance, recoveries and remaining equity into one bailout-cost number, and do not compute concentration from the number of nodes in this file.",
    p8: "Rows still marked check are visible as unverified. Cite the primary link on the event, or do not cite the row.",
    p9: "Each bubble’s area follows the total assets of the bank’s Spanish legal entity at the end of 2025, taken from TheBanks.eu or the bank’s own annual accounts. We use the entity rather than the consolidated group because this is a map of Spanish banking: Santander’s and BBVA’s groups include large foreign subsidiaries that would dwarf everything else. Two exceptions: Arquia only publishes a group figure, and Grupo Caja Rural is sized by Banco Cooperativo Español, its central bank, not by its rural cajas added together. Years before 2025 have no sizes yet, so bubbles there follow the number of institutions and are drawn dashed.",
  },
  es: {
    p1: "Este sitio es una genealogía histórica curada, no un censo completo de las entidades de crédito españolas ni un registro de todos los bancos desde 1920. Sigue a las entidades que alimentan ocho grupos de destino — CaixaBank, Santander, BBVA, Sabadell, Unicaja, Ibercaja, Kutxabank y Abanca — y a una lista corta de independientes y cooperativas que siguen.",
    p2: "Cajamar, Grupo Caja Rural, Banca March, Caja Almendralejo, Banca Pueyo, Arquia Banca y Bankinter aparecen solo como cabezas supervivientes. No se ha codificado su árbol interno. El registro del Banco de España sigue siendo la referencia de la población completa.",
    p3: "Cada relación es un hecho fechado con un mecanismo y un resultado. Solo los hechos completados que transfieren el control o la continuidad del negocio bancario mueven una entidad a un grupo actual. Las participaciones minoritarias, las OPA fallidas, las cesiones a SAREB y la venta de TSB en 2026 permanecen visibles y no cambian el padre de Banco Sabadell.",
    p4: "El estado jurídico y la continuidad del negocio bancario se guardan por separado. El negocio de Caja Madrid llegó a CaixaBank a través de BFA y Bankia; eso no significa que la persona jurídica original fuera absorbida por CaixaBank.",
    p5: "Los vehículos intermedios se conservan a propósito: BFA, Banco CAM, Catalunya Banc, Novacaixagalicia, NCG Banco, Banco CEISS, Banco Grupo Caja3 y otros. La adquisición y la absorción jurídica posterior son dos hechos.",
    p6: "Caixa Ontinyent y Colonya–Caixa Pollença siguen como cajas tradicionales independientes. Las sedes del mapa son orígenes históricos, no red de oficinas ni cuota de mercado.",
    p7: "Las cifras de la página de datos conservan su compilador y su definición. No sumes ayudas del FROB, recuperaciones y plusvalías en un único coste del rescate, ni calcules concentración a partir del número de nodos de este archivo.",
    p8: "Las filas que siguen marcadas como check se muestran como no verificadas. Cita el enlace primario del hecho, o no cites la fila.",
    p9: "El área de cada burbuja sigue el activo total de la entidad jurídica española del banco a cierre de 2025, según TheBanks.eu o las cuentas anuales del propio banco. Usamos la entidad y no el grupo consolidado porque este es un mapa de la banca española: los grupos Santander y BBVA incluyen grandes filiales extranjeras que harían diminuto todo lo demás. Dos excepciones: Arquia solo publica la cifra de grupo, y el Grupo Caja Rural se dimensiona con el Banco Cooperativo Español, su banco central, no con la suma de sus cajas rurales. Los años anteriores a 2025 aún no tienen tamaños, así que ahí las burbujas siguen el número de entidades y se dibujan con trazo discontinuo.",
  },
};

function Inner() {
  const { t, locale } = useLocale();
  const copy = COPY[locale];
  const sections = SECTIONS[locale];
  return (
    <div className="min-h-screen">
      <SiteHeader current="about" />
      <main className="mx-auto max-w-4xl px-5 py-10 md:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.navAbout}</p>
        <h1 className="mt-3 text-3xl text-heading md:text-4xl">{t.aboutTitle}</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map((section, index) => (
            <article
              key={section.key}
              id={"anchor" in section ? section.anchor : undefined}
              className={`rounded-2xl border border-line bg-panel p-5 ${index === 0 ? "md:col-span-2" : ""}`}
            >
              <h2 className="font-mono text-[11px] tracking-[0.12em] text-accent uppercase">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-fog/90">{copy[section.key]}</p>
            </article>
          ))}
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
