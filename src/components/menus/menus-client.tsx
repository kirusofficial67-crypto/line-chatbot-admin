'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { MenuDialog } from '@/components/menus/menu-dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Pencil, Trash2, GripVertical, ChevronRight } from 'lucide-react'

interface NotificationTarget { id: string; name: string; lineUserId: string; isActive: boolean }
interface Part { id?: string; type: string; content: string; imageUrl: string; linkUrl: string; linkLabel: string; order: number }
interface MenuWithNotifications {
  id: string; label: string; description?: string | null; type: string
  content?: string | null; imageUrl?: string | null; linkUrl?: string | null
  phoneNumber?: string | null; order: number; isActive: boolean
  emoji?: string | null
  parentId?: string | null
  shippingCompany?: string | null; shippingAddress?: string | null
  shippingZones?: string | null; shippingRates?: string | null
  shippingContact?: string | null; shippingMapUrl?: string | null
  notifications: { targetId: string; target: NotificationTarget }[]
  parts?: Part[]
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  REPLY:         { label: '💬 ข้อความ',     color: 'bg-blue-100 text-blue-700' },
  IMAGE:         { label: '🖼️ รูปภาพ',      color: 'bg-purple-100 text-purple-700' },
  LINK:          { label: '🔗 ลิงก์',        color: 'bg-yellow-100 text-yellow-700' },
  PHONE:         { label: '📞 โทรศัพท์',    color: 'bg-gray-100 text-gray-700' },
  SHIPPING:      { label: '🚚 การจัดส่ง',   color: 'bg-blue-100 text-blue-800' },
  NOTIFY_ADMIN:  { label: '🔔 แจ้งแอดมิน', color: 'bg-green-100 text-green-700' },
  NOTIFY_SELLER: { label: '📣 แจ้งผู้ขาย', color: 'bg-orange-100 text-orange-700' },
  SUBMENU:       { label: '📂 เมนูย่อย',   color: 'bg-amber-100 text-amber-700' },
}

interface MenusClientProps {
  menus: MenuWithNotifications[]
  targets: NotificationTarget[]
}

export function MenusClient({ menus: initialMenus, targets }: MenusClientProps) {
  const { toast } = useToast()
  const [menus, setMenus] = useState(initialMenus)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuWithNotifications | null>(null)

  async function toggleActive(menu: MenuWithNotifications) {
    const res = await fetch(`/api/menus/${menu.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !menu.isActive }),
    })
    if (res.ok) {
      setMenus(prev => prev.map(m => m.id === menu.id ? { ...m, isActive: !m.isActive } : m))
    }
  }

  async function deleteMenu(id: string) {
    if (!confirm('ต้องการลบเมนูนี้?')) return
    const res = await fetch(`/api/menus/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMenus(prev => prev.filter(m => m.id !== id))
      toast({ title: 'ลบเมนูเรียบร้อย' })
    }
  }

  function openCreate() { setEditingMenu(null); setDialogOpen(true) }
  function openEdit(menu: MenuWithNotifications) { setEditingMenu(menu); setDialogOpen(true) }

  function onSaved(saved: MenuWithNotifications) {
    setMenus(prev => {
      const exists = prev.some(m => m.id === saved.id)
      if (exists) return prev.map(m => m.id === saved.id ? { ...m, ...saved } : m)
      return [...prev, saved]
    })
    setDialogOpen(false)
    toast({ title: editingMenu ? 'อัปเดตเมนูแล้ว' : 'เพิ่มเมนูแล้ว' })
  }

  // แยกเมนูหลักและเมนูย่อย
  const rootMenus = menus.filter(m => !m.parentId)
  const getChildren = (parentId: string) => menus.filter(m => m.parentId === parentId)

  function renderMenu(menu: MenuWithNotifications, isChild = false, idx = 0) {
    const typeInfo = TYPE_LABELS[menu.type] || { label: menu.type, color: 'bg-gray-100 text-gray-700' }
    const children = getChildren(menu.id)

    return (
      <div key={menu.id}>
        <Card className={`${!menu.isActive ? 'opacity-60' : ''} ${isChild ? 'ml-6 border-l-4 border-l-amber-300' : ''}`}>
          <CardContent className="flex items-center gap-4 py-3">
            {isChild
              ? <ChevronRight className="h-4 w-4 text-amber-400 shrink-0" />
              : <GripVertical className="h-4 w-4 text-gray-400 cursor-grab shrink-0" />
            }
            {!isChild && <span className="w-5 text-sm text-muted-foreground shrink-0">{idx + 1}</span>}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">
                  {menu.emoji && <span className="mr-0.5">{menu.emoji}</span>}
                  {menu.label}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
                {(menu.parts?.length ?? 0) > 0 && (
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                    📦 {menu.parts!.length} parts
                  </span>
                )}
                {menu.notifications.length > 0 && (
                  <span className="text-xs text-muted-foreground">แจ้ง {menu.notifications.length} คน</span>
                )}
                {children.length > 0 && (
                  <span className="text-xs text-amber-600">📂 {children.length} เมนูย่อย</span>
                )}
              </div>
              {menu.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{menu.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Switch checked={menu.isActive} onCheckedChange={() => toggleActive(menu)} />
              <Button size="sm" variant="ghost" onClick={() => openEdit(menu)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteMenu(menu.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* แสดงเมนูย่อย */}
        {children.length > 0 && (
          <div className="space-y-1.5 mt-1.5 mb-2">
            {children.map((child, ci) => renderMenu(child, true, ci))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="bg-line hover:bg-line-dark">
          <Plus className="h-4 w-4 mr-2" /> เพิ่มเมนูใหม่
        </Button>
      </div>

      <div className="space-y-2">
        {rootMenus.length === 0 && (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              ยังไม่มีเมนู กดปุ่มด้านบนเพื่อเพิ่มเมนูแรก
            </CardContent>
          </Card>
        )}
        {rootMenus.map((menu, idx) => renderMenu(menu, false, idx))}
      </div>

      <MenuDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={onSaved}
        menu={editingMenu}
        targets={targets}
        allMenus={menus}
      />
    </div>
  )
}
