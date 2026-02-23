/**
 * Generate favicon.ico and apple-icon.png from src/app/icon.svg for Safari/Firefox compatibility.
 * Run once: node scripts/generate-favicons.mjs
 */
import sharp from "sharp"
import toIco from "to-ico"
import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const svgPath = join(root, "src/app/icon.svg")
const appDir = join(root, "src/app")

const svg = readFileSync(svgPath)

async function main() {
  // 32x32 and 16x16 PNG for favicon.ico (Safari, Firefox, old browsers)
  const png32 = await sharp(svg).resize(32, 32).png().toBuffer()
  const png16 = await sharp(svg).resize(16, 16).png().toBuffer()
  const ico = await toIco([png16, png32])
  writeFileSync(join(appDir, "favicon.ico"), ico)
  console.log("Wrote src/app/favicon.ico")

  // 180x180 Apple Touch Icon (Safari iOS/macOS)
  const applePng = await sharp(svg).resize(180, 180).png().toBuffer()
  writeFileSync(join(appDir, "apple-icon.png"), applePng)
  console.log("Wrote src/app/apple-icon.png")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
