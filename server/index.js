require('dotenv').config()

const path = require('path')
const express = require('express')
const { lookupVehicleHandler } = require('./lookup-vehicle')
const { generateReportHandler } = require('./generate-report')

const app = express()
const PORT = Number(process.env.PORT) || 3001
const ROOT = path.join(__dirname, '..')

app.use(express.json({ limit: '2mb' }))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.post('/api/lookup-vehicle', lookupVehicleHandler)
app.post('/api/generate-report', generateReportHandler)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'epicvinrecord-report-api' })
})

app.use(express.static(ROOT))

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`EpicVINrecord report API listening on http://localhost:${PORT}`)
    console.log(`Thank you page: http://localhost:${PORT}/thank-you/`)
  })
}

module.exports = app
