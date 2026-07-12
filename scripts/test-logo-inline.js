const fs = require('fs')
const path = require('path')

const htmlPath = path.join(__dirname, '..', 'report-sample.html')
let html = fs.readFileSync(htmlPath, 'utf8')
const before = html.includes('img2/epicvin-logos/epicvinrecord-logo.png')
const logoBuf = fs.readFileSync(
  path.join(__dirname, '..', 'img2', 'epicvin-logos', 'epicvinrecord-logo.png')
)
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`
html = html.replace(
  /src=["'](?:\.\.\/)?img2\/epicvin-logos\/epicvinrecord-logo\.png["']/gi,
  `src="${logoDataUri}"`
)
const after = html.includes('data:image/png;base64,')
const stillPath = html.includes('img2/epicvin-logos/epicvinrecord-logo.png')
console.log(JSON.stringify({ before, after, stillPath, uriLen: logoDataUri.length }))
