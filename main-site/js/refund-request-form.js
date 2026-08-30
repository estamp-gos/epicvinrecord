(function () {
  'use strict';

  function getApiBase() {
    if (typeof window.EPICVIN_REPORT_API_BASE === 'string') {
      return window.EPICVIN_REPORT_API_BASE.replace(/\/$/, '');
    }
    var origin = window.location.origin || '';
    var port = window.location.port || '';
    if (port === '3001' || /:3001$/i.test(origin)) return '';
    if (
      origin.indexOf('http://127.0.0.1') === 0 ||
      origin.indexOf('http://localhost') === 0 ||
      window.location.protocol === 'file:'
    ) {
      return 'http://localhost:3001';
    }
    return '';
  }

  function todayISO() {
    var d = new Date();
    var month = String(d.getMonth() + 1);
    var day = String(d.getDate());
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return d.getFullYear() + '-' + month + '-' + day;
  }

  document.querySelectorAll('form.refund-form').forEach(function (form) {
    var dateInput = form.querySelector('input[name="purchaseDate"]');
    if (dateInput) dateInput.max = todayISO();

    var btn = form.querySelector('[type="submit"]');
    var statusEl = form.querySelector('.form-status');
    if (!btn || !statusEl) return;

    function setStatus(ok, message) {
      statusEl.className = 'form-status ' + (ok ? 'ok' : 'err');
      statusEl.textContent = message;
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = String(form.email.value || '').trim();
      var vehicle = String(form.vehicle.value || '').trim();
      var purchaseDate = String(form.purchaseDate ? form.purchaseDate.value : '').trim();
      var description = String(form.description.value || '').trim();
      var helpWith = Array.prototype.slice.call(form.querySelectorAll('input[name="helpWith"]:checked'))
        .map(function (el) { return el.value; });
      var resolutionEl = form.querySelector('input[name="resolution"]:checked');
      var resolution = resolutionEl ? resolutionEl.value : '';

      if (!email) return setStatus(false, 'Please enter the email used for your purchase.');
      if (!vehicle) return setStatus(false, 'Please enter the vehicle registration or VIN.');
      if (!purchaseDate) return setStatus(false, 'Please enter the date you purchased the report.');
      if (!helpWith.length) return setStatus(false, 'Please select what we can help you with.');
      if (!description) return setStatus(false, 'Please describe the issue.');
      if (!resolution) return setStatus(false, 'Please select a preferred resolution.');

      btn.disabled = true;
      btn.textContent = 'Submitting...';
      statusEl.className = 'form-status';
      statusEl.textContent = '';

      try {
        var res = await fetch(getApiBase() + '/api/send-refund-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: String(form.orderId.value || '').trim(),
            email: email,
            vehicle: vehicle,
            purchaseDate: purchaseDate,
            helpWith: helpWith,
            description: description,
            resolution: resolution
          })
        });
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Could not submit your request. Please try again.');
        }
        form.reset();
        if (dateInput) dateInput.max = todayISO();
        setStatus(true, 'Your request has been received and is in process. A confirmation email has been sent to ' + email + '.');
      } catch (err) {
        setStatus(false, err && err.message ? err.message : 'Failed to submit your request.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Request';
      }
    });
  });
})();
