import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const stories = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/stories" }),
  schema: z.object({
    entityId: z.string(),
    groupId: z.string(),
    year: z.number(),
    locale: z.enum(["en", "es"]),
    title: z.string(),
  }),
});

export const collections = { stories };
