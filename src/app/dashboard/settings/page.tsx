import { prisma } from '@/lib/prisma'
import { SettingsClient } from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const settings = await prisma.botSetting.findMany()
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground">ตั้งค่าข้อความต้อนรับและการทำงานของ Bot</p>
      </div>
      <SettingsClient settings={settingsMap} />
    </div>
  )
}
