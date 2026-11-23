import sharp from 'sharp'

const W = 1200
const H = 630

const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.25" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.78"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="72" y="470" font-family="Georgia, serif" font-size="96" font-weight="700" fill="#ffffff">Roamly</text>
  <text x="74" y="535" font-family="Arial, sans-serif" font-size="38" fill="#ffffff" fill-opacity="0.9">Plan together. Travel better.</text>
</svg>`)

await sharp('public/images/hero/hunza.webp')
  .resize(W, H, { fit: 'cover' })
  .composite([{ input: overlay }])
  .jpeg({ quality: 82 })
  .toFile('public/og-image.jpg')

console.log('public/og-image.jpg ready')