import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    spec: z.string(),
    summary: z.string(),
    cover: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { projects };
