/**
 * Injects Vehicle Model + Model Year fields before the email field
 * in all find-vin forms across HTML pages.
 */
const fs = require('fs')
const path = require('path')

const roots = [
  path.join(__dirname, '..', 'index.html'),
  path.join(__dirname, '..', 'price', 'index.html'),
  path.join(__dirname, '..', 'vin-decoder', 'index.html'),
  path.join(__dirname, '..', 'license-plate-lookup', 'index.html'),
  path.join(__dirname, '..', 'sample-vehicle-history-report', 'index.html'),
]

const FIELD_STYLE =
  "width: 100%; padding: 14px 18px; border: 2px solid #e6e6e6; border-radius: 10px; font-size: 16px; background-color: var(--basic-white); outline: none; transition: border-color 0.3s ease;"
const LABEL_STYLE =
  "display: block; margin-bottom: 10px; font-size: 15px; font-weight: 500; color: var(--basic-black);"
const WRAP_STYLE =
  "background: transparent; padding: 0; margin-bottom: 16px; position: relative; z-index: 1;"

function fieldsHtml(idSuffix) {
  return `                                            <div
                                                style="${WRAP_STYLE}">
                                                <label for="car-model-${idSuffix}"
                                                    style="${LABEL_STYLE}">Vehicle
                                                    Model:</label>
                                                <input id="car-model-${idSuffix}" name="car_model" type="text"
                                                    placeholder="e.g. BMW i8" required
                                                    style="${FIELD_STYLE}"
                                                    onmouseover="this.style.borderColor='var(--basic-black)'"
                                                    onmouseout="this.style.borderColor='#e6e6e6'"
                                                    onfocus="this.style.borderColor='var(--main-blue)'"
                                                    onblur="this.style.borderColor='#e6e6e6'">
                                            </div>
                                            <div
                                                style="${WRAP_STYLE}">
                                                <label for="model-year-${idSuffix}"
                                                    style="${LABEL_STYLE}">Model
                                                    Year:</label>
                                                <input id="model-year-${idSuffix}" name="model_year" type="number"
                                                    min="1950" max="2030" placeholder="e.g. 2018" required
                                                    style="${FIELD_STYLE}"
                                                    onmouseover="this.style.borderColor='var(--basic-black)'"
                                                    onmouseout="this.style.borderColor='#e6e6e6'"
                                                    onfocus="this.style.borderColor='var(--main-blue)'"
                                                    onblur="this.style.borderColor='#e6e6e6'">
                                            </div>
`
}

function inject(html) {
  if (html.includes('name="car_model"') && html.includes('name="model_year"')) {
    // Already has some — still inject missing per-form via email id
  }

  // Match email field blocks: id="customer-email-SUFFIX"
  return html.replace(
    /(<input\s+id="customer-email-([^"]+)"\s+name="customer_email")/g,
    (match, inputTag, suffix, offset, full) => {
      // Look back ~800 chars for existing car_model in same form section
      const lookback = full.slice(Math.max(0, offset - 1200), offset)
      if (lookback.includes('name="car_model"')) {
        return match
      }
      // Find start of the email wrapper div (the div containing this input)
      // Insert fields immediately before the email wrapper.
      // We replace a larger chunk: from the email div opening through the input.
      return match
    }
  )
}

/**
 * More reliable: insert before each email label/input wrapper that doesn't
 * already have car_model nearby.
 */
function injectBeforeEmail(html) {
  const re =
    /(<div\s*\n?\s*style="background: transparent; padding: 0; margin-bottom: 16px; position: relative; z-index: 1;">\s*\n?\s*<label for="customer-email-([^"]+)"[\s\S]*?<\/div>)/g

  return html.replace(re, (block, _full, suffix, offset, full) => {
    const lookback = full.slice(Math.max(0, offset - 800), offset)
    if (lookback.includes('name="car_model"')) return block
    return fieldsHtml(suffix) + block
  })
}

let total = 0
for (const file of roots) {
  if (!fs.existsSync(file)) {
    console.warn('skip missing', file)
    continue
  }
  const before = fs.readFileSync(file, 'utf8')
  const after = injectBeforeEmail(before)
  const added =
    (after.match(/name="car_model"/g) || []).length -
    (before.match(/name="car_model"/g) || []).length
  if (after !== before) {
    fs.writeFileSync(file, after)
    console.log('updated', path.relative(path.join(__dirname, '..'), file), '+', added, 'model fields')
    total += added
  } else {
    console.log('unchanged', path.relative(path.join(__dirname, '..'), file))
  }
}
console.log('done, added', total)
