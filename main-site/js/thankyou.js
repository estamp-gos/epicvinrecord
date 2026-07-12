(function () {
  'use strict';

  /**
   * Prefer same-origin /api when served by `npm start` (Express on :3001).
   * If the page is opened via Live Server / static host / file://, call the
   * report API on localhost:3001 explicitly (override with EPICVIN_REPORT_API_BASE).
   */
  function getApiBase() {
    if (typeof window.EPICVIN_REPORT_API_BASE === 'string') {
      return window.EPICVIN_REPORT_API_BASE.replace(/\/$/, '');
    }
    var origin = window.location.origin || '';
    var port = window.location.port || '';
    // Express report server
    if (port === '3001' || /:3001$/i.test(origin)) {
      return '';
    }
    // Static preview / Live Server / file — hit the Node API
    if (
      origin.indexOf('http://127.0.0.1') === 0 ||
      origin.indexOf('http://localhost') === 0 ||
      window.location.protocol === 'file:'
    ) {
      return 'http://localhost:3001';
    }
    return '';
  }

  var vinReport = null;
  var downloading = false;
  var downloadStarted = false;

  var els = {
    card: document.getElementById('report-card'),
    missing: document.getElementById('missing-order'),
    error: document.getElementById('error-box'),
    btn: document.getElementById('download-btn'),
    label: document.getElementById('download-label'),
    status: document.getElementById('status-line'),
    sumId: document.getElementById('sum-id'),
    sumEmail: document.getElementById('sum-email'),
    sumModel: document.getElementById('sum-model'),
    sumYear: document.getElementById('sum-year'),
    sumType: document.getElementById('sum-type'),
    sumTier: document.getElementById('sum-tier'),
    noteEmail: document.getElementById('note-email')
  };

  function showError(msg) {
    if (!els.error) return;
    els.error.style.display = 'block';
    els.error.textContent = msg;
  }

  function setStatus(text) {
    if (els.status) els.status.textContent = text || '';
  }

  function setDownloading(isDown) {
    downloading = isDown;
    if (els.btn) els.btn.disabled = isDown;
    if (els.label) {
      els.label.textContent = isDown ? 'Generating PDF...' : 'Download PDF Report';
    }
  }

  function loadOrder() {
    try {
      var raw = localStorage.getItem('vinReport');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse vinReport', e);
      return null;
    }
  }

  function renderSummary(order) {
    var id = order.vin || order.plate || 'N/A';
    els.sumId.textContent = id;
    els.sumEmail.textContent = order.email || '—';
    if (els.sumModel) els.sumModel.textContent = order.carModel || order.vehicleModel || '—';
    if (els.sumYear) els.sumYear.textContent = order.year || '—';
    els.sumType.textContent = order.vehicleType || 'basic';
    els.sumTier.textContent = order.tierName || 'basic';
    if (els.noteEmail) {
      els.noteEmail.textContent = order.email || 'your email';
    }
    els.card.style.display = 'block';
  }

  async function lookupVehicle(order) {
    var registration = String(order.vin || order.plate || '').trim();
    var year = String(order.year || '').trim();
    var vehicleModel = String(order.carModel || order.vehicleModel || '').trim();

    if (!year && vehicleModel) {
      var yearMatch = vehicleModel.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) year = yearMatch[0];
    }

    var res = await fetch(getApiBase() + '/api/lookup-vehicle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration: registration,
        vin: order.vin || '',
        plate: order.plate || '',
        year: year,
        vehicleModel: vehicleModel,
        carModel: vehicleModel,
        vehicleType: order.vehicleType || ''
      })
    });

    var data = await res.json().catch(function () { return {}; });
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Vehicle lookup failed (' + res.status + ')');
    }
    return data.data;
  }

  async function generatePdf(order, enrichment) {
    var registration = String(order.vin || order.plate || '').trim();
    var formModel = String(order.carModel || order.vehicleModel || '').trim();
    var formYear = String(order.year || '').trim();
    var res = await fetch(getApiBase() + '/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vin: order.vin || '',
        plate: order.plate || '',
        registration: registration,
        // Prefer values typed in the entry form
        year: formYear || enrichment.yearOfManufacture || '',
        carModel: formModel || enrichment.model || '',
        vehicleModel: formModel || enrichment.model || '',
        formCarModel: formModel,
        formYear: formYear,
        vehicleType: order.vehicleType,
        enrichment: enrichment,
        reportData: enrichment
      })
    });

    if (!res.ok) {
      var err = await res.json().catch(function () { return {}; });
      throw new Error(err.message || 'Could not generate PDF');
    }

    var blob = await res.blob();
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var safeId =
      String(registration || 'vehicle')
        .replace(/[^\w\d-]+/gi, '')
        .slice(0, 32) || 'vehicle';
    a.download = 'EpicVIN-Report-' + safeId + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function generatePDF() {
    if (!vinReport || downloading) return;

    setDownloading(true);
    if (els.error) els.error.style.display = 'none';

    try {
      var enrichment = vinReport.enrichment;
      if (!enrichment || typeof enrichment !== 'object') {
        setStatus('Looking up all report fields with Groq…');
        enrichment = await lookupVehicle(vinReport);
        vinReport = Object.assign({}, vinReport, { enrichment: enrichment });
        try {
          localStorage.setItem('vinReport', JSON.stringify(vinReport));
        } catch (e) { /* ignore */ }
      }

      setStatus('Generating PDF report…');
      await generatePdf(vinReport, enrichment);
      setStatus('Download started. If nothing happened, click the button again.');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      var msg = err && err.message ? err.message : 'Failed to generate report PDF.';
      showError(msg + ' Make sure the report API is running (npm start).');
      setStatus('Generation failed — you can retry with the button.');
    } finally {
      setDownloading(false);
    }
  }

  function init() {
    vinReport = loadOrder();
    if (!vinReport) {
      if (els.missing) els.missing.style.display = 'block';
      return;
    }

    renderSummary(vinReport);

    if (els.btn) {
      els.btn.addEventListener('click', function () {
        generatePDF();
      });
    }

    if (!downloadStarted) {
      downloadStarted = true;
      setTimeout(function () {
        generatePDF();
      }, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
