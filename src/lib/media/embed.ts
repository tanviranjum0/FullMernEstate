export interface EmbedTarget {
  provider: "youtube" | "vimeo" | "matterport" | "kuula" | "momento360";
  src: string;
}

/**
 * Converts a video / virtual-tour URL into an embeddable URL for allow-listed providers.
 * Anything else returns null and is shown as an external link, never framed.
 */
export function toEmbed(rawUrl: string): EmbedTarget | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") ?? (url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : null);
    return id && /^[\w-]{6,20}$/.test(id) ? { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` } : null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return /^[\w-]{6,20}$/.test(id) ? { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    return id && /^\d{4,15}$/.test(id) ? { provider: "vimeo", src: `https://player.vimeo.com/video/${id}?dnt=1` } : null;
  }
  if (host === "my.matterport.com") {
    const id = url.searchParams.get("m");
    return id && /^[\w-]{5,30}$/.test(id) ? { provider: "matterport", src: `https://my.matterport.com/show/?m=${id}&play=0` } : null;
  }
  if (host === "kuula.co") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    return id && /^[\w-]{3,40}$/.test(id) ? { provider: "kuula", src: `https://kuula.co/share/${id}?fs=1&vr=0&thumbs=1` } : null;
  }
  if (host === "momento360.com") {
    return url.pathname.startsWith("/e/") ? { provider: "momento360", src: url.toString() } : null;
  }
  return null;
}
