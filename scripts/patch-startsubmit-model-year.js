const fs = require('fs')

const files = [
  'price/index.html',
  'vin-decoder/index.html',
  'license-plate-lookup/index.html',
  'sample-vehicle-history-report/index.html',
]

function patchFile(file) {
  let s = fs.readFileSync(file, 'utf8')
  const original = s

  // startSubmit call
  s = s.replace(
    /openPaymentCheckout\(vin, plate, vehicleType, customerEmail\);/g,
    `openPaymentCheckout(vin, plate, vehicleType, customerEmail, carModel, year);`
  )

  // Inject model/year read before sendFormDataToEmail in startSubmit if missing
  if (!s.includes("readModelYearFromForm(form)") || !s.includes('Please enter Vehicle Model')) {
    s = s.replace(
      /(\/\/ Get vehicle type from the form\r?\n\s*let vehicleTypeSelect = form\.querySelector\('select\[name="vehicle_type"\]'\);\r?\n\s*let vehicleType = vehicleTypeSelect \? vehicleTypeSelect\.value : 'sedan';\r?\n\r?\n)(\s*\/\/ Send form data to email and open checkout modal)/,
      `$1
            let modelYear = typeof readModelYearFromForm === 'function' ? readModelYearFromForm(form) : { carModel: '', year: '' };
            let carModel = modelYear.carModel || '';
            let year = modelYear.year || '';
            if (!carModel || !year) {
                alert('Please enter Vehicle Model and Model Year.');
                return;
            }

$2`
    )
  }

  // Interceptor VIN
  s = s.replace(
    /window\.openPaymentCheckout\(vin, null, vehicleType, customerEmail\);/g,
    `window.openPaymentCheckout(vin, null, vehicleType, customerEmail, (typeof readModelYearFromForm === 'function' ? readModelYearFromForm(form).carModel : ''), (typeof readModelYearFromForm === 'function' ? readModelYearFromForm(form).year : ''));`
  )

  // Interceptor plate
  s = s.replace(
    /window\.openPaymentCheckout\(null, plate, vehicleType, customerEmail\);/g,
    `window.openPaymentCheckout(null, plate, vehicleType, customerEmail, (typeof readModelYearFromForm === 'function' ? readModelYearFromForm(form).carModel : ''), (typeof readModelYearFromForm === 'function' ? readModelYearFromForm(form).year : ''));`
  )

  if (s !== original) {
    fs.writeFileSync(file, s)
    console.log('patched', file)
  } else {
    console.log('unchanged', file)
  }
}

for (const f of files) patchFile(f)
