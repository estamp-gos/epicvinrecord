const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { resolveChromeExecutable } = require('../server/chromePath');

// Vector Shield + Checkmark + V Emblem
function getShieldSvgSnippet(size = 64) {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0066FF" />
        <stop offset="50%" stop-color="#0084FF" />
        <stop offset="100%" stop-color="#00C0FF" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#FBBF24" />
      </linearGradient>
      <linearGradient id="darkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#1E293B" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0066FF" flood-opacity="0.35" />
      </filter>
    </defs>

    <!-- Outer shield contour -->
    <path d="M50 8 L85 22 C85 58 50 88 50 88 C50 88 15 58 15 22 L50 8 Z" 
          fill="url(#shieldGrad)" />

    <!-- Inner shield facet / 3D depth -->
    <path d="M50 8 L85 22 C85 58 50 88 50 88 L50 8 Z" 
          fill="#0052CC" opacity="0.25" />

    <!-- Amber Trust Accent (top edge highlight) -->
    <path d="M50 14 L78 25 C75 38 68 50 50 62 C32 50 25 38 22 25 L50 14 Z" 
          fill="#07152B" opacity="0.9" />

    <!-- Dynamic "V" / Unified Verification Wing -->
    <path d="M30 32 L50 66 L70 32 L61 32 L50 52 L39 32 Z" 
          fill="url(#shieldGrad)" />

    <!-- Verified Bold Checkmark intersecting V -->
    <path d="M43 55 L35 45 L30 50 L43 65 L73 28 L67 23 Z" 
          fill="#FFFFFF" />

    <!-- Gold security pip at bottom crest -->
    <circle cx="50" cy="76" r="3.5" fill="url(#goldGrad)" />
  </svg>`;
}

// 1. Horizontal Logo HTML (for 588 x 79 PNG)
function getHorizontalLogoHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 588px;
      height: 79px;
      display: flex;
      align-items: center;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding-left: 6px;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .text-box {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .brand-title {
      font-size: 40px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: -0.5px;
      display: flex;
      align-items: baseline;
    }
    .vin-part {
      color: #0070F3;
      font-weight: 900;
    }
    .unified-part {
      color: #0F172A;
      font-weight: 800;
    }
    .badge {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2.2px;
      text-transform: uppercase;
      color: #64748B;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #0070F3;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="logo-container">
    ${getShieldSvgSnippet(68)}
    <div class="text-box">
      <div class="brand-title">
        <span class="vin-part">VIN</span><span class="unified-part">Unified</span>
      </div>
      <div class="badge">
        <span class="badge-dot"></span>Vehicle History &amp; Records
      </div>
    </div>
  </div>
</body>
</html>`;
}

// 2. Report Header Logo HTML (for 697 x 220 PNG)
function getReportHeaderLogoHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 697px;
      height: 220px;
      display: flex;
      align-items: center;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding: 20px 24px;
    }
    .logo-card {
      display: flex;
      align-items: center;
      gap: 24px;
      width: 100%;
    }
    .text-box {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .brand-title {
      font-size: 64px;
      line-height: 1;
      font-weight: 900;
      letter-spacing: -1px;
    }
    .vin-part {
      color: #0070F3;
    }
    .unified-part {
      color: #0F172A;
    }
    .tagline {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 3.5px;
      text-transform: uppercase;
      color: #0070F3;
      margin-top: 10px;
    }
    .sub-tagline {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
      color: #64748B;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="logo-card">
    ${getShieldSvgSnippet(140)}
    <div class="text-box">
      <div class="brand-title">
        <span class="vin-part">VIN</span><span class="unified-part">Unified</span>
      </div>
      <div class="tagline">Official Vehicle History Report</div>
      <div class="sub-tagline">National NMVTIS &amp; Insurance Records Database</div>
    </div>
  </div>
</body>
</html>`;
}

// 3. Square 600x600 Logo / Social Share Card HTML
function getSquareLogoHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 600px;
      height: 600px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      text-align: center;
      padding: 40px;
    }
    .icon-box {
      margin-bottom: 24px;
      filter: drop-shadow(0 12px 24px rgba(0, 112, 243, 0.25));
    }
    .brand-title {
      font-size: 58px;
      line-height: 1;
      font-weight: 900;
      letter-spacing: -1px;
    }
    .vin-part {
      color: #0070F3;
    }
    .unified-part {
      color: #0F172A;
    }
    .tagline {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #0070F3;
      margin-top: 14px;
    }
    .domain-badge {
      margin-top: 22px;
      padding: 8px 24px;
      border-radius: 999px;
      background: #F1F5F9;
      color: #475569;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="icon-box">
    ${getShieldSvgSnippet(190)}
  </div>
  <div class="brand-title">
    <span class="vin-part">VIN</span><span class="unified-part">Unified</span>
  </div>
  <div class="tagline">Vehicle History &amp; Records</div>
  <div class="domain-badge">vinunified.store</div>
</body>
</html>`;
}

// 4. App Icon Favicon HTML (e.g. 192x192, 180x180, etc.)
function getAppIconHtml(size) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0F172A;
      border-radius: ${Math.round(size * 0.22)}px;
      overflow: hidden;
    }
  </style>
</head>
<body>
  ${getShieldSvgSnippet(Math.round(size * 0.78))}
</body>
</html>`;
}

// Full Standalone SVG logo file content
function getFullSvgLogo() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="48" viewBox="0 0 260 48" fill="none">
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0066FF" />
        <stop offset="50%" stop-color="#0084FF" />
        <stop offset="100%" stop-color="#00C0FF" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#FBBF24" />
      </linearGradient>
    </defs>

    <!-- Shield Icon (x=0, y=0, w=44, h=44) -->
    <g transform="translate(2, 2) scale(0.44)">
      <path d="M50 8 L85 22 C85 58 50 88 50 88 C50 88 15 58 15 22 L50 8 Z" fill="url(#shieldGrad)" />
      <path d="M50 8 L85 22 C85 58 50 88 50 88 L50 8 Z" fill="#0052CC" opacity="0.25" />
      <path d="M50 14 L78 25 C75 38 68 50 50 62 C32 50 25 38 22 25 L50 14 Z" fill="#07152B" opacity="0.9" />
      <path d="M30 32 L50 66 L70 32 L61 32 L50 52 L39 32 Z" fill="url(#shieldGrad)" />
      <path d="M43 55 L35 45 L30 50 L43 65 L73 28 L67 23 Z" fill="#FFFFFF" />
      <circle cx="50" cy="76" r="3.5" fill="url(#goldGrad)" />
    </g>

    <!-- Typography -->
    <text x="56" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="28" font-weight="900" fill="#0070F3" letter-spacing="-0.5">VIN</text>
    <text x="108" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="28" font-weight="800" fill="#0F172A" letter-spacing="-0.5">Unified</text>
    <text x="57" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="8" font-weight="700" fill="#64748B" letter-spacing="1.8">VEHICLE RECORDS</text>
  </svg>`;
}

async function run() {
  const chromePath = resolveChromeExecutable();
  console.log('Using Chrome executable:', chromePath);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  async function renderToBuffer(html, width, height, omitBackground = true) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    return await page.screenshot({
      type: 'png',
      omitBackground: omitBackground,
      clip: { x: 0, y: 0, width, height }
    });
  }

  function saveBuffer(buf, outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buf);
    console.log(`Saved: ${outPath} (${buf.length} bytes)`);
  }

  // 1. Horizontal Navbar Logo (588 x 79)
  const navHtml = getHorizontalLogoHtml();
  const navBuf = await renderToBuffer(navHtml, 588, 79, true);
  saveBuffer(navBuf, path.join(__dirname, '..', 'img2', 'vinunified-logos', 'vinunified-logo.png'));

  // 2. Report Header Logo (697 x 220)
  const reportHtml = getReportHeaderLogoHtml();
  const reportBuf = await renderToBuffer(reportHtml, 697, 220, true);
  saveBuffer(reportBuf, path.join(__dirname, '..', 'img2', 'vinunified-logos', 'vinunified-report-logo.png'));

  // 3. Square Logo / OG Image (600 x 600)
  const squareHtml = getSquareLogoHtml();
  const squareBuf = await renderToBuffer(squareHtml, 600, 600, false);
  saveBuffer(squareBuf, path.join(__dirname, '..', 'img', 'logo-record.png'));
  saveBuffer(squareBuf, path.join(__dirname, '..', 'img2', 'vinunified-logos', 'vinunified-square.png'));

  // 4. Favicons / App Icons
  const iconSizes = [64, 128, 152, 167, 180, 192];
  for (const s of iconSizes) {
    const icoHtml = getAppIconHtml(s);
    const icoBuf = await renderToBuffer(icoHtml, s, s, true);
    saveBuffer(icoBuf, path.join(__dirname, '..', 'img', 'ico', `${s}.png`));
  }

  // 5. Standalone SVGs
  const svgContent = getFullSvgLogo();
  fs.writeFileSync(path.join(__dirname, '..', 'img2', 'vinunified-logos', 'vinunified-logo.svg'), svgContent, 'utf8');
  console.log('Generated standalone SVGs.');

  await browser.close();
  console.log('All logo assets successfully generated!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
