const fs = require('fs')

const files = [
  'index.html',
  'price/index.html',
  'vin-decoder/index.html',
  'license-plate-lookup/index.html',
  'sample-vehicle-history-report/index.html',
]

for (const f of files) {
  let html = fs.readFileSync(f, 'utf8')
  const before = html

  html = html.replace(
    /data-fixed-gbp="true" data-price-gbp="54\.99"/g,
    'data-plan-name="Basic" data-price-gbp="54.99"'
  )
  html = html.replace(
    /class="accent accent-price price" data-fixed-gbp="true"/g,
    'class="accent accent-price price" data-price-gbp="54.99"'
  )
  html = html.replace(/\s*data-fixed-gbp="true"/g, '')

  if (f !== 'index.html' && !html.includes('ip-currency.js')) {
    html = html.replace(
      '<script src="../main-site/js/payment-config.js"></script>',
      '<script src="../main-site/js/payment-config.js"></script>\n    <script src="../main-site/js/ip-currency.js"></script>'
    )
  }

  if (html !== before) {
    fs.writeFileSync(f, html)
    console.log('updated', f)
  } else {
    console.log('no change', f)
  }
}
