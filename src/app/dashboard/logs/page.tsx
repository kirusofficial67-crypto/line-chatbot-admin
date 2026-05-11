import { prisma } from '@/lib/prisma'
import { LogsClient } from '@/components/logs/logs-client'

export default async function LogsPage() {
  const [chatLogs, notifyLogs] = await Promise.all([
    prisma.chatLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { menu: true },
    }),
    prisma.notificationLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { target: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ประวัติการใช้งาน</h1>
        <p className="text-muted-foreground">ประวัติการกดเมนูและการแจ้งเตือน</p>
      </div>
      <LogsClient chatLogs={chatLogs} notifyLogs={notifyLogs} />
    </div>
  )
}
