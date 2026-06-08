const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'data');
const outputPath = path.join(__dirname, '..', 'public', 'last-update.json');

const files = [
  'business_intelligence.json',
  'academic_conferences.json',
  'academic_papers.json',
];

let latest = null;

for (const file of files) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  for (const item of data) {
    const t = item.crawledAt;
    if (!t) continue;
    const d = new Date(t);
    if (!latest || d > latest) latest = d;
  }
}

const result = {
  lastUpdate: latest ? latest.toISOString() : new Date().toISOString(),
  formatted: latest
    ? `${latest.getFullYear()}-${String(latest.getMonth()+1).padStart(2,'0')}-${String(latest.getDate()).padStart(2,'0')} ${String(latest.getHours()).padStart(2,'0')}:${String(latest.getMinutes()).padStart(2,'0')}`
    : '—',
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('Last update written:', result.formatted);