import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay } from 'date-fns'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [totalChats, adminContacts, sellerContacts, botEnabled] = await Promise.all([
    prisma.chatLog.count(),
    prisma.chatLog.count({ where: { menu: { type: 'NOTIFY_ADMIN' } } }),
    prisma.chatLog.count({ where: { menu: { type: 'NOTIFY_SELLER' } } }),
    prisma.botSetting.findUnique({ where: { key: 'bot_enabled' } }),
  ])

  const chartData = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const date = startOfDay(subDays(new Date(), 6 - i))
      const nextDate = startOfDay(subDays(new Date(), 5 - i))
      const count = await prisma.chatLog.count({
        where: { createdAt: { gte: date, lt: nextDate } },
      })
      return {
        date: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        chats: count,
      }
    })
  )

  return NextResponse.json({
    totalChats,
    adminContacts,
    sellerContacts,
    botEnabled: botEnabled?.value === 'true',
    chartData,
  })
}
