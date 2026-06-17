import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface SearchDoc {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  url: string;
  date: string;
}

interface SearchIndexData {
  index: Record<string, unknown>;
  docs: SearchDoc[];
  stats: {
    heritage: number;
    conference: number;
    paper: number;
    business: number;
    total: number;
    builtAt: string;
  };
}

const INDEX_PATH = path.join(process.cwd(), 'public', 'search-index.json');

let cachedDocs: SearchDoc[] | null = null;
let useFlexSearch = true;
let flexIndex: any = null;

function loadDocs(): SearchDoc[] {
  if (cachedDocs) return cachedDocs;
  const raw = fs.readFileSync(INDEX_PATH, 'utf-8');
  const data: SearchIndexData = JSON.parse(raw);
  cachedDocs = data.docs;

  // 尝试加载 FlexSearch，失败则降级为文本匹配
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
    const FlexSearch: any = require('flexsearch');
    flexIndex = new FlexSearch.Document({
      tokenize: 'forward',
      document: {
        id: 'id',
        index: [
          { field: 'title', tokenize: 'forward', resolution: 9 },
          { field: 'description', tokenize: 'forward', resolution: 5 },
          { field: 'category', tokenize: 'forward', resolution: 5 },
        ],
        store: ['id', 'title', 'type', 'category', 'description', 'url', 'date'],
      },
    });
    flexIndex.import(data.index as never);
  } catch {
    console.warn('[search] FlexSearch 不可用，降级为文本匹配');
    useFlexSearch = false;
  }

  return cachedDocs;
}

/** 简单文本匹配 - FlexSearch 不可用时的降级方案 */
function textSearch(docs: SearchDoc[], query: string): string[] {
  const q = query.toLowerCase();
  const scores: Map<string, number> = new Map();

  for (const doc of docs) {
    let score = 0;
    const title = (doc.title || '').toLowerCase();
    const desc = (doc.description || '').toLowerCase();
    const cat = (doc.category || '').toLowerCase();

    if (title.includes(q)) score += 100;
    if (cat.includes(q)) score += 50;
    if (desc.includes(q)) score += 20;

    // 部分匹配加分
    for (const word of q.split(/\s+/)) {
      if (!word) continue;
      if (title.includes(word)) score += 10;
      if (cat.includes(word)) score += 5;
      if (desc.includes(word)) score += 2;
    }

    if (score > 0) scores.set(doc.id, (scores.get(doc.id) || 0) + score);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const typeFilter = (searchParams.get('type') || '').trim();

  if (!q) {
    return NextResponse.json({ results: [], total: 0 });
  }

  try {
    const docs = loadDocs();
    let matchedIds: string[];

    if (useFlexSearch && flexIndex) {
      // FlexSearch 模式
      const rawResults = flexIndex.search(q, { limit: 20, enrich: true });
      const idSet = new Set<string>();
      for (const fieldResult of rawResults) {
        for (const item of fieldResult.result) {
          idSet.add((item as unknown as { id: string }).id);
        }
      }
      matchedIds = [...idSet];
    } else {
      // 文本匹配降级
      matchedIds = textSearch(docs, q);
    }

    // 过滤 + 去重
    const seen = new Set<string>();
    const merged: SearchDoc[] = [];
    for (const id of matchedIds) {
      if (seen.has(id)) continue;
      if (merged.length >= 20) break;
      const doc = docs.find((d) => d.id === id);
      if (doc) {
        if (typeFilter && doc.type !== typeFilter) continue;
        seen.add(id);
        merged.push(doc);
      }
    }

    return NextResponse.json({
      results: merged.map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        url: doc.url,
        description: doc.description,
        date: doc.date,
      })),
      total: merged.length,
      mode: useFlexSearch ? 'flexsearch' : 'fallback',
    });
  } catch (err) {
    console.error('[search API] 错误:', err);
    return NextResponse.json(
      { error: '搜索服务暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
}
