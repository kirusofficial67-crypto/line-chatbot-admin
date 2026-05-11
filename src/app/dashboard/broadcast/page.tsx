import { prisma } from '@/lib/prisma'
import { BroadcastClient } from '@/components/broadcast/broadcast-client'
import { AlertTriangle } from 'lucide-react'

export default async function BroadcastPage() {
  try {
    const [broadcasts, customers] = await Promise.all([
      (prisma as any).broadcast.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } } },
      }),
      (prisma as any).customer.findMany({
        where: { isBlocked: false },
        select: { id: true, lineUserId: true, displayName: true, pictureUrl: true },
        orderBy: { displayName: 'asc' },
      }),
    ])

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast</h1>
          <p className="text-muted-foreground">ส่งข้อความหาลูกค้าทุกคนหรือเลือกเฉพาะกลุ่ม</p>
        </div>
        <BroadcastClient broadcasts={broadcasts} customers={customers} />
      </div>
    )
  } catch {
    return <PrismaRestartNotice page="Broadcast" />
  }
}

function PrismaRestartNotice({ page }: { page: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{page}</h1>
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
