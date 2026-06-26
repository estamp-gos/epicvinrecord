(function () {
  'use strict';

  var order = null;
  var proofFile = null;

  function getEl(id) {
    return document.getElementById(id);
  }

  function loadOrder() {
    try {
      var raw = localStorage.getItem('vinReport');
      if (raw) order = JSON.parse(raw);
    } catch (e) {
      order = null;
    }
    renderOrderSummary();
  }

  function setManualFieldsVisible(show) {
    var fallbackInputs = getEl('proof-fallback-inputs');
    var fallbackAlert = getEl('proof-fallback-fields');
    var manualVin = getEl('proof-vin-manual');
    var manualEmail = getEl('proof-email-manual');

    if (fallbackInputs) fallbackInputs.style.display = show ? 'block' : 'none';
    if (fallbackAlert) fallbackAlert.style.display = show ? 'block' : 'none';
    if (manualVin) manualVin.required = show;
    if (manualEmail) manualEmail.required = show;
  }

  function renderOrderSummary() {
    var summary = getEl('proof-order-summary');
    var amount = (order && order.amountPaid) ? order.amountPaid : BANK_PRICE_GBP;

    if (!summary) return;

    if (order && order.email && (order.vin || order.plate)) {
      summary.style.display = 'block';
      setManualFieldsVisible(false);
      var idLabel = order.vin ? 'VIN' : 'Plate';
      var idValue = order.vin || order.plate;
      summary.innerHTML =
        '<p><strong>' + idLabel + ':</strong> ' + idValue + '</p>' +
        '<p><strong>Email:</strong> ' + order.email + '</p>' +
        (order.carModel ? '<p><strong>Car Model:</strong> ' + order.carModel + '</p>' : '') +
        (order.year ? '<p><strong>Year:</strong> ' + order.year + '</p>' : '') +
        '<p><strong>Amount:</strong> ' + formatGbpPrice(amount) + '</p>' +
        '<p><strong>Payment method:</strong> Bank transfer</p>';
    } else {
      summary.style.display = 'none';
      setManualFieldsVisible(true);
      order = order || {};
    }
  }

  function showError(msg) {
    var el = getEl('proof-error');
    if (el) {
      el.textContent = msg;
      el.style.display = msg ? 'block' : 'none';
    }
  }

  function handleFileChange(e) {
    var file = e.target.files && e.target.files[0];
    showError('');
    if (!file) {
      proofFile = null;
      updateFileLabel('');
      return;
    }
    if (file.size > MAX_PROOF_FILE_BYTES) {
      showError('File is too large. Maximum size is 4MB.');
      proofFile = null;
      e.target.value = '';
      updateFileLabel('');
      return;
    }
    var allowed = file.type.indexOf('image/') === 0 || file.type === 'application/pdf';
    if (!allowed) {
      showError('Please upload an image (PNG, JPG, etc.) or PDF.');
      proofFile = null;
      e.target.value = '';
      updateFileLabel('');
      return;
    }
    proofFile = file;
    updateFileLabel(file.name);
  }

  function updateFileLabel(name) {
    var label = getEl('proof-file-label');
    if (!label) return;
    if (name) {
      label.innerHTML = '<p class="proof-file-name">' + name + '</p><p class="proof-file-hint">Tap to change file</p>';
      label.classList.add('proof-file-label--selected');
    } else {
      label.innerHTML = '<p class="proof-file-title">Tap to upload screenshot</p><p class="proof-file-hint">PNG, JPG or PDF — max 4MB</p>';
      label.classList.remove('proof-file-label--selected');
    }
  }

  function getOrderFromForm() {
    var manualVin = getEl('proof-vin-manual');
    var manualEmail = getEl('proof-email-manual');
    var email = (order && order.email) ? order.email : (manualEmail ? manualEmail.value.trim() : '');
    var vin = (order && order.vin) ? order.vin : (manualVin ? manualVin.value.trim() : '');
    var plate = (order && order.plate) ? order.plate : '';
    if (!vin && manualVin && manualVin.value.trim()) vin = manualVin.value.trim();
    var notes = getEl('proof-notes') ? getEl('proof-notes').value.trim() : '';
    var amount = (order && order.amountPaid) ? order.amountPaid : BANK_PRICE_GBP;
    return { email: email, vin: vin, plate: plate, notes: notes, amount: amount };
  }

  function showThankYou() {
    var overlay = getEl('proof-thankyou-overlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function hideThankYou() {
    var overlay = getEl('proof-thankyou-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    showError('');

    var data = getOrderFromForm();
    if (!data.email || !(data.vin || data.plate)) {
      showError('Order details are missing. Please enter your VIN/plate and email.');
      return;
    }
    if (!proofFile) {
      showError('Please upload your payment screenshot.');
      return;
    }

    var submitBtn = getEl('proof-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    try {
      var formData = new FormData();
      formData.append('proof', proofFile);
      formData.append('email', data.email);
      formData.append('vin', data.vin || data.plate);
      formData.append('plate', data.plate || '');
      formData.append('carModel', (order && order.carModel) || '');
      formData.append('year', (order && order.year) || '');
      formData.append('amount', String(data.amount));
      formData.append('notes', data.notes);

      var res = await fetch(PROOF_UPLOAD_API, { method: 'POST', body: formData });
      var result = await res.json().catch(function () { return {}; });

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Upload failed. Please try again.');
      }

      showThankYou();
    } catch (err) {
      showError(err.message || 'Upload failed. Please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Payment Proof';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadOrder();

    var fileInput = getEl('proof-file-input');
    if (fileInput) fileInput.addEventListener('change', handleFileChange);

    var form = getEl('proof-upload-form');
    if (form) form.addEventListener('submit', handleSubmit);

    var thankyouClose = getEl('proof-thankyou-close');
    var thankyouDone = getEl('proof-thankyou-done');
    if (thankyouClose) thankyouClose.addEventListener('click', hideThankYou);
    if (thankyouDone) thankyouDone.addEventListener('click', hideThankYou);

    var manualVin = getEl('proof-vin-manual');
    var manualEmail = getEl('proof-email-manual');
    if (manualVin) manualVin.addEventListener('input', function () { order = order || {}; order.vin = manualVin.value; });
    if (manualEmail) manualEmail.addEventListener('input', function () { order = order || {}; order.email = manualEmail.value; });
  });
})();
