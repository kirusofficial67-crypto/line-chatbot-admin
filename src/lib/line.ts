import { Client, middleware, TextMessage, FlexMessage } from '@line/bot-sdk'
import { prisma } from '@/lib/prisma'

export const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
}

export const lineClient = new Client(lineConfig)
export { middleware as lineMiddleware }

// ใช้ string constants แทน enum (schema เปลี่ยนเป็น SQLite String)
const MENU_TYPE = {
  REPLY: 'REPLY',
  IMAGE: 'IMAGE',
  LINK: 'LINK',
  PHONE: 'PHONE',
  NOTIFY_ADMIN: 'NOTIFY_ADMIN',
  NOTIFY_SELLER: 'NOTIFY_SELLER',
  SUBMENU: 'SUBMENU',
  SHIPPING: 'SHIPPING',
} as const

export async function getActiveMenus() {
  return prisma.menu.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { order: 'asc' },
  })
}

export async function buildMenuFlexMessage(): Promise<FlexMessage> {
  const menus = await getActiveMenus()

  // ดึงชื่อร้านจาก settings
  const shopSetting = await prisma.botSetting.findUnique({ where: { key: 'shop_name' } })
  const shopName = shopSetting?.value || 'Binchotan'

  const getDefaultEmoji = (type: string): string => {
    switch (type) {
      case MENU_TYPE.NOTIFY_ADMIN:  return '🔔'
      case MENU_TYPE.NOTIFY_SELLER: return '📣'
      case MENU_TYPE.SHIPPING:      return '🚚'
      case MENU_TYPE.LINK:          return '🔗'
      case MENU_TYPE.PHONE:         return '📞'
      case MENU_TYPE.IMAGE:         return '🖼️'
      case MENU_TYPE.SUBMENU:       return '📂'
      case MENU_TYPE.REPLY:         return '💬'
      default:                      return '💬'
    }
  }

  const getIconStyle = (type: string): { bg: string } => {
    switch (type) {
      case MENU_TYPE.NOTIFY_ADMIN:  return { bg: '#1A2E1A' }
      case MENU_TYPE.NOTIFY_SELLER: return { bg: '#2E1A0A' }
      case MENU_TYPE.SHIPPING:      return { bg: '#0A1A2E' }
      case MENU_TYPE.LINK:          return { bg: '#1A0A2E' }
      case MENU_TYPE.PHONE:         return { bg: '#0A2E1A' }
      case MENU_TYPE.IMAGE:         return { bg: '#2E0A1A' }
      case MENU_TYPE.SUBMENU:       return { bg: '#2E1F00' }
      case MENU_TYPE.REPLY:         return { bg: '#1A1A1A' }
      default:                      return { bg: '#1A1A1A' }
    }
  }

  const menuCards = (menus as (typeof menus[number] & { emoji?: string | null })[]).map((menu) => {
    const emoji = menu.emoji || getDefaultEmoji(menu.type)
    const iconStyle = getIconStyle(menu.type)
    return {
      type: 'box' as const,
      layout: 'horizontal' as const,
      contents: [
        // Icon box — dark bg with emoji
        {
          type: 'box' as const,
          layout: 'vertical' as const,
          contents: [{ type: 'text' as const, text: emoji, size: 'lg' as const, align: 'center' as const, gravity: 'center' as const }],
          backgroundColor: iconStyle.bg,
          cornerRadius: '10px',
          width: '44px',
          height: '44px',
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        },
        // Label
        {
          type: 'box' as const,
          layout: 'vertical' as const,
          contents: [
            {
              type: 'text' as const,
              text: menu.label,
              weight: 'bold' as const,
              size: 'sm' as const,
              color: '#1A1A1A',
              wrap: false,
              adjustMode: 'shrink-to-fit' as const,
            },
          ],
          flex: 1,
          paddingStart: '12px',
          justifyContent: 'center' as const,
        },
        // Gold arrow
        {
          type: 'text' as const,
          text: '›',
          color: '#C9A227',
          size: 'xl' as const,
          gravity: 'center' as const,
          align: 'end' as const,
        },
      ],
      backgroundColor: '#FFFFFF',
      cornerRadius: '12px',
      paddingAll: '12px',
      margin: 'sm' as const,
      action: {
        type: 'postback' as const,
        label: menu.label.length > 20 ? menu.label.substring(0, 20) : menu.label,
        data: `action=menu&id=${menu.id}`,
        displayText: menu.label,
      },
    }
  })

  return {
    type: 'flex',
    altText: 'เมนูหลัก — ' + shopName,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '🔥 ' + shopName, weight: 'bold', size: 'xl', color: '#D4AF37' },
          { type: 'text', text: 'กรุณาเลือกเมนูที่ต้องการ', size: 'xs', color: '#8B7230', margin: 'sm' },
          // Gold accent line
          {
            type: 'box' as const,
            layout: 'vertical' as const,
            contents: [],
            height: '2px',
            backgroundColor: '#C9A227',
            margin: 'md' as const,
          },
        ],
        backgroundColor: '#111111',
        paddingAll: '18px',
        paddingBottom: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: menuCards.length > 0
          ? menuCards
          : [{ type: 'text' as const, text: 'ยังไม่มีเมนู', color: '#9CA3AF', align: 'center' as const }],
        backgroundColor: '#F7F5F0',
        paddingAll: '10px',
        paddingBottom: '14px',
        spacing: 'none',
      },
    },
  }
}

async function buildSubMenuFlexMessage(parentId: string, parentLabel: string, parentEmoji?: string | null): Promise<FlexMessage | null> {
  const subMenus = await prisma.menu.findMany({
    where: { parentId, isActive: true },
    orderBy: { order: 'asc' },
  })
  if (!subMenus.length) return null

  const getDefaultEmoji = (type: string): string => {
    switch (type) {
      case MENU_TYPE.NOTIFY_ADMIN:  return '🔔'
      case MENU_TYPE.NOTIFY_SELLER: return '📣'
      case MENU_TYPE.SHIPPING:      return '🚚'
      case MENU_TYPE.LINK:          return '🔗'
      case MENU_TYPE.PHONE:         return '📞'
      case MENU_TYPE.IMAGE:         return '🖼️'
      case MENU_TYPE.SUBMENU:       return '📂'
      default:                      return '💬'
    }
  }

  const getIconBg = (type: string): string => {
    switch (type) {
      case MENU_TYPE.NOTIFY_ADMIN:  return '#1A2E1A'
      case MENU_TYPE.NOTIFY_SELLER: return '#2E1A0A'
      case MENU_TYPE.SHIPPING:      return '#0A1A2E'
      case MENU_TYPE.LINK:          return '#1A0A2E'
      case MENU_TYPE.PHONE:         return '#0A2E1A'
      case MENU_TYPE.IMAGE:         return '#2E0A1A'
      case MENU_TYPE.SUBMENU:       return '#2E1F00'
      default:                      return '#1A1A1A'
    }
  }

  const cards = (subMenus as (typeof subMenus[number] & { emoji?: string | null })[]).map((menu) => {
    const emoji = menu.emoji || getDefaultEmoji(menu.type)
    return {
      type: 'box' as const,
      layout: 'horizontal' as const,
      contents: [
        {
          type: 'box' as const,
          layout: 'vertical' as const,
          contents: [{ type: 'text' as const, text: emoji, size: 'lg' as const, align: 'center' as const, gravity: 'center' as const }],
          backgroundColor: getIconBg(menu.type),
          cornerRadius: '10px',
          width: '44px',
          height: '44px',
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        },
        {
          type: 'box' as const,
          layout: 'vertical' as const,
          contents: [{ type: 'text' as const, text: menu.label, weight: 'bold' as const, size: 'sm' as const, color: '#1A1A1A', wrap: false, adjustMode: 'shrink-to-fit' as const }],
          flex: 1,
          paddingStart: '12px',
          justifyContent: 'center' as const,
        },
        { type: 'text' as const, text: '›', color: '#C9A227', size: 'xl' as const, gravity: 'center' as const, align: 'end' as const },
      ],
      backgroundColor: '#FFFFFF',
      cornerRadius: '12px',
      paddingAll: '12px',
      margin: 'sm' as const,
      action: {
        type: 'postback' as const,
        label: menu.label.length > 20 ? menu.label.substring(0, 20) : menu.label,
        data: `action=menu&id=${menu.id}`,
        displayText: menu.label,
      },
    }
  })

  const headerEmoji = parentEmoji || '🪨'

  return {
    type: 'flex',
    altText: parentLabel,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: headerEmoji + ' ' + parentLabel, weight: 'bold', size: 'lg', color: '#D4AF37', wrap: false, adjustMode: 'shrink-to-fit' },
          { type: 'text', text: 'เลือกหัวข้อที่ต้องการ', size: 'xs', color: '#8B7230', margin: 'sm' },
          {
            type: 'box' as const,
            layout: 'vertical' as const,
            contents: [],
            height: '2px',
            backgroundColor: '#C9A227',
            margin: 'md' as const,
          },
        ],
        backgroundColor: '#1A1A1A',
        paddingAll: '18px',
        paddingBottom: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: cards,
        backgroundColor: '#F7F5F0',
        paddingAll: '10px',
        paddingBottom: '14px',
      },
      footer: backButtonFooter,
    },
  }
}

// ─── Back-to-main button (เพิ่มท้ายทุก response) ─────────────────────────────
function buildBackButton(): FlexMessage {
  return {
    type: 'flex',
    altText: 'กลับเมนูหลัก',
    contents: {
      type: 'bubble',
      size: 'kilo' as const,
      body: {
        type: 'box',
        layout: 'vertical' as const,
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback' as const,
              label: '🏠 กลับเมนูหลัก',
              data: 'action=back_to_main',
              displayText: 'กลับเมนูหลัก',
            },
            style: 'secondary' as const,
            height: 'sm' as const,
          },
        ],
        paddingAll: '10px',
        backgroundColor: '#1F1F1F',
      },
    },
  }
}

// ─── Footer ปุ่มย้อนกลับ (ใส่ใน bubble footer) ──────────────────────────────
const backButtonFooter = {
  type: 'box' as const,
  layout: 'vertical' as const,
  contents: [
    {
      type: 'separator' as const,
      color: '#C9A22730',
    },
    {
      type: 'button' as const,
      action: {
        type: 'postback' as const,
        label: '🏠 กลับเมนูหลัก',
        data: 'action=back_to_main',
        displayText: 'กลับเมนูหลัก',
      },
      style: 'secondary' as const,
      height: 'sm' as const,
      margin: 'sm' as const,
    },
  ],
  paddingAll: '8px',
  backgroundColor: '#F0EDE8',
}

function buildPartMessages(parts: { type: string; content?: string | null; imageUrl?: string | null; linkUrl?: string | null; linkLabel?: string | null }[]): (TextMessage | FlexMessage)[] {
  const msgs: (TextMessage | FlexMessage)[] = []
  for (const part of parts) {
    if (part.type === 'TEXT' && part.content) {
      msgs.push({ type: 'text', text: part.content })
    } else if (part.type === 'IMAGE' && part.imageUrl) {
      msgs.push({
        type: 'flex',
        altText: 'รูปภาพ',
        contents: {
          type: 'bubble',
          hero: { type: 'image', url: part.imageUrl, size: 'full', aspectRatio: '20:13', aspectMode: 'cover' },
          body: part.content
            ? { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: part.content, wrap: true, size: 'sm' }] }
            : undefined,
        },
      } as FlexMessage)
    } else if (part.type === 'LINK' && part.linkUrl) {
      msgs.push({
        type: 'flex',
        altText: part.linkLabel || 'ลิงก์',
        contents: {
          type: 'bubble',
          body: part.content
            ? { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: part.content, wrap: true }] }
            : undefined,
          footer: {
            type: 'box', layout: 'vertical',
            contents: [{
              type: 'button',
              action: { type: 'uri', label: part.linkLabel || 'เปิดลิงก์', uri: part.linkUrl },
              style: 'primary', color: '#06C755',
            }],
          },
        },
      } as FlexMessage)
    }
  }
  return msgs
}

export { buildBackButton }

export async function handleMenuAction(
  menuId: string,
  lineUserId: string,
  displayName: string,
  customerId?: string
) {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
    include: {
      notifications: { include: { target: true } },
      parts: { orderBy: { order: 'asc' } },
      subMenus: { where: { isActive: true }, orderBy: { order: 'asc' } },
    },
  })
  if (!menu) return

  await prisma.chatLog.create({
    data: {
      lineUserId,
      displayName,
      menuId: menu.id,
      action: 'MENU_CLICK',
      messageContent: menu.label,
      customerId: customerId ?? null,
    },
  })

  const messages: (TextMessage | FlexMessage)[] = []

  // Multi-part messages — ถ้ามี parts ใช้ parts แทนทั้งหมด
  if (menu.parts && menu.parts.length > 0) {
    const partMsgs = buildPartMessages(menu.parts)
    if (partMsgs.length > 0) {
      // เพิ่ม back button ท้าย (max 5 messages รวมกัน)
      const withBack = partMsgs.length < 5
        ? [...partMsgs, buildBackButton()]
        : partMsgs
      await lineClient.pushMessage(lineUserId, withBack)
      return
    }
  }

  switch (menu.type) {
    case MENU_TYPE.REPLY:
      if (menu.content) messages.push({ type: 'text', text: menu.content })
      break

    case MENU_TYPE.IMAGE:
      if (menu.imageUrl) {
        messages.push({
          type: 'flex',
          altText: menu.label,
          contents: {
            type: 'bubble',
            hero: { type: 'image', url: menu.imageUrl, size: 'full', aspectRatio: '20:13', aspectMode: 'cover' },
            body: menu.content
              ? { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: menu.content, wrap: true }] }
              : undefined,
          },
        } as FlexMessage)
      }
      break

    case MENU_TYPE.LINK:
      if (menu.linkUrl) {
        messages.push({
          type: 'flex',
          altText: menu.label,
          contents: {
            type: 'bubble',
            body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: menu.content || menu.label, wrap: true }] },
            footer: {
              type: 'box', layout: 'vertical',
              contents: [{
                type: 'button',
                action: { type: 'uri', label: 'เปิดลิงก์', uri: menu.linkUrl },
                style: 'primary', color: '#06C755',
              }],
            },
          },
        } as FlexMessage)
      }
      break

    case MENU_TYPE.PHONE:
      if (menu.phoneNumber) {
        messages.push({
          type: 'flex',
          altText: menu.label,
          contents: {
            type: 'bubble',
            body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: menu.content || menu.label, wrap: true }] },
            footer: {
              type: 'box', layout: 'vertical',
              contents: [{
                type: 'button',
                action: { type: 'uri', label: `โทร ${menu.phoneNumber}`, uri: `tel:${menu.phoneNumber}` },
                style: 'primary',
              }],
            },
          },
        } as FlexMessage)
      }
      break

    case MENU_TYPE.SHIPPING: {
      const lines: string[] = []
      if (menu.content) lines.push(menu.content)
      if (menu.shippingCompany) lines.push(`🚚 บริษัทขนส่ง: ${menu.shippingCompany}`)
      if (menu.shippingRates) lines.push(`💰 ราคาค่าส่ง: ${menu.shippingRates}`)
      if (menu.shippingAddress) lines.push(`📍 ที่อยู่รับสินค้า: ${menu.shippingAddress}`)
      if (menu.shippingZones) lines.push(`🗺️ พื้นที่ให้บริการ: ${menu.shippingZones}`)
      if (menu.shippingContact) lines.push(`📞 ติดต่อขนส่ง: ${menu.shippingContact}`)

      const footerButtons = []
      if (menu.shippingMapUrl) {
        footerButtons.push({
          type: 'button' as const,
          action: { type: 'uri' as const, label: '📍 ดูแผนที่', uri: menu.shippingMapUrl },
          style: 'primary' as const, color: '#2563EB',
        })
      }
      if (menu.shippingContact) {
        footerButtons.push({
          type: 'button' as const,
          action: { type: 'uri' as const, label: `📞 โทร`, uri: `tel:${menu.shippingContact}` },
          style: 'secondary' as const,
          margin: 'sm' as const,
        })
      }

      messages.push({
        type: 'flex',
        altText: `ข้อมูลการจัดส่ง - ${menu.label}`,
        contents: {
          type: 'bubble',
          header: {
            type: 'box', layout: 'vertical',
            backgroundColor: '#2563EB', paddingAll: '16px',
            contents: [{ type: 'text', text: `🚚 ${menu.label}`, weight: 'bold', color: '#ffffff', size: 'lg' }],
          },
          body: {
            type: 'box', layout: 'vertical', spacing: 'sm',
            contents: lines.map(line => ({ type: 'text' as const, text: line, wrap: true, size: 'sm' as const })),
          },
          footer: footerButtons.length > 0
            ? { type: 'box', layout: 'vertical', contents: footerButtons }
            : undefined,
        },
      } as FlexMessage)
      break
    }

    case MENU_TYPE.SUBMENU: {
      if (menu.content) messages.push({ type: 'text', text: menu.content })
      const menuWithEmoji = menu as typeof menu & { emoji?: string | null }
      const subMsg = await buildSubMenuFlexMessage(menu.id, menu.label, menuWithEmoji.emoji)
      if (subMsg) messages.push(subMsg)
      break
    }

    case MENU_TYPE.NOTIFY_ADMIN:
    case MENU_TYPE.NOTIFY_SELLER: {
      // ถ้าไม่มี content → ใช้ข้อความ default
      const defaultAck = menu.type === MENU_TYPE.NOTIFY_ADMIN
        ? '✅ ส่งข้อความถึงแอดมินแล้ว\nกรุณารอสักครู่ ทีมงานจะติดต่อกลับโดยเร็ว 🙏'
        : '✅ ส่งข้อความถึงผู้ขายแล้ว\nกรุณารอสักครู่ ทีมงานจะติดต่อกลับโดยเร็ว 🙏'
      messages.push({ type: 'text', text: menu.content || defaultAck })

      // ส่งแจ้งเตือนไปยัง admin/seller (ไม่บล็อก flow ถ้า error)
      try {
        await sendNotifications(menu, lineUserId, displayName)
      } catch (e) {
        console.error('[NOTIFY] sendNotifications failed:', e)
      }

      // หยุดบอทตอบกลับอัตโนมัติ 3 ชั่วโมง
      if (customerId) {
        await prisma.customer.update({
          where: { id: customerId },
          data: { botPausedUntil: new Date(Date.now() + 3 * 60 * 60 * 1000) },
        })
      }
      break
    }
  }

  if (messages.length > 0) {
    // เพิ่ม back button ท้ายทุก response ยกเว้น SUBMENU (มี footer อยู่แล้ว)
    const finalMessages = menu.type !== MENU_TYPE.SUBMENU && messages.length < 5
      ? [...messages, buildBackButton()]
      : messages
    await lineClient.pushMessage(lineUserId, finalMessages)
  }
}

async function sendNotifications(
  menu: { id: string; label: string; notifications: { target: { id: string; lineUserId: string; isActive: boolean } }[] },
  fromUserId: string,
  displayName: string
) {
  const activeTargets = menu.notifications.filter((n) => n.target.isActive)
  for (const { target } of activeTargets) {
    try {
      await lineClient.pushMessage(target.lineUserId, {
        type: 'flex',
        altText: `แจ้งเตือน: ${displayName} ต้องการติดต่อ`,
        contents: {
          type: 'bubble',
          header: {
            type: 'box', layout: 'vertical',
            backgroundColor: '#06C755', paddingAll: '16px',
            contents: [{ type: 'text', text: '🔔 มีลูกค้าต้องการติดต่อ', weight: 'bold', color: '#ffffff' }],
          },
          body: {
            type: 'box', layout: 'vertical', spacing: 'sm',
            contents: [
              { type: 'text', text: `เมนู: ${menu.label}`, weight: 'bold' },
              { type: 'text', text: `ชื่อ: ${displayName}`, margin: 'sm' },
              { type: 'text', text: `LINE ID: ${fromUserId}`, size: 'sm', color: '#888888', margin: 'sm' },
              { type: 'text', text: new Date().toLocaleString('th-TH'), size: 'xs', color: '#aaaaaa', margin: 'sm' },
            ],
          },
        },
      })
      await prisma.notificationLog.create({
        data: { lineUserId: fromUserId, displayName, targetId: target.id, menuLabel: menu.label, status: 'SENT' },
      })
    } catch (error) {
      await prisma.notificationLog.create({
        data: { lineUserId: fromUserId, displayName, targetId: target.id, menuLabel: menu.label, status: 'FAILED', error: String(error) },
      })
    }
  }
}

export async function sendWelcomeMessage(lineUserId: string) {
  const setting = await prisma.botSetting.findUnique({ where: { key: 'welcome_message' } })
  const text = setting?.value || 'ยินดีต้อนรับ!'
  const menuMessage = await buildMenuFlexMessage()
  await lineClient.pushMessage(lineUserId, [{ type: 'text', text }, menuMessage])
}
