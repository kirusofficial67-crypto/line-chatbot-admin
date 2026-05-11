import { NextRequest, NextResponse } from 'next/server'
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

  const botEnabled = await prisma.botSetting.findUnique({ where: { key: 'bot_enabled' } })
  if (botEnabled?.value !== 'true') {
    return NextResponse.json({ status: 'bot_disabled' })
  }

  const body = JSON.parse(rawBody)
  const events: WebhookEvent[] = body.events || []

  await Promise.all(events.map(handleEvent))
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

  // ดึงข้อมูลล่าสุดจาก DB เสมอ (รวม botPausedUntil ที่อาจเปลี่ยนจาก postback ก่อนหน้า)
  const fresh = await prisma.customer.findUnique({ where: { lineUserId: userId } })
  return fresh!
}

async function handleEvent(event: WebhookEvent) {
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
    })
    return
  }

  const customer = await getOrCreateCustomer(userId)

  // ─── Text message ────────────────────────────────────────────────────────────
  if (event.type === 'message' && event.message.type === 'text') {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { totalMessages: { increment: 1 } },
    })

    await prisma.chatLog.create({
      data: {
        lineUserId: userId,
        displayName: customer.displayName,
        action: 'TEXT_MESSAGE',
        messageContent: event.message.text,
        customerId: customer.id,
      },
    })

    // ถ้าบอทถูกพักไว้ (แอดมินกำลังตอบแทน) — เงียบไว้
    if (customer.botPausedUntil && customer.botPausedUntil > new Date()) {
      return
    }

    // ตอบกลับด้วย fallback + เมนู (pushMessage เชื่อถือได้กว่า replyMessage)
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

  // ─── Postback (menu click / back button) ─────────────────────────────────────
  if (event.type === 'postback') {
    const data = (event as PostbackEvent).postback.data
    const params = new URLSearchParams(data)
    const action = params.get('action')
    const menuId = params.get('id')

    // กดเมนูปกติ
    if (action === 'menu' && menuId) {
      // ล้าง pause เสมอเมื่อกดเมนู
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalMessages: { increment: 1 },
          botPausedUntil: null,
        },
      })
      await handleMenuAction(menuId, userId, customer.displayName ?? 'Unknown', customer.id)
      return
    }

    // ปุ่มย้อนกลับเมนูหลัก
    if (action === 'back_to_main') {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalMessages: { increment: 1 },
          botPausedUntil: null, // ล้าง pause → บอทกลับมาทำงาน
        },
      })
      try {
        const menuMessage = await buildMenuFlexMessage()
        await lineClient.pushMessage(userId, menuMessage)
      } catch (e) {
        console.error('[BACK_TO_MAIN] pushMessage failed:', e)
      }
      return
    }
  }
}
