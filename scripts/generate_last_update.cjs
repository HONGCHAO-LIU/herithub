const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'data');
const outputPath = path.join(__dirname, '..', 'public', 'last-update.json');

const now = new Date();

const result = {
  lastUpdate: now.toISOString(),
  formatted: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
};

try {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log('Last update written:', result.formatted);
} catch (err) {
  console.error('[ERROR] Failed to write last-update.json:', err.message);
  // 不抛出异常，避免阻断构建流程
}