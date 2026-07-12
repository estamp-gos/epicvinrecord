/**
 * IP-based currency display for EpicVINrecord.
 * - United Kingdom (GB) → GBP (£)
 * - Europe → EUR (€)
 * - United States / Canada / Americas USD zone → USD ($)
 * - Elsewhere → USD ($)
 *
 * Base catalogue price is GBP via data-price-gbp / CARD_PRICE_GBP.
 * Test:
 *   localStorage.setItem('__mockCountry','US'); location.reload();
 *   localStorage.setItem('__mockCountry','DE'); location.reload();
 *   localStorage.setItem('__mockCountry','GB'); location.reload();
 */
(function () {
  var BASE_GBP = typeof CARD_PRICE_GBP === 'number' ? CARD_PRICE_GBP : 54.99;
  var BANK_GBP = typeof BANK_PRICE_GBP === 'number' ? BANK_PRICE_GBP : 52.99;

  var GEO_APIS = [
    'https://ipapi.co/json/',
    'https://ipwho.is/',
    'https://geolocation-db.com/json/'
  ];

  var EUR_COUNTRIES = {
    AT: 1, BE: 1, BG: 1, HR: 1, CY: 1, CZ: 1, DK: 1, EE: 1, FI: 1, FR: 1,
    DE: 1, GR: 1, HU: 1, IE: 1, IT: 1, LV: 1, LT: 1, LU: 1, MT: 1, NL: 1,
    PL: 1, PT: 1, RO: 1, SK: 1, SI: 1, ES: 1, SE: 1, IS: 1, LI: 1, NO: 1,
    CH: 1, AD: 1, MC: 1, SM: 1, VA: 1, AL: 1, BA: 1, ME: 1, MK: 1, RS: 1,
    XK: 1, UA: 1, MD: 1, BY: 1
  };

  var USD_COUNTRIES = {
    US: 1, CA: 1, MX: 1, PR: 1, VI: 1, GU: 1, AS: 1, MP: 1, UM: 1
  };

  var GBP_TO_EUR_FALLBACK = 1.17;
  var GBP_TO_USD_FALLBACK = 1.27;

  var state = {
    country: 'GB',
    currency: 'GBP',
    symbol: '\u00A3',
    locale: 'en-GB',
    rateFromGbp: 1,
    ready: false
  };

  function timeoutFetch(url, ms) {
    var controller = new AbortController();
    var id = setTimeout(function () { controller.abort(); }, ms || 3500);
    return fetch(url, { signal: controller.signal }).finally(function () {
      clearTimeout(id);
    });
  }

  function extractCountry(json) {
    if (!json || typeof json !== 'object') return null;
    var code =
      json.country_code ||
      json.country_code2 ||
      json.countryCode ||
      (typeof json.country === 'string' && json.country.length === 2 ? json.country : null);
    if (code && String(code).length === 2) return String(code).toUpperCase();
    return null;
  }

  async function detectCountry() {
    var mock = null;
    try {
      mock = localStorage.getItem('__mockCountry');
    } catch (e) { /* ignore */ }
    if (mock && /^[A-Za-z]{2}$/.test(mock)) {
      return mock.toUpperCase();
    }

    for (var i = 0; i < GEO_APIS.length; i++) {
      try {
        var res = await timeoutFetch(GEO_APIS[i], 3500);
        if (!res.ok) continue;
        var json = await res.json();
        var code = extractCountry(json);
        if (code) return code;
      } catch (err) {
        /* try next */
      }
    }

    try {
      var lang = (navigator.language || '').toLowerCase();
      if (lang.indexOf('-gb') !== -1 || lang === 'en-gb') return 'GB';
      if (lang.indexOf('-us') !== -1 || lang === 'en-us') return 'US';
      if (lang.indexOf('de') === 0 || lang.indexOf('-de') !== -1) return 'DE';
      if (lang.indexOf('fr') === 0) return 'FR';
      if (lang.indexOf('nl') === 0) return 'NL';
      if (lang.indexOf('it') === 0) return 'IT';
      if (lang.indexOf('es') === 0) return 'ES';
      if (lang.indexOf('pl') === 0) return 'PL';
    } catch (e2) { /* ignore */ }

    return 'GB';
  }

  async function getGbpRate(symbol, fallback) {
    try {
      var res = await timeoutFetch(
        'https://api.exchangerate.host/latest?base=GBP&symbols=' + symbol,
        3500
      );
      if (!res.ok) throw new Error('rate http ' + res.status);
      var json = await res.json();
      if (json && json.rates && json.rates[symbol]) return Number(json.rates[symbol]);
      throw new Error('no ' + symbol);
    } catch (e) {
      return fallback;
    }
  }

  function resolveCurrency(country) {
    if (country === 'GB' || country === 'UK') {
      return {
        country: 'GB',
        currency: 'GBP',
        symbol: '\u00A3',
        locale: 'en-GB',
        rateFromGbp: 1
      };
    }
    if (EUR_COUNTRIES[country]) {
      return {
        country: country,
        currency: 'EUR',
        symbol: '\u20AC',
        locale: country === 'DE' ? 'de-DE' : 'en-IE',
        rateFromGbp: GBP_TO_EUR_FALLBACK
      };
    }
    if (USD_COUNTRIES[country] || country === 'US') {
      return {
        country: country || 'US',
        currency: 'USD',
        symbol: '$',
        locale: 'en-US',
        rateFromGbp: GBP_TO_USD_FALLBACK
      };
    }
    // Default non-UK / non-EU → USD (covers VPN-to-US and most other regions)
    return {
      country: country || 'US',
      currency: 'USD',
      symbol: '$',
      locale: 'en-US',
      rateFromGbp: GBP_TO_USD_FALLBACK
    };
  }

  function formatAmount(amountGbp, currency, locale, rateFromGbp) {
    var amount = Number(amountGbp) * Number(rateFromGbp || 1);
    try {
      return new Intl.NumberFormat(locale || 'en-GB', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      var symbol = '\u00A3';
      if (currency === 'EUR') symbol = '\u20AC';
      if (currency === 'USD') symbol = '$';
      return symbol + amount.toFixed(2);
    }
  }

  function formatCompact(amountGbp) {
    return formatAmount(amountGbp, state.currency, state.locale, state.rateFromGbp);
  }

  function labelForOption(el, amountGbp) {
    var name = (el.getAttribute('data-plan-name') || el.value || 'Basic').trim();
    if (/^basic$/i.test(name) || !el.getAttribute('data-plan-name')) {
      name = 'Basic';
    }
    return name + ' \u2014 ' + formatCompact(amountGbp);
  }

  function applyToDom() {
    var nodes = document.querySelectorAll(
      '[data-price-gbp], [data-fixed-gbp], .accent-price.price, option[data-price-gbp], option[data-fixed-gbp]'
    );
    nodes.forEach(function (el) {
      var gbp = parseFloat(
        el.getAttribute('data-price-gbp') ||
          el.getAttribute('data-base-gbp') ||
          ''
      );
      if (isNaN(gbp)) gbp = BASE_GBP;

      var formatted = formatCompact(gbp);
      if (el.tagName === 'OPTION') {
        el.textContent = labelForOption(el, gbp);
      } else if (el.classList.contains('accent-price') || el.classList.contains('price')) {
        var sup = el.querySelector('sup');
        el.textContent = formatted;
        if (sup) el.appendChild(sup);
      } else {
        el.textContent = formatted;
      }
      el.setAttribute('data-displayed-currency', state.currency);
      el.setAttribute('data-displayed-amount', String(
        (gbp * state.rateFromGbp).toFixed(2)
      ));
    });

    document.querySelectorAll('select[name="report_type"] option, select option[value="basic"]').forEach(function (opt) {
      if (opt.hasAttribute('data-price-gbp') || opt.hasAttribute('data-fixed-gbp')) return;
      if (/£|€|\$|\d+\.\d{2}/.test(opt.textContent || '')) {
        opt.setAttribute('data-price-gbp', String(BASE_GBP));
        opt.setAttribute('data-plan-name', 'Basic');
        opt.textContent = labelForOption(opt, BASE_GBP);
        opt.setAttribute('data-displayed-currency', state.currency);
      }
    });
  }

  function syncPaymentConfig() {
    var displayAmount = Number((BASE_GBP * state.rateFromGbp).toFixed(2));
    var bankDisplay = Number((BANK_GBP * state.rateFromGbp).toFixed(2));

    window.__epicCurrency = {
      country: state.country,
      currency: state.currency,
      symbol: state.symbol,
      locale: state.locale,
      rateFromGbp: state.rateFromGbp,
      cardPrice: displayAmount,
      bankPrice: bankDisplay,
      cardPriceGbp: BASE_GBP,
      bankPriceGbp: BANK_GBP,
      format: formatCompact,
      ready: true
    };

    window.formatGbpPrice = function (amountGbp) {
      return formatCompact(amountGbp);
    };
  }

  async function init() {
    var country = await detectCountry();
    var resolved = resolveCurrency(country);
    state.country = resolved.country;
    state.currency = resolved.currency;
    state.symbol = resolved.symbol;
    state.locale = resolved.locale;
    state.rateFromGbp = resolved.rateFromGbp;

    if (state.currency === 'EUR') {
      state.rateFromGbp = await getGbpRate('EUR', GBP_TO_EUR_FALLBACK);
    } else if (state.currency === 'USD') {
      state.rateFromGbp = await getGbpRate('USD', GBP_TO_USD_FALLBACK);
    }

    state.ready = true;
    syncPaymentConfig();
    applyToDom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__epicIpCurrency = {
    init: init,
    applyToDom: applyToDom,
    detectCountry: detectCountry,
    getState: function () { return state; },
    setMockCountry: function (code) {
      try {
        if (code) localStorage.setItem('__mockCountry', String(code).toUpperCase());
        else localStorage.removeItem('__mockCountry');
      } catch (e) { /* ignore */ }
      return init();
    }
  };
})();
