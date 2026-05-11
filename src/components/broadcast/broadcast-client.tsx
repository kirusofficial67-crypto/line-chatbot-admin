'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { Send, Plus, Users, User, CheckCircle, XCircle, Loader2, Radio } from 'lucide-react'

interface Broadcast {
  id: string
  title: string
  message: string
  type: string
  targetType: string
  sentCount: number
  failCount: number
  status: string
  sentAt: Date | string | null
  createdAt: Date | string
  createdBy: { name: string } | null
}

interface CustomerTarget {
  id: string
  lineUserId: string
  displayName: string | null
  pictureUrl: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:  { label: 'รอส่ง',   color: 'bg-yellow-100 text-yellow-700', icon: Radio },
  SENDING:  { label: 'กำลังส่ง', color: 'bg-blue-100 text-blue-700',    icon: Loader2 },
  DONE:     { label: 'ส่งแล้ว', color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  FAILED:   { label: 'ล้มเหลว', color: 'bg-red-100 text-red-700',       icon: XCircle },
}

export function BroadcastClient({
  broadcasts: init,
  customers,
}: {
  broadcasts: Broadcast[]
  customers: CustomerTarget[]
}) {
  const { toast } = useToast()
  const [broadcasts, setBroadcasts] = useState(init)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [targetType, setTargetType] = useState<'ALL' | 'SPECIFIC'>('ALL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', message: '' })

  function toggleCustomer(lineUserId: string) {
    setSelectedIds(prev =>
      prev.includes(lineUserId) ? prev.filter(id => id !== lineUserId) : [...prev, lineUserId]
    )
  }

  function selectAll() {
    const filtered = customers.filter(c =>
      !search || c.displayName?.toLowerCase().includes(search.toLowerCase())
    )
    setSelectedIds(filtered.map(c => c.lineUserId))
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.message) return

    if (targetType === 'SPECIFIC' && selectedIds.length === 0) {
      toast({ title: 'กรุณาเลือกผู้รับอย่างน้อย 1 คน', variant: 'destructive' })
      return
    }

    setLoading(true)
    const res = await fetch('/api/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        message: form.message,
        type: 'TEXT',
        targetType,
        targetUserIds: targetType === 'SPECIFIC' ? selectedIds : undefined,
      }),
    })
    setLoading(false)

    if (res.ok) {
      const data = await res.json()
      setBroadcasts(prev => [data, ...prev])
      setForm({ title: '', message: '' })
      setSelectedIds([])
      setOpen(false)
      toast({ title: 'กำลังส่ง Broadcast...' })
    } else {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' })
    }
  }

  const filteredCustomers = customers.filter(c =>
    !search || c.displayName?.toLowerCase().includes(search.toLowerCase()) || c.lineUserId.includes(search)
  )

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Broadcast ทั้งหมด', value: broadcasts.length, color: 'text-blue-600' },
          { label: 'ส่งสำเร็จ', value: broadcasts.filter(b => b.status === 'DONE').length, color: 'text-green-600' },
          { label: 'ล้มเหลว', value: broadcasts.filter(b => b.status === 'FAILED').length, color: 'text-red-600' },
          { label: 'ลูกค้าทั้งหมด', value: customers.length, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="py-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="bg-line hover:bg-line-dark">
          <Plus className="h-4 w-4 mr-2" /> สร้าง Broadcast ใหม่
        </Button>
      </div>

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ประวัติ Broadcast</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {broadcasts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">ยังไม่มี Broadcast</p>
          ) : (
            <div className="divide-y">
              {broadcasts.map(b => {
                const s = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.PENDING
                const Icon = s.icon
                return (
                  <div key={b.id} className="p-4 flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${s.color} shrink-0 mt-0.5`}>
                      <Icon className={`h-4 w-4 ${b.status === 'SENDING' ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{b.title}</p>
                        <Badge variant="secondary" className="text-xs">
                          {b.targetType === 'ALL' ? <><Users className="h-3 w-3 mr-1 inline" />ทุกคน</> : <><User className="h-3 w-3 mr-1 inline" />เลือก</>}
                        </Badge>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.message}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>ส่งแล้ว: <strong className="text-green-600">{b.sentCount}</strong> คน</span>
                        {b.failCount > 0 && <span>ล้มเหลว: <strong className="text-red-600">{b.failCount}</strong> คน</span>}
                        <span>{b.createdBy?.name || 'Admin'}</span>
                        <span>{formatDate(b.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-line" /> สร้าง Broadcast ใหม่
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1">
              <Label>หัวข้อ (สำหรับอ้างอิง) *</Label>
              <Input
                placeholder="เช่น โปรโมชั่นเดือนพฤษภาคม"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>ข้อความ *</Label>
              <Textarea
                placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                rows={4}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">{form.message.length} ตัวอักษร</p>
            </div>

            {/* Target type */}
            <div className="space-y-2">
              <Label>ส่งหา</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('ALL')}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    targetType === 'ALL' ? 'border-line bg-green-50 text-line' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  ลูกค้าทุกคน ({customers.length} คน)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('SPECIFIC')}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    targetType === 'SPECIFIC' ? 'border-line bg-green-50 text-line' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="h-4 w-4" />
                  เลือกเฉพาะกลุ่ม
                </button>
              </div>
            </div>

            {/* Customer selector */}
            {targetType === 'SPECIFIC' && (
              <div className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">เลือกผู้รับ ({selectedIds.length} คน)</p>
                  <Button type="button" size="sm" variant="outline" onClick={selectAll}>เลือกทั้งหมด</Button>
                </div>
                <Input
                  placeholder="ค้นหาชื่อหรือ LINE ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredCustomers.map(c => (
                    <label key={c.lineUserId} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={selectedIds.includes(c.lineUserId)}
                        onCheckedChange={() => toggleCustomer(c.lineUserId)}
                      />
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium overflow-hidden shrink-0">
                        {c.pictureUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.pictureUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (c.displayName?.[0] || '?').toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.displayName || 'ไม่ทราบชื่อ'}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{c.lineUserId}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              ⚠️ ข้อความจะถูกส่งออกทันทีและไม่สามารถยกเลิกได้ กรุณาตรวจสอบก่อนส่ง
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button type="submit" className="bg-line hover:bg-line-dark" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                ส่ง Broadcast
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
