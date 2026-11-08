const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'license-plate-lookup/index.html',
  'price/index.html',
  'sample-vehicle-history-report/index.html',
  'vin-decoder/index.html'
];

files.forEach(relPath => {
  const filePath = path.join(__dirname, '..', relPath);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalLen = content.length;

  // 1. Domain replacements (escaped and unescaped)
  content = content.replace(/https:\\\/\\\/epicvinrecord\.com\\\//g, 'https:\\/\\/vinunified.store\\/');
  content = content.replace(/https:\\\/\\\/epicvinrecord\.com/g, 'https:\\/\\/vinunified.store');
  content = content.replace(/https:\/\/epicvinrecord\.com\//g, 'https://vinunified.store/');
  content = content.replace(/https:\/\/epicvinrecord\.com/g, 'https://vinunified.store');
  content = content.replace(/https:\/\/www\.epicvinrecord\.com\//g, 'https://vinunified.store/');
  content = content.replace(/https:\/\/www\.epicvinrecord\.com/g, 'https://vinunified.store');
  content = content.replace(/https:\/\/epicvin\.uk/g, 'https://vinunified.store');
  content = content.replace(/info@epicvinrecord\.com/g, 'info@vinunified.store');

  // 2. Cookie domain and session domain
  content = content.replace(/domain=\.epicvinrecord\.com;/g, 'domain=.vinunified.store;');
  content = content.replace(/data-state_cookie_domain="epicvinrecord\.com"/g, 'data-state_cookie_domain="vinunified.store"');
  content = content.replace(/window\.sessionDomain = 'epicvinrecord\.com';/g, "window.sessionDomain = 'vinunified.store';");

  // 3. Logo image replacements
  content = content.replace(/img2\/epicvin-logos\/logo\.png/g, 'img2/vinunified-logos/vinunified-logo.png');
  content = content.replace(/alt="EpicVINrecord UK Logo"/g, 'alt="VINUnified Logo"');
  content = content.replace(/alt="EpicVINrecord Logo"/g, 'alt="VINUnified Logo"');

  // 4. Structured data & titles
  content = content.replace(/EpicVINrecord - Vehicle History Reports & VIN Check/g, 'VINUnified - Vehicle History Reports & VIN Check');
  content = content.replace(/<title>License Plate Lookup \| EpicVINrecord<\/title>/g, '<title>License Plate Lookup | VINUnified</title>');
  content = content.replace(/<title>Vehicle History Report Pricing \| EpicVINrecord<\/title>/g, '<title>Vehicle History Report Pricing | VINUnified</title>');
  content = content.replace(/<title>VIN Decoder \| EpicVINrecord<\/title>/g, '<title>VIN Decoder | VINUnified</title>');
  content = content.replace(/<title>Sample Vehicle History Report \| EpicVINrecord<\/title>/g, '<title>Sample Vehicle History Report | VINUnified</title>');

  // 5. Packages
  content = content.replace(/'EpicVIN Basic Report'/g, "'VINUnified Basic Report'");
  content = content.replace(/'EpicVIN Standard Report'/g, "'VINUnified Standard Report'");
  content = content.replace(/'EpicVIN Premium Report'/g, "'VINUnified Premium Report'");

  // 6. User-facing text replacements
  content = content.replace(/Check your vehicle history report with EpicVIN\./g, 'Check your vehicle history report with VINUnified.');
  content = content.replace(/How to find my car's usage history with EpicVINrecord Vehicle History\?/g, "How to find my car's usage history with VINUnified Vehicle History?");
  content = content.replace(/Quick walkthrough of EpicVIN:/g, 'Quick walkthrough of VINUnified:');
  content = content.replace(/What is an EpicVINrecord Vehicle History Report\?/g, 'What is a VINUnified Vehicle History Report?');
  content = content.replace(/Every day EpicVINrecord provides millions of customers/g, 'Every day VINUnified provides millions of customers');
  content = content.replace(/EpicVINrecord reports are available only to the vehicle owner\./g, 'VINUnified reports are available only to the vehicle owner.');
  content = content.replace(/Do EpicVINrecord reports have information on every vehicle\?/g, 'Do VINUnified reports have information on every vehicle?');
  content = content.replace(/EpicVINrecord boasts an absolutely massive amount of data/g, 'VINUnified boasts an absolutely massive amount of data');
  content = content.replace(/EpicVINrecord provides reports for vehicles/g, 'VINUnified provides reports for vehicles');
  content = content.replace(/EpicVINrecord drastically reduces your chances/g, 'VINUnified drastically reduces your chances');
  content = content.replace(/At EpicVINrecord you can use the VIN number/g, 'At VINUnified you can use the VIN number');
  content = content.replace(/Get EpicVINrecord/g, 'Get VINUnified');
  content = content.replace(/alt="Mobile version of EpicVIN"/g, 'alt="Mobile version of VINUnified"');
  content = content.replace(/Share EpicVINrecord/g, 'Share VINUnified');
  content = content.replace(/text=Check%20your%20vehicle%20history%20with%20EpicVIN/g, 'text=Check%20your%20vehicle%20history%20with%20VINUnified');
  content = content.replace(/subject=Check%20out%20EpicVIN/g, 'subject=Check%20out%20VINUnified');
  content = content.replace(/an EpicVINrecord Vehicle History Report/g, 'a VINUnified Vehicle History Report');
  content = content.replace(/EpicVINrecord is an approved NMVTIS data provider\./g, 'VINUnified is an approved NMVTIS data provider.');
  content = content.replace(/What Customers Say About EpicVINrecord/g, 'What Customers Say About VINUnified');
  content = content.replace(/EpicVINrecord through the eyes of our customers/g, 'VINUnified through the eyes of our customers');
  content = content.replace(/from your EpicVINrecord report\./g, 'from your VINUnified report.');
  content = content.replace(/EpicVINrecord is now where I choose to go/g, 'VINUnified is now where I choose to go');
  content = content.replace(/"EpicVINrecord delivered/g, '"VINUnified delivered');
  content = content.replace(/I put EpicVINrecord in my/g, 'I put VINUnified in my');
  content = content.replace(/"EpicVINrecord was extremely/g, '"VINUnified was extremely');
  content = content.replace(/"I found EpicVINrecord features/g, '"I found VINUnified features');
  content = content.replace(/About EpicVIN/g, 'About VINUnified');
  content = content.replace(/epicvinrecord Vehicle History Reports\. All Rights Reserved\./g, 'VINUnified Vehicle History Reports. All Rights Reserved.');
  content = content.replace(/epicvinrecord VIN Reports\. All Rights Reserved\./g, 'VINUnified VIN Reports. All Rights Reserved.');
  content = content.replace(/acceptance of epicvinrecord's/g, "acceptance of VINUnified's");
  content = content.replace(/operated by epicvinrecord/g, 'operated by VINUnified');

  // 7. Structured JSON "name": "EpicVIN"
  content = content.replace(/"name": "EpicVIN"/g, '"name": "VINUnified"');

  // Write updated file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${relPath} (diff bytes: ${content.length - originalLen})`);
});

