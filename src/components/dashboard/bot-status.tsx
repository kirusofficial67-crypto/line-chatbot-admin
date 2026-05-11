'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Bot, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function BotStatus({ enabled: initialEnabled }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function toggle() {
    setLoading(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_enabled: (!enabled).toString() }),
      })
      setEnabled(!enabled)
      toast({ title: `Bot ${!enabled ? 'เปิด' : 'ปิด'}การทำงานแล้ว` })
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: enabled ? '#06C755' : '#ef4444' }}>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${enabled ? 'bg-green-100' : 'bg-red-100'}`}>
            <Bot className={`h-5 w-5 ${enabled ? 'text-line' : 'text-red-500'}`} />
          </div>
          <div>
            <p className="font-semibold">สถานะ Bot</p>
            <p className="text-sm text-muted-foreground">
              {enabled ? 'กำลังทำงานปกติ' : 'ปิดการทำงานอยู่'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={enabled ? 'default' : 'destructive'} className={enabled ? 'bg-line' : ''}>
            {enabled ? 'Online' : 'Offline'}
          </Badge>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Switch checked={enabled} onCheckedChange={toggle} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
