/**
 * Wire report-sample.html dynamic fields to PDF placeholders,
 * then sync a copy into report-template for backup.
 */
const fs = require('fs')
const path = require('path')

const samplePath = path.join(__dirname, '..', 'report-sample.html')
let html = fs.readFileSync(samplePath, 'utf8')

html = html.replace(
  /<title>Vehicle Inspection Report - [^<]*<\/title>/,
  '<title>Vehicle Inspection Report - {{REGISTRATION}}</title>'
)

const replacements = [
  // Hero
  [/<h1>BMW i8 i8<\/h1>/, '<h1>{{BANNER_TITLE}}</h1>'],
  [/<div class="plate">MF18OBG<\/div>/, '<div class="plate">{{REGISTRATION}}</div>'],

  // General info
  [
    /<div class="row2 shaded"><div class="cell-label">MAKE<\/div><div class="cell-value">BMW<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">MAKE</div><div class="cell-value">{{MAKE}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">MODEL<\/div><div class="cell-value">i8<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">MODEL</div><div class="cell-value">{{MODEL}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">DOOR<\/div><div class="cell-value">4<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">DOOR</div><div class="cell-value">{{NUMBER_OF_DOORS}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">YEAR OF MANUFACTURE<\/div><div class="cell-value">2018<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">YEAR OF MANUFACTURE</div><div class="cell-value">{{YEAR}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">GEARBOX<\/div><div class="cell-value">6 speed Automatic<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">GEARBOX</div><div class="cell-value">{{GEARBOX}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">TOP SPEED<\/div><div class="cell-value">155 mph<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">TOP SPEED</div><div class="cell-value">{{TOP_SPEED}}</div></div>',
  ],

  // Engine
  [
    /<div class="row2 shaded"><div class="cell-label">POWER<\/div><div class="cell-value">357 BHP<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">POWER</div><div class="cell-value">{{POWER}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">MAX\. TORQUE<\/div><div class="cell-value">570 Nm at 3\.700 rpm<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">MAX. TORQUE</div><div class="cell-value">{{MAX_TORQUE}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">ENGINE CAPACITY<\/div><div class="cell-value">1\.499 cc<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">ENGINE CAPACITY</div><div class="cell-value">{{ENGINE_CAPACITY}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">CYLINDERS<\/div><div class="cell-value">3<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">CYLINDERS</div><div class="cell-value">{{CYLINDERS}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">FUEL TYPE<\/div><div class="cell-value">Petrol\/Electric<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">FUEL TYPE</div><div class="cell-value">{{FUEL_TYPE}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">CONSUMPTION CITY<\/div><div class="cell-value">mpg<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">CONSUMPTION CITY</div><div class="cell-value">{{CONSUMPTION_CITY}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">CONSUMPTION EXTRA URBAN<\/div><div class="cell-value">mpg<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">CONSUMPTION EXTRA URBAN</div><div class="cell-value">{{CONSUMPTION_EXTRA_URBAN}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">CONSUMPTION COMBINED<\/div><div class="cell-value">134\.5 mpg<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">CONSUMPTION COMBINED</div><div class="cell-value">{{CONSUMPTION_COMBINED}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">CO2 EMISSION<\/div><div class="cell-value">49 g\/km<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">CO2 EMISSION</div><div class="cell-value">{{CO2_EMISSION}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">CO2 LABEL<\/div><div class="cell-value">A<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">CO2 LABEL</div><div class="cell-value">{{CO2_LABEL}}</div></div>',
  ],
  [
    /LABEL A<\/div>/,
    'LABEL {{CO2_LABEL}}</div>',
  ],

  // Tyres
  [
    /<div class="row2 shaded"><div class="cell-label">TYRE DATA MODEL<\/div><div class="cell-value">i8\. Coupe<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">TYRE DATA MODEL</div><div class="cell-value">{{TYRE_DATA_MODEL}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">ENGINE POWER \(KW\)<\/div><div class="cell-value">266 kW<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">ENGINE POWER (KW)</div><div class="cell-value">{{ENGINE_POWER_KW}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">STANDARD FITMENT<\/div><div class="cell-value">Yes<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">STANDARD FITMENT</div><div class="cell-value">{{STANDARD_FITMENT}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">FRONT TYRE SIZE<\/div><div class="cell-value">195\/50R20<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">FRONT TYRE SIZE</div><div class="cell-value">{{FRONT_TYRE_SIZE}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">REAR TYRE SIZE<\/div><div class="cell-value">215\/45R20<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">REAR TYRE SIZE</div><div class="cell-value">{{REAR_TYRE_SIZE}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">FRONT PRESSURE \(BAR \/ PSI\)<\/div><div class="cell-value">2\.20 bar \/ 32\.00 psi<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">FRONT PRESSURE (BAR / PSI)</div><div class="cell-value">{{FRONT_PRESSURE}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">REAR PRESSURE \(BAR \/ PSI\)<\/div><div class="cell-value">2\.20 bar \/ 32\.00 psi<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">REAR PRESSURE (BAR / PSI)</div><div class="cell-value">{{REAR_PRESSURE}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">WHEEL \/ HUB<\/div><div class="cell-value">PCD 5x112 \| Centre bore 66\.70 mm<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">WHEEL / HUB</div><div class="cell-value">{{WHEEL_HUB}}</div></div>',
  ],

  // Tax / status boxes
  [
    /<div class="row2 shaded"><div class="cell-label">BAND<\/div><div class="cell-value" style="font-weight:700;">A<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">BAND</div><div class="cell-value" style="font-weight:700;">{{TAX_BAND}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">SINGLE PAYMENT \(12 MONTHS\)<\/div><div class="cell-value" style="font-weight:700;">N\/A,-<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">SINGLE PAYMENT (12 MONTHS)</div><div class="cell-value" style="font-weight:700;">{{TAX_SINGLE_PAYMENT}}</div></div>',
  ],
  [
    /Clear — No outstanding loans or financial agreements on this vehicle\./,
    '{{FINANCE_STATUS}}',
  ],
  [
    /Clear — No record of accidents or damage reported for this vehicle\./,
    '{{DAMAGE_STATUS}}',
  ],
  [
    /Clear — No theft record found\./,
    '{{STOLEN_STATUS}}',
  ],
  [
    />EXAMPLE EXAMPLE EXAMPLE<\/text>/,
    '>{{MAKE}} {{MODEL}}</text>',
  ],

  // Dimensions
  [
    /<div class="row2 shaded"><div class="cell-label">WIDTH<\/div><div class="cell-value">1\.942 mm<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">WIDTH</div><div class="cell-value">{{WIDTH}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">HEIGHT<\/div><div class="cell-value">1\.297 mm<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">HEIGHT</div><div class="cell-value">{{HEIGHT}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">LENGTH<\/div><div class="cell-value">4\.689 mm<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">LENGTH</div><div class="cell-value">{{LENGTH}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">WHEEL BASE<\/div><div class="cell-value">2\.800 mm<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">WHEEL BASE</div><div class="cell-value">{{WHEEL_BASE}}</div></div>',
  ],
  [
    /<div class="row2 shaded"><div class="cell-label">KERB WEIGHT<\/div><div class="cell-value">1\.485 kg<\/div><\/div>/,
    '<div class="row2 shaded"><div class="cell-label">KERB WEIGHT</div><div class="cell-value">{{KERB_WEIGHT}}</div></div>',
  ],
  [
    /<div class="row2 plain"><div class="cell-label">MAX\. ALLOWED WEIGHT<\/div><div class="cell-value">1\.870 kg<\/div><\/div>/,
    '<div class="row2 plain"><div class="cell-label">MAX. ALLOWED WEIGHT</div><div class="cell-value">{{MAX_ALLOWED_WEIGHT}}</div></div>',
  ],
]

let count = 0
for (const [re, to] of replacements) {
  if (re.test(html)) {
    html = html.replace(re, to)
    count++
  } else {
    console.warn('MISS:', String(re).slice(0, 80))
  }
}

fs.writeFileSync(samplePath, html)
console.log('Updated report-sample.html placeholders:', count)

// Sync full sample into report-template (PDF backup path)
const templatePath = path.join(__dirname, '..', 'report-template', 'index.html')
fs.copyFileSync(samplePath, templatePath)
console.log('Synced report-template/index.html from report-sample.html')
