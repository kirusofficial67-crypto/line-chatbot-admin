import { NextRequest, NextResponse, after } from 'next/server'
import { WebhookEvent, PostbackEvent } from '@line/bot-sdk'
import { lineConfig, lineClient, handleMenuAction, buildMenuFlexMessage, sendWelcomeMessage } from '@/lib/line'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('SHA256', lineConfig.channelSecret)
    .update(body)
    .digest('base64')
  return hash === signature
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-line-signature') || ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(rawBody)
  const events: WebhookEvent[] = body.events || []

  // ✅ Return 200 ให้ LINE ทันที — ป้องกัน timeout / retry
  // แล้วค่อย process ทีหลังผ่าน after()
  after(async () => {
    try {
      const botEnabled = await prisma.botSetting.findUnique({ where: { key: 'bot_enabled' } })
      if (botEnabled?.value !== 'true') return

      // allSettled แทน all — event นึง error ไม่กระทบ event อื่น
      await Promise.allSettled(events.map(handleEvent))
    } catch (e) {
      console.error('[WEBHOOK] Fatal error in after():', e)
    }
  })

  return NextResponse.json({ status: 'ok' })
}

async function getOrCreateCustomer(userId: string) {
  let profile = { displayName: 'Unknown', pictureUrl: '', statusMessage: '' }
  try {
    const p = await lineClient.getProfile(userId)
    profile = {
      displayName: p.displayName,
      pictureUrl: p.pictureUrl ?? '',
      statusMessage: p.statusMessage ?? '',
    }
  } catch {}

  try {
    // upsert เฉพาะ profile fields — ไม่ยุ่ง botPausedUntil
    await prisma.customer.upsert({
      where: { lineUserId: userId },
      update: {
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
        lastActiveAt: new Date(),
      },
      create: {
        lineUserId: userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
      },
    })
  } catch (e) {
    console.error('[getOrCreateCustomer] upsert failed:', e)
    // ลอง create ใหม่ถ้า upsert fail
    try {
      await prisma.customer.create({
        data: {
          lineUserId: userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          statusMessage: profile.statusMessage,
        },
      })
    } catch {} // อาจ duplicate — ไม่เป็นไร
  }

  // ดึงข้อมูลล่าสุดจาก DB (รวม botPausedUntil)
  const fresh = await prisma.customer.findUnique({ where: { lineUserId: userId } })

  // Safety: ถ้ายังไม่มี return dummy object เพื่อไม่ให้ crash
  return fresh ?? {
    id: '',
    lineUserId: userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    statusMessage: profile.statusMessage,
    isBlocked: false,
    botPausedUntil: null,
    totalMessages: 0,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
  }
}

async function handleEvent(event: WebhookEvent) {
  try {
    const userId = event.source.userId
    if (!userId) return

    // Follow event
    if (event.type === 'follow') {
      await getOrCreateCustomer(userId)
      await sendWelcomeMessage(userId)
      return
    }

    // Unfollow — mark but keep data
    if (event.type === 'unfollow') {
      await prisma.customer.updateMany({
        where: { lineUserId: userId },
        data: { isBlocked: false, lastActiveAt: new Date() },
      }).catch(() => {})
      return
    }

    const customer = await getOrCreateCustomer(userId)

    // ─── Text message ──────────────────────────────────────────────────────────
    if (event.type === 'message' && event.message.type === 'text') {
      if (customer.id) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { totalMessages: { increment: 1 } },
        }).catch(() => {})

        await prisma.chatLog.create({
          data: {
            lineUserId: userId,
            displayName: customer.displayName,
            action: 'TEXT_MESSAGE',
            messageContent: event.message.text,
            customerId: customer.id,
          },
        }).catch(() => {})
      }

      // ถ้าบอทถูกพักไว้ (แอดมินกำลังตอบแทน) — เงียบไว้
      if (customer.botPausedUntil && customer.botPausedUntil > new Date()) {
        return
      }

      // ตอบกลับด้วย fallback + เมนู
      try {
        const fallback = await prisma.botSetting.findUnique({ where: { key: 'fallback_message' } })
        const menuMessage = await buildMenuFlexMessage()
        await lineClient.pushMessage(userId, [
          { type: 'text', text: fallback?.value || '🤖 ไม่เข้าใจคำสั่ง กรุณาเลือกจากเมนูด้านล่างนะคะ' },
          menuMessage,
        ])
      } catch (e) {
        console.error('[TEXT_FALLBACK] pushMessage failed:', e)
      }
      return
    }

    // ─── Postback (menu click / back button) ───────────────────────────────────
    if (event.type === 'postback') {
      const data = (event as PostbackEvent).postback.data
      const params = new URLSearchParams(data)
      const action = params.get('action')
      const menuId = params.get('id')

      // กดเมนูปกติ
      if (action === 'menu' && menuId) {
        if (customer.id) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { totalMessages: { increment: 1 }, botPausedUntil: null },
          }).catch(() => {})
        }
        await handleMenuAction(menuId, userId, customer.displayName ?? 'Unknown', customer.id)
        return
      }

      // ปุ่มย้อนกลับเมนูหลัก
      if (action === 'back_to_main') {
        if (customer.id) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { totalMessages: { increment: 1 }, botPausedUntil: null },
          }).catch(() => {})
        }
        try {
          const menuMessage = await buildMenuFlexMessage()
          await lineClient.pushMessage(userId, menuMessage)
        } catch (e) {
          console.error('[BACK_TO_MAIN] pushMessage failed:', e)
        }
        return
      }
    }
  } catch (e) {
    console.error('[handleEvent] Unhandled error:', e)
  }
}
