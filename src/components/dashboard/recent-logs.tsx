import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

interface Menu { id: string; label: string }

interface LogWithMenu {
  id: string
  displayName: string | null
  action: string
  createdAt: Date | string
  menu: Menu | null
}

export function RecentLogs({ logs }: { logs: LogWithMenu[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">กิจกรรมล่าสุด</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีกิจกรรม</p>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{log.displayName || 'Unknown'}</p>
                <p className="text-muted-foreground text-xs truncate">
                  {log.menu?.label || log.action}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
