#!/usr/bin/env python3
"""
价格验证脚本 (validate_prices.py)
===========================================
用途: 读取 raw_business.json，与历史价格基准比较，标记偏差超过±30%的异常条目。
      输出验证报告，并将验证状态写回数据。

输入: raw_business.json, business_intelligence.json (历史基准)
输出: price_validation_report.json
副作用: 更新 raw_business.json 中的 validation_status 字段

依赖: json, logging, datetime, pathlib, re, sys, os
"""

import json
import logging
import os
import re
import sys
from datetime import datetime
from pathlib import Path

# ==================== 路径配置 ====================
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
LOGS_DIR = SCRIPT_DIR / "logs"
RAW_FILE = DATA_DIR / "raw_business.json"
HISTORY_FILE = DATA_DIR / "business_intelligence.json"
REPORT_FILE = DATA_DIR / "price_validation_report.json"

# 导入 LLM 客户端（可选，未配置则跳过 AI 辅助判定）
sys.path.insert(0, str(SCRIPT_DIR))
try:
    from llm_client import chat, is_available as llm_available
except ImportError:
    chat = None
    def llm_available(): return False

os.makedirs(LOGS_DIR, exist_ok=True)

# ==================== 日志配置 ====================
LOG_FILE = LOGS_DIR / f"validate_prices_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

# ==================== 常量 ====================
PRICE_DEVIATION_THRESHOLD = 0.30  # ±30%
UNIT_MAP = {"元": 1, "万元": 10000, "亿": 100000000, "亿元": 100000000}


def parse_amount(amount_str: str) -> float | None:
    """解析金额字符串为数值（单位：元）"""
    if not amount_str:
        return None
    # 清理字符串
    cleaned = re.sub(r"[￥¥,，\s]", "", amount_str)
    # 匹配数字+单位
    match = re.match(r"(\d+(?:\.\d+)?)\s*(万元|元|亿|亿元)?", cleaned)
    if not match:
        return None
    value = float(match.group(1))
    unit = match.group(2) if match.group(2) else "元"
    multiplier = UNIT_MAP.get(unit, 1)
    return value * multiplier


def extract_price_history(history_data: dict) -> dict[str, list[float]]:
    """从历史数据中提取各类型项目的价格基准"""
    price_history: dict[str, list[float]] = {}
    items = history_data.get("items", []) if isinstance(history_data, dict) else history_data

    if isinstance(items, list):
        for item in items:
            atype = item.get("type", "其他")
            amount = item.get("amount", "")
            parsed = parse_amount(amount)
            if parsed is not None and parsed > 0:
                if atype not in price_history:
                    price_history[atype] = []
                price_history[atype].append(parsed)
    return price_history


def compute_baselines(price_history: dict[str, list[float]]) -> dict[str, dict]:
    """计算各类型的价格基准（中位数、均值）"""
    baselines = {}
    for atype, prices in price_history.items():
        if not prices:
            continue
        sorted_prices = sorted(prices)
        n = len(sorted_prices)
        median = sorted_prices[n // 2] if n > 0 else 0
        mean = sum(sorted_prices) / n
        baselines[atype] = {
            "count": n,
            "median": median,
            "mean": round(mean, 2),
            "min": min(sorted_prices),
            "max": max(sorted_prices),
        }
    return baselines


def validate_item(item: dict, baselines: dict[str, dict]) -> dict:
    """验证单个条目"""
    atype = item.get("type", "其他")
    amount_str = item.get("amount", "")
    parsed = parse_amount(amount_str)

    result = {
        "item_id": item.get("id", ""),
        "title": item.get("title", ""),
        "type": atype,
        "amount_raw": amount_str,
        "amount_parsed": parsed,
        "validation_status": "skipped",
        "deviation": None,
        "baseline_median": None,
        "message": "",
    }

    if parsed is None or parsed <= 0:
        result["validation_status"] = "skipped"
        result["message"] = "无有效金额，跳过验证"
        return result

    baseline = baselines.get(atype)
    if not baseline:
        result["validation_status"] = "no_baseline"
        result["message"] = f"类型'{atype}'无历史价格基准"
        return result

    median = baseline["median"]
    result["baseline_median"] = median

    if median <= 0:
        result["validation_status"] = "no_baseline"
        result["message"] = "历史基准金额为零"
        return result

    deviation = (parsed - median) / median
    result["deviation"] = round(deviation, 4)

    if abs(deviation) > PRICE_DEVIATION_THRESHOLD:
        direction = "偏高" if deviation > 0 else "偏低"
        result["validation_status"] = "anomaly"
        result["message"] = (
            f"{direction}: 当前金额 {amount_str}，"
            f"历史中位数为 {median / 10000:.2f}万元，"
            f"偏差 {deviation * 100:.1f}%"
        )
    else:
        result["validation_status"] = "normal"
        result["message"] = f"在正常范围内（偏差 {deviation * 100:.1f}%）"

    return result


def main():
    logger.info("=" * 60)
    logger.info(f"价格验证脚本启动 — {datetime.now().isoformat()}")
    logger.info("=" * 60)

    # 步骤1: 读取原始数据
    raw_data = None
    if RAW_FILE.exists():
        try:
            with open(RAW_FILE, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            logger.info(f"已读取原始数据: {RAW_FILE} ({len(raw_data.get('items', []))} 条)")
        except Exception as e:
            logger.error(f"读取原始数据失败: {e}")
            return 1
    else:
        logger.error(f"原始数据文件不存在: {RAW_FILE}")
        return 1

    raw_items = raw_data.get("items", []) if isinstance(raw_data, dict) else raw_data

    # 步骤2: 读取历史价格基准
    baselines = {}
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history_data = json.load(f)
            price_history = extract_price_history(history_data)
            baselines = compute_baselines(price_history)
            logger.info(f"已加载历史价格基准: {len(baselines)} 个类型")
            for atype, bl in baselines.items():
                logger.info(f"  {atype}: 中位数={bl['median'] / 10000:.2f}万元 (n={bl['count']})")
        except Exception as e:
            logger.warning(f"读取历史数据失败，将无法进行偏差比较: {e}")
    else:
        logger.warning(f"历史数据文件不存在: {HISTORY_FILE}，将跳过价格验证")

    # 步骤3: 验证每个条目
    validation_results = []
    anomaly_count = 0
    normal_count = 0
    skipped_count = 0

    for item in raw_items:
        result = validate_item(item, baselines)
        validation_results.append(result)
        if result["validation_status"] == "anomaly":
            anomaly_count += 1
        elif result["validation_status"] == "normal":
            normal_count += 1
        else:
            skipped_count += 1

    # 步骤3.5: AI 辅助异常判定（仅在 LLM 可用且有异常时执行）
    ai_corrected = 0
    if llm_available() and anomaly_count > 0:
        logger.info(f"AI 辅助审核: {anomaly_count} 条异常待判定...")
        anomalies = [r for r in validation_results if r["validation_status"] == "anomaly"]
        for anom in anomalies:
            try:
                prompt = f"""你是文化遗产领域采购专家。以下招标条目被标记为价格异常（偏离历史中位数±30%），请判断这是否为合理报价。

条目信息:
- 标题: {anom.get('title', '')}
- 类型: {anom.get('type', '')}
- 金额: {anom.get('amount', '')}
- 偏差: {anom.get('deviation_pct', 0):.1f}%
- 历史中位数: {anom.get('baseline_median', 0) / 10000:.2f}万元

请仅回复"合理"或"异常"，不要加任何解释。"""
                result = chat([{"role": "user", "content": prompt}], max_tokens=10, temperature=0)
                if result and "合理" in result:
                    anom["validation_status"] = "normal"
                    anom["ai_reviewed"] = True
                    anom["ai_review_result"] = "合理（AI判定）"
                    ai_corrected += 1
                    logger.info(f"  AI 修正: [{anom['type']}] {anom['title'][:40]}... → 合理")
            except Exception as e:
                logger.warning(f"  AI 审核失败: {e}")
        if ai_corrected > 0:
            logger.info(f"AI 修正: {ai_corrected} 条异常被重新判定为合理")
            anomaly_count -= ai_corrected
            normal_count += ai_corrected

    # 步骤4: 写回验证状态到原始数据
    validation_map = {r["item_id"]: r["validation_status"] for r in validation_results}
    for item in raw_items:
        item["validation_status"] = validation_map.get(item.get("id", ""), "skipped")

    try:
        with open(RAW_FILE, "w", encoding="utf-8") as f:
            json.dump(raw_data, f, ensure_ascii=False, indent=2)
        logger.info(f"验证状态已写回: {RAW_FILE}")
    except Exception as e:
        logger.error(f"写回原始数据失败: {e}")

    # 步骤5: 输出验证报告
    report = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "threshold": f"±{PRICE_DEVIATION_THRESHOLD * 100:.0f}%",
            "total_validated": len(validation_results),
            "normal_count": normal_count,
            "anomaly_count": anomaly_count,
            "skipped_count": skipped_count,
        },
        "baselines": {k: {"median": v["median"], "mean": v["mean"], "count": v["count"]}
                       for k, v in baselines.items()},
        "anomalies": [r for r in validation_results if r["validation_status"] == "anomaly"],
        "all_results": validation_results,
    }

    try:
        with open(REPORT_FILE, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        logger.info(f"验证报告已写入: {REPORT_FILE}")
    except Exception as e:
        logger.error(f"写入验证报告失败: {e}")
        return 1

    # 步骤6: 控制台摘要
    print(f"\n{'='*60}")
    print(f" 价格验证摘要")
    print(f"{'='*60}")
    print(f"  验证条目: {len(validation_results)}")
    print(f"  正常: {normal_count} | 异常(>±30%): {anomaly_count} | 跳过: {skipped_count}")
    if anomaly_count > 0:
        print(f"\n  ⚠ 异常条目:")
        for r in report["anomalies"]:
            print(f"    [{r['type']}] {r['title'][:50]}...")
            print(f"    {r['message']}")
    print(f"\n  报告文件: {REPORT_FILE}")
    print(f"  日志文件: {LOG_FILE}")
    print(f"{'='*60}")
    logger.info("价格验证脚本执行完成")
    return 0


if __name__ == "__main__":
    sys.exit(main())
