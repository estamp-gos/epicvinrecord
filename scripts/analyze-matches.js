const fs = require('fs');

const files = [
  'index.html',
  'license-plate-lookup/index.html',
  'price/index.html',
  'sample-vehicle-history-report/index.html',
  'vin-decoder/index.html'
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const fileMatches = [];
  lines.forEach((l, i) => {
    if (/epicvin/i.test(l)) {
      fileMatches.push({ line: i + 1, text: l.trim() });
    }
  });
  console.log(`${file}: ${fileMatches.length} occurrences`);
});

