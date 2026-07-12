const fs = require('fs')

/** Resolves a local Chrome/Chromium binary from env or common install paths. */
function resolveChromeExecutable() {
  const fromEnv =
    process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv
  }

  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA
        ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
        : '',
    ].filter(Boolean)
    for (const p of candidates) {
      if (fs.existsSync(p)) return p
    }
  }

  if (process.platform === 'darwin') {
    const p =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    if (fs.existsSync(p)) return p
  }

  if (process.platform === 'linux') {
    const candidates = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    ]
    for (const p of candidates) {
      if (fs.existsSync(p)) return p
    }
  }

  return undefined
}

module.exports = { resolveChromeExecutable }
