/**
 * merge_qs_data.cjs
 * 
 * Prebuild 阶段脚本：将多个数据源合并到 heritage.json
 * 
 * 用法: node scripts/merge_qs_data.cjs
 * 
 * 流程:
 *   1. 读取 src/data/heritage.json（已有数据）
 *   2. 读取 src/data/qs_heritage_orgs.json（QS 高校数据）
 *   3. 读取 src/data/unesco_heritage.json（UNESCO 世界遗产数据）
 *   4. 合并去重（按"名称"字段）
 *   5. 输出到 public/heritage.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_HERITAGE = path.join(ROOT, 'src', 'data', 'heritage.json');
const SRC_QS = path.join(ROOT, 'src', 'data', 'qs_heritage_orgs.json');
const SRC_UNESCO = path.join(ROOT, 'src', 'data', 'unesco_heritage.json');
const OUT_DIR = path.join(ROOT, 'public');
const OUT_FILE = path.join(OUT_DIR, 'heritage.json');

console.log('[merge_qs_data] 开始合并数据源...');

/**
 * 安全读取 JSON 数组文件
 * @param {string} filePath 文件路径
 * @param {boolean} required 是否必需（false 时文件不存在仅警告不退出）
 * @returns {Array}
 */
function readJsonArray(filePath, required) {
  if (!fs.existsSync(filePath)) {
    if (required) {
      console.error(`[merge_qs_data] 错误: ${path.basename(filePath)} 不存在`);
      process.exit(1);
    }
    console.warn(`[merge_qs_data] 警告: ${path.basename(filePath)} 不存在，跳过`);
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      console.error(`[merge_qs_data] 错误: ${path.basename(filePath)} 不是数组格式`);
      process.exit(1);
    }
    return data;
  } catch (err) {
    console.error(`[merge_qs_data] 读取 ${path.basename(filePath)} 失败: ${err.message}`);
    process.exit(1);
  }
}

// 1. 读取现有 heritage.json（必需）
const heritageData = readJsonArray(SRC_HERITAGE, true);
console.log(`[merge_qs_data] 已读取 heritage.json: ${heritageData.length} 条记录`);

// 2. 读取 QS 高校数据（必需）
const qsData = readJsonArray(SRC_QS, true);
console.log(`[merge_qs_data] 已读取 qs_heritage_orgs.json: ${qsData.length} 条记录`);

// 3. 读取 UNESCO 世界遗产数据（可选，采集脚本尚未运行时跳过）
const unescoData = readJsonArray(SRC_UNESCO, false);
if (unescoData.length > 0) {
  console.log(`[merge_qs_data] 已读取 unesco_heritage.json: ${unescoData.length} 条记录`);
} else {
  console.log('[merge_qs_data] unesco_heritage.json 未就绪，跳过');
}

// 4. 合并去重（按"名称"字段）
const existingNames = new Set(heritageData.map(item => item['名称']));
const newItems = [];

// 追加来源标签
const allSources = [
  ...qsData,
  ...unescoData,
];

for (const item of allSources) {
  const name = item['名称'];
  if (existingNames.has(name)) {
    console.log(`[merge_qs_data] 跳过重复: ${name}`);
    continue;
  }
  newItems.push(item);
  existingNames.add(name);
}

const merged = [...heritageData, ...newItems];
console.log(`[merge_qs_data] 合并后总数: ${merged.length} (新增 ${newItems.length} 条)`);
console.log(`[merge_qs_data]   - heritage 原有: ${heritageData.length}`);
console.log(`[merge_qs_data]   - QS 高校新增: ${qsData.length - (allSources.length - newItems.length - Math.max(0, allSources.length - qsData.length - newItems.length)) > 0 ? '+' : ''}${qsData.length}`);
console.log(`[merge_qs_data]   - UNESCO 新增: ${unescoData.length > 0 ? '+' : '未采集'}${unescoData.length}`);

// 5. 确保输出目录存在
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// 6. 写入输出文件
try {
  fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`[merge_qs_data] 已输出: ${OUT_FILE}`);
} catch (err) {
  console.error(`[merge_qs_data] 写入失败: ${err.message}`);
  process.exit(1);
}

console.log('[merge_qs_data] 完成.');
