const Groq = require('groq-sdk')

const DEFAULT_MODEL =
  process.env.GROQ_MODEL?.trim() || 'llama-3.1-8b-instant'

function safeParseGroqJson(text) {
  if (!text || typeof text !== 'string') return null
  const trimmed = text.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  const slice =
    start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed
  try {
    return JSON.parse(slice)
  } catch {
    return null
  }
}

function str(v, fallback = 'N/A') {
  if (v === null || v === undefined || v === '') return fallback
  return String(v)
}

/** Treat empty / N/A / prompt example leftovers as missing. */
function cleanStr(v, fallback = 'N/A') {
  if (v === null || v === undefined) return fallback
  let s = String(v).trim()
  if (!s) return fallback
  // Strip accidental "e.g." prefixes from model examples
  s = s.replace(/^e\.g\.\s*/i, '').trim()
  if (!s || /^n\/?a$/i.test(s) || /^null$/i.test(s) || /^undefined$/i.test(s)) {
    return fallback
  }
  return s
}

function cleanTyreDataModel(v, modelFallback) {
  let s = cleanStr(v, '')
  // Groq sometimes copies the bad prompt example "model. Hatchback"
  s = s.replace(/^model\.\s*/i, '').trim()
  if (!s || /^n\/?a$/i.test(s)) {
    return cleanStr(modelFallback, 'Standard')
  }
  return s
}

/** UK CO2 tax band → typical 12-month single payment display. */
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

function cleanTaxPayment(v, taxBand) {
  let s = cleanStr(v, '')
  // Reject leftover prompt text like "e.g. £ 115,-" already stripped by cleanStr,
  // and literal N/A / placeholders
  if (!s || /^n\/?a$/i.test(s) || /example/i.test(s)) {
    const band = String(taxBand || 'E').trim().toUpperCase().slice(0, 1)
    return TAX_BAND_PAYMENT[band] || '£ 145,-'
  }
  // Ensure £ formatting if a bare number came back
  if (/^\d/.test(s) && !s.includes('£')) {
    s = `£ ${s.replace(/\.00$/, '')},-`
  }
  return s
}

function normalizeReportData(obj, registration) {
  const motTests = Array.isArray(obj.motTests) ? obj.motTests : []
  const mileageHistory = Array.isArray(obj.mileageHistory)
    ? obj.mileageHistory
    : []

  return {
    make: str(obj.make),
    model: str(obj.model),
    colour: str(obj.colour || obj.color, 'GREY'),
    yearOfManufacture: str(obj.yearOfManufacture || obj.year),
    gearbox: str(obj.gearbox, 'Automatic'),
    topSpeed: str(obj.topSpeed),
    power: str(obj.power),
    maxTorque: str(obj.maxTorque),
    engineCapacity: str(obj.engineCapacity),
    cylinders: str(obj.cylinders),
    fuelType: str(obj.fuelType),
    consumptionCity: str(obj.consumptionCity, 'mpg'),
    consumptionExtraUrban: str(obj.consumptionExtraUrban, 'mpg'),
    consumptionCombined: str(obj.consumptionCombined),
    co2Emission: str(obj.co2Emission),
    co2Label: str(obj.co2Label, 'A'),
    tyreDataModel: cleanTyreDataModel(
      obj.tyreDataModel,
      obj.model || obj.make
    ),
    enginePowerKw: cleanStr(obj.enginePowerKw),
    standardFitment: cleanStr(obj.standardFitment, 'Yes'),
    frontTyreSize: cleanStr(obj.frontTyreSize),
    rearTyreSize: cleanStr(obj.rearTyreSize),
    frontPressure: cleanStr(obj.frontPressure),
    rearPressure: cleanStr(obj.rearPressure),
    wheelHub: cleanStr(obj.wheelHub),
    motExpiryDate: cleanStr(obj.motExpiryDate),
    motPassRate: cleanStr(obj.motPassRate, '100%'),
    motPassed: cleanStr(obj.motPassed, '0'),
    failedMotTests: cleanStr(obj.failedMotTests, '0'),
    totalAdviceItems: cleanStr(obj.totalAdviceItems, '0'),
    totalItemsFailed: cleanStr(obj.totalItemsFailed, '0'),
    motTests: motTests.map((t, i) => ({
      number: t.number ?? motTests.length - i,
      date: str(t.date, ''),
      result: str(t.result, 'Passed'),
      nextExpiry: t.nextExpiry ? str(t.nextExpiry) : '',
      advice: Array.isArray(t.advice) ? t.advice.map((a) => str(a, '')) : [],
    })),
    taxDaysLeft: cleanStr(obj.taxDaysLeft, '0'),
    taxMotExpiryDisplay: cleanStr(
      obj.taxMotExpiryDisplay || obj.motExpiryDate
    ),
    taxBand: cleanStr(obj.taxBand || obj.co2Label, 'E'),
    taxSinglePayment: cleanTaxPayment(
      obj.taxSinglePayment,
      obj.taxBand || obj.co2Label || 'E'
    ),
    financeStatus: str(
      obj.financeStatus,
      'Clear — No outstanding loans or financial agreements on this vehicle.'
    ),
    damageStatus: str(
      obj.damageStatus,
      'Clear — No record of accidents or damage reported for this vehicle.'
    ),
    stolenStatus: str(obj.stolenStatus, 'Clear — No theft record found.'),
    legalFinancialStatus: str(obj.legalFinancialStatus, 'Clear / No issues'),
    legalWriteOffStatus: str(
      obj.legalWriteOffStatus,
      'Not recorded as write-off'
    ),
    legalAccidentStatus: str(obj.legalAccidentStatus, 'No accident records'),
    legalTheftStatus: str(obj.legalTheftStatus, 'No theft markers'),
    odometerUnit: str(obj.odometerUnit, 'In miles'),
    mileageRegistrations: str(
      obj.mileageRegistrations,
      String(mileageHistory.length || 0)
    ),
    firstMileageRegistration: str(obj.firstMileageRegistration),
    lastMileageRegistration: str(obj.lastMileageRegistration),
    mileageHistory: mileageHistory.map((m, i) => ({
      label: str(m.label, `Registration #${i + 1}`),
      date: str(m.date),
      mileage: str(m.mileage),
    })),
    width: str(obj.width),
    height: str(obj.height),
    length: str(obj.length),
    wheelBase: str(obj.wheelBase),
    kerbWeight: str(obj.kerbWeight),
    maxAllowedWeight: str(obj.maxAllowedWeight),
    fuelTankCapacity: str(obj.fuelTankCapacity),
    numberOfDoors: str(obj.numberOfDoors),
    numberOfSeats: str(obj.numberOfSeats),
    numberOfAxles: str(obj.numberOfAxles, '2'),
    engineNumber: str(obj.engineNumber),
    vrm: str(obj.vrm || registration),
    valuationBook: str(obj.valuationBook, 'Direct'),
    firstMotRegistration: str(obj.firstMotRegistration),
    onTheRoad: str(obj.onTheRoad),
    dealerForecourt: str(obj.dealerForecourt),
    tradeRetailValue: str(obj.tradeRetailValue),
    privateClean: str(obj.privateClean),
    averagePrivateTradeValue: str(obj.averagePrivateTradeValue),
    partExchange: str(obj.partExchange),
    auctionValue: str(obj.auctionValue),
    tradeAverage: str(obj.tradeAverage),
    tradePoor: str(obj.tradePoor),
    valuationMileage: str(obj.valuationMileage),
  }
}

async function lookupVehicleHandler(req, res) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      message:
        'GROQ_API_KEY is not set. Add it to your environment (see .env).',
    })
  }

  const body = req.body || {}
  const registration = String(
    body.registration ?? body.vin ?? body.plate ?? ''
  ).trim()
  const year = String(body.year ?? '').trim()
  const vehicleModel = String(
    body.vehicleModel ?? body.carModel ?? ''
  ).trim()
  const vehicleType = String(body.vehicleType ?? '').trim()

  if (!registration) {
    return res.status(400).json({
      success: false,
      message: 'registration (or vin/plate) is required',
    })
  }

  const identityHint = [
    year && `Year: ${year}`,
    vehicleModel && `Model hint: ${vehicleModel}`,
    vehicleType && `Vehicle type: ${vehicleType}`,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `You are a UK vehicle history report data expert. Given this vehicle identifier, produce a COMPLETE realistic vehicle inspection report dataset.

Registration/VIN/Plate: ${registration}
${identityHint || 'Infer year and model from the registration/VIN if possible.'}

Return ONLY a valid JSON object (no markdown, no explanation) with ALL of these fields filled with realistic values for this vehicle (UK market). Use real typical specs — avoid N/A unless truly unknown:

{
  "make": "manufacturer",
  "model": "model name",
  "colour": "colour in caps e.g. GREY",
  "yearOfManufacture": "YYYY",
  "gearbox": "e.g. 6 speed Automatic",
  "topSpeed": "e.g. 155 mph",
  "power": "e.g. 357 BHP",
  "maxTorque": "e.g. 570 Nm at 3.700 rpm",
  "engineCapacity": "e.g. 1.499 cc",
  "cylinders": "e.g. 3",
  "fuelType": "e.g. Petrol/Electric",
  "consumptionCity": "e.g. mpg or a number with mpg",
  "consumptionExtraUrban": "mpg",
  "consumptionCombined": "e.g. 134.5 mpg",
  "co2Emission": "e.g. 49 g/km",
  "co2Label": "A-M letter",
  "tyreDataModel": "body style for tyre fitment e.g. Hatchback or Coupe (never prefix with model. and never N/A)",
  "enginePowerKw": "e.g. 49 kW",
  "standardFitment": "Yes",
  "frontTyreSize": "e.g. 175/65R14",
  "rearTyreSize": "e.g. 175/65R14",
  "frontPressure": "e.g. 2.00 bar / 29.00 psi",
  "rearPressure": "e.g. 2.00 bar / 29.00 psi",
  "wheelHub": "e.g. PCD 4x100 | Centre bore 54.10 mm",
  "motExpiryDate": "YYYY-MM-DD",
  "motPassRate": "e.g. 100%",
  "motPassed": "number as string",
  "failedMotTests": "0",
  "totalAdviceItems": "number",
  "totalItemsFailed": "0",
  "motTests": [
    {
      "number": 5,
      "date": "YYYY-MM-DD HH:MM AM/PM",
      "result": "Passed",
      "nextExpiry": "YYYY-MM-DD",
      "advice": ["optional advice text"]
    }
  ],
  "taxDaysLeft": "number",
  "taxMotExpiryDisplay": "e.g. 13 Aug 2026",
  "taxBand": "letter A-M matching CO2 (never N/A)",
  "taxSinglePayment": "UK 12-month tax amount e.g. £ 145,- (never N/A)",
  "financeStatus": "Clear — No outstanding loans or financial agreements on this vehicle.",
  "damageStatus": "Clear — No record of accidents or damage reported for this vehicle.",
  "stolenStatus": "Clear — No theft record found.",
  "legalFinancialStatus": "Clear / No issues",
  "legalWriteOffStatus": "Not recorded as write-off",
  "legalAccidentStatus": "No accident records",
  "legalTheftStatus": "No theft markers",
  "odometerUnit": "In miles",
  "mileageRegistrations": "5",
  "firstMileageRegistration": "YYYY-MM-DD",
  "lastMileageRegistration": "YYYY-MM-DD",
  "mileageHistory": [
    { "label": "Registration #1", "date": "YYYY-MM-DD", "mileage": "21.394 mi" }
  ],
  "width": "e.g. 1.942 mm",
  "height": "e.g. 1.297 mm",
  "length": "e.g. 4.689 mm",
  "wheelBase": "e.g. 2.800 mm",
  "kerbWeight": "e.g. 1.485 kg",
  "maxAllowedWeight": "e.g. 1.870 kg",
  "fuelTankCapacity": "e.g. 42 L",
  "numberOfDoors": "3",
  "numberOfSeats": "4",
  "numberOfAxles": "2",
  "engineNumber": "alphanumeric",
  "vrm": "${registration}",
  "valuationBook": "Direct",
  "firstMotRegistration": "DD-MM-YYYY",
  "onTheRoad": "number with thousands dots e.g. 103.810",
  "dealerForecourt": "33.239",
  "tradeRetailValue": "31.304",
  "privateClean": "28.778",
  "averagePrivateTradeValue": "27.864",
  "partExchange": "27.615",
  "auctionValue": "26.990",
  "tradeAverage": "26.059",
  "tradePoor": "23.068",
  "valuationMileage": "73.731"
}

Include 3-5 motTests (newest first) and matching mileageHistory entries. Keep finance/damage/stolen as Clear unless you have a strong reason. Use UK formatting.`

  try {
    const client = new Groq({ apiKey })
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.3,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content:
            'You output only compact JSON matching the requested schema. No markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? ''
    const parsed = safeParseGroqJson(text)

    if (!parsed) {
      return res.status(502).json({
        success: false,
        message:
          'Could not parse structured vehicle data from the model response.',
        rawPreview: text.slice(0, 500),
      })
    }

    const data = normalizeReportData(parsed, registration)
    return res.json({ success: true, data })
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Groq lookup request failed'
    return res.status(502).json({ success: false, message: msg })
  }
}

module.exports = { lookupVehicleHandler, normalizeReportData }
