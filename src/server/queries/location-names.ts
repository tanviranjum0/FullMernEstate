import "server-only";
import type { LocationOption } from "@/components/search/hero-search";
import type { LocationNames } from "@/lib/search/describe";
import { getLocationTree } from "./content";

export async function getLocationOptions(): Promise<{ options: LocationOption[]; names: LocationNames }> {
  const tree = await getLocationTree();
  const names: LocationNames = {};
  const options = tree.map(({ city, neighbourhoods }) => {
    names[city.slug] = city.name;
    for (const n of neighbourhoods) names[`${city.slug}/${n.slug}`] = n.name;
    return {
      city: { slug: city.slug, name: city.name },
      neighbourhoods: neighbourhoods.map((n) => ({ slug: n.slug, name: n.name })),
    };
  });
  return { options, names };
}
