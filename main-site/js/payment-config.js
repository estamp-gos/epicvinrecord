/** Bank transfer payment configuration (matches VinXtract flow) */

var CARD_PRICE_GBP = 54.99;
var PAYPAL_CARD_URL = 'https://www.paypal.com/ncp/payment/FFWBH4VTGWVCS';
var BANK_PRICE_GBP = 52.99;
var BANK_DISCOUNT_GBP = 7;

var WISE_BANK_URL = 'https://wise.com/pay/r/3z3m7dxtCGb6A6g';

var PROOF_EMAIL_TO = 'rmoto7817@gmail.com';
var SUPPORT_EMAIL = 'car.check.store@gmail.com';

var UPLOAD_PROOF_PATH = 'upload-proof/index.html';

var MAX_PROOF_FILE_BYTES = 4 * 1024 * 1024;

/** VIN search form emails → car.check.store@gmail.com */
var WEB3FORMS_ACCESS_KEY = 'b396a128-42aa-46b7-8925-4cbd91f02d4e';

/**
 * Payment proof (screenshot) emails → rmoto7817@gmail.com
 * Free Web3Forms sends ONLY to the email used when creating this key.
 * 1. Open https://web3forms.com
 * 2. Enter rmoto7817@gmail.com → Get Access Key (check inbox/spam)
 * 3. Paste the new key below (do NOT reuse the car.check key)
 */
var PROOF_WEB3FORMS_ACCESS_KEY = 'ed2eccaf-228f-4d68-96ee-936f838f755a';

/** Optional Cloudflare Worker (deploy wrangler.toml first). Web3Forms is primary. */
var PROOF_UPLOAD_API = 'https://epicvinrecord.rmoto7817.workers.dev/upload-proof';
var USE_WORKER_FOR_PROOF = false;

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

/**
 * Send VIN/plate form entry notification to SUPPORT_EMAIL via Web3Forms.
 * Free Web3Forms delivers only to the inbox used when creating WEB3FORMS_ACCESS_KEY.
 */
async function sendFormDataToEmail(vin, plate, state, vehicleType, searchType, customerEmail) {
  try {
    var emailSubject = 'New ' + (searchType === 'vin' ? 'VIN' : 'License Plate') + ' Check Request';
    var lines = ['New Vehicle Check Request'];

    if (customerEmail) {
      lines.push('Customer Email: ' + customerEmail);
    }
    if (vin) {
      lines.push('VIN: ' + vin);
    }
    if (plate) {
      lines.push('Plate: ' + plate);
    }
    if (state) {
      lines.push('State: ' + state);
    }
    lines.push('Vehicle Type: ' + (vehicleType || 'sedan'));
    lines.push('Search Type: ' + (searchType || 'vin'));
    lines.push('Timestamp: ' + new Date().toLocaleString());

    var formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', emailSubject);
    formData.append('from_name', 'EpicVINrecord');
    formData.append('message', lines.join('\n'));
    if (customerEmail) {
      formData.append('replyto', customerEmail);
    }

    var response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    var result = await response.json();

    if (response.ok && result.success) {
      console.log('Entry form email sent to ' + SUPPORT_EMAIL);
      return true;
    }

    console.error('Failed to send entry form email:', result.message || result);
    return false;
  } catch (error) {
    console.error('Error sending entry form email:', error);
    return false;
  }
}

window.sendFormDataToEmail = sendFormDataToEmail;

window.openPaymentCheckout = function (vin, plate, vehicleType, customerEmail) {
  var report = buildVinReport(vin, plate, customerEmail, vehicleType);
  try {
    localStorage.setItem('vinReport', JSON.stringify(report));
  } catch (e) { /* continue */ }
  if (typeof window.openCheckoutModal === 'function') {
    window.openCheckoutModal(report);
  } else {
    console.error('payment-flow.js not loaded — openCheckoutModal missing');
  }
};
