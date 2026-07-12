const fs = require('fs')
const path = require('path')
const http = require('http')

const payload = JSON.stringify({
  registration: 'TESTLOGO123',
  vin: 'TESTLOGO123',
  year: '2004',
  carModel: 'Suzuki Baleno',
  enrichment: {
    make: 'Suzuki',
    model: 'Baleno',
    yearOfManufacture: '2004',
    colour: 'SILVER',
    numberOfDoors: '4',
  },
})

const req = http.request(
  {
    hostname: 'localhost',
    port: 3001,
    path: '/api/generate-report',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  (res) => {
    const chunks = []
    res.on('data', (c) => chunks.push(c))
    res.on('end', () => {
      const buf = Buffer.concat(chunks)
      console.log('status', res.statusCode, 'type', res.headers['content-type'], 'bytes', buf.length)
      if (res.statusCode !== 200) {
        console.log(buf.toString('utf8').slice(0, 500))
        process.exit(1)
      }
      const out = path.join(process.env.TEMP || '.', 'epicvin-logo-test.pdf')
      fs.writeFileSync(out, buf)
      // PDF should contain image XObject if logo rendered
      const text = buf.toString('latin1')
      const hasImage = /\/Subtype\s*\/Image/.test(text) || /\/XObject/.test(text)
      console.log('saved', out, 'hasImageXObject', hasImage)
    })
  }
)
req.on('error', (e) => {
  console.error(e)
  process.exit(1)
})
req.write(payload)
req.end()
