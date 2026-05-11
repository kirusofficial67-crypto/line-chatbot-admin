import { prisma } from '@/lib/prisma'
import { NotificationsClient } from '@/components/notifications/notifications-client'

export default async function NotificationsPage() {
  const targets = await prisma.notificationTarget.findMany({
    orderBy: { name: 'asc' },
    include: {
      menus: { include: { menu: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ผู้รับการแจ้งเตือน</h1>
        <p className="text-muted-foreground">จัดการบัญชี LINE ที่รับการแจ้งเตือนเมื่อลูกค้าต้องการติดต่อ</p>
      </div>
      <NotificationsClient targets={targets} />
    </div>
  )
}
