'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Pencil, Trash2, Bell, Loader2 } from 'lucide-react'
interface Menu { id: string; label: string }
interface NotificationTarget { id: string; name: string; lineUserId: string; isActive: boolean; createdAt: Date | string; updatedAt: Date | string }
type TargetWithMenus = NotificationTarget & {
  menus: { menuId: string; targetId: string; menu: Menu }[]
}

export function NotificationsClient({ targets: initialTargets }: { targets: TargetWithMenus[] }) {
  const { toast } = useToast()
  const [targets, setTargets] = useState(initialTargets)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TargetWithMenus | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', lineUserId: '' })

  function openCreate() {
    setEditing(null)
    setForm({ name: '', lineUserId: '' })
    setDialogOpen(true)
  }

  function openEdit(target: TargetWithMenus) {
    setEditing(target)
    setForm({ name: target.name, lineUserId: target.lineUserId })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = editing ? `/api/notifications/${editing.id}` : '/api/notifications'
    const method = editing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      if (editing) {
        setTargets((prev) => prev.map((t) => t.id === data.id ? { ...t, ...data } : t))
        toast({ title: 'อัปเดตแล้ว' })
      } else {
        setTargets((prev) => [...prev, { ...data, menus: [] }])
        toast({ title: 'เพิ่มผู้รับแจ้งเตือนแล้ว' })
      }
      setDialogOpen(false)
    }
  }

  async function toggleActive(target: TargetWithMenus) {
    const res = await fetch(`/api/notifications/${target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !target.isActive }),
    })
    if (res.ok) {
      setTargets((prev) => prev.map((t) => t.id === target.id ? { ...t, isActive: !t.isActive } : t))
    }
  }

  async function deleteTarget(id: string) {
    if (!confirm('ต้องการลบผู้รับแจ้งเตือนนี้?')) return
    const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTargets((prev) => prev.filter((t) => t.id !== id))
      toast({ title: 'ลบแล้ว' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="bg-line hover:bg-line-dark">
          <Plus className="h-4 w-4 mr-2" /> เพิ่มผู้รับแจ้งเตือน
        </Button>
      </div>

      <div className="space-y-3">
        {targets.length === 0 && (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              ยังไม่มีผู้รับแจ้งเตือน กดปุ่มด้านบนเพื่อเพิ่ม
            </CardContent>
          </Card>
        )}
        {targets.map((target) => (
          <Card key={target.id} className={!target.isActive ? 'opacity-60' : ''}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Bell className="h-4 w-4 text-line" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{target.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{target.lineUserId}</p>
                {target.menus.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {target.menus.map(({ menu }) => (
                      <Badge key={menu.id} variant="secondary" className="text-xs">
                        {menu.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={target.isActive ? 'default' : 'secondary'}
                  className={target.isActive ? 'bg-line' : ''}>
                  {target.isActive ? 'เปิด' : 'ปิด'}
                </Badge>
                <Switch checked={target.isActive} onCheckedChange={() => toggleActive(target)} />
                <Button size="sm" variant="ghost" onClick={() => openEdit(target)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteTarget(target.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'แก้ไขผู้รับแจ้งเตือน' : 'เพิ่มผู้รับแจ้งเตือน'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>ชื่อ *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="เช่น ทีม Support"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>LINE User ID *</Label>
              <Input
                value={form.lineUserId}
                onChange={(e) => setForm({ ...form, lineUserId: e.target.value })}
                placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
              />
              <p className="text-xs text-muted-foreground">
                หา LINE User ID โดยใช้ LINE webhook หรือ LINE Developers Console
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
              <Button type="submit" className="bg-line hover:bg-line-dark" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                บันทึก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
