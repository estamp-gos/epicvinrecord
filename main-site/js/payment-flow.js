(function () {
  'use strict';

  if (window.__epicvinPaymentFlowLoaded) return;
  window.__epicvinPaymentFlowLoaded = true;

  var state = window.__epicvinPayment || (window.__epicvinPayment = {
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
      animation: 'epicvin-spin 1s linear infinite',
      margin: '10px auto'
    }
  };

  function injectStyles() {
    if (document.getElementById('epicvin-payment-styles')) return;
    var style = document.createElement('style');
    style.id = 'epicvin-payment-styles';
    style.textContent = '@keyframes epicvin-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
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
    if (getEl('epicvin-checkout-overlay')) return;

    var checkoutOverlay = document.createElement('div');
    checkoutOverlay.id = 'epicvin-checkout-overlay';
    applyStyles(checkoutOverlay, modalStyles.overlay);
    checkoutOverlay.style.display = 'none';
    checkoutOverlay.setAttribute('aria-hidden', 'true');
    checkoutOverlay.innerHTML =
      '<div id="epicvin-checkout-modal" class="checkout-modal-dialog" style="background:#fff;border-radius:10px;padding:30px;max-width:500px;width:100%;position:relative;box-shadow:0 5px 30px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto">' +
      '<button type="button" id="epicvin-checkout-close" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:28px;cursor:pointer;color:#666">&times;</button>' +
      '<h3 style="margin-bottom:20px;color:#2563eb;font-size:24px;font-weight:bold">Complete Your Purchase</h3>' +
      '<div id="epicvin-checkout-summary" style="margin-bottom:20px;padding:15px;background-color:#f3f4f6;border-radius:8px;font-size:14px;color:#4b5563"></div>' +
      '<p style="margin-bottom:20px;color:#6b7280;font-size:14px">Click below to proceed to secure payment. Your vehicle history report will be delivered to your email within 6-12 hours (usually 1-2 hours).</p>' +
      '<p style="margin-bottom:15px;color:#111827;font-size:14px;font-weight:600">I CONFIRM THAT I AM VOLUNTARILY PURCHASING A VEHICLE INSPECTION REPORT FROM EPICVINRECORD. THE REPORT WILL BE DELIVERED WITHIN THE STATED TIMEFRAME, AND ONCE DELIVERED, IT IS NON-REFUNDABLE.</p>' +
      '<label style="display:flex;align-items:flex-start;gap:10px;margin-bottom:20px;font-size:14px;color:#374151;cursor:pointer">' +
      '<input type="checkbox" id="epicvin-terms-checkbox" style="width:18px;height:18px;margin-top:2px">' +
      '<span>I have read and agree to the purchase confirmation above.</span></label>' +
      '<p style="margin-bottom:20px;color:#4b5563;font-size:13px;line-height:1.5">Please ensure payments are directed to AMU Traders LLC. Your bank statement will reflect our name for easy tracking.</p>' +
      '<div id="epicvin-checkout-buttons"></div>' +
      '</div>';

    var cardOverlay = document.createElement('div');
    cardOverlay.id = 'epicvin-card-overlay';
    applyStyles(cardOverlay, modalStyles.overlay);
    cardOverlay.style.display = 'none';
    cardOverlay.setAttribute('aria-hidden', 'true');
    cardOverlay.innerHTML =
      '<div style="background:#fff;border-radius:10px;padding:30px;max-width:500px;width:100%;position:relative;box-shadow:0 5px 30px rgba(0,0,0,0.3)">' +
      '<button type="button" id="epicvin-card-close" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:28px;cursor:pointer;color:#666">&times;</button>' +
      '<h3 style="margin-bottom:16px;color:#2563eb;font-size:20px;font-weight:bold">Card Payment Unavailable</h3>' +
      '<p style="margin-bottom:20px;color:#4b5563;font-size:14px;line-height:1.6">Our credit/debit card payment server is temporarily down. Kindly pay via bank transfer to get your report faster and save \u00A37.</p>' +
      '<button type="button" id="epicvin-card-bank-btn" style="width:100%;padding:15px;background:#2563eb;color:white;border:none;border-radius:5px;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:10px">Pay via Bank \u2014 ' + formatGbpPrice(BANK_PRICE_GBP) + '</button>' +
      '<button type="button" id="epicvin-card-cancel-btn" style="width:100%;padding:15px;background:#6b7280;color:white;border:none;border-radius:5px;font-size:16px;font-weight:600;cursor:pointer">Close</button>' +
      '</div>';

    document.body.appendChild(checkoutOverlay);
    document.body.appendChild(cardOverlay);

    var checkoutModal = getEl('epicvin-checkout-modal');
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

    getEl('epicvin-checkout-close').addEventListener('click', closeCheckoutModal);
    getEl('epicvin-card-close').addEventListener('click', closeCardDownModal);
    getEl('epicvin-card-cancel-btn').addEventListener('click', closeCardDownModal);
    getEl('epicvin-card-bank-btn').addEventListener('click', function () {
      closeCardDownModal();
      payViaBank();
    });
    getEl('epicvin-terms-checkbox').addEventListener('change', function (e) {
      state.acceptedTerms = e.target.checked;
      renderCheckoutButtons();
    });
  }

  function renderCheckoutSummary() {
    var summary = getEl('epicvin-checkout-summary');
    if (!summary || !state.currentOrder) return;
    var idLabel = state.currentOrder.vin ? 'VIN' : 'Plate';
    var idValue = state.currentOrder.vin || state.currentOrder.plate || 'N/A';
    summary.innerHTML =
      '<p style="margin-bottom:10px"><strong>' + idLabel + ':</strong> ' + idValue + '</p>' +
      '<p style="margin-bottom:10px"><strong>Email:</strong> ' + (state.currentOrder.email || 'N/A') + '</p>' +
      '<p style="margin-bottom:0"><strong>Report Type:</strong> ' + (state.currentOrder.tierName || 'basic') + ' - ' + formatGbpPrice(CARD_PRICE_GBP) + '</p>';
  }

  function renderCheckoutButtons() {
    var container = getEl('epicvin-checkout-buttons');
    if (!container) return;

    if (state.checkoutLoading) {
      container.innerHTML =
        '<div style="text-align:center;margin-top:15px">' +
        '<div style="border:4px solid rgba(0,0,0,0.1);border-radius:50%;border-top:4px solid #2563eb;width:30px;height:30px;animation:epicvin-spin 1s linear infinite;margin:10px auto"></div>' +
        '<p>Opening bank payment...</p></div>';
      return;
    }

    var disabled = !state.acceptedTerms;
    var opacity = disabled ? '0.6' : '1';
    var cursor = disabled ? 'not-allowed' : 'pointer';

    container.innerHTML =
      '<button type="button" id="epicvin-pay-bank" style="width:100%;padding:15px;background:#2563eb;color:white;border:none;border-radius:5px;font-size:16px;font-weight:600;cursor:' + cursor + ';opacity:' + opacity + ';margin-bottom:10px" ' + (disabled ? 'disabled' : '') + '>Pay via Bank (Get \u00A37 discount) \u2014 ' + formatGbpPrice(BANK_PRICE_GBP) + '</button>' +
      '<button type="button" id="epicvin-pay-card" style="width:100%;padding:15px;background:#fff;color:#2563eb;border:2px solid #2563eb;border-radius:5px;font-size:16px;font-weight:600;cursor:' + cursor + ';opacity:' + opacity + ';margin-bottom:10px" ' + (disabled ? 'disabled' : '') + '>Pay via Card \u2014 ' + formatGbpPrice(CARD_PRICE_GBP) + '</button>' +
      '<button type="button" id="epicvin-pay-cancel" style="width:100%;padding:15px;background:#6b7280;color:white;border:none;border-radius:5px;font-size:16px;font-weight:600;cursor:pointer">Cancel</button>';

    getEl('epicvin-pay-bank').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      payViaBank();
    });
    getEl('epicvin-pay-card').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      payViaCard();
    });
    getEl('epicvin-pay-cancel').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeCheckoutModal();
    });
  }

  function closeCardDownModal() {
    var overlay = getEl('epicvin-card-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  window.closeCheckoutModal = function () {
    var overlay = getEl('epicvin-checkout-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
    state.checkoutLoading = false;
    state.acceptedTerms = false;
    closeCardDownModal();
    var checkbox = getEl('epicvin-terms-checkbox');
    if (checkbox) checkbox.checked = false;
    renderCheckoutButtons();
  };

  window.openCheckoutModal = function (orderData) {
    injectModals();
    state.currentOrder = orderData;
    state.acceptedTerms = false;
    state.checkoutLoading = false;
    var checkbox = getEl('epicvin-terms-checkbox');
    if (checkbox) checkbox.checked = false;
    renderCheckoutSummary();
    renderCheckoutButtons();
    var checkoutOverlay = getEl('epicvin-checkout-overlay');
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
        currency: 'GBP',
        currencySymbol: '\u00A3'
      })));
    } catch (e) { /* continue */ }
    window.open(WISE_BANK_URL, '_blank', 'noopener,noreferrer');
    window.location.href = buildUploadProofUrl();
  };

  window.payViaCard = function () {
    if (!state.acceptedTerms) return;
    var overlay = getEl('epicvin-card-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
    }
  };

  window.EPICVIN_USE_PAYMENT_MODAL = true;

  function epicvinHandleFormSubmit(form, e) {
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
    var searchType = vin ? 'vin' : 'plate';
    var done = function () {
      if (typeof window.openPaymentCheckout === 'function') {
        window.openPaymentCheckout(vin, plate, vehicleType, customerEmail);
      }
    };
    if (typeof window.sendFormDataToEmail === 'function') {
      Promise.resolve(window.sendFormDataToEmail(vin, plate, null, vehicleType, searchType, customerEmail)).then(done);
    } else {
      done();
    }
  }

  function bindEpicvinForms() {
    var forms = document.querySelectorAll('.find-vin__form--vin, .find-vin__form--plate');
    forms.forEach(function (form) {
      form.setAttribute('action', '#');
      if (form.dataset.epicvinBound === '1') return;
      form.dataset.epicvinBound = '1';
      form.addEventListener('submit', function (e) {
        if (!window.EPICVIN_USE_PAYMENT_MODAL) return;
        epicvinHandleFormSubmit(form, e);
      }, true);
    });
  }

  function blockLegacyCheckoutRedirects() {
    try {
      var nativeAssign = window.location.assign.bind(window.location);
      window.location.assign = function (url) {
        if (window.EPICVIN_USE_PAYMENT_MODAL && typeof url === 'string' && url.indexOf('/checkout/') !== -1) {
          return;
        }
        return nativeAssign(url);
      };
    } catch (e) { /* ignore */ }
  }

  blockLegacyCheckoutRedirects();

  function initPaymentForms() {
    injectModals();
    bindEpicvinForms();
  }

  injectStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initPaymentForms();
      setTimeout(bindEpicvinForms, 100);
    });
  } else {
    initPaymentForms();
    setTimeout(bindEpicvinForms, 100);
  }
})();
