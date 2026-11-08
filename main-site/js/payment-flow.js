(function () {
  'use strict';

  if (window.__vinunifiedPaymentFlowLoaded) return;
  window.__vinunifiedPaymentFlowLoaded = true;

  var state = window.__vinunifiedPayment || (window.__vinunifiedPayment = {
    currentOrder: null,
    acceptedTerms: false,
    checkoutLoading: false
  });

  var modalStyles = {
    overlay: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      zIndex: '100001',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
      boxSizing: 'border-box'
    },
    modal: {
      background: '#fff',
      borderRadius: '10px',
      padding: '30px',
      maxWidth: '500px',
      width: '100%',
      position: 'relative',
      boxShadow: '0 5px 30px rgba(0,0,0,0.3)',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    closeButton: {
      position: 'absolute',
      top: '10px',
      right: '15px',
      background: 'none',
      border: 'none',
      fontSize: '28px',
      cursor: 'pointer',
      color: '#666',
      lineHeight: '1'
    },
    proceedButton: {
      width: '100%',
      padding: '15px',
      background: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: '10px'
    },
    cancelButton: {
      width: '100%',
      padding: '15px',
      background: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer'
    },
    loadingSpinner: {
      border: '4px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '50%',
      borderTop: '4px solid #2563eb',
      width: '30px',
      height: '30px',
      animation: 'vinunified-spin 1s linear infinite',
      margin: '10px auto'
    }
  };

  function injectStyles() {
    if (document.getElementById('vinunified-payment-styles')) return;
    var style = document.createElement('style');
    style.id = 'vinunified-payment-styles';
    style.textContent = '@keyframes vinunified-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  function applyStyles(el, styles) {
    Object.keys(styles).forEach(function (key) {
      el.style[key] = styles[key];
    });
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function injectModals() {
    if (getEl('vinunified-checkout-overlay')) return;

    var checkoutOverlay = document.createElement('div');
    checkoutOverlay.id = 'vinunified-checkout-overlay';
    applyStyles(checkoutOverlay, modalStyles.overlay);
    checkoutOverlay.style.display = 'none';
    checkoutOverlay.setAttribute('aria-hidden', 'true');
    checkoutOverlay.innerHTML =
      '<div id="vinunified-checkout-modal" class="checkout-modal-dialog" style="background:#fff;border-radius:10px;padding:30px;max-width:500px;width:100%;position:relative;box-shadow:0 5px 30px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto">' +
      '<button type="button" id="vinunified-checkout-close" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:28px;cursor:pointer;color:#666">&times;</button>' +
      '<h3 style="margin-bottom:20px;color:#2563eb;font-size:24px;font-weight:bold">Complete Your Purchase</h3>' +
      '<div id="vinunified-checkout-summary" style="margin-bottom:20px;padding:15px;background-color:#f3f4f6;border-radius:8px;font-size:14px;color:#4b5563"></div>' +
      '<p style="margin-bottom:20px;color:#6b7280;font-size:14px"></p>' +
      '<p style="margin-bottom:15px;color:#111827;font-size:14px;font-weight:600">I CONFIRM THAT I AM VOLUNTARILY PURCHASING A VEHICLE INSPECTION REPORT FROM VINUNIFIED. THE REPORT WILL BE DELIVERED WITHIN THE STATED TIMEFRAME, AND ONCE DELIVERED, IT IS NON-REFUNDABLE.</p>' +
      '<label style="display:flex;align-items:flex-start;gap:10px;margin-bottom:20px;font-size:14px;color:#374151;cursor:pointer">' +
      '<input type="checkbox" id="vinunified-terms-checkbox" style="width:18px;height:18px;margin-top:2px">' +
      '<span>I have read and agree to the purchase confirmation above.</span></label>' +
      '<div id="vinunified-checkout-buttons"></div>' +
      '</div>';

    var cardOverlay = document.createElement('div');
    cardOverlay.id = 'vinunified-card-overlay';
    applyStyles(cardOverlay, modalStyles.overlay);
    cardOverlay.style.display = 'none';
    cardOverlay.setAttribute('aria-hidden', 'true');
    cardOverlay.innerHTML =
      '<div style="background:#fff;border-radius:10px;padding:30px;max-width:500px;width:100%;position:relative;box-shadow:0 5px 30px rgba(0,0,0,0.3)">' +
      '<button type="button" id="vinunified-card-close" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:28px;cursor:pointer;color:#666">&times;</button>' +
      '<h3 style="margin-bottom:16px;color:#2563eb;font-size:20px;font-weight:bold">Card Payment Unavailable</h3>' +
      '<p style="margin-bottom:20px;color:#4b5563;font-size:14px;line-height:1.6">Our credit/debit card payment server is temporarily down. Kindly pay via bank transfer to get your report faster and save \u00A37.</p>' +
      '<button type="button" id="vinunified-card-bank-btn" style="width:100%;padding:15px;background:#2563eb;color:white;border:none;border-radius:5px;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:10px">Pay via Bank \u2014 ' + formatGbpPrice(BANK_PRICE_GBP) + '</button>' +
      '<button type="button" id="vinunified-card-cancel-btn" style="width:100%;padding:15px;background:#6b7280;color:white;border:none;border-radius:5px;font-size:16px;font-weight:600;cursor:pointer">Close</button>' +
      '</div>';

    document.body.appendChild(checkoutOverlay);
    document.body.appendChild(cardOverlay);

    var checkoutModal = getEl('vinunified-checkout-modal');
    if (checkoutModal) {
      checkoutModal.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    cardOverlay.querySelector('div').addEventListener('click', function (e) { e.stopPropagation(); });

    checkoutOverlay.addEventListener('click', function (e) {
      if (e.target === checkoutOverlay) closeCheckoutModal();
    });
    cardOverlay.addEventListener('click', function (e) {
      if (e.target === cardOverlay) closeCardDownModal();
    });

    getEl('vinunified-checkout-close').addEventListener('click', closeCheckoutModal);
    getEl('vinunified-card-close').addEventListener('click', closeCardDownModal);
    getEl('vinunified-card-cancel-btn').addEventListener('click', closeCardDownModal);
    getEl('vinunified-card-bank-btn').addEventListener('click', function () {
      closeCardDownModal();
      payViaBank();
    });
    getEl('vinunified-terms-checkbox').addEventListener('change', function (e) {
      state.acceptedTerms = e.target.checked;
      renderCheckoutButtons();
    });
  }

  function renderCheckoutSummary() {
    var summary = getEl('vinunified-checkout-summary');
    if (!summary || !state.currentOrder) return;
    var idLabel = state.currentOrder.vin ? 'VIN' : 'Plate';
    var idValue = state.currentOrder.vin || state.currentOrder.plate || 'N/A';
    summary.innerHTML =
      '<p style="margin-bottom:10px"><strong>' + idLabel + ':</strong> ' + idValue + '</p>' +
      '<p style="margin-bottom:10px"><strong>Email:</strong> ' + (state.currentOrder.email || 'N/A') + '</p>' +
      (state.currentOrder.carModel
        ? '<p style="margin-bottom:10px"><strong>Model:</strong> ' + state.currentOrder.carModel + '</p>'
        : '') +
      (state.currentOrder.year
        ? '<p style="margin-bottom:10px"><strong>Year:</strong> ' + state.currentOrder.year + '</p>'
        : '') +
      (state.currentOrder.vehicleCategory
        ? '<p style="margin-bottom:10px"><strong>Vehicle Type:</strong> ' + state.currentOrder.vehicleCategory + '</p>'
        : '') +
      '<p style="margin-bottom:0"><strong>Report Type:</strong> ' + (state.currentOrder.tierName || 'basic') + ' - ' + formatGbpPrice(CARD_PRICE_GBP) + '</p>';
  }

  function renderCheckoutButtons() {
    var container = getEl('vinunified-checkout-buttons');
    if (!container) return;

    if (state.checkoutLoading) {
      container.innerHTML =
        '<div style="text-align:center;margin-top:15px">' +
        '<div style="border:4px solid rgba(0,0,0,0.1);border-radius:50%;border-top:4px solid #2563eb;width:30px;height:30px;animation:vinunified-spin 1s linear infinite;margin:10px auto"></div>' +
        '<p>Opening bank payment...</p></div>';
      return;
    }

    var disabled = !state.acceptedTerms;
    var opacity = disabled ? '0.6' : '1';
    var cursor = disabled ? 'not-allowed' : 'pointer';

    container.innerHTML =
      // '<button type="button" id="vinunified-pay-bank" style="width:100%;padding:15px;background:#2563eb;color:white;border:none;border-radius:5px;font-size:16px;font-weight:600;cursor:' + cursor + ';opacity:' + opacity + ';margin-bottom:10px" ' + (disabled ? 'disabled' : '') + '>Pay via Bank (Get \u00A37 discount) \u2014 ' + formatGbpPrice(BANK_PRICE_GBP) + '</button>' +
      '<button type="button" id="vinunified-pay-card" style="width:100%;padding:15px;background:#fff;color:#2563eb;border:2px solid #2563eb;border-radius:5px;font-size:16px;font-weight:600;cursor:' + cursor + ';opacity:' + opacity + ';margin-bottom:10px" ' + (disabled ? 'disabled' : '') + '>Pay via Card \u2014 ' + formatGbpPrice(CARD_PRICE_GBP) + '</button>' +
      '<button type="button" id="vinunified-pay-cancel" style="width:100%;padding:15px;background:#6b7280;color:white;border:none;border-radius:5px;font-size:16px;font-weight:600;cursor:pointer">Cancel</button>';

    // getEl('vinunified-pay-bank').addEventListener('click', function (e) {
    //   e.preventDefault();
    //   e.stopPropagation();
    //   payViaBank();
    // });
    getEl('vinunified-pay-card').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      payViaCard();
    });
    getEl('vinunified-pay-cancel').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeCheckoutModal();
    });
  }

  function closeCardDownModal() {
    var overlay = getEl('vinunified-card-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  window.closeCheckoutModal = function () {
    var overlay = getEl('vinunified-checkout-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
    state.checkoutLoading = false;
    state.acceptedTerms = false;
    closeCardDownModal();
    var checkbox = getEl('vinunified-terms-checkbox');
    if (checkbox) checkbox.checked = false;
    renderCheckoutButtons();
  };

  window.openCheckoutModal = function (orderData) {
    injectModals();
    state.currentOrder = orderData;
    state.acceptedTerms = false;
    state.checkoutLoading = false;
    var checkbox = getEl('vinunified-terms-checkbox');
    if (checkbox) checkbox.checked = false;
    renderCheckoutSummary();
    renderCheckoutButtons();
    var checkoutOverlay = getEl('vinunified-checkout-overlay');
    checkoutOverlay.style.display = 'flex';
    checkoutOverlay.setAttribute('aria-hidden', 'false');
  };

  window.payViaBank = function () {
    if (!state.acceptedTerms) return;
    state.checkoutLoading = true;
    renderCheckoutButtons();
    try {
      var existing = localStorage.getItem('vinReport');
      var report = existing ? JSON.parse(existing) : (state.currentOrder || {});
      localStorage.setItem('vinReport', JSON.stringify(Object.assign({}, report, state.currentOrder, {
        paymentMethod: 'bank',
        amountPaid: BANK_PRICE_GBP,
        currency: (window.__epicCurrency && window.__epicCurrency.currency) || 'GBP',
        currencySymbol: (window.__epicCurrency && window.__epicCurrency.symbol) || '\u00A3'
      })));
    } catch (e) { /* continue */ }
    window.open(WISE_BANK_URL, '_blank', 'noopener,noreferrer');
    window.location.href = buildUploadProofUrl();
  };

  window.payViaCard = function () {
    if (!state.acceptedTerms) return;
    try {
      var existing = localStorage.getItem('vinReport');
      var report = existing ? JSON.parse(existing) : (state.currentOrder || {});
      localStorage.setItem('vinReport', JSON.stringify(Object.assign({}, report, state.currentOrder, {
        paymentMethod: 'freemius',
        amountPaid: CARD_PRICE_GBP,
        currency: (window.__epicCurrency && window.__epicCurrency.currency) || 'GBP',
        currencySymbol: (window.__epicCurrency && window.__epicCurrency.symbol) || '\u00A3'
      })));
    } catch (e) { /* continue */ }
    // Continue to Freemius in this tab. Freemius success URL must redirect
    // to /thank-you/ only after a successful payment (set in Freemius dashboard).
    var cardUrl =
      (typeof FREEMIUS_CHECKOUT_URL === 'string' && FREEMIUS_CHECKOUT_URL) ||
      (typeof STRIPE_CARD_URL === 'string' && STRIPE_CARD_URL) ||
      'https://checkout.freemius.com/product/27824/plan/61097/licenses/1/currency/gbp/';
    window.location.href = cardUrl;
  };

  window.VINUNIFIED_USE_PAYMENT_MODAL = true;

  function vinunifiedHandleFormSubmit(form, e) {
    if (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
    var btn = form.querySelector('button[type="submit"]');
    if (typeof window.startSubmit === 'function' && btn) {
      window.startSubmit(e || { preventDefault: function () {} }, btn);
      return;
    }
    var vinInput = form.querySelector('input[name="vin"]');
    var plateInput = form.querySelector('input[name="plate"]');
    var vin = vinInput ? vinInput.value.trim() : '';
    var plate = plateInput ? plateInput.value.trim() : '';
    if (!vin && !plate) return;
    var emailInput = form.querySelector('input[name="customer_email"]');
    var customerEmail = emailInput ? emailInput.value.trim() : '';
    var vehicleTypeSelect = form.querySelector('select[name="vehicle_type"]');
    var vehicleType = vehicleTypeSelect ? vehicleTypeSelect.value : 'basic';
    var modelYear =
      typeof readModelYearFromForm === 'function'
        ? readModelYearFromForm(form)
        : { carModel: '', year: '' };
    var carModel = modelYear.carModel || '';
    var year = modelYear.year || '';
    var vehicleCategory =
      typeof readVehicleCategoryFromForm === 'function'
        ? readVehicleCategoryFromForm(form)
        : '';
    var searchType = vin ? 'vin' : 'plate';
    var done = function () {
      if (typeof window.openPaymentCheckout === 'function') {
        window.openPaymentCheckout(vin, plate, vehicleType, customerEmail, carModel, year, vehicleCategory);
      }
    };
    if (typeof window.sendFormDataToEmail === 'function') {
      Promise.resolve(window.sendFormDataToEmail(vin, plate, null, vehicleType, searchType, customerEmail, carModel, year)).then(done);
    } else {
      done();
    }
  }

  function bindVinunifiedForms() {
    var forms = document.querySelectorAll('.find-vin__form--vin, .find-vin__form--plate');
    forms.forEach(function (form) {
      form.setAttribute('action', '#');
      if (form.dataset.vinunifiedBound === '1') return;
      form.dataset.vinunifiedBound = '1';
      form.addEventListener('submit', function (e) {
        if (!window.VINUNIFIED_USE_PAYMENT_MODAL) return;
        vinunifiedHandleFormSubmit(form, e);
      }, true);
    });
  }

  function blockLegacyCheckoutRedirects() {
    try {
      var nativeAssign = window.location.assign.bind(window.location);
      window.location.assign = function (url) {
        if (window.VINUNIFIED_USE_PAYMENT_MODAL && typeof url === 'string' && url.indexOf('/checkout/') !== -1) {
          return;
        }
        return nativeAssign(url);
      };
    } catch (e) { /* ignore */ }
  }

  blockLegacyCheckoutRedirects();

  function initPaymentForms() {
    injectModals();
    bindVinunifiedForms();
  }

  injectStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initPaymentForms();
      setTimeout(bindVinunifiedForms, 100);
    });
  } else {
    initPaymentForms();
    setTimeout(bindVinunifiedForms, 100);
  }
})();
