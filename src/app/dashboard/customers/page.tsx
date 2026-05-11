import { prisma } from '@/lib/prisma'
import { CustomersClient } from '@/components/customers/customers-client'
import { AlertTriangle } from 'lucide-react'

export default async function CustomersPage() {
  try {
    const [customers, total] = await Promise.all([
      (prisma as any).customer.findMany({
        take: 100,
        orderBy: { lastActiveAt: 'desc' },
        include: { _count: { select: { chatLogs: true } } },
      }),
      (prisma as any).customer.count(),
    ])

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ข้อมูลลูกค้า</h1>
          <p className="text-muted-foreground">รายชื่อและประวัติลูกค้าที่เคยแชทกับ Bot ({total} คน)</p>
        </div>
        <CustomersClient customers={customers} />
      </div>
    )
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ข้อมูลลูกค้า</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-64 gap-4 border-2 border-dashed border-yellow-300 rounded-xl bg-yellow-50">
          <AlertTriangle className="h-10 w-10 text-yellow-500" />
          <p className="text-lg font-semibold text-yellow-800">ต้อง Restart Dev Server</p>
          <p className="text-sm text-yellow-700">เนื่องจากเพิ่ง migrate database ใหม่</p>
          <div className="bg-white rounded-lg px-6 py-3 border border-yellow-200 font-mono text-sm">
            กด <strong>Ctrl+C</strong> แล้วรัน <strong>npm run dev</strong> ใหม่
          </div>
        </div>
      </div>
    )
  }
}
