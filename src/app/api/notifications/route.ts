import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const targetSchema = z.object({
  name: z.string().min(1).max(100),
  lineUserId: z.string().min(1),
  isActive: z.boolean().default(true),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const targets = await prisma.notificationTarget.findMany({
    orderBy: { name: 'asc' },
    include: { menus: { include: { menu: true } } },
  })

  return NextResponse.json(targets)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = targetSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const target = await prisma.notificationTarget.create({ data: parsed.data })
  return NextResponse.json(target, { status: 201 })
}
