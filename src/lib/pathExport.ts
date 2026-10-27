import { hierarchy, tree } from "d3";
import {
  childrenByParent,
  currentGroupOf,
  eventsUpTo,
  groupColor,
  walkLineage,
} from "./bankGraph";
import { FEATURED_GROUPS, dashFor, type BankDataset, type FeaturedGroup } from "./types";

function layoutGroups(dataset: BankDataset, groups: FeaturedGroup[]) {
  const nodes = new Map<string, { id: string; x: number; y: number }>();
  const width = 720;
  const height = 420;
  const colW = width / groups.length;
  groups.forEach((group, index) => {
    const children = childrenByParent(dataset.events);
    const walk = (id: string): { name: string; children: ReturnType<typeof walk>[] } => ({
      name: id,
      children: (children.get(id) ?? []).map(walk),
    });
    const root = hierarchy(walk(group));
    tree<typeof root.data>().nodeSize([16, colW - 36])(root);
    let minX = Infinity;
    let maxX = -Infinity;
    root.descendants().forEach((node) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
    });
    const span = Math.max(1, maxX - minX);
    root.descendants().forEach((node) => {
      nodes.set(node.data.name, {
        id: node.data.name,
        x: 28 + index * colW + (root.height === 0 ? 0 : node.y),
        y: 40 + ((node.x - minX) / span) * (height - 70),
      });
    });
  });
  return nodes;
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function familyPathSvg(
  dataset: BankDataset,
  entityId: string,
  year: number,
  labels: Record<string, string>,
): string {
  const { path } = walkLineage(dataset, entityId, year);
  const highlight = new Set(path);
  const group = path[path.length - 1];
  const groups = FEATURED_GROUPS.includes(group as FeaturedGroup)
    ? [group as FeaturedGroup]
    : [...FEATURED_GROUPS];
  const nodes = layoutGroups(dataset, groups);
  const width = 720;
  const height = 440;

  const lines = eventsUpTo(dataset.events, year)
    .map((event) => {
      const from = nodes.get(event.from);
      const to = nodes.get(event.to);
      if (!from || !to) return "";
      const onPath = highlight.has(event.from) && highlight.has(event.to) && event.lineage;
      if (!onPath) return "";
      const dash = dashFor(event.mechanism);
      return `<path d="M${from.x},${from.y} C${(from.x + to.x) / 2},${from.y} ${(from.x + to.x) / 2},${to.y} ${to.x},${to.y}" fill="none" stroke="#f8fafc" stroke-width="2"${dash ? ` stroke-dasharray="${dash}"` : ""} />`;
    })
    .filter(Boolean);

  const circles = [...nodes.values()]
    .filter((node) => highlight.has(node.id))
    .map((node) => {
      const name = escapeXml(labels[node.id] ?? node.id);
      const fill = groupColor(currentGroupOf(dataset, node.id, year));
      return `<g transform="translate(${node.x},${node.y})"><circle r="6" fill="${fill}" stroke="#f8fafc" stroke-width="1.5"/><text x="10" y="4" fill="#f8fafc" font-size="11" font-family="IBM Plex Mono, monospace">${name}</text></g>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#07080b"/>${lines.join("")}${circles.join("")}</svg>`;
}

export function downloadText(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadSvgAsPng(filename: string, svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("png"));
    image.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 1440;
  canvas.height = 880;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#07080b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const png = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = png;
  link.download = filename;
  link.click();
}
