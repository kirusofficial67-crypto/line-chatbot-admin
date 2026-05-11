'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, exportToCSV } from '@/lib/utils'
import { Search, Download, Ban, UserCheck, MessageSquare, Clock, User } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface Customer {
  id: string
  lineUserId: string
  displayName: string | null
  pictureUrl: string | null
  statusMessage: string | null
  followedAt: Date | string
  lastActiveAt: Date | string
  isBlocked: boolean
  totalMessages: number
  _count: { chatLogs: number }
}

interface ChatLogItem {
  id: string
  action: string
  messageContent: string | null
  createdAt: Date | string
  menu: { label: string } | null
}

export function CustomersClient({ customers: init }: { customers: Customer[] }) {
  const { toast } = useToast()
  const [customers, setCustomers] = useState(init)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [logs, setLogs] = useState<ChatLogItem[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const filtered = customers.filter(c =>
    !search || c.displayName?.toLowerCase().includes(search.toLowerCase()) || c.lineUserId.includes(search)
  )

  async function openDetail(c: Customer) {
    setSelected(c)
    setLoadingLogs(true)
    try {
      const res = await fetch(`/api/customers/${c.id}`)
      const data = await res.json()
      setLogs(data.chatLogs || [])
    } catch {}
    setLoadingLogs(false)
  }

  async function toggleBlock(c: Customer) {
    const res = await fetch(`/api/customers/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked: !c.isBlocked }),
    })
    if (res.ok) {
      setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, isBlocked: !x.isBlocked } : x))
      if (selected?.id === c.id) setSelected(prev => prev ? { ...prev, isBlocked: !prev.isBlocked } : prev)
      toast({ title: !c.isBlocked ? 'บล็อกลูกค้าแล้ว' : 'ยกเลิกบล็อกแล้ว' })
    }
  }

  function handleExport() {
    exportToCSV(
      filtered.map(c => ({
        ชื่อ: c.displayName || '',
        LINE_ID: c.lineUserId,
        สถานะ: c.statusMessage || '',
        ข้อความทั้งหมด: c.totalMessages,
        เริ่มติดตาม: formatDate(c.followedAt),
        ใช้งานล่าสุด: formatDate(c.lastActiveAt),
        บล็อก: c.isBlocked ? 'ใช่' : 'ไม่',
      })),
      'customers'
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="ค้นหาชื่อ หรือ LINE ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'ลูกค้าทั้งหมด', value: customers.length, color: 'text-blue-600' },
          { label: 'ใช้งานวันนี้', value: customers.filter(c => new Date(c.lastActiveAt).toDateString() === new Date().toDateString()).length, color: 'text-green-600' },
          { label: 'ถูกบล็อก', value: customers.filter(c => c.isBlocked).length, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="py-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">ลูกค้า</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">LINE ID</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">ข้อความ</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">ใช้งานล่าสุด</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">สถานะ</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">ยังไม่มีข้อมูลลูกค้า</td></tr>
                )}
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {c.pictureUrl ? (
                          <Image src={c.pictureUrl} alt="" width={36} height={36} className="rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{c.displayName || 'ไม่ทราบชื่อ'}</p>
                          {c.statusMessage && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{c.statusMessage}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground hidden md:table-cell">{c.lineUserId}</td>
                    <td className="p-4 text-center">
                      <span className="font-semibold">{c.totalMessages}</span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground hidden lg:table-cell">
                      {formatDate(c.lastActiveAt)}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={c.isBlocked ? 'destructive' : 'default'}
                        className={c.isBlocked ? '' : 'bg-green-100 text-green-700 border-green-200'}>
                        {c.isBlocked ? 'บล็อก' : 'ปกติ'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openDetail(c)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className={c.isBlocked ? 'text-green-600' : 'text-red-500'}
                          onClick={() => toggleBlock(c)}
                          title={c.isBlocked ? 'ยกเลิกบล็อก' : 'บล็อก'}
                        >
                          {c.isBlocked ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selected.pictureUrl ? (
                    <Image src={selected.pictureUrl} alt="" width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p>{selected.displayName || 'ไม่ทราบชื่อ'}</p>
                    <p className="text-xs font-normal text-muted-foreground font-mono">{selected.lineUserId}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { icon: MessageSquare, label: 'ข้อความทั้งหมด', value: selected.totalMessages },
                  { icon: Clock, label: 'เริ่มติดตาม', value: formatDate(selected.followedAt) },
                  { icon: Clock, label: 'ใช้งานล่าสุด', value: formatDate(selected.lastActiveAt) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">ประวัติการกดเมนู</h4>
                  <Button
                    size="sm" variant={selected.isBlocked ? 'outline' : 'destructive'}
                    onClick={() => toggleBlock(selected)}
                  >
                    {selected.isBlocked ? <><UserCheck className="h-3.5 w-3.5 mr-1" />ยกเลิกบล็อก</> : <><Ban className="h-3.5 w-3.5 mr-1" />บล็อก</>}
                  </Button>
                </div>
                {loadingLogs ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">กำลังโหลด...</p>
                ) : logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">ยังไม่มีประวัติ</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{log.menu?.label || log.messageContent || log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.action}</p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
