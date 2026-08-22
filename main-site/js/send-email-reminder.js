(function () {
  'use strict';

  function getApiBase() {
    if (typeof window.EPICVIN_REPORT_API_BASE === 'string') {
      return window.EPICVIN_REPORT_API_BASE.replace(/\/$/, '');
    }
    var origin = window.location.origin || '';
    var port = window.location.port || '';
    if (port === '3001' || /:3001$/i.test(origin)) {
      return '';
    }
    if (
      origin.indexOf('http://127.0.0.1') === 0 ||
      origin.indexOf('http://localhost') === 0 ||
      window.location.protocol === 'file:'
    ) {
      return 'http://localhost:3001';
    }
    return '';
  }

  var form = document.getElementById('reminder-form');
  var btn = document.getElementById('send-btn');
  var statusEl = document.getElementById('status');
  var emailInput = document.getElementById('email');

  function setStatus(ok, message) {
    statusEl.className = 'status ' + (ok ? 'ok' : 'err');
    statusEl.textContent = message;
  }

  try {
    var raw = localStorage.getItem('vinReport');
    if (raw) {
      var order = JSON.parse(raw);
      if (order.email && !emailInput.value) emailInput.value = order.email;
    }
  } catch (e) { /* ignore */ }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = String(emailInput.value || '').trim();
    if (!email) {
      setStatus(false, 'Please enter an email address.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';
    statusEl.className = 'status';
    statusEl.textContent = '';

    try {
      var res = await fetch(getApiBase() + '/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not send the reminder email.');
      }
      setStatus(true, 'Reminder sent to ' + email + '.');
    } catch (err) {
      setStatus(false, err && err.message ? err.message : 'Failed to send reminder.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send';
    }
  });
})();
