'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react'

interface NotificationTarget { id: string; name: string; lineUserId: string }
interface Part {
  id?: string
  type: 'TEXT' | 'IMAGE' | 'LINK'
  content: string
  imageUrl: string
  linkUrl: string
  linkLabel: string
  order: number
}
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
  parts: Part[]
}

const defaultPart = (): Part => ({ type: 'TEXT', content: '', imageUrl: '', linkUrl: '', linkLabel: '', order: 0 })

const defaultForm = {
  label: '', description: '', type: 'REPLY', content: '',
  imageUrl: '', linkUrl: '', phoneNumber: '', order: 0, isActive: true,
  emoji: '',
  parentId: null as string | null,
  shippingCompany: '', shippingAddress: '', shippingZones: '',
  shippingRates: '', shippingContact: '', shippingMapUrl: '',
  notificationTargetIds: [] as string[],
  parts: [] as Part[],
}

const TYPE_OPTIONS = [
  { value: 'REPLY',         label: '💬 ข้อความตอบกลับ' },
  { value: 'IMAGE',         label: '🖼️ รูปภาพ' },
  { value: 'LINK',          label: '🔗 ลิงก์เว็บ' },
  { value: 'PHONE',         label: '📞 เบอร์โทรศัพท์' },
  { value: 'SHIPPING',      label: '🚚 ข้อมูลการจัดส่ง' },
  { value: 'NOTIFY_ADMIN',  label: '🔔 แจ้งเตือนแอดมิน' },
  { value: 'NOTIFY_SELLER', label: '📣 แจ้งเตือนผู้ขาย' },
  { value: 'SUBMENU',       label: '📂 เมนูย่อย (Sub-menu)' },
]

const PART_TYPE_OPTIONS = [
  { value: 'TEXT',  label: '💬 ข้อความ' },
  { value: 'IMAGE', label: '🖼️ รูปภาพ' },
  { value: 'LINK',  label: '🔗 ลิงก์' },
]

// Emoji presets แบ่งตามหมวด
const EMOJI_GROUPS = [
  { label: 'ร้านถ่าน/วัสดุ', emojis: ['🪨','⚫','🔥','🌑','🪵','⬛','🌋','💨'] },
  { label: 'ยอดนิยม',        emojis: ['⭐','💎','✨','🌟','💫','🏆','👑','🎯'] },
  { label: 'การสื่อสาร',     emojis: ['📞','💬','🔔','📣','📲','📩','🗣️','📢'] },
  { label: 'การจัดส่ง',      emojis: ['🚚','📦','🛒','🏪','🗺️','📍','🔑','🏠'] },
  { label: 'ข้อมูล/ลิงก์',   emojis: ['🔗','🖼️','📂','📋','📝','💡','📌','🗂️'] },
  { label: 'ธรรมชาติ',       emojis: ['🌿','🍃','🌲','🌳','🍂','🌾','🌰','🪴'] },
]

export function MenuDialog({ open, onClose, onSaved, menu, targets, allMenus }: {
  open: boolean
  onClose: () => void
  onSaved: (menu: MenuWithNotifications) => void
  menu: MenuWithNotifications | null
  targets: NotificationTarget[]
  allMenus: MenuWithNotifications[]
}) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [useMultiPart, setUseMultiPart] = useState(false)
  const [emojiGroupIdx, setEmojiGroupIdx] = useState(0)

  useEffect(() => {
    if (menu) {
      setForm({
        label: menu.label,
        description: menu.description || '',
        type: menu.type,
        content: menu.content || '',
        imageUrl: menu.imageUrl || '',
        linkUrl: menu.linkUrl || '',
        phoneNumber: menu.phoneNumber || '',
        order: menu.order,
        isActive: menu.isActive,
        emoji: menu.emoji || '',
        parentId: menu.parentId || null,
        shippingCompany: menu.shippingCompany || '',
        shippingAddress: menu.shippingAddress || '',
        shippingZones: menu.shippingZones || '',
        shippingRates: menu.shippingRates || '',
        shippingContact: menu.shippingContact || '',
        shippingMapUrl: menu.shippingMapUrl || '',
        notificationTargetIds: menu.notifications.map((n) => n.targetId),
        parts: (menu.parts || []) as Part[],
      })
      setUseMultiPart(((menu.parts as Part[] | undefined) || []).length > 0)
    } else {
      setForm(defaultForm)
      setUseMultiPart(false)
    }
  }, [menu, open])

  function set(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleTarget(id: string) {
    setForm(prev => ({
      ...prev,
      notificationTargetIds: prev.notificationTargetIds.includes(id)
        ? prev.notificationTargetIds.filter(t => t !== id)
        : [...prev.notificationTargetIds, id],
    }))
  }

  function addPart() {
    setForm(prev => ({
      ...prev,
      parts: [...prev.parts, { ...defaultPart(), order: prev.parts.length }],
    }))
  }

  function removePart(idx: number) {
    setForm(prev => ({ ...prev, parts: prev.parts.filter((_, i) => i !== idx) }))
  }

  function updatePart(idx: number, key: keyof Part, value: string) {
    setForm(prev => ({
      ...prev,
      parts: prev.parts.map((p, i) => i === idx ? { ...p, [key]: value } : p),
    }))
  }

  function toggleMultiPart(checked: boolean) {
    setUseMultiPart(checked)
    if (!checked) setForm(prev => ({ ...prev, parts: [] }))
    else if (form.parts.length === 0) addPart()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const url = menu ? `/api/menus/${menu.id}` : '/api/menus'
    const payload = {
      ...form,
      parts: useMultiPart ? form.parts.map((p, i) => ({ ...p, order: i })) : [],
    }
    const res = await fetch(url, {
      method: menu ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (res.ok) onSaved(await res.json())
  }

  const isNotify = form.type === 'NOTIFY_ADMIN' || form.type === 'NOTIFY_SELLER'
  const isShipping = form.type === 'SHIPPING'
  const isSubmenu = form.type === 'SUBMENU'

  // Parent menu options (exclude self and non-SUBMENU)
  const parentOptions = allMenus.filter(m =>
    m.id !== menu?.id && !m.parentId && m.type === 'SUBMENU'
  )

  // Default emoji per type
  const defaultEmojis: Record<string, string> = {
    REPLY: '💬', IMAGE: '🖼️', LINK: '🔗', PHONE: '📞',
    SHIPPING: '🚚', NOTIFY_ADMIN: '🔔', NOTIFY_SELLER: '📣', SUBMENU: '📂',
  }
  const previewEmoji = form.emoji || defaultEmojis[form.type] || '💬'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{menu ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ชื่อ + ประเภท */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>ชื่อเมนู *</Label>
              <Input value={form.label} onChange={e => set('label', e.target.value)} placeholder="เช่น สอบถามการจัดส่ง" required />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>ประเภทเมนู *</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>คำอธิบาย</Label>
              <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="อธิบายสั้นๆ (ไม่แสดงใน Bot)" />
            </div>
          </div>

          {/* ─── EMOJI PICKER ─── */}
          <div className="space-y-2">
            <Label>Emoji ไอคอน (แสดงใน LINE Bot)</Label>
            <div className="border rounded-xl p-3 bg-gray-50 space-y-3">
              {/* Preview + Input */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center text-2xl bg-white rounded-xl border-2 border-gray-200 shadow-sm shrink-0">
                  {previewEmoji}
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    value={form.emoji}
                    onChange={e => set('emoji', e.target.value)}
                    placeholder={`ค่าเริ่มต้น: ${defaultEmojis[form.type] || '💬'}`}
                    maxLength={8}
                    className="bg-white"
                  />
                  <p className="text-xs text-muted-foreground">พิมพ์ emoji โดยตรง หรือเลือกด้านล่าง</p>
                </div>
                {form.emoji && (
                  <Button type="button" variant="ghost" size="sm" className="text-gray-400 shrink-0" onClick={() => set('emoji', '')}>
                    ล้าง
                  </Button>
                )}
              </div>

              {/* Emoji group tabs */}
              <div className="space-y-2">
                <div className="flex gap-1 flex-wrap">
                  {EMOJI_GROUPS.map((g, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEmojiGroupIdx(i)}
                      className={`text-xs px-2 py-1 rounded-full transition-all ${
                        emojiGroupIdx === i
                          ? 'bg-amber-800 text-white'
                          : 'bg-white border text-gray-600 hover:border-amber-400'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Emoji grid */}
                <div className="flex gap-1.5 flex-wrap bg-white rounded-lg p-2 border">
                  {EMOJI_GROUPS[emojiGroupIdx].emojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => set('emoji', emoji)}
                      className={`w-9 h-9 text-xl flex items-center justify-center rounded-lg transition-all hover:scale-110 ${
                        form.emoji === emoji
                          ? 'bg-amber-100 ring-2 ring-amber-400 shadow-sm scale-110'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Parent menu selector */}
          <div className="space-y-1">
            <Label>อยู่ภายใต้เมนู (ถ้าเป็นเมนูย่อย)</Label>
            <Select value={form.parentId || 'none'} onValueChange={v => set('parentId', v === 'none' ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="ไม่มี (เมนูหลัก)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— ไม่มี (เมนูหลัก) —</SelectItem>
                {parentOptions.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.emoji || '📂'} {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">เลือกถ้าต้องการให้เมนูนี้อยู่ใต้เมนู Sub-menu</p>
          </div>

          {/* Sub-menu info */}
          {isSubmenu && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              📂 เมนูประเภทนี้จะแสดงเมนูย่อยให้ลูกค้าเลือกต่อ<br />
              <span className="text-xs mt-1 block">วิธีเพิ่มเมนูย่อย: บันทึกเมนูนี้ก่อน แล้วสร้างเมนูใหม่โดยเลือก "อยู่ภายใต้เมนู" เป็นเมนูนี้</span>
            </div>
          )}

          {/* ข้อความ intro (ทุกประเภท) */}
          {!useMultiPart && (
            <div className="space-y-1">
              <Label>ข้อความตอบกลับ{isShipping ? ' (intro)' : isSubmenu ? ' (แนะนำก่อนแสดงเมนูย่อย)' : ''}</Label>
              <Textarea value={form.content} onChange={e => set('content', e.target.value)}
                placeholder={
                  isShipping ? 'ข้อความแนะนำก่อนแสดงข้อมูลจัดส่ง (ไม่บังคับ)'
                  : isSubmenu ? 'ข้อความที่แสดงก่อนเมนูย่อย เช่น "เลือกหัวข้อที่ต้องการ" (ไม่บังคับ)'
                  : 'ข้อความที่ Bot จะตอบกลับ'
                }
                rows={3} />
            </div>
          )}

          {/* IMAGE */}
          {form.type === 'IMAGE' && !useMultiPart && (
            <div className="space-y-1">
              <Label>URL รูปภาพ</Label>
              <Input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." />
            </div>
          )}

          {/* LINK */}
          {form.type === 'LINK' && !useMultiPart && (
            <div className="space-y-1">
              <Label>URL ลิงก์</Label>
              <Input value={form.linkUrl} onChange={e => set('linkUrl', e.target.value)} placeholder="https://..." />
            </div>
          )}

          {/* PHONE */}
          {form.type === 'PHONE' && (
            <div className="space-y-1">
              <Label>เบอร์โทรศัพท์</Label>
              <Input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="0812345678" />
            </div>
          )}

          {/* SHIPPING */}
          {isShipping && (
            <div className="space-y-3 border rounded-lg p-4 bg-blue-50">
              <p className="text-sm font-semibold text-blue-700">🚚 ข้อมูลการจัดส่ง</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>บริษัทขนส่ง</Label>
                  <Input value={form.shippingCompany} onChange={e => set('shippingCompany', e.target.value)} placeholder="เช่น Flash Express, Kerry" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>ที่อยู่รับสินค้า</Label>
                  <Textarea value={form.shippingAddress} onChange={e => set('shippingAddress', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>ราคาค่าส่ง</Label>
                  <Textarea value={form.shippingRates} onChange={e => set('shippingRates', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>พื้นที่ให้บริการ</Label>
                  <Textarea value={form.shippingZones} onChange={e => set('shippingZones', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>เบอร์ติดต่อขนส่ง</Label>
                  <Input value={form.shippingContact} onChange={e => set('shippingContact', e.target.value)} placeholder="065-xxx-xxxx" />
                </div>
                <div className="space-y-1">
                  <Label>ลิงก์แผนที่</Label>
                  <Input value={form.shippingMapUrl} onChange={e => set('shippingMapUrl', e.target.value)} placeholder="https://maps.google.com/..." />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFY targets */}
          {isNotify && targets.length > 0 && (
            <div className="space-y-2">
              <Label>ส่งการแจ้งเตือนไปยัง</Label>
              <div className="border rounded-lg p-3 space-y-2">
                {targets.map(t => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.notificationTargetIds.includes(t.id)}
                      onCheckedChange={() => toggleTarget(t.id)}
                    />
                    <span className="text-sm">{t.name} <span className="text-muted-foreground text-xs">({t.lineUserId.substring(0, 12)}...)</span></span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {isNotify && targets.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              ⚠️ ยังไม่มีผู้รับแจ้งเตือน — ไปเพิ่มที่เมนู &quot;การแจ้งเตือน&quot; ก่อน
            </div>
          )}

          {/* ─── MULTI-PART SECTION ─── */}
          {!isShipping && !isSubmenu && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">📦 ข้อความหลายส่วน (Multi-part)</p>
                  <p className="text-xs text-muted-foreground">ส่งข้อความหลายชิ้นพร้อมกัน เช่น รูป + ข้อความ + ลิงก์</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useMultiPart}
                    onChange={e => toggleMultiPart(e.target.checked)}
                    className="w-4 h-4 accent-green-500"
                  />
                  <span className="text-sm font-medium">เปิดใช้</span>
                </label>
              </div>

              {useMultiPart && (
                <div className="space-y-3">
                  {form.parts.map((part, idx) => (
                    <div key={idx} className="bg-white border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-300" />
                        <span className="text-xs font-semibold text-muted-foreground">Part {idx + 1}</span>
                        <div className="flex-1">
                          <Select value={part.type} onValueChange={v => updatePart(idx, 'type', v as Part['type'])}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PART_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" size="sm" variant="ghost" className="text-red-400 h-7 w-7 p-0" onClick={() => removePart(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {part.type === 'TEXT' && (
                        <Textarea
                          value={part.content}
                          onChange={e => updatePart(idx, 'content', e.target.value)}
                          placeholder="พิมพ์ข้อความ..."
                          rows={2}
                          className="text-sm"
                        />
                      )}

                      {part.type === 'IMAGE' && (
                        <div className="space-y-1.5">
                          <Input
                            value={part.imageUrl}
                            onChange={e => updatePart(idx, 'imageUrl', e.target.value)}
                            placeholder="URL รูปภาพ https://..."
                            className="text-sm"
                          />
                          <Input
                            value={part.content}
                            onChange={e => updatePart(idx, 'content', e.target.value)}
                            placeholder="คำอธิบายใต้รูป (ไม่บังคับ)"
                            className="text-sm"
                          />
                        </div>
                      )}

                      {part.type === 'LINK' && (
                        <div className="space-y-1.5">
                          <Input
                            value={part.linkUrl}
                            onChange={e => updatePart(idx, 'linkUrl', e.target.value)}
                            placeholder="URL ลิงก์ https://..."
                            className="text-sm"
                          />
                          <Input
                            value={part.linkLabel}
                            onChange={e => updatePart(idx, 'linkLabel', e.target.value)}
                            placeholder="ชื่อปุ่ม เช่น 'ดูรายละเอียด'"
                            className="text-sm"
                          />
                          <Textarea
                            value={part.content}
                            onChange={e => updatePart(idx, 'content', e.target.value)}
                            placeholder="ข้อความเหนือปุ่ม (ไม่บังคับ)"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <Button type="button" variant="outline" size="sm" onClick={addPart} className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-1" /> เพิ่ม Part
                  </Button>

                  {form.parts.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      จะส่ง {form.parts.length} ข้อความพร้อมกัน (max 5 ต่อครั้ง)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ลำดับแสดงผล */}
          <div className="space-y-1">
            <Label>ลำดับแสดงผล</Label>
            <Input type="number" value={form.order} onChange={e => set('order', parseInt(e.target.value) || 0)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" className="bg-line hover:bg-line-dark" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {menu ? 'บันทึก' : 'เพิ่มเมนู'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
