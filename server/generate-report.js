const fs = require('fs/promises')
const path = require('path')
const { pathToFileURL } = require('url')
const { resolveChromeExecutable } = require('./chromePath')

// ESM-only packages — must use dynamic import() from CommonJS
const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar'

const LOCAL_CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
]

const RAW_HTML_KEYS = new Set([
  'MOT_HISTORY_HTML',
  'MILEAGE_HISTORY_HTML',
  'LOGO_SRC',
  'INSPECTION_BANNER_SRC',
])

async function loadChromium() {
  const { default: chromium } = await import('@sparticuz/chromium-min')
  return chromium
}

async function loadPuppeteer() {
  const { default: puppeteer } = await import('puppeteer-core')
  return puppeteer
}

async function getLaunchOptions() {
  const useSparticuz = !!process.env.VERCEL || process.platform === 'linux'

  if (!useSparticuz) {
    const executablePath = resolveChromeExecutable()
    if (!executablePath) {
      throw new Error(
        'Chrome not found for local PDF generation. Install Google Chrome or set PUPPETEER_EXECUTABLE_PATH.'
      )
    }
    return {
      executablePath,
      headless: true,
      args: LOCAL_CHROME_ARGS,
    }
  }

  const chromium = await loadChromium()
  return {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
    headless: chromium.headless,
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isMissing(v) {
  if (v === null || v === undefined) return true
  const s = String(v).trim()
  if (!s) return true
  return /^n\/?a$/i.test(s) || /^null$/i.test(s) || /^undefined$/i.test(s)
}

function pickDisplay(v, fallback) {
  if (isMissing(v)) return fallback
  let s = String(v).trim().replace(/^e\.g\.\s*/i, '').trim()
  if (isMissing(s) || /example/i.test(s)) return fallback
  return s
}

const TAX_BAND_PAYMENT = {
  A: '£ 0,-',
  B: '£ 20,-',
  C: '£ 30,-',
  D: '£ 110,-',
  E: '£ 145,-',
  F: '£ 160,-',
  G: '£ 200,-',
  H: '£ 240,-',
  I: '£ 260,-',
  J: '£ 300,-',
  K: '£ 325,-',
  L: '£ 445,-',
  M: '£ 520,-',
}

function formatTyreDataModel(raw, modelFallback) {
  let s = pickDisplay(raw, '')
  s = s.replace(/^model\.\s*/i, '').trim()
  if (!s) return pickDisplay(modelFallback, 'Standard')
  return s
}

function formatTaxPayment(raw, taxBand) {
  const s = pickDisplay(raw, '')
  if (!s) {
    const band = String(taxBand || 'E').trim().toUpperCase().slice(0, 1)
    return TAX_BAND_PAYMENT[band] || '£ 145,-'
  }
  if (/^\d/.test(s) && !s.includes('£')) {
    return `£ ${s.replace(/\.00$/, '')},-`
  }
  return s
}

function applyPlaceholders(html, map) {
  let out = html
  const ordered = [...Object.entries(map)].sort(
    (a, b) => b[0].length - a[0].length
  )
  for (const [key, val] of ordered) {
    const token = new RegExp(
      `\\{\\{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`,
      'g'
    )
    const safe = RAW_HTML_KEYS.has(key) ? String(val) : escapeHtml(val)
    out = out.replace(token, safe)
  }
  return out
}

function buildMotHistoryHtml(motTests) {
  const tests = Array.isArray(motTests) ? motTests : []
  if (!tests.length) {
    return `<div class="mot-block"><div class="mot-entry-head">No MOT records<span class="date"></span></div>
      <div class="mot-sub-row"><div><div class="lab">Result</div><div class="val">N/A</div></div></div></div>`
  }

  return tests
    .map((t) => {
      const num = escapeHtml(t.number ?? '')
      const date = escapeHtml(t.date || '')
      const result = escapeHtml(t.result || 'Passed')
      const resultClass =
        String(t.result || '').toLowerCase() === 'passed' ? 'pass' : ''
      const nextExpiry = t.nextExpiry
        ? `<div><div class="lab">Next Expiry</div><div class="val">${escapeHtml(t.nextExpiry)}</div></div>`
        : ''
      const advice = (Array.isArray(t.advice) ? t.advice : [])
        .filter(Boolean)
        .map(
          (a) =>
            `<div class="advice-box"><span class="advice-tag">Advice</span><div class="advice-text">${escapeHtml(a)}</div></div>`
        )
        .join('')

      return `<div class="mot-block">
        <div class="mot-entry-head">MOT #${num} <span class="date">${date}</span></div>
        <div class="mot-sub-row">
          <div><div class="lab">Result</div><div class="val ${resultClass}">${result}</div></div>
          ${nextExpiry}
        </div>
        ${advice}
      </div>`
    })
    .join('\n')
}

function buildMileageHistoryHtml(rows) {
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) {
    return `<tr><td colspan="3">No mileage records</td></tr>`
  }
  return list
    .map(
      (m) =>
        `<tr><td>${escapeHtml(m.label || '')}</td><td>${escapeHtml(m.date || '')}</td><td>${escapeHtml(m.mileage || '')}</td></tr>`
    )
    .join('\n')
}

function passRateWidth(rate) {
  const m = String(rate || '').match(/(\d+)/)
  const n = m ? Math.min(100, Math.max(0, Number(m[1]))) : 100
  return `${n}%`
}

function coercePlaceholders(payload) {
  const e =
    typeof payload.enrichment === 'object' && payload.enrichment !== null
      ? payload.enrichment
      : typeof payload.reportData === 'object' && payload.reportData !== null
        ? payload.reportData
        : {}

  const registration = String(
    e.vrm ||
      payload.registration ||
      payload.reg ||
      payload.plate ||
      payload.vin ||
      ''
  ).trim()

  // Entry-form fields take priority for identity display
  const formModel = String(
    payload.formCarModel || payload.carModel || payload.vehicleModel || ''
  ).trim()
  const formYear = String(payload.formYear || payload.year || '').trim()

  const make = String(e.make || 'N/A')
  const model = String(
    formModel || e.model || payload.carModel || payload.vehicleModel || 'N/A'
  )
  const year = String(
    formYear || e.yearOfManufacture || payload.year || 'N/A'
  )

  // Executive Summary "Vehicle" = what user typed (Model + Year)
  const vehicleFullName =
    formModel && formYear
      ? `${formModel} (${formYear})`
      : formModel
        ? formModel
        : [make !== 'N/A' ? make : '', model !== 'N/A' ? model : '', year !== 'N/A' ? `(${year})` : '']
            .filter(Boolean)
            .join(' ')
            .trim()

  const banner = [make !== 'N/A' ? make : '', model !== 'N/A' ? model : '']
    .filter(Boolean)
    .join(' ')
    .trim()
    || vehicleFullName
    || [year !== 'N/A' ? year : '', model !== 'N/A' ? model : '']
      .filter(Boolean)
      .join(' ')
      .trim()

  const reportDate =
    typeof payload.reportDate === 'string' && payload.reportDate.trim()
      ? payload.reportDate.trim()
      : new Date().toISOString().slice(0, 10)

  const motPassRate = String(e.motPassRate || '100%')

  return {
    REPORT_DATE: reportDate,
    BANNER_TITLE: banner || model || 'Vehicle report',
    VEHICLE_FULL_NAME: vehicleFullName || banner || 'N/A',
    MAKE: make !== 'N/A' ? make : model,
    MODEL: model,
    REGISTRATION: registration || 'N/A',
    IDENTIFICATION_NUMBER: registration || 'N/A',
    COLOUR: String(e.colour || e.color || 'N/A'),
    YEAR: year,
    GEARBOX: String(e.gearbox || 'N/A'),
    TOP_SPEED: String(e.topSpeed || 'N/A'),
    POWER: String(e.power || 'N/A'),
    MAX_TORQUE: String(e.maxTorque || 'N/A'),
    ENGINE_CAPACITY: String(e.engineCapacity || 'N/A'),
    CYLINDERS: String(e.cylinders || 'N/A'),
    FUEL_TYPE: String(e.fuelType || 'N/A'),
    CONSUMPTION_CITY: String(e.consumptionCity || 'mpg'),
    CONSUMPTION_EXTRA_URBAN: String(e.consumptionExtraUrban || 'mpg'),
    CONSUMPTION_COMBINED: String(e.consumptionCombined || 'N/A'),
    CO2_EMISSION: String(e.co2Emission || 'N/A'),
    CO2_LABEL: pickDisplay(e.co2Label, 'E'),
    TYRE_DATA_MODEL: formatTyreDataModel(e.tyreDataModel, model),
    ENGINE_POWER_KW: pickDisplay(e.enginePowerKw, 'N/A'),
    STANDARD_FITMENT: pickDisplay(e.standardFitment, 'Yes'),
    FRONT_TYRE_SIZE: pickDisplay(e.frontTyreSize, 'N/A'),
    REAR_TYRE_SIZE: pickDisplay(e.rearTyreSize, 'N/A'),
    FRONT_PRESSURE: pickDisplay(e.frontPressure, 'N/A'),
    REAR_PRESSURE: pickDisplay(e.rearPressure, 'N/A'),
    WHEEL_HUB: pickDisplay(e.wheelHub, 'N/A'),
    MOT_EXPIRY_DATE: pickDisplay(e.motExpiryDate, 'N/A'),
    MOT_PASS_RATE: motPassRate,
    MOT_PASS_RATE_WIDTH: passRateWidth(motPassRate),
    MOT_PASSED: pickDisplay(e.motPassed, '0'),
    FAILED_MOT_TESTS: pickDisplay(e.failedMotTests, '0'),
    TOTAL_ADVICE_ITEMS: pickDisplay(e.totalAdviceItems, '0'),
    TOTAL_ITEMS_FAILED: pickDisplay(e.totalItemsFailed, '0'),
    MOT_HISTORY_HTML: buildMotHistoryHtml(e.motTests),
    TAX_DAYS_LEFT: pickDisplay(e.taxDaysLeft, '0'),
    TAX_MOT_EXPIRY_DISPLAY: pickDisplay(
      e.taxMotExpiryDisplay || e.motExpiryDate,
      'N/A'
    ),
    TAX_BAND: pickDisplay(e.taxBand || e.co2Label, 'E'),
    TAX_SINGLE_PAYMENT: formatTaxPayment(
      e.taxSinglePayment,
      e.taxBand || e.co2Label || 'E'
    ),
    FINANCE_STATUS: String(
      e.financeStatus ||
        'Clear — No outstanding loans or financial agreements on this vehicle.'
    ),
    DAMAGE_STATUS: String(
      e.damageStatus ||
        'Clear — No record of accidents or damage reported for this vehicle.'
    ),
    STOLEN_STATUS: String(
      e.stolenStatus || 'Clear — No theft record found.'
    ),
    LEGAL_FINANCIAL_STATUS: String(
      e.legalFinancialStatus || 'Clear / No issues'
    ),
    LEGAL_WRITE_OFF_STATUS: String(
      e.legalWriteOffStatus || 'Not recorded as write-off'
    ),
    LEGAL_ACCIDENT_STATUS: String(
      e.legalAccidentStatus || 'No accident records'
    ),
    LEGAL_THEFT_STATUS: String(
      e.legalTheftStatus || 'No theft markers'
    ),
    ODOMETER_UNIT: String(e.odometerUnit || 'In miles'),
    MILEAGE_REGISTRATIONS: String(e.mileageRegistrations || '0'),
    FIRST_MILEAGE_REGISTRATION: String(e.firstMileageRegistration || 'N/A'),
    LAST_MILEAGE_REGISTRATION: String(e.lastMileageRegistration || 'N/A'),
    MILEAGE_HISTORY_HTML: buildMileageHistoryHtml(e.mileageHistory),
    WIDTH: String(e.width || 'N/A'),
    HEIGHT: String(e.height || 'N/A'),
    LENGTH: String(e.length || 'N/A'),
    WHEEL_BASE: String(e.wheelBase || 'N/A'),
    KERB_WEIGHT: String(e.kerbWeight || 'N/A'),
    MAX_ALLOWED_WEIGHT: String(e.maxAllowedWeight || 'N/A'),
    FUEL_TANK_CAPACITY: String(e.fuelTankCapacity || 'N/A'),
    NUMBER_OF_DOORS: String(e.numberOfDoors || 'N/A'),
    NUMBER_OF_SEATS: String(e.numberOfSeats || 'N/A'),
    NUMBER_OF_AXLES: String(e.numberOfAxles || '2'),
    ENGINE_NUMBER: String(e.engineNumber || 'N/A'),
    VRM: String(e.vrm || registration || 'N/A'),
    VALUATION_BOOK: String(e.valuationBook || 'Direct'),
    FIRST_MOT_REGISTRATION: String(e.firstMotRegistration || 'N/A'),
    ON_THE_ROAD: String(e.onTheRoad || 'N/A'),
    DEALER_FORECOURT: String(e.dealerForecourt || 'N/A'),
    TRADE_RETAIL_VALUE: String(e.tradeRetailValue || 'N/A'),
    PRIVATE_CLEAN: String(e.privateClean || 'N/A'),
    AVERAGE_PRIVATE_TRADE_VALUE: String(
      e.averagePrivateTradeValue || 'N/A'
    ),
    PART_EXCHANGE: String(e.partExchange || 'N/A'),
    AUCTION_VALUE: String(e.auctionValue || 'N/A'),
    TRADE_AVERAGE: String(e.tradeAverage || 'N/A'),
    TRADE_POOR: String(e.tradePoor || 'N/A'),
    VALUATION_MILEAGE: String(e.valuationMileage || 'N/A'),
  }
}

function safeFilename(reg) {
  const base =
    String(reg || 'vehicle')
      .replace(/[^\w\d-]+/gi, '')
      .slice(0, 32) || 'vehicle'
  return `EpicVIN-Report-${base}.pdf`
}

async function resolveLogoDataUri(cwd) {
  const candidates = [
    path.join(cwd, 'img2', 'epicvin-logos', 'epicvinrecord-logo.png'),
    path.join(cwd, 'img2', 'epicvin-logos', 'epicvinrecord-logo-source.png'),
    path.join(cwd, 'img2', 'epicvin-logos', 'epicvin-main-logo.svg'),
  ]
  for (const logoPath of candidates) {
    try {
      const logoBuf = await fs.readFile(logoPath)
      const ext = path.extname(logoPath).toLowerCase()
      const mime =
        ext === '.svg'
          ? 'image/svg+xml'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : 'image/png'
      return `data:${mime};base64,${logoBuf.toString('base64')}`
    } catch {
      /* try next */
    }
  }
  // Tiny inline SVG fallback so PDF never shows a broken image
  const fallbackSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="40"><text x="0" y="28" font-family="Arial" font-size="22" font-weight="700" fill="#0084FF">EPIC</text><text x="68" y="28" font-family="Arial" font-size="22" font-weight="700" fill="#111">VINRECORD</text></svg>'
  return `data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString('base64')}`
}

async function resolveInspectionBannerDataUri(cwd) {
  const candidates = [
    path.join(cwd, 'img2', 'report', 'car-img.png'),
    path.join(cwd, 'img2', 'report', 'example-car-2.png'),
    path.join(cwd, 'img2', 'report', 'vehicle-inspection-banner.jpg'),
    path.join(cwd, 'img2', 'report', 'vehicle-inspection-banner.png'),
  ]
  for (const imgPath of candidates) {
    try {
      const buf = await fs.readFile(imgPath)
      const ext = path.extname(imgPath).toLowerCase()
      const mime =
        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'
      return `data:${mime};base64,${buf.toString('base64')}`
    } catch {
      /* try next */
    }
  }
  return ''
}

async function generateReportHandler(req, res) {
  const payload = req.body || {}
  const cwd = path.join(__dirname, '..')
  const templatePath = path.join(cwd, 'report-sample.html')

  let rawTemplate
  try {
    rawTemplate = await fs.readFile(templatePath, 'utf8')
  } catch {
    return res.status(500).json({
      success: false,
      message: 'report-sample.html template not found',
    })
  }

  // Drop preview-only script so PDF stays static
  rawTemplate = rawTemplate.replace(
    /<script\b[\s\S]*?<\/script>\s*(?=<\/body>)/gi,
    '<!-- preview scripts omitted for pdf -->\n'
  )

  // Ensure relative assets resolve if any remain (file base href)
  const baseHref = pathToFileURL(path.join(cwd, path.sep)).href
  if (!/<base\s/i.test(rawTemplate)) {
    rawTemplate = rawTemplate.replace(
      /<head([^>]*)>/i,
      `<head$1><base href="${baseHref}">`
    )
  }

  const placeholders = coercePlaceholders(payload)
  placeholders.LOGO_SRC = await resolveLogoDataUri(cwd)
  placeholders.INSPECTION_BANNER_SRC = await resolveInspectionBannerDataUri(cwd)

  // Also force-replace any leftover relative logo paths
  rawTemplate = rawTemplate.replace(
    /src=["'](?:\.\.\/)?img2\/epicvin-logos\/epicvinrecord-logo\.png["']/gi,
    `src="{{LOGO_SRC}}"`
  )
  rawTemplate = rawTemplate.replace(
    /src=["'](?:\.\.\/)?img2\/report\/vehicle-inspection-banner\.(?:jpg|png)["']/gi,
    `src="{{INSPECTION_BANNER_SRC}}"`
  )

  let html = applyPlaceholders(rawTemplate, placeholders)

  let browser
  try {
    const puppeteer = await loadPuppeteer()
    browser = await puppeteer.launch(await getLaunchOptions())
    const page = await browser.newPage()
    await page.setViewport({ width: 1024, height: 1400 })
    await page.emulateMediaType('print')
    await page.setContent(html, { waitUntil: 'load', timeout: 90_000 })
    // Wait for logo image decode
    await page.evaluate(async () => {
      const imgs = Array.from(document.images || [])
      await Promise.all(
        imgs.map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.onload = resolve
                  img.onerror = resolve
                })
        )
      )
    })
    await new Promise((r) => setTimeout(r, 400))

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '10px', right: '10px', bottom: '10px', left: '10px' },
    })

    await browser.close()
    browser = undefined

    const filename = safeFilename(placeholders.REGISTRATION)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    )
    return res.status(200).send(Buffer.from(pdfBuffer))
  } catch (err) {
    if (browser) {
      await browser.close().catch(() => {})
    }
    console.error('PDF generation error:', err)
    const msg = err instanceof Error ? err.message : 'PDF generation failed'
    return res.status(500).json({ success: false, message: msg })
  }
}

module.exports = { generateReportHandler, coercePlaceholders }
