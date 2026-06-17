# herithub scripts/ 代码现状审计报告

> 审计日期: 2026-06-16  
> 审计范围: `scripts/` 目录下 9 个脚本 + `.github/workflows/daily-pipeline.yml`  
> 审计维度: 错误处理 / 字段容错 / 凭证安全 / 日志 / 性能 / 冗余代码 / AI 接入点

---

## 总体评分汇总

| 脚本 | 错误处理 | 字段容错 | 安全 | 日志 | 性能 | 冗余 | 综合 |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| crawl_business.py | B+ | A- | A | A | B | C+ | B+ |
| validate_prices.py | B+ | A | A | A | A | A | A- |
| crawl_conferences.py | B+ | A- | A | A | B | C+ | B+ |
| crawl_papers.py | A- | A | A | A | B | C+ | B+ |
| check_links.py | A- | A | A | A | A- | A | A |
| merge_and_generate.py | B+ | A | A | A | A | B+ | B+ |
| daily_update.py | C+ | A | D | D | B | B+ | C |
| notify_subscribers.py | C | B+ | A | D | B | C+ | C+ |
| generate_last_update.cjs | D | N/A | A | D | A | C | D+ |
| daily-pipeline.yml | C+ | N/A | B+ | A | C+ | A | B |

---

## 逐文件详细审计

---

### 1. crawl_business.py (522 行)

#### 1.1 错误处理: B+

- `fetch_with_retry()` 实现了 3 次重试，覆盖 Timeout / ConnectionError / HTTPError / 通用 Exception，返回 None 给调用方判断。设计合理。
- 三个爬虫函数内部均用 try/except 包裹了整个循环体，单条失败不中断整体。
- `main()` 对每个信源单独 try/except，某个信源失败不影响其他。
- **改进点**: 网络层面的重试间隔为固定 `RETRY_DELAY * attempt` (2s/4s/6s)，建议加入随机抖动（jitter）避免惊群效应。爬虫未处理 HTTP 403/503 等非 200 但可重试的场景——当前 `raise_for_status()` 后直接进 except，可增加针对 5xx 的专项重试。

#### 1.2 字段容错: A-

- `.get_text(strip=True)` 和 `link_el.get("href", "")` 均有默认值兜底。
- `classify_article()` 对空标题/描述返回默认分类 `["专业服务"]`。
- `extract_amount()` 有多个正则回退模式。
- **改进点**: `generate_seed_data()` 中的种子数据字段并非全部与爬虫输出字段对齐——种子数据缺少 `type` 在部分条目中有，有的没有 `crawled_at`（后补）。建议统一 schema。

#### 1.3 凭证安全: A

- 无硬编码 Token/密码/API Key。
- User-Agent 是通用 Chrome 标识，无敏感信息。

#### 1.4 日志: A

- 同时输出到文件（带时间戳文件名）和控制台，日志级别 INFO，格式规范。
- 每个步骤前后均有日志打点，可追溯。

#### 1.5 性能: B

- `crawl_ccgp()` 遍历所有关键词（7 板块 × ~5 词 = 35 词），每个发一次 POST 请求，全部串行。虽然做了 `[:5]` 限制，但仍是串行阻塞 I/O。
- **改进点**: 可使用 `concurrent.futures.ThreadPoolExecutor` 对多关键词搜索并行化，将采集时间缩短为原来的 1/N。

#### 1.6 冗余代码: C+

- `from datetime import timedelta` 未使用。
- `SOURCE_CONFIGS` (第 75-93 行) 定义了三个信源配置，但三个爬虫函数内部全部硬编码 URL 而非读取该配置——完全死代码。
- `ARTICLE_TYPES` (第 100 行) 定义后仅用于文档说明，代码中 `infer_article_type()` 自己返回硬编码字符串。
- `generate_seed_data()` 与采集函数输出的 item 字段不一致（种子有 `type`/`amount`/`publish_date`/`sectors` 等，但缺少某些爬虫产出的字段如 `description` 长度处理方式不同）。

#### 1.7 AI 接入点分析

| 插入位置 | 触发时机 | 传递数据 | 用途 |
|----------|----------|----------|------|
| `main()` 第 ~458 行，去重前 | 每次采集完成后 | 全部 `all_results` 列表 (每条的 title, description, source, link, sectors) | **AI 辅助分类**: LLM 重新评估 `sectors` 分类准确性，修正 `classify_article` 的简单关键词匹配误判 |
| 同上位置 | 同上 | 同上 | **语义去重**: 标题相似但 ID 不同的条目，LLM 判断是否为同一信息的不同转载 |
| 写入 JSON 前 (第 ~475 行) | 去重后 | 全部 unique_results | **质量评分**: LLM 对每条数据给出 1-5 分质量评估，过滤低质量/不相关条目 |

---

### 2. validate_prices.py (268 行)

#### 2.1 错误处理: B+

- 主流程各步骤均有 try/except 包裹，JSON 读取失败会返回 1 退出码。
- 历史数据文件不存在时以 warning 降级，不阻断流程。
- **改进点**: `parse_amount()` 对于格式异常返回 None，但调用方统一标记为 "skipped"，无法区分"真正无金额"和"格式无法解析"。建议增加 `parse_error` 字段。

#### 2.2 字段容错: A

- `item.get("type", "其他")`、`item.get("amount", "")` 均有默认值。
- `extract_price_history()` 对 `items` 做了 `isinstance(list)` 判断后才遍历。
- 验证状态写回时通过 `validation_map` 做 O(1) 查找。

#### 2.3 凭证安全: A

- 无任何凭证。

#### 2.4 日志: A

- 标准文件+控制台双通道日志。

#### 2.5 性能: A

- 纯内存计算，O(n) 复杂度，无性能瓶颈。

#### 2.6 冗余代码: A

- 无明显未使用导入或死代码。

#### 2.7 AI 接入点分析

| 插入位置 | 触发时机 | 传递数据 | 用途 |
|----------|----------|----------|------|
| 第 ~195 行（anomaly 判定后） | 检测到异常价格 | anomaly 条目 (title, amount, baseline_median, deviation, type) | **AI 辅助判定**: LLM 判断异常是否为合理市场波动（如特大项目、特殊品类），减少误报 |
| 报告写入前 (第 ~235 行) | 所有验证完成 | 全部 anomaly 列表 + baselines | **异常摘要生成**: LLM 生成人类可读的异常分析报告 |

---

### 3. crawl_conferences.py (412 行)

#### 3.1 错误处理: B+

- `fetch_with_retry()` 与 crawl_business 相同实现，有 3 次重试。
- 三个爬虫函数外层均有 try/except，失败不传播。
- `parse_date()` 对非法日期返回 None，`is_in_window()` 对 None 返回 True（保守策略：无日期的保留）。
- **改进点**: 同 crawl_business，建议加入 jitter 和 5xx 专项重试。

#### 3.2 字段容错: A-

- CSS 选择器返回空时 `if not link_el: continue` 跳过。
- `date_text if date_text else "待定"` 兜底。
- `generate_seed_data()` 统一补齐 `id` 和 `crawled_at`。
- **改进点**: `parse_date` 返回 None 时 `is_in_window` 返回 True，这会把"日期格式完全不匹配"的条目当作有效保留，可能导致过期会议混入。建议对无法解析日期的条目标记为 `date_confidence: low`。

#### 3.3 凭证安全: A

- 无凭证。

#### 3.4 日志: A

- 标准日志配置。

#### 3.5 性能: B

- 三个信源串行采集，每个 1 次请求，总量不大。但如果 ICOMOS 响应慢（timeout=30s），会拖慢全局。可并行化。

#### 3.6 冗余代码: C+

- `SOURCE_CONFIGS` (第 87-104 行) 完整定义了三个信源的 URL/超时，但爬虫函数全部硬编码 URL，该配置完全未使用——与 crawl_business 相同的问题。
- `generate_seed_data()` 内部定义的 `fmt` lambda 函数名与 Python 标准库冲突（非严重但风格不佳）。

#### 3.7 AI 接入点分析

| 插入位置 | 触发时机 | 传递数据 | 用途 |
|----------|----------|----------|------|
| `main()` 第 ~365 行，去重前 | 每次采集完成 | 全部 `all_results` (name, date, location, organizer, url) | **AI 结构化提取**: 从自由文本中提取标准化日期/地点/投稿截止日 |
| 同上位置 | 同上 | 同上 | **AI 去重**: 同一会议在不同信源报道的语义匹配，替代纯 ID 去重 |
| 种子数据生成前 | 所有信源均无结果 | 当日日期、历史会议列表 | **AI 补充生成**: 基于历史模式生成更具时效性的种子数据 |

---

### 4. crawl_papers.py (429 行)

#### 4.1 错误处理: A-

- `fetch_with_retry()` 针对 429 限速做了专项退避（`wait = RETRY_DELAY * attempt * 2`），业内最佳实践。
- XML 解析在 try 块内，`ET.fromstring` 失败不崩溃。
- **改进点**: arXiv XML 中个别字段可能缺失（如无 author、无 summary），当前通过 `if xxx is not None and xxx.text` 防御，但 abstract 截断 `[:500]` 可能在多字节字符（中文）处截断不完整。

#### 4.2 字段容错: A

- Crossref `date-parts` 处理了 1/2/3 元素三种情况，防御充分。
- DOI 前缀检测 `if link and not link.startswith('http') and link.startswith('10.')` 正确。
- `generate_seed_data()` 为种子补齐 `arxiv_id` 空字符串。

#### 4.3 凭证安全: A

- 无凭证。User-Agent 是项目标识。

#### 4.4 日志: A

- 每个关键词的 arXiv/CrossRef 搜索均有独立日志。

#### 4.5 性能: B

- 5 个关键词 × 2 个 API = 10 次串行 HTTP 请求。arXiv 和 CrossRef 完全独立，可并行。
- **改进点**: 使用 `concurrent.futures` 对所有关键词×API 组合并行请求，预计可提速 5-8 倍。

#### 4.6 冗余代码: C+

- `from urllib.parse import quote, urlencode` — 两者均未在代码中使用。
- `import re` — 仅在 `sanitize_text()` 中使用一次 `re.sub(r"\s+", " ", text)`，功能等价于 `" ".join(text.split())`，后者更快且无需导入 re。
- `feedparser` 在文件头部注释中列为依赖，但实际代码使用 `xml.etree.ElementTree` 解析 arXiv 响应——注释与实现不一致。

#### 4.7 AI 接入点分析

| 插入位置 | 触发时机 | 传递数据 | 用途 |
|----------|----------|----------|------|
| `main()` 第 ~365 行，去重后 | 每次采集完成 | 全部 unique papers (title, abstract, authors, journal, doi) | **AI 中文摘要**: LLM 对英文摘要生成 2-3 句中精炼概述 |
| 同上 | 同上 | 同上 | **AI 主题分类**: LLM 将论文归类到文化遗产子领域，补充 tags |
| 同上 | 同上 | 同上 | **AI 质量过滤**: 识别非学术内容、低质量预印本、不相关论文 |

---

### 5. check_links.py (312 行)

#### 5.1 错误处理: A-

- 异步检查中逐异常类型细分：`TimeoutError` / `ClientConnectorError` / `ClientError` / 通用 `Exception`，每种都有独立的 error 消息。
- `extract_all_urls()` 逐文件 try/except，单文件损坏不中断。
- `update_data_files()` 对每个文件独立异常处理。
- **改进点**: `asyncio.run()` 在主流程中仅有一层 try/except，如果事件循环本身崩溃（极少见），所有结果丢失。建议增加中间结果定期持久化。

#### 5.2 字段容错: A

- `extract_urls_from_item()` 全部使用 `.get()` 默认值。
- `is_skippable()` 处理空字符串和 None。
- `update_data_files()` 双重检查 `idx < len(items)` 和 `isinstance(items[idx], dict)`。
- 链接字段别名列表 (`aliases`) 覆盖了多个常见命名变体。

#### 5.3 凭证安全: A

- 无凭证。

#### 5.4 日志: A

- 每 20 个链接输出进度，大规模检查时可追踪。

#### 5.5 性能: A-

- aiohttp + Semaphore(10) + TCPConnector 是正确的异步方案。
- **改进点**: `force_close=True` 会导致每个请求结束后关闭连接，大幅增加 TCP 握手开销。对于检查数百个链接的场景，建议设为 `force_close=False` 并启用连接池复用。另外 `session.head()` 对某些服务器可能返回 405，可增加 GET 作为 fallback。

#### 5.6 冗余代码: A

- 无未使用导入，代码干净。

#### 5.7 AI 接入点分析

| 插入位置 | 触发时机 | 传递数据 | 用途 |
|----------|----------|----------|------|
| 第 ~260 行，`update_data_files` 前 | 检查完成后 | `dead_links` 列表 (url, error, source_file, item_id) | **AI 链接修复建议**: 对死链，LLM 搜索 Wayback Machine 或建议替代 URL |
| 同上 | 同上 | 同上 | **AI 异常分类**: 区分"永久失效"和"临时不可达"，减少误报 |

---

### 6. merge_and_generate.py (300 行)

#### 6.1 错误处理: B+

- `load_json()` / `save_json()` 均有 try/except 兜底，返回空 dict 或记录错误。
- `merge_category()` 被 main 的 try/except 包裹，单个类别失败不阻断其他。
- **改进点**: `parse_date()` 内部重新 `import re`（第一次调用时才导入），虽然在函数内导入避免了顶层导入顺序问题，但每次调用都重新 import 有微小开销，且与文件头部风格不一致（其他脚本都在顶部 import re）。

#### 6.2 字段容错: A

- `make_dedup_key()` 使用 `item.get("title", "") or item.get("name", "")` 双重回退。
- `is_fresh()` 依次尝试 `publish_date` / `date` / `published` / `crawled_at` 四个字段，防御非常充分。
- `parse_date()` 对 None/空/非法值均返回 None，is_fresh 对 None 返回 True（保守保留）。

#### 6.3 凭证安全: A

- 无凭证。

#### 6.4 日志: A

- 标准日志。

#### 6.5 性能: A

- 去重用 dict 实现 O(1) 查找，排序 O(n log n)，无瓶颈。

#### 6.6 冗余代码: B+

- `import shutil` 未在代码中使用。
- `import hashlib` 使用正确。`from datetime import timedelta` 使用正确。

#### 6.7 AI 接入点分析

| 插入位置 | 触发时机 | 传递数据 | 用途 |
|----------|----------|----------|------|
| `merge_category()` 第 ~180 行，去重后排序前 | 每个类别合并完成 | deduped 列表 (全部字段) | **AI 语义去重**: 在当前基于标题+URL 的 MD5 去重基础上，增加基于嵌入向量的语义相似度去重 |
| 同上 | 同上 | 同上 | **AI 质量排序**: LLM 对条目评分，高质量条目排在前面 |
| `main()` 第 ~260 行，统计输出前 | 全部合并完成 | statistics dict | **AI 数据摘要**: 生成当日数据更新的人类语言摘要 |

---

### 7. daily_update.py (210 行)

#### 7.1 错误处理: C+

- `run_cmd()` 捕获 `returncode` 和 stderr，但不抛出异常，调用方需自行判断。
- `main()` 对每个 step 有 try/except，失败不阻断后续步骤——这在自动化场景下是合理的容错设计。
- **严重问题**: 无超时控制。`subprocess.run()` 未设置 `timeout` 参数，爬虫或部署命令可能无限挂起。

#### 7.2 字段容错: A

- `step2_merge()` 对 `business_intelligence.json` 的所有字段均有默认值 (`item.get('title', '')`)。
- `merge_simple()` 使用 `setdefault('tags', [])` 和 `setdefault('keywords', [])` 做字段补全——与项目文档 §6.2 的防御策略一致。
- `next_id` 计算有 `max()` + `isinstance` 防御。

#### 7.3 凭证安全: D

- **高危**: Vercel Token 通过命令行参数 `--token {VERCEL_TOKEN}` 传递，在 Linux 上会暴露于 `/proc/<pid>/cmdline`，任何同机用户可读取。
- **建议**: 使用环境变量 `VERCEL_TOKEN` 由 Vercel CLI 自动读取，或通过 `--token "$(cat .vercel/.token)"` 配合 stdin 方式，或使用 `vercel --token $(< .vercel/.token)` 的进程替换方式（仍有风险），最佳方案是让 Vercel CLI 从环境变量读取而无需显式传参。

#### 7.4 日志: D

- 全部使用 `print()` 而非 `logging` 模块。
- 无时间戳、无日志级别、无文件持久化——排查问题时几乎无法追溯。
- **建议**: 至少增加 `logging.basicConfig` 输出到文件。

#### 7.5 性能: B

- 步骤串行执行，其中 `step1_crawl` 内部三个爬虫也是串行 `subprocess.run`。可将三个爬虫并行启动。
- `step4_git` 执行 `git status --short` 后再 commit——合理跳过空变更。

#### 7.6 冗余代码: B+

- `import sys` 使用正确。`import os` 使用正确。无明显死代码。

#### 7.7 其他严重问题

- **硬编码绝对路径**: 第 20 行 `PROJECT_DIR = Path(r'C:\Users\Administrator\Favorites\workspace-work\versions\v1.3.3')` 硬编码了 Windows 特定路径。在 GitHub Actions (ubuntu-latest) 上运行时此路径不存在，意味着此脚本只能在特定 Windows 机器上运行，不能用于 CI。实际上 `daily-pipeline.yml` 中并没有调用 `daily_update.py`——这说明该脚本是本地手动使用的，但硬编码路径使其极度脆弱。
- **shell=True 风险**: `subprocess.run(cmd, shell=True, ...)` 如果 cmd 中拼接了用户可控数据，存在命令注入风险。当前所有 cmd 是硬编码字符串，风险较低但不符合安全最佳实践。

#### 7.8 AI 接入点分析

| 插入位置 | 触发时机 | 传递数据 | 用途 |
|----------|----------|----------|------|
| `step2_merge()` 第 ~100 行，新数据合并后 | 数据合并完成 | 新加入的条目列表 (new_added items) | **AI 数据审核**: 对新条目做质量/分类/重复检查后再入库 |
| `main()` 第 ~195 行，部署前 | 所有步骤完成但部署前 | 当日采集统计 | **AI 异常判定**: 检测采集量突变（如突然 0 条或暴增 500 条），触发告警 |

---

### 8. notify_subscribers.py (246 行)

#### 8.1 错误处理: C

- `load_json()` 有 try/except，但 `main()` 整体无 try/except——JSON 解析失败以外的异常会直接崩溃。
- 写入 `notification_queue.json` 无异常处理。
- **改进点**: `main()` 应包裹在 try/except 中。

#### 8.2 字段容错: B+

- `extract_item_repr()` 对三种数据类型分别处理字段映射。
- `match_keywords()` 处理空字符串和 None。
- **改进点**: 论文数据中 `item.get('authors', '')` 返回的是 list 而非 str，`' '.join()` 对 list 会拼接但可能不符合预期——如果 authors 是 list of str，join 会拼接；如果嵌套复杂会报错。建议增加 `isinstance` 检查。

#### 8.3 凭证安全: A

- 无凭证。邮件发送逻辑未实现（仅生成队列），后续实现时需注意 SMTP 密码安全。

#### 8.4 日志: D

- 全部使用 `print()`，无日志模块。排查匹配逻辑问题困难。

#### 8.5 性能: B

- O(S×I) 匹配，对于小规模（<100 订阅者 × <500 条目 = 50000 次比对）可接受。
- 关键词匹配使用 `kw in item_text`，对中文文本是 O(n*m) 子串搜索，数据量大时可考虑使用 AC 自动机或倒排索引。

#### 8.6 冗余代码: C+

- `import sys` 未使用。
- `from typing import Optional` 导入但函数签名中未使用 Optional 类型注解。

#### 8.7 AI 接入点分析

| 插入位置 | 触发时机 | 传递数据 | 用途 |
|----------|----------|----------|------|
| `main()` 第 ~230 行，通知队列生成后 | 匹配完成 | 全部 notifications | **AI 通知摘要**: LLM 为每条匹配生成个性化通知文案 |
| 匹配循环内部 (第 ~200 行) | 每个订阅者匹配时 | item_text + subscriber_keywords | **AI 语义匹配**: 替代纯关键词字符串包含匹配，用嵌入向量做语义相似度匹配 |

---

### 9. generate_last_update.cjs (21 行)

#### 9.1 错误处理: D

- 完全没有 try/catch。`fs.writeFileSync` 可能因权限不足或磁盘满而抛出异常，导致 `npm run prebuild` 失败 → 整个构建中断。
- **建议**: 包裹在 try/catch 中，失败时输出 warning 但不阻断构建。

#### 9.2 字段容错: N/A

- 不涉及数据字段。

#### 9.3 凭证安全: A

- 无凭证。

#### 9.4 日志: D

- 仅一行 `console.log`。建议增加错误情况的 stderr 输出。

#### 9.5 性能: A

- 简单文件写入，无性能问题。

#### 9.6 冗余代码: C

- `files` 数组（第 5-8 行）声明并赋值了三个数据文件名，但整个脚本中从未使用。这是明显的死代码——可能曾是"从数据文件中取最新日期"的实现残留，现在已改为直接用 `new Date()`。

#### 9.7 AI 接入点分析

- 过于简单，无 AI 接入必要。

---

### 10. .github/workflows/daily-pipeline.yml (205 行)

#### 10.1 错误处理: C+

- 每个 job 的步骤之间没有 `continue-on-error`，某一步失败会中止整个 job——但这是合理的设计。
- **严重问题**: 没有失败通知机制。爬虫失败、合并失败、push 失败均无人知晓。建议增加 `if: failure()` 步骤发送通知。
- **改进点**: `git push` 可能因冲突失败（如果有人手动 push），当前无冲突处理。

#### 10.2 字段容错: N/A

#### 10.3 凭证安全: B+

- 没有显式暴露 Token。Git push 使用 Actions 内置 `GITHUB_TOKEN`。
- **改进点**: 如果使用 `secrets.VERCEL_TOKEN` 部署，需确保以环境变量方式传递而非 CLI 参数。

#### 10.4 日志: A

- GitHub Actions 内置日志完善。

#### 10.5 性能: C+

- 每个 job 独立 `pip install requests beautifulsoup4 aiohttp`，无缓存。建议启用 pip 缓存：

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: pip-${{ runner.os }}-${{ hashFiles('requirements.txt') }}
```

- 商业情报管线安装 `aiohttp` 但实际未使用（仅 check_links 用）——浪费安装时间。

#### 10.6 冗余代码: A

- 结构清晰，无冗余。

#### 10.7 调度表达式问题

- `0 19 1 * *` 意图是"每月 1 日 UTC+8 3:00 → UTC 19:00"，但这个 cron 表示"每月 1 日 UTC 19:00"，对于 UTC+8 来说就是每月 1 日 3:00（次日凌晨）。但 cron 会在每月 1 日执行，而不是每月 1 日的前一天。实际上：每月 1 日 UTC 19:00 = 北京时间每月 2 日凌晨 3:00，与文档说的"每月 1 日"有 1 天偏差。建议改为 `0 19 28-31 * *` + 脚本内判断是否为当月最后一天，或接受 1 天偏差（非关键路径）。

#### 10.8 AI 接入点分析

| 插入位置 | 触发时机 | 传递数据 | 用途 |
|----------|----------|----------|------|
| 每个 pipeline 的 merge step 之后 | 数据合并完成 | 当日新增数据文件路径 | **AI 审核 Job**: 运行 AI 质量审核，标记低质量条目到 review 看板 |
| 所有 job 之后 (新增 job) | 所有管线完成 | merge_statistics.json | **AI 摘要 Job**: 生成每日采集摘要并通知管理员 |
| `if: failure()` 步骤 | 任何步骤失败 | 失败日志 | **AI 故障分析**: LLM 分析日志给出修复建议 |

---

## 跨脚本共性问题

### 共性问题 1: SOURCE_CONFIGS 死代码

`crawl_business.py` 和 `crawl_conferences.py` 均定义了 `SOURCE_CONFIGS` 配置列表但未使用。爬虫函数直接硬编码 URL，如果信源 URL 变更需要同时修改配置列表和函数内部两处。

**修复建议**: 重构爬虫函数，从 `SOURCE_CONFIGS` 读取 URL/timeout，或直接删除该配置列表。

### 共性问题 2: 日志不统一

| 脚本 | 日志方案 |
|------|----------|
| crawl_*.py / validate / merge / check_links | `logging` 模块 → 文件 + 控制台 |
| daily_update.py | `print()` |
| notify_subscribers.py | `print()` |
| generate_last_update.cjs | `console.log()` |

**修复建议**: `daily_update.py` 和 `notify_subscribers.py` 统一使用 `logging` 模块，保持与爬虫脚本一致的日志格式和文件输出。

### 共性问题 3: 爬虫串行化

三个爬虫脚本内部的信源采集均为串行。`crawl_papers.py` 的 5×2=10 次 API 调用完全独立，并行化收益最大。

**修复建议**: 使用 `concurrent.futures.ThreadPoolExecutor` 或 `asyncio` + `aiohttp` 统一改造所有爬虫的 HTTP 请求层。

### 共性问题 4: 种子数据维护负担

4 个脚本有种子数据（business / conferences / papers），均为手工维护的静态列表。随着时间推移，种子数据会过时。

**修复建议**: 种子数据应按季度更新，或改为从历史正式数据中采样生成。

### 共性问题 5: 缺少 requirements.txt

项目包含 9 个 Python 脚本，依赖 `requests`, `beautifulsoup4`, `aiohttp`，但没有 `requirements.txt`。GitHub Actions 中通过 `pip install` 显式列出依赖——如果依赖变更需要同步修改 YAML。

**修复建议**: 在 `scripts/` 下添加 `requirements.txt`，Actions 中改用 `pip install -r scripts/requirements.txt`。

---

## AI 集成优先级建议

按投入产出比排序：

| 优先级 | 集成项 | 涉及脚本 | 预期收益 |
|--------|--------|----------|----------|
| P0 | 语义去重（替代 MD5 标题去重） | merge_and_generate.py | 消除跨信源重复数据 |
| P0 | 采集失败告警 | daily-pipeline.yml | 避免数据断层 |
| P1 | AI 辅助分类（替代关键词匹配） | crawl_business.py | 提升分类准确率 |
| P1 | 论文中文摘要生成 | crawl_papers.py | 提升用户体验 |
| P2 | 智能价格异常判定 | validate_prices.py | 减少误报 |
| P2 | AI 数据质量审核 | daily_update.py | 入库前质量把关 |
| P3 | 死链修复建议 | check_links.py | 辅助运维 |
| P3 | 通知文案个性化 | notify_subscribers.py | 提升订阅体验 |

---

## 修复清单（按严重程度排序）

| # | 优先级 | 文件 | 问题 | 修复动作 |
|---|--------|------|------|----------|
| 1 | 紧急 | daily_update.py:20 | 硬编码绝对路径 | 改为 `Path(__file__).resolve().parent.parent` |
| 2 | 紧急 | daily_update.py:183 | Token 暴露于进程列表 | 改用环境变量 `VERCEL_TOKEN`，不传 `--token` 参数 |
| 3 | 高 | daily-pipeline.yml | 无失败通知 | 增加 `if: failure()` 的 Slack/邮件通知步骤 |
| 4 | 高 | generate_last_update.cjs | 无错误处理 | 包裹 try/catch |
| 5 | 中 | crawl_business.py:15 | `timedelta` 未使用 | 删除 |
| 6 | 中 | crawl_business.py:75-93 | SOURCE_CONFIGS 死代码 | 删除或重构引用 |
| 7 | 中 | crawl_conferences.py:87-104 | SOURCE_CONFIGS 死代码 | 删除或重构引用 |
| 8 | 中 | crawl_papers.py:35 | `quote, urlencode` 未使用 | 删除 |
| 9 | 中 | merge_and_generate.py:20 | `shutil` 未使用 | 删除 |
| 10 | 中 | notify_subscribers.py:37 | `Optional` 未使用 | 删除 |
| 11 | 中 | notify_subscribers.py:36 | `sys` 未使用 | 删除 |
| 12 | 中 | generate_last_update.cjs:5-8 | `files` 死代码 | 删除 |
| 13 | 中 | daily_update.py | 使用 print 而非 logging | 引入 logging 模块 |
| 14 | 中 | notify_subscribers.py | 使用 print 而非 logging | 引入 logging 模块 |
| 15 | 低 | daily-pipeline.yml | 无 pip 缓存 | 添加 actions/cache |
| 16 | 低 | scripts/ | 无 requirements.txt | 创建 |
| 17 | 低 | crawl_papers.py | re 导入可用 str.split 替代 | 改为 `" ".join(text.split())` |
| 18 | 低 | crawl_*.py | 串行 HTTP 请求 | 使用 ThreadPoolExecutor 并行化 |
| 19 | 低 | check_links.py:167 | force_close=True 降低性能 | 改为 False |
