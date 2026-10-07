export const cacheTags = {
  properties: "properties",
  property: (slug: string) => `property:${slug}`,
  agents: "agents",
  agent: (slug: string) => `agent:${slug}`,
  locations: "locations",
  location: (path: string) => `location:${path}`,
  articles: "articles",
  article: (slug: string) => `article:${slug}`,
  settings: "settings",
} as const;
