import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'subscriptions.json');

/** PUT: 取消订阅（设置 active=false） */
export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的 ID' }, { status: 400 });
    }

    if (!fs.existsSync(DATA_PATH)) {
      return NextResponse.json({ error: '订阅数据不存在' }, { status: 404 });
    }

    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const subs = JSON.parse(raw);

    const idx = subs.findIndex((s: any) => s.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: '未找到该订阅' }, { status: 404 });
    }

    subs[idx].active = false;
    fs.writeFileSync(DATA_PATH, JSON.stringify(subs, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
