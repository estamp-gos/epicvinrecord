/** Bank transfer payment configuration (matches VinXtract flow) */

var CARD_PRICE_GBP = 59.99;
var BANK_PRICE_GBP = 52.99;
var BANK_DISCOUNT_GBP = 7;

var WISE_BANK_URL = 'https://wise.com/pay/r/3z3m7dxtCGb6A6g';

var PROOF_EMAIL_TO = 'rmoto7817@gmail.com';
var SUPPORT_EMAIL = 'car.check.store@gmail.com';

var UPLOAD_PROOF_PATH = 'upload-proof/index.html';

var MAX_PROOF_FILE_BYTES = 4 * 1024 * 1024;

/** Update after deploying cloudflare-worker.js */
var PROOF_UPLOAD_API = 'https://cold-hat-5fd3.rmoto7817.workers.dev/upload-proof';

function formatGbpPrice(amount) {
  var value = Number(amount);
  var formatted = Number.isInteger(value)
    ? value.toLocaleString('en-GB')
    : value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '\u00A3' + formatted;
}

function buildUploadProofUrl() {
  var path = window.location.pathname.replace(/\\/g, '/');
  var subPages = [
    '/price/',
    '/vin-decoder/',
    '/license-plate-lookup/',
    '/sample-vehicle-history-report/'
  ];
  for (var i = 0; i < subPages.length; i++) {
    if (path.indexOf(subPages[i]) !== -1) {
      return '../upload-proof/index.html';
    }
  }
  return 'upload-proof/index.html';
}

function buildVinReport(vin, plate, email, vehicleType) {
  return {
    vin: vin || '',
    plate: plate || '',
    email: email || '',
    vehicleType: vehicleType || 'basic',
    tier: 'basic',
    tierName: 'basic',
    tierPrice: CARD_PRICE_GBP,
    currency: 'GBP',
    currencySymbol: '\u00A3',
    timestamp: new Date().toISOString()
  };
}

function openPaymentCheckout(vin, plate, vehicleType, customerEmail) {
  var report = buildVinReport(vin, plate, customerEmail, vehicleType);
  try {
    localStorage.setItem('vinReport', JSON.stringify(report));
  } catch (e) { /* continue */ }
  if (typeof openCheckoutModal === 'function') {
    openCheckoutModal(report);
  }
}
