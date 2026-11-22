import { mkdir, readdir, rename, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'public/images'
const BACKUP = 'image-originals' // originals yahan jate hain, public se bahar
const SKIP = /(favicon|logo|icon)/i // logo aur icons ko mat chhero
const WIDTHS = { hero: 1920 } // folder ke hisaab se max width
const DEFAULT_WIDTH = 1400
const QUALITY = 78

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

let before = 0
let after = 0

for await (const file of walk(SRC)) {
  const ext = path.extname(file).toLowerCase()
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue
  if (SKIP.test(path.basename(file))) continue

  const rel = path.relative(SRC, file)
  const folder = rel.split(path.sep)[0]
  const out = file.slice(0, -ext.length) + '.webp'

  const sizeBefore = (await stat(file)).size
  await sharp(file)
    .rotate()
    .resize({ width: WIDTHS[folder] ?? DEFAULT_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out)
  const sizeAfter = (await stat(out)).size

  const backupPath = path.join(BACKUP, rel)
  await mkdir(path.dirname(backupPath), { recursive: true })
  await rename(file, backupPath)

  before += sizeBefore
  after += sizeAfter
  console.log(`${rel}: ${(sizeBefore / 1024).toFixed(0)} KB -> ${(sizeAfter / 1024).toFixed(0)} KB`)
}

console.log(`\nTotal: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`)