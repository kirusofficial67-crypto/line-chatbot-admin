'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export function SyncFollowersButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ synced?: number; total?: number; error?: string } | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/sync-followers', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      setResult({ synced: data.synced, total: data.total })
      // รีเฟรชหน้าเพื่อแสดงข้อมูลใหม่
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : 'Sync failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleSync}
        disabled={loading}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'กำลัง Sync...' : 'Sync ลูกค้าจาก LINE'}
      </Button>
      {result && !result.error && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Sync แล้ว {result.synced}/{result.total} คน
        </p>
      )}
      {result?.error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {result.error}
        </p>
      )}
    </div>
  )
}
