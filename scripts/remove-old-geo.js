const fs = require('fs')

const file = 'index.html'
let h = fs.readFileSync(file, 'utf8')
const marker = "console.log('Price geo script loading...');"
const idx = h.indexOf(marker)
if (idx < 0) {
  console.log('old geo script not found')
  process.exit(0)
}

const scriptStart = h.lastIndexOf('<script>', idx)
const scriptEnd = h.indexOf('</script>', idx)
if (scriptStart < 0 || scriptEnd < 0) {
  console.error('could not locate script bounds')
  process.exit(1)
}

const end = scriptEnd + '</script>'.length
const replacement =
  '\n    <!-- IP currency handled by main-site/js/ip-currency.js -->\n'
h = h.slice(0, scriptStart) + replacement + h.slice(end)
fs.writeFileSync(file, h)
console.log('removed old geo script')
