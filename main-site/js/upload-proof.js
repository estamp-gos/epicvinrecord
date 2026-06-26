(function () {
  'use strict';

  var order = null;
  var proofFile = null;
  var MAX_ATTACHMENT_BYTES = 900000;

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
    return {
      email: email,
      vin: vin,
      plate: plate,
      notes: notes,
      amount: amount,
      carModel: (order && order.carModel) || '',
      year: (order && order.year) || ''
    };
  }

  function showThankYou() {
    var overlay = getEl('proof-thankyou-overlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function hideThankYou() {
    var overlay = getEl('proof-thankyou-overlay');
    if (overlay) overlay.style.display = 'none';
  }


  function compressImageFile(file) {
    return new Promise(function (resolve) {
      if (!file.type || file.type.indexOf('image/') !== 0 || file.size <= MAX_ATTACHMENT_BYTES) {
        resolve(file);
        return;
      }
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var maxW = 1200;
        var w = img.width;
        var h = img.height;
        if (w > maxW) {
          h = Math.round(h * (maxW / w));
          w = maxW;
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.82);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  function buildProofPlainMessage(data, file, screenshotUrl, hasAttachment) {
    var id = data.vin || data.plate;
    var lines = [
      'Payment Proof Submitted',
      '',
      'VIN/Plate: ' + id,
      'Car Model: ' + (data.carModel || 'N/A'),
      'Year: ' + (data.year || 'N/A'),
      'Customer Email: ' + data.email,
      'Amount Paid: ' + formatGbpPrice(data.amount),
      'Notes: ' + (data.notes || 'None'),
      'File: ' + file.name + ' (' + file.type + ', ' + Math.round(file.size / 1024) + ' KB)'
    ];
    if (hasAttachment) {
      lines.push('', 'Payment screenshot is attached to this email.');
    } else if (screenshotUrl) {
      lines.push('', 'Payment Screenshot — open this link to view:', screenshotUrl);
    }
    return lines.join('\n');
  }

  function buildProofSubject(data) {
    var id = data.vin || data.plate;
    return '[Payment Proof] ' + id + ' - ' + formatGbpPrice(data.amount);
  }

  async function uploadToLitterbox(file) {
    var fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('time', '72h');
    fd.append('fileToUpload', file, file.name);
    var res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: fd
    });
    var url = (await res.text()).trim();
    if (!res.ok || url.indexOf('http') !== 0) {
      throw new Error('Litterbox upload failed');
    }
    return url;
  }

  async function uploadToCatbox(file) {
    var fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', file, file.name);
    var res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: fd
    });
    var url = (await res.text()).trim();
    if (!res.ok || url.indexOf('http') !== 0) {
      throw new Error('Catbox upload failed');
    }
    return url;
  }

  async function uploadProofToPublicUrl(file) {
    var providers = [uploadToLitterbox, uploadToCatbox];
    var lastError = null;
    for (var i = 0; i < providers.length; i++) {
      try {
        return await providers[i](file);
      } catch (err) {
        lastError = err;
        console.warn('Screenshot host failed:', err);
      }
    }
    throw new Error('Could not upload screenshot. Please try again.');
  }

  function getProofAccessKey() {
    var key = typeof PROOF_WEB3FORMS_ACCESS_KEY !== 'undefined'
      ? PROOF_WEB3FORMS_ACCESS_KEY
      : '';
    if (!key || key.indexOf('PASTE') !== -1) {
      return '';
    }
    return key;
  }

  async function postWeb3Forms(formData) {
    var res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    var result = await res.json().catch(function () { return {}; });
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Email delivery failed.');
    }
    return result;
  }

  function appendWeb3FormsBaseFields(formData, accessKey, data, subject, message) {
    formData.append('access_key', accessKey);
    formData.append('subject', subject);
    formData.append('from_name', 'EpicVINrecord Payment Proof');
    formData.append('email', data.email);
    formData.append('replyto', data.email);
    formData.append('message', message);
    formData.append('botcheck', '');
  }

  async function submitProofViaWeb3Forms(data, file) {
    var prepared = await compressImageFile(file);
    var accessKey = getProofAccessKey();
    if (!accessKey) {
      throw new Error(
        'Proof email not configured. Add a Web3Forms access key for rmoto7817@gmail.com in payment-config.js (PROOF_WEB3FORMS_ACCESS_KEY).'
      );
    }

    var subject = buildProofSubject(data);

    if (prepared.size <= 1024 * 1024) {
      var withAttachment = new FormData();
      appendWeb3FormsBaseFields(
        withAttachment,
        accessKey,
        data,
        subject,
        buildProofPlainMessage(data, prepared, null, true)
      );
      withAttachment.append('attachment', prepared, prepared.name);

      try {
        return await postWeb3Forms(withAttachment);
      } catch (attachErr) {
        console.warn('Web3Forms attachment unavailable, using screenshot link:', attachErr.message);
      }
    }

    var screenshotUrl = await uploadProofToPublicUrl(prepared);
    var withLink = new FormData();
    appendWeb3FormsBaseFields(
      withLink,
      accessKey,
      data,
      subject,
      buildProofPlainMessage(data, prepared, screenshotUrl, false)
    );
    withLink.append('Screenshot URL', screenshotUrl);
    return postWeb3Forms(withLink);
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
      await submitProofViaWeb3Forms(data, proofFile);
      showThankYou();
    } catch (err) {
      console.error('Proof submit failed:', err);
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
