'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DashboardChartProps {
  data: { date: string; chats: number }[]
}

export function DashboardChart({ data }: DashboardChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">แชท 7 วันล่าสุด</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="chats" fill="#06C755" radius={[4, 4, 0, 0]} name="แชท" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
