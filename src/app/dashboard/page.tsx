import { prisma } from '@/lib/prisma'
import { DashboardStats } from '@/components/dashboard/stats'
import { DashboardChart } from '@/components/dashboard/chart'
import { RecentLogs } from '@/components/dashboard/recent-logs'
import { BotStatus } from '@/components/dashboard/bot-status'
import { subDays, startOfDay } from 'date-fns'

export default async function DashboardPage() {
  const [
    totalCustomers,
    adminContacts,
    sellerContacts,
    botEnabled,
    recentLogs,
    chartData,
  ] = await Promise.all([
    // นับจำนวนลูกค้า (Customer) รายคน ไม่ใช่จำนวนแชท
    prisma.customer.count(),
    // นับลูกค้าที่เคยกดติดต่อแอดมิน (distinct lineUserId)
    prisma.chatLog.groupBy({
      by: ['lineUserId'],
      where: { menu: { type: 'NOTIFY_ADMIN' } },
    }).then(r => r.length),
    // นับลูกค้าที่เคยกดติดต่อผู้ขาย (distinct lineUserId)
    prisma.chatLog.groupBy({
      by: ['lineUserId'],
      where: { menu: { type: 'NOTIFY_SELLER' } },
    }).then(r => r.length),
    prisma.botSetting.findUnique({ where: { key: 'bot_enabled' } }),
    prisma.chatLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { menu: true },
    }),
    Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 6 - i))
        const nextDate = startOfDay(subDays(new Date(), 5 - i))
        return prisma.chatLog.count({
          where: { createdAt: { gte: date, lt: nextDate } },
        }).then((count) => ({
          date: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
          chats: count,
        }))
      })
    ),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">ภาพรวมระบบ LINE Chatbot</p>
      </div>

      <BotStatus enabled={botEnabled?.value === 'true'} />

      <DashboardStats
        totalCustomers={totalCustomers}
        adminContacts={adminContacts}
        sellerContacts={sellerContacts}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardChart data={chartData} />
        </div>
        <div>
          <RecentLogs logs={recentLogs} />
        </div>
      </div>
    </div>
  )
}
