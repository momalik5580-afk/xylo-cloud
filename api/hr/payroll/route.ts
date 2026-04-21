import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/hr/payroll?month=3&year=2026&userId=&status=DRAFT
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month  = searchParams.get('month')  ? parseInt(searchParams.get('month')!)  : new Date().getMonth() + 1
  const year   = searchParams.get('year')   ? parseInt(searchParams.get('year')!)   : new Date().getFullYear()
  const userId = searchParams.get('userId')
  const status = searchParams.get('status')

  const where: any = { month, year }
  if (userId) where.user_id = userId
  if (status) where.status  = status

  const [records, total] = await Promise.all([
    prisma.payroll_records.findMany({
      where,
      include: {
        users: {
          select: {
            first_name:    true,
            last_name:     true,
            employee_id:   true,
            department_id: true,
            role_id:       true,
          },
        },
      },
      orderBy: { users: { first_name: 'asc' } },
    }),
    prisma.payroll_records.count({ where }),
  ])

  const summary = {
    total,
    totalNetSalary:  records.reduce((s: number, r: any) => s + Number(r.net_salary), 0),
    totalBaseSalary: records.reduce((s: number, r: any) => s + Number(r.base_salary), 0),
    draft:    records.filter((r: any) => r.status === 'DRAFT').length,
    approved: records.filter((r: any) => r.status === 'APPROVED').length,
    paid:     records.filter((r: any) => r.status === 'PAID').length,
  }

  return NextResponse.json({ records, total, summary, month, year })
}

// POST /api/hr/payroll
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'process_month') {
      const { month, year } = body
      const staff   = await prisma.users.findMany({ where: { is_active: true } })
      const created = []
      for (const user of staff) {
        const existing = await prisma.payroll_records.findFirst({ where: { user_id: user.id, month, year } })
        if (existing) continue
        const record = await prisma.payroll_records.create({
          data: {
            user_id:      user.id,
            month,
            year,
            base_salary:  Number(user.basic_salary) || 0,
            net_salary:   Number(user.basic_salary) || 0,
            working_days: 26,
            present_days: 26,
            leave_days:   0,
            abscent_days: 0,
            status:       'DRAFT',
          },
        })
        created.push(record)
      }
      return NextResponse.json({ created: created.length, month, year })
    }

    const { userId, month, year, baseSalary, overtime, bonuses, deductions, taxAmount, workingDays, presentDays, leaveDays, abscnetDays, notes } = body
    const netSalary = baseSalary + (overtime || 0) + (bonuses || 0) - (deductions || 0) - (taxAmount || 0)

    const record = await prisma.payroll_records.create({
      data: {
        user_id:      userId,
        month,
        year,
        base_salary:  baseSalary,
        overtime:     overtime   || 0,
        bonuses:      bonuses    || 0,
        deductions:   deductions || 0,
        tax_amount:   taxAmount  || 0,
        net_salary:   netSalary,
        working_days: workingDays  || 26,
        present_days: presentDays  || 26,
        leave_days:   leaveDays    || 0,
        abscent_days: abscnetDays  || 0,
        notes:        notes || null,
        status:       'DRAFT',
      },
    })
    return NextResponse.json({ record }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}