import { getCurrentUser } from "@/lib/auth/session";
import { FavoritesHydrator } from "@/components/property/client-stores";
import { getFavoriteIdsForUser } from "@/server/services/favorites";

/** Streams the signed-in user's saved-home ids into the client store after the shell renders. */
export async function FavoritesLoader() {
  const user = await getCurrentUser();
  const ids = user ? await getFavoriteIdsForUser(user.id) : [];
  return <FavoritesHydrator ids={ids} signedIn={Boolean(user)} />;
}
