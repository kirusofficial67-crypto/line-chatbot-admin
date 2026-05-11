import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const partSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'LINK']),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  linkLabel: z.string().optional(),
  order: z.number().default(0),
})

const menuSchema = z.object({
  label: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['REPLY', 'IMAGE', 'LINK', 'PHONE', 'NOTIFY_ADMIN', 'NOTIFY_SELLER', 'SUBMENU', 'SHIPPING']),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  phoneNumber: z.string().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
  emoji: z.string().max(8).optional(),
  parentId: z.string().optional().nullable(),
  notificationTargetIds: z.array(z.string()).optional(),
  parts: z.array(partSchema).optional(),
  // Shipping fields
  shippingCompany: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingZones: z.string().optional(),
  shippingRates: z.string().optional(),
  shippingContact: z.string().optional(),
  shippingMapUrl: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const menus = await prisma.menu.findMany({
    orderBy: { order: 'asc' },
    include: {
      notifications: { include: { target: true } },
      parts: { orderBy: { order: 'asc' } },
    },
  })
  return NextResponse.json(menus)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = menuSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { notificationTargetIds, parts, ...data } = parsed.data

  // กรองค่าว่างออกจาก data ก่อนส่งให้ Prisma
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)
  )

  const menu = await prisma.menu.create({
    data: {
      ...cleanData,
      ...(notificationTargetIds?.length && {
        notifications: { create: notificationTargetIds.map((id) => ({ targetId: id })) },
      }),
      ...((parts?.length) && {
        parts: { create: parts.map((p, i) => ({ type: p.type, content: p.content || null, imageUrl: p.imageUrl || null, linkUrl: p.linkUrl || null, linkLabel: p.linkLabel || null, order: i })) },
      }),
    },
    include: {
      notifications: { include: { target: true } },
      parts: { orderBy: { order: 'asc' } },
    },
  })
  return NextResponse.json(menu, { status: 201 })
}
