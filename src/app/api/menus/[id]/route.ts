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

const updateSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['REPLY', 'IMAGE', 'LINK', 'PHONE', 'NOTIFY_ADMIN', 'NOTIFY_SELLER', 'SUBMENU', 'SHIPPING']).optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  phoneNumber: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
  emoji: z.string().max(8).optional(),
  parentId: z.string().optional().nullable(),
  notificationTargetIds: z.array(z.string()).optional(),
  parts: z.array(partSchema).optional(),
  shippingCompany: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingZones: z.string().optional(),
  shippingRates: z.string().optional(),
  shippingContact: z.string().optional(),
  shippingMapUrl: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { notificationTargetIds, parts, ...data } = parsed.data

  // กรองเฉพาะ field ที่มีค่า — string ว่าง "" และ undefined ไม่ส่งให้ Prisma
  // ยกเว้น parentId ซึ่ง null หมายถึง "ล้างค่า" (เมนูหลัก)
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([key, v]) => {
      if (key === 'parentId') return v !== undefined   // null = ตั้งใจล้าง
      if (key === 'isActive') return v !== undefined   // boolean ต้องผ่านทั้งหมด
      if (key === 'order') return v !== undefined      // number 0 ต้องผ่าน
      return v !== undefined && v !== ''               // string ว่างไม่ผ่าน
    })
  )

  const menu = await prisma.menu.update({
    where: { id: params.id },
    data: {
      ...cleanData,
      ...(notificationTargetIds !== undefined && {
        notifications: {
          deleteMany: {},
          create: notificationTargetIds.map((id) => ({ targetId: id })),
        },
      }),
      ...(parts !== undefined && {
        parts: {
          deleteMany: {},
          create: parts.map((p, i) => ({ type: p.type, content: p.content || null, imageUrl: p.imageUrl || null, linkUrl: p.linkUrl || null, linkLabel: p.linkLabel || null, order: i })),
        },
      }),
    },
    include: {
      notifications: { include: { target: true } },
      parts: { orderBy: { order: 'asc' } },
    },
  })
  return NextResponse.json(menu)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.menu.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
