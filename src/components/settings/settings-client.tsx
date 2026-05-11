'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save } from 'lucide-react'

interface SettingsClientProps {
  settings: Record<string, string>
}

export function SettingsClient({ settings: initial }: SettingsClientProps) {
  const { toast } = useToast()
  const [settings, setSettings] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_name: settings.shop_name,
        welcome_message: settings.welcome_message,
        fallback_message: settings.fallback_message,
      }),
    })
    setLoading(false)
    if (res.ok) toast({ title: 'บันทึกการตั้งค่าแล้ว' })
    else toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลร้าน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>ชื่อร้าน / แบรนด์ (แสดงบนเมนู Bot)</Label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={settings.shop_name || ''}
              onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
              placeholder="เช่น Binchotan ถ่านคุณภาพ"
            />
            <p className="text-xs text-muted-foreground">ชื่อนี้จะแสดงที่หัวเมนูใน LINE Bot 🌿</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อความ Bot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ข้อความต้อนรับ (เมื่อลูกค้าเพิ่มเพื่อน)</Label>
            <Textarea
              value={settings.welcome_message || ''}
              onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
              rows={3}
              placeholder="ยินดีต้อนรับ! กรุณาเลือกเมนูที่ต้องการ"
            />
          </div>
          <div className="space-y-2">
            <Label>ข้อความเมื่อไม่เข้าใจคำสั่ง</Label>
            <Textarea
              value={settings.fallback_message || ''}
              onChange={(e) => setSettings({ ...settings, fallback_message: e.target.value })}
              rows={3}
              placeholder="ขออภัย ไม่เข้าใจคำสั่ง กรุณาเลือกจากเมนู"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">LINE Webhook URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm break-all">
            {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}
            /api/webhook/line
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            คัดลอก URL นี้ไปใส่ใน LINE Developers Console → Messaging API → Webhook URL
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="bg-line hover:bg-line-dark" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        บันทึกการตั้งค่า
      </Button>
    </div>
  )
}
