import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlanEra - Smart Study Planning",
    short_name: "PlanEra",
    description: "Upload your syllabus and get AI-powered study plans with calendar integration",
    start_url: "/",
    display: "standalone",
    background_color: "#1e1b4b",
    theme_color: "#312e81",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    categories: ["education", "productivity"],
  }
}
