const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'report-sample.html')
const dest = path.join(__dirname, '..', 'report-template', 'index.html')
const html = fs.readFileSync(src, 'utf8')
const headEnd = html.indexOf('</head>')
const head = html
  .slice(0, headEnd + 7)
  .replace(/<title>[^<]*<\/title>/, '<title>Vehicle Inspection Report - {{REGISTRATION}}</title>')

const body = `<body>
<div class="page">

  <!-- HEADER -->
  <div class="top-header">
    <div class="logo">
      <div class="logo-icon">🚗<span class="check">✓</span></div>
      <div class="logo-text"><span class="veh">VEHICLE</span><span class="insp">INSPECTIONS</span></div>
    </div>
    <div class="report-date-badge">Report Date:{{REPORT_DATE}}</div>
  </div>

  <!-- HERO -->
  <div class="hero">
    <div class="hero-left">
      <h1>{{BANNER_TITLE}}</h1>
      <div class="hero-make">
        <div class="roundel"></div>
        <span>{{MAKE}}</span>
      </div>
    </div>
    <div class="hero-right">
      <div class="plate">{{REGISTRATION}}</div>
      <div class="plate-label">REGISTRATION NUMBER</div>
    </div>
  </div>

  <!-- GENERAL INFORMATION -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon red">🚗</div>
      <div>
        <p class="section-title">General Information</p>
        <p class="section-sub">Basic vehicle specifications and details</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="card">
      <div class="row2 shaded"><div class="cell-label">MAKE</div><div class="cell-value">{{MAKE}}</div></div>
      <div class="row2 plain"><div class="cell-label">MODEL</div><div class="cell-value">{{MODEL}}</div></div>
      <div class="row2 shaded"><div class="cell-label">COLOUR</div><div class="cell-value">{{COLOUR}}</div></div>
      <div class="row2 plain"><div class="cell-label">YEAR OF MANUFACTURE</div><div class="cell-value">{{YEAR}}</div></div>
      <div class="row2 shaded"><div class="cell-label">GEARBOX</div><div class="cell-value">{{GEARBOX}}</div></div>
      <div class="row2 plain"><div class="cell-label">TOP SPEED</div><div class="cell-value">{{TOP_SPEED}}</div></div>
    </div>
  </div>

  <!-- ENGINE & FUEL -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon">⚙️</div>
      <div>
        <p class="section-title">Engine &amp; Fuel Consumption</p>
        <p class="section-sub">Technical specifications and environmental data</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="two-col">
      <div class="card">
        <div class="row2 shaded"><div class="cell-label">POWER</div><div class="cell-value">{{POWER}}</div></div>
        <div class="row2 plain"><div class="cell-label">MAX. TORQUE</div><div class="cell-value">{{MAX_TORQUE}}</div></div>
        <div class="row2 shaded"><div class="cell-label">ENGINE CAPACITY</div><div class="cell-value">{{ENGINE_CAPACITY}}</div></div>
        <div class="row2 plain"><div class="cell-label">CYLINDERS</div><div class="cell-value">{{CYLINDERS}}</div></div>
        <div class="row2 shaded"><div class="cell-label">FUEL TYPE</div><div class="cell-value">{{FUEL_TYPE}}</div></div>
        <div class="row2 plain"><div class="cell-label">CONSUMPTION CITY</div><div class="cell-value">{{CONSUMPTION_CITY}}</div></div>
        <div class="row2 shaded"><div class="cell-label">CONSUMPTION EXTRA URBAN</div><div class="cell-value">{{CONSUMPTION_EXTRA_URBAN}}</div></div>
        <div class="row2 plain"><div class="cell-label">CONSUMPTION COMBINED</div><div class="cell-value">{{CONSUMPTION_COMBINED}}</div></div>
        <div class="row2 shaded"><div class="cell-label">CO2 EMISSION</div><div class="cell-value">{{CO2_EMISSION}}</div></div>
        <div class="row2 plain"><div class="cell-label">CO2 LABEL</div><div class="cell-value">{{CO2_LABEL}}</div></div>
      </div>

      <div class="co2-card">
        <p class="co2-title">CO2 Emissions Label</p>
        <div class="co2-row">
          <div class="co2-bar" style="width:62%;background:#0a8a3c;">0 &lt; 101</div>
          <div class="co2-flag" style="left:64%;">LABEL {{CO2_LABEL}}</div>
        </div>
        <div class="co2-row">
          <div class="co2-bar" style="width:52%;background:#3fb04f;">101 - 120<span class="co2-letters">B<br>C</span></div>
        </div>
        <div class="co2-row">
          <div class="co2-bar" style="width:47%;background:#8bc34a;">121 - 140<span class="co2-letters">D<br>E</span></div>
        </div>
        <div class="co2-row">
          <div class="co2-bar" style="width:42%;background:#ffc107;">141 - 165<span class="co2-letters">F<br>G</span></div>
        </div>
        <div class="co2-row">
          <div class="co2-bar" style="width:37%;background:#ff9800;">166 - 185<span class="co2-letters">H</span></div>
        </div>
        <div class="co2-row">
          <div class="co2-bar" style="width:32%;background:#f4511e;">186 - 225<span class="co2-letters">I<br>J</span></div>
        </div>
        <div class="co2-row">
          <div class="co2-bar" style="width:27%;background:#d32f2f;">225+<span class="co2-letters">K<br>L<br>M</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- TYRE & WHEEL -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon">📏</div>
      <div>
        <p class="section-title">Tyre &amp; Wheel Details</p>
        <p class="section-sub">Factory tyre sizes, pressures and fitment</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="two-col">
      <div class="card">
        <div class="row2 shaded"><div class="cell-label">TYRE DATA MODEL</div><div class="cell-value">{{TYRE_DATA_MODEL}}</div></div>
        <div class="row2 plain"><div class="cell-label">ENGINE POWER (KW)</div><div class="cell-value">{{ENGINE_POWER_KW}}</div></div>
        <div class="row2 shaded"><div class="cell-label">STANDARD FITMENT</div><div class="cell-value">{{STANDARD_FITMENT}}</div></div>
      </div>
      <div class="card">
        <div class="row2 shaded"><div class="cell-label">FRONT TYRE SIZE</div><div class="cell-value">{{FRONT_TYRE_SIZE}}</div></div>
        <div class="row2 plain"><div class="cell-label">REAR TYRE SIZE</div><div class="cell-value">{{REAR_TYRE_SIZE}}</div></div>
        <div class="row2 shaded"><div class="cell-label">FRONT PRESSURE (BAR / PSI)</div><div class="cell-value">{{FRONT_PRESSURE}}</div></div>
        <div class="row2 plain"><div class="cell-label">REAR PRESSURE (BAR / PSI)</div><div class="cell-value">{{REAR_PRESSURE}}</div></div>
        <div class="row2 shaded"><div class="cell-label">WHEEL / HUB</div><div class="cell-value">{{WHEEL_HUB}}</div></div>
      </div>
    </div>
  </div>

  <!-- MOT HISTORY -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon">📋</div>
      <div>
        <p class="section-title">MOT History</p>
        <p class="section-sub">Vehicle MOT test results and statistics</p>
      </div>
    </div>
    <hr class="section-rule">

    <div class="two-col" style="margin-bottom:18px;">
      <div class="stat-card">
        <div class="stat-card-head">🕐 Current MOT Status</div>
        <div class="row2 shaded"><div class="cell-label">MOT EXPIRY DATE</div><div class="cell-value">{{MOT_EXPIRY_DATE}}</div></div>
        <div class="row2 plain">
          <div class="cell-label">MOT PASS RATE</div>
          <div class="cell-value">
            Pass Rate <strong style="color:var(--green)">{{MOT_PASS_RATE}}</strong>
            <div class="progress-track"><div class="progress-fill" style="width:{{MOT_PASS_RATE_WIDTH}}"></div></div>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-head">📊 MOT Statistics</div>
        <div class="row2 shaded"><div class="cell-label">MOT PASSED</div><div class="cell-value">{{MOT_PASSED}}</div></div>
        <div class="row2 plain"><div class="cell-label">FAILED MOT TESTS</div><div class="cell-value">{{FAILED_MOT_TESTS}}</div></div>
        <div class="row2 shaded"><div class="cell-label">TOTAL ADVICE ITEMS</div><div class="cell-value">{{TOTAL_ADVICE_ITEMS}}</div></div>
        <div class="row2 plain"><div class="cell-label">TOTAL ITEMS FAILED</div><div class="cell-value">{{TOTAL_ITEMS_FAILED}}</div></div>
      </div>
    </div>

    <div class="card">
      <div style="padding:14px 18px; font-size:13px; font-weight:700; display:flex; align-items:center; gap:6px; border-bottom:1px solid var(--border);">🕐 Recent MOT Tests</div>
      {{MOT_HISTORY_HTML}}
    </div>
  </div>

  <!-- TAX & MOT CHECK -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon">📅</div>
      <div>
        <p class="section-title">Tax &amp; MOT Check</p>
        <p class="section-sub">Vehicle tax and MOT status information</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="card">
      <div class="row2 shaded"><div class="cell-label">DAYS LEFT</div><div class="cell-value" style="font-weight:700;">{{TAX_DAYS_LEFT}}</div></div>
      <div class="row2 plain"><div class="cell-label">MOT EXPIRY DATE</div><div class="cell-value" style="font-weight:700;">{{TAX_MOT_EXPIRY_DISPLAY}}</div></div>
    </div>
  </div>

  <!-- TAX CALCULATION -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon orange">💰</div>
      <div>
        <p class="section-title">Tax Calculation</p>
        <p class="section-sub">Vehicle tax band and calculation details</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="card">
      <div class="row2 shaded"><div class="cell-label">BAND</div><div class="cell-value" style="font-weight:700;">{{TAX_BAND}}</div></div>
      <div class="row2 plain"><div class="cell-label">SINGLE PAYMENT (12 MONTHS)</div><div class="cell-value" style="font-weight:700;">{{TAX_SINGLE_PAYMENT}}</div></div>
    </div>
  </div>

  <!-- FINANCE CHECK -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon">🏦</div>
      <div>
        <p class="section-title">Finance Check</p>
        <p class="section-sub">Outstanding finance and loan information</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="clear-box"><span class="tick">✔</span> {{FINANCE_STATUS}}</div>
  </div>

  <!-- DAMAGE HISTORY -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon red">🚗</div>
      <div>
        <p class="section-title">Damage History</p>
        <p class="section-sub">Accident and damage records</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="clear-box"><span class="tick">✔</span> {{DAMAGE_STATUS}}</div>

    <div class="car-diagram">
      <svg width="360" height="260" viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" stroke="#333" stroke-width="1.5">
          <rect x="110" y="10" width="140" height="100" rx="35"/>
          <line x1="110" y1="60" x2="60" y2="45" />
          <line x1="250" y1="60" x2="300" y2="45" />
          <rect x="110" y="150" width="140" height="100" rx="35"/>
          <line x1="110" y1="200" x2="60" y2="215" />
          <line x1="250" y1="200" x2="300" y2="215" />
        </g>
        <text x="180" y="135" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" letter-spacing="2" fill="#333">{{MAKE}} {{MODEL}}</text>
      </svg>
    </div>
  </div>

  <!-- STOLEN STATUS -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon">🔒</div>
      <div>
        <p class="section-title">Stolen Status</p>
        <p class="section-sub">Theft and security status check</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="clear-box"><span class="tick">✔</span> {{STOLEN_STATUS}}</div>
  </div>

  <!-- MILEAGE CHECK -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon">📊</div>
      <div>
        <p class="section-title">Mileage Check</p>
        <p class="section-sub">Odometer readings and mileage history</p>
      </div>
    </div>
    <hr class="section-rule">

    <p style="font-size:13px;font-weight:700;margin:0 0 8px 2px;">✳️ Current Status</p>
    <div class="card" style="margin-bottom:18px;">
      <div class="row2 shaded"><div class="cell-label">Odometer</div><div class="cell-value">{{ODOMETER_UNIT}}</div></div>
      <div class="row2 plain"><div class="cell-label">Mileage registrations</div><div class="cell-value">{{MILEAGE_REGISTRATIONS}}</div></div>
      <div class="row2 shaded"><div class="cell-label">First mileage registration</div><div class="cell-value">{{FIRST_MILEAGE_REGISTRATION}}</div></div>
      <div class="row2 plain"><div class="cell-label">Last registration</div><div class="cell-value">{{LAST_MILEAGE_REGISTRATION}}</div></div>
    </div>

    <p style="font-size:13px;font-weight:700;margin:0 0 8px 2px;">📊 Mileage History</p>
    <div class="card">
      <table class="data-table">
        <thead>
          <tr><th>REGISTRATION</th><th>DATE</th><th>MILEAGE</th></tr>
        </thead>
        <tbody>
          {{MILEAGE_HISTORY_HTML}}
        </tbody>
      </table>
    </div>
  </div>

  <!-- DIMENSIONS & WEIGHT -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon">📏</div>
      <div>
        <p class="section-title">Dimensions &amp; Weight</p>
        <p class="section-sub">Physical specifications and measurements</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="card">
      <div class="row2 shaded"><div class="cell-label">WIDTH</div><div class="cell-value">{{WIDTH}}</div></div>
      <div class="row2 plain"><div class="cell-label">HEIGHT</div><div class="cell-value">{{HEIGHT}}</div></div>
      <div class="row2 shaded"><div class="cell-label">LENGTH</div><div class="cell-value">{{LENGTH}}</div></div>
      <div class="row2 plain"><div class="cell-label">WHEEL BASE</div><div class="cell-value">{{WHEEL_BASE}}</div></div>
      <div class="row2 shaded"><div class="cell-label">KERB WEIGHT</div><div class="cell-value">{{KERB_WEIGHT}}</div></div>
      <div class="row2 plain"><div class="cell-label">MAX. ALLOWED WEIGHT</div><div class="cell-value">{{MAX_ALLOWED_WEIGHT}}</div></div>
    </div>
  </div>

  <!-- ADDITIONAL INFORMATION -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon">⚙️</div>
      <div>
        <p class="section-title">Additional Information</p>
        <p class="section-sub">Vehicle configuration and identifiers</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="card">
      <div class="row2 shaded"><div class="cell-label">FUEL TANK CAPACITY</div><div class="cell-value">{{FUEL_TANK_CAPACITY}}</div></div>
      <div class="row2 plain"><div class="cell-label">NUMBER OF DOORS</div><div class="cell-value">{{NUMBER_OF_DOORS}}</div></div>
      <div class="row2 shaded"><div class="cell-label">NUMBER OF SEATS</div><div class="cell-value">{{NUMBER_OF_SEATS}}</div></div>
      <div class="row2 plain"><div class="cell-label">NUMBER OF AXLES</div><div class="cell-value">{{NUMBER_OF_AXLES}}</div></div>
      <div class="row2 shaded"><div class="cell-label">ENGINE NUMBER</div><div class="cell-value">{{ENGINE_NUMBER}}</div></div>
    </div>
  </div>

  <!-- VEHICLE VALUATION -->
  <div class="section">
    <div class="section-head">
      <div class="section-icon orange">💰</div>
      <div>
        <p class="section-title">Vehicle Valuation</p>
        <p class="section-sub">Market and trade-in value estimates</p>
      </div>
    </div>
    <hr class="section-rule">
    <div class="card">
      <div class="row2 shaded"><div class="cell-label">VRM</div><div class="cell-value">{{VRM}}</div></div>
      <div class="row2 plain"><div class="cell-label">VALUATION BOOK</div><div class="cell-value">{{VALUATION_BOOK}}</div></div>
      <div class="row2 shaded"><div class="cell-label">FIRST MOT REGISTRATION</div><div class="cell-value">{{FIRST_MOT_REGISTRATION}}</div></div>
      <div class="row2 plain"><div class="cell-label">ON THE ROAD</div><div class="cell-value">{{ON_THE_ROAD}}</div></div>
      <div class="row2 shaded"><div class="cell-label">DEALER FORECOURT</div><div class="cell-value">{{DEALER_FORECOURT}}</div></div>
      <div class="row2 plain"><div class="cell-label">TRADE RETAIL VALUE</div><div class="cell-value">{{TRADE_RETAIL_VALUE}}</div></div>
      <div class="row2 shaded"><div class="cell-label">PRIVATE CLEAN</div><div class="cell-value">{{PRIVATE_CLEAN}}</div></div>
      <div class="row2 plain"><div class="cell-label">AVERAGE PRIVATE TRADE VALUE</div><div class="cell-value">{{AVERAGE_PRIVATE_TRADE_VALUE}}</div></div>
      <div class="row2 shaded"><div class="cell-label">PART EXCHANGE</div><div class="cell-value">{{PART_EXCHANGE}}</div></div>
      <div class="row2 plain"><div class="cell-label">AUCTION VALUE</div><div class="cell-value">{{AUCTION_VALUE}}</div></div>
      <div class="row2 shaded"><div class="cell-label">TRADE AVERAGE</div><div class="cell-value">{{TRADE_AVERAGE}}</div></div>
      <div class="row2 plain"><div class="cell-label">TRADE POOR</div><div class="cell-value">{{TRADE_POOR}}</div></div>
      <div class="row2 shaded"><div class="cell-label">VALUATION MILEAGE</div><div class="cell-value">{{VALUATION_MILEAGE}}</div></div>
    </div>
  </div>

</div>
</body>
</html>
`

fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.writeFileSync(dest, head + '\n' + body)
console.log('Wrote', dest)
