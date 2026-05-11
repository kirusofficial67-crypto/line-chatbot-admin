import { prisma } from '@/lib/prisma'
import { MenusClient } from '@/components/menus/menus-client'

export default async function MenusPage() {
  const menus = await prisma.menu.findMany({
    orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
    include: {
      notifications: { include: { target: true } },
      parts: { orderBy: { order: 'asc' } },
    },
  })

  const targets = await prisma.notificationTarget.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">จัดการเมนู Chatbot</h1>
        <p className="text-muted-foreground">เพิ่ม แก้ไข หรือลบเมนูที่แสดงใน LINE Bot</p>
      </div>
      <MenusClient menus={menus} targets={targets} />
    </div>
  )
}
