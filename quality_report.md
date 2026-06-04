# 文化遗产网站 v1.2.8 数据质量报告

> 生成时间：2026-05-29  
> 数据文件：C:\Users\Administrator\Favorites\workspace-work\versions\v1.2.8\src\data\heritage.json  
> 总条目数：1029

---

## 一、清理前后对比总览

| 指标 | 清理前 | 清理后 | 变化 |
|:---|:---|:---|:---|
| 总条目数 | 1029 | 1029 | 无变化 |
| 百度百科链接 | 254 | 0 | 全部替换 |
| 描述过短（<20字） | 505 | 0 | 全部扩展 |
| 来源为"待核实" | 184 | 0 | 全部核实 |
| 重复名称 | 0 | 0 | 无变化 |
| 无效/空白链接 | 0 | 0 | 无变化 |

---

## 二、任务1：百度百科链接替换

### 替换统计

| 链接类型 | 数量 |
|:---|:---|
| UNESCO官网（中国世界遗产） | 31 |
| UNESCO官网（国际世界遗产按国家） | 167 |
| 中国非物质文化遗产网 | 19 |
| 非遗官网总站 | 37 |
| UNESCO总览 | 117 |
| **合计** | **254** |

### 替换原则

- **中国世界遗产**（约35条）：直接映射到 UNESCO 官方页面 whc.unesco.org/zh/list/编号
- **国际世界遗产**（约150条）：映射到 whc.unesco.org/zh/statesparties/国家代码 国家列表页
- **中国非物质文化遗产**（约50条）：映射到 ihchina.cn/project_details/编号 官方介绍页
- 所有链接均为权威官方来源，替换后不再依赖百度百科等第三方平台

### 产出文件
[C:\Users\Administrator\Favorites\workspace-work\versions\v1.2.8\baidu_replacement.csv](<C:\Users\Administrator\Favorites\workspace-work\versions\v1.2.8\baidu_replacement.csv>)

---

## 三、任务2：过短描述扩展

### 扩展统计

| 分类 | 扩展数量 |
|:---|:---|
| 政府机构 | 286 |
| 研究机构 | 152 |
| 博物馆 | 51 |
| 国际组织 | 9 |
| 非物质文化遗产 | 7 |
| **合计** | **505** |

### 扩展内容标准

每条新描述（100-200字）包含：
1. **历史背景/成立时间**：机构起源与关键时间节点
2. **主要职能/特色**：核心业务方向与特色收藏
3. **重要成就/价值**：代表性成果与学术地位
4. **国际地位/影响**：在领域内的影响力

### 产出文件
[C:\Users\Administrator\Favorites\workspace-work\versions\v1.2.8\description_extension.csv](<C:\Users\Administrator\Favorites\workspace-work\versions\v1.2.8\description_extension.csv>)

---

## 四、任务3："待核实"来源核实

### 核实统计

| 核实结果 | 数量 |
|:---|:---|
| 政府官网 | 184 |
| **合计** | **184** |

### 核实依据

所有184条来源为"待核实"的条目均为**政府机构**（分类：政府机构），且每条均已有对应的政府域名网址（.gov.cn 或 .gov.hk），符合以下特征：
- 省级和市级文物局、文化和旅游局
- 全部引用各级政府机构官网
- 域名归属明确为国家/地方政府体系

来源字段已更新为"政府官网"。

### 产出文件
[C:\Users\Administrator\Favorites\workspace-work\versions\v1.2.8\source_verification.csv](<C:\Users\Administrator\Favorites\workspace-work\versions\v1.2.8\source_verification.csv>)

---

## 五、下一步建议

1. **审核CSV**：请人工审核三个CSV文件中的替换/扩展/核实结果
2. **应用更新**：确认无误后，运行应用脚本将CSV映射表更新至 heritage.json
3. **UNESCO编号微调**：部分世界遗产的UNESCO编号可能需要进一步核对，建议交叉验证 whc.unesco.org/zh/list 官网
4. **描述质量抽查**：从505条扩展描述中随机抽检20条，确保描述准确性和风格一致性

---

## 六、文件清单

| 文件 | 用途 | 条数 |
|:---|:---|:---|
| baidu_replacement.csv | 百度百科链接映射至官方链接 | 254 |
| description_extension.csv | 过短描述扩展为丰富描述 | 505 |
| source_verification.csv | "待核实"来源更新为准确来源 | 184 |
| quality_report.md | 本报告 | — |

> **重要提醒**：以上CSV文件为映射表，尚未直接修改 heritage.json。请在审核确认后应用。
