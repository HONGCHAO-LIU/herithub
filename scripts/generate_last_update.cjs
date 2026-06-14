const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'data');
const outputPath = path.join(__dirname, '..', 'public', 'last-update.json');

const files = [
  'business_intelligence.json',
  'academic_conferences.json',
  'academic_papers.json',
];

const now = new Date();

const result = {
  lastUpdate: now.toISOString(),
  formatted: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('Last update written:', result.formatted);