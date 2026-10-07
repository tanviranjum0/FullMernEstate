/**
 * Builds committed static image variants (e.g. the default hero) through the same pipeline used
 * for uploads. Run with `npm run media:build-static -- <source> <public-folder> [alt-text]`.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { processImage } from "../src/lib/media/process";
import { variantFileName } from "../src/lib/media/variants";

async function main() {
  const [source, folder] = process.argv.slice(2);
  if (!source || !folder) {
    console.error("Usage: npm run media:build-static -- <source-image> <public-subfolder>");
    process.exit(1);
  }
  const processed = await processImage(await readFile(source), { quality: 78 });
  const outDir = path.join(process.cwd(), "public", "images", folder);
  await mkdir(outDir, { recursive: true });
  for (const variant of processed.variants) {
    await writeFile(path.join(outDir, variantFileName(variant.width)), variant.buffer);
    console.log(`  ${variantFileName(variant.width)}  ${(variant.buffer.length / 1024).toFixed(0)} KB`);
  }
  const src = `/images/${folder}/${variantFileName(processed.width)}`;
  console.log(
    JSON.stringify({ src, width: processed.width, height: processed.height, blurDataURL: processed.blurDataURL }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
