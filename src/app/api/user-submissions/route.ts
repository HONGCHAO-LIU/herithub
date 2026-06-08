import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'user_submissions.json');

function readSubmissions(): any[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeSubmissions(data: any[]) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/** GET: 查看所有用户提交（管理端） */
export async function GET() {
  const submissions = readSubmissions();
  return NextResponse.json({ total: submissions.length, submissions });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.reviewerEmail || !body.infoSourceLink) {
      return NextResponse.json({ error: '缺少必填信息' }, { status: 400 });
    }

    const submissions = readSubmissions();
    const newSubmission = {
      id: submissions.length > 0 ? Math.max(...submissions.map((s: any) => s.id)) + 1 : 1,
      ...body,
      status: 'pending',
      submittedAt: body.submittedAt || new Date().toISOString(),
    };

    submissions.push(newSubmission);
    writeSubmissions(submissions);

    return NextResponse.json({ success: true, id: newSubmission.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
