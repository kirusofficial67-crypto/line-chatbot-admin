import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { lineClient } from '@/lib/line'
import { z } from 'zod'

const broadcastSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['TEXT', 'FLEX']).default('TEXT'),
  targetType: z.enum(['ALL', 'SPECIFIC']).default('ALL'),
  targetUserIds: z.array(z.string()).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const broadcasts = await prisma.broadcast.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { createdBy: { select: { name: true } } },
  })
  return NextResponse.json(broadcasts)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = broadcastSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { title, message, type, targetType, targetUserIds } = parsed.data

  // สร้าง record ก่อน
  const broadcast = await prisma.broadcast.create({
    data: {
      title,
      message,
      type,
      targetType,
      status: 'SENDING',
      createdById: session.user.id,
    },
  })

  // ส่งจริง async
  sendBroadcast(broadcast.id, message, type, targetType, targetUserIds)

  return NextResponse.json(broadcast, { status: 201 })
}

async function sendBroadcast(
  broadcastId: string,
  message: string,
  type: string,
  targetType: string,
  targetUserIds?: string[]
) {
  try {
    let sentCount = 0
    let failCount = 0

    if (targetType === 'SPECIFIC' && targetUserIds?.length) {
      // ส่งไปยัง user ที่กำหนด
      const chunks = chunkArray(targetUserIds, 500)
      for (const chunk of chunks) {
        try {
          await lineClient.multicast(chunk, [{ type: 'text', text: message }])
          sentCount += chunk.length
        } catch {
          failCount += chunk.length
        }
      }
    } else {
      // Broadcast ไปทุกคน
      await lineClient.broadcast([{ type: 'text', text: message }])

      const customerCount = await prisma.customer.count({ where: { isBlocked: false } })
      sentCount = customerCount
    }

    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'DONE', sentCount, failCount, sentAt: new Date() },
    })
  } catch (error) {
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'FAILED', failCount: 1 },
    })
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}
