import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.wordmark.primary,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ef",
    theme_color: "#171614",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
