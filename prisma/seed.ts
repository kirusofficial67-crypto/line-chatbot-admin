import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin1234', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: "SUPER_ADMIN",
    },
  })

  await prisma.menu.createMany({
    data: [
      {
        id: 'menu-1',
        label: 'สินค้าของเรา',
        description: 'ดูสินค้าทั้งหมด',
        type: "REPLY",
        content: 'ขอบคุณที่สนใจ! สินค้าของเรามีหลากหลาย กรุณาเลือกหมวดหมู่ที่ต้องการ',
        order: 1,
        isActive: true,
      },
      {
        id: 'menu-2',
        label: 'โปรโมชั่น',
        description: 'โปรโมชั่นล่าสุด',
        type: "IMAGE",
        content: 'โปรโมชั่นพิเศษ!',
        imageUrl: 'https://via.placeholder.com/1024x512',
        order: 2,
        isActive: true,
      },
      {
        id: 'menu-3',
        label: 'ติดต่อแอดมิน',
        description: 'ติดต่อทีมงาน',
        type: "NOTIFY_ADMIN",
        content: 'ขอบคุณที่ติดต่อเรา! ทีมงานจะตอบกลับภายใน 5 นาที',
        order: 3,
        isActive: true,
      },
      {
        id: 'menu-4',
        label: 'ติดต่อผู้ขาย',
        description: 'คุยกับผู้ขายโดยตรง',
        type: "NOTIFY_SELLER",
        content: 'กำลังเชื่อมต่อกับผู้ขาย...',
        order: 4,
        isActive: true,
      },
      {
        id: 'menu-5',
        label: 'เว็บไซต์เรา',
        description: 'ไปยังเว็บไซต์',
        type: "LINK",
        content: 'คลิกเพื่อเยี่ยมชมเว็บไซต์ของเรา',
        linkUrl: 'https://example.com',
        order: 5,
        isActive: true,
      },
    ],
  })

  await prisma.botSetting.createMany({
    data: [
      { key: 'welcome_message', value: 'ยินดีต้อนรับ! กรุณาเลือกเมนูที่ต้องการ' },
      { key: 'fallback_message', value: 'ขออภัย ไม่เข้าใจคำสั่ง กรุณาเลือกจากเมนูด้านล่าง' },
      { key: 'bot_enabled', value: 'true' },
    ],
  })

  console.log('Seed completed. Admin:', admin.email, '/ Password: admin1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
