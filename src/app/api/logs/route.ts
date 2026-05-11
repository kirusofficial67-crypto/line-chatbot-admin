import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'chat'
  const limit = parseInt(searchParams.get('limit') || '100')
  const page = parseInt(searchParams.get('page') || '1')
  const skip = (page - 1) * limit

  if (type === 'notification') {
    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { target: true },
      }),
      prisma.notificationLog.count(),
    ])
    return NextResponse.json({ logs, total, page, limit })
  }

  const [logs, total] = await Promise.all([
    prisma.chatLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { menu: true },
    }),
    prisma.chatLog.count(),
  ])

  return NextResponse.json({ logs, total, page, limit })
}
