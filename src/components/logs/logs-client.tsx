'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { exportToCSV, formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'
interface Menu { id: string; label: string; type: string }
interface NotificationTarget { id: string; name: string; lineUserId: string }
interface ChatLogWithMenu {
  id: string; lineUserId: string; displayName: string | null
  action: string; messageContent: string | null; createdAt: Date | string
  menu: Menu | null
}
interface NotifyLogWithTarget {
  id: string; lineUserId: string; displayName: string | null
  menuLabel: string; status: string; error: string | null; createdAt: Date | string
  target: NotificationTarget | null
}

interface LogsClientProps {
  chatLogs: ChatLogWithMenu[]
  notifyLogs: NotifyLogWithTarget[]
}

export function LogsClient({ chatLogs, notifyLogs }: LogsClientProps) {
  function exportChat() {
    exportToCSV(
      chatLogs.map((l) => ({
        วันที่: formatDate(l.createdAt),
        LINE_ID: l.lineUserId,
        ชื่อ: l.displayName || '',
        เมนู: l.menu?.label || '',
        การกระทำ: l.action,
      })),
      'chat-logs'
    )
  }

  function exportNotify() {
    exportToCSV(
      notifyLogs.map((l) => ({
        วันที่: formatDate(l.createdAt),
        LINE_ID: l.lineUserId,
        ชื่อ: l.displayName || '',
        เมนู: l.menuLabel,
        ผู้รับ: l.target?.name || '',
        สถานะ: l.status,
        ข้อผิดพลาด: l.error || '',
      })),
      'notification-logs'
    )
  }

  return (
    <Tabs defaultValue="chat">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="chat">ประวัติแชท ({chatLogs.length})</TabsTrigger>
          <TabsTrigger value="notify">ประวัติแจ้งเตือน ({notifyLogs.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="chat">
        <Card>
          <CardContent className="p-0">
            <div className="flex justify-end p-4 border-b">
              <Button variant="outline" size="sm" onClick={exportChat}>
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่/เวลา</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>LINE ID</TableHead>
                    <TableHead>เมนูที่กด</TableHead>
                    <TableHead>การกระทำ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chatLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        ยังไม่มีประวัติ
                      </TableCell>
                    </TableRow>
                  )}
                  {chatLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                      <TableCell>{log.displayName || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{log.lineUserId}</TableCell>
                      <TableCell>{log.menu?.label || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.action}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notify">
        <Card>
          <CardContent className="p-0">
            <div className="flex justify-end p-4 border-b">
              <Button variant="outline" size="sm" onClick={exportNotify}>
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่/เวลา</TableHead>
                    <TableHead>ชื่อผู้ส่ง</TableHead>
                    <TableHead>เมนู</TableHead>
                    <TableHead>ผู้รับ</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifyLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        ยังไม่มีประวัติ
                      </TableCell>
                    </TableRow>
                  )}
                  {notifyLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                      <TableCell>{log.displayName || '-'}</TableCell>
                      <TableCell>{log.menuLabel}</TableCell>
                      <TableCell>{log.target?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={log.status === 'SENT' ? 'default' : 'destructive'}
                          className={log.status === 'SENT' ? 'bg-line' : ''}
                        >
                          {log.status === 'SENT' ? 'ส่งแล้ว' : log.status === 'FAILED' ? 'ล้มเหลว' : 'รอส่ง'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
