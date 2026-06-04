import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'subscriptions.json');

function readSubscriptions(): any[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeSubscriptions(data: any[]) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/** GET: 按邮箱查询订阅 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: '缺少 email 参数' }, { status: 400 });
  }

  const subs = readSubscriptions();
  const mine = subs.filter((s: any) => s.email === email);

  return NextResponse.json(mine);
}

/** POST: 创建新订阅 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, keywords, categories, notifyMethod } = body;

    if (!email || !keywords) {
      return NextResponse.json({ error: '缺少必填信息' }, { status: 400 });
    }

    const subs = readSubscriptions();
    const newSub = {
      id: subs.length > 0 ? Math.max(...subs.map((s: any) => s.id)) + 1 : 1,
      email,
      keywords,
      categories: categories || ['business', 'conference', 'paper'],
      notifyMethod: notifyMethod || 'email',
      active: true,
      createdAt: new Date().toISOString(),
    };

    subs.push(newSub);
    writeSubscriptions(subs);

    return NextResponse.json({ success: true, id: newSub.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
