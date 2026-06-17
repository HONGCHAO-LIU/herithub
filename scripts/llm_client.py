#!/usr/bin/env python3
"""
LLM 客户端模块 (llm_client.py)
===============================
提供统一的 OpenAI 兼容 API 调用接口，供各脚本复用。

环境变量配置:
  LLM_API_KEY    - API 密钥（必填，未设置时所有调用返回 None）
  LLM_API_BASE   - API 地址（默认 https://api.openai.com/v1）
  LLM_MODEL      - 模型名（默认 gpt-4o-mini）
  LLM_MAX_TOKENS - 最大输出 token（默认 1024）
  LLM_TEMPERATURE - 温度参数（默认 0.3）
"""

import json
import logging
import os
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

logger = logging.getLogger(__name__)

LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_API_BASE = os.environ.get("LLM_API_BASE", "https://api.openai.com/v1")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")
LLM_MAX_TOKENS = int(os.environ.get("LLM_MAX_TOKENS", "1024"))
LLM_TEMPERATURE = float(os.environ.get("LLM_TEMPERATURE", "0.3"))


def chat(messages: list[dict], max_tokens: int = None, temperature: float = None) -> str | None:
    """调用 LLM Chat Completion，返回文本内容。失败返回 None。"""
    if not LLM_API_KEY:
        logger.debug("LLM_API_KEY 未配置，跳过调用")
        return None

    url = f"{LLM_API_BASE.rstrip('/')}/chat/completions"
    body = json.dumps({
        "model": LLM_MODEL,
        "messages": messages,
        "max_tokens": max_tokens or LLM_MAX_TOKENS,
        "temperature": temperature if temperature is not None else LLM_TEMPERATURE,
    }).encode("utf-8")

    req = Request(url, data=body, headers={
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    })

    try:
        with urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"].strip()
    except HTTPError as e:
        logger.warning(f"LLM API HTTP {e.code}: {e.reason}")
        return None
    except URLError as e:
        logger.warning(f"LLM API 网络错误: {e.reason}")
        return None
    except Exception as e:
        logger.warning(f"LLM 调用失败: {e}")
        return None


def is_available() -> bool:
    """检查 LLM 是否可用"""
    return bool(LLM_API_KEY)