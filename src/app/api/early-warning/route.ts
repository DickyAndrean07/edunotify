import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { evaluateClassEWS, saveEWSAlerts } from '@/services/earlyWarningService';
import { generateAIClassInsights } from '@/lib/ai/service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const asOfDate = searchParams.get('asOfDate') || undefined;

    if (!classId) {
      return NextResponse.json(
        { error: 'Parameter classId wajib disertakan' },
        { status: 400 }
      );
    }

    const overview = await evaluateClassEWS(session.schoolId, classId, asOfDate);
    return NextResponse.json(overview);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengevaluasi EWS' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { classId, asOfDate, providerOverride } = body;

    if (!classId) {
      return NextResponse.json(
        { error: 'Field classId wajib disertakan' },
        { status: 400 }
      );
    }

    // 1. Evaluate deterministic EWS
    const overview = await evaluateClassEWS(session.schoolId, classId, asOfDate);

    // 2. Generate AI insights
    const aiInsight = await generateAIClassInsights({
      className: overview.className,
      totalStudents: overview.totalStudents,
      averageAttendanceRate: overview.averageAttendanceRate,
      students: overview.students,
      asOfDate,
      providerOverride,
    });

    overview.aiInsight = aiInsight;

    // 3. Save alerts to early_warning_logs
    await saveEWSAlerts(session.schoolId, overview.students, aiInsight.executiveSummary);

    return NextResponse.json(overview);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal menghasilkan analisis EWS dan AI' },
      { status: 500 }
    );
  }
}
