import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Bell, PhoneCall, TrendingUp } from 'lucide-react'

interface DashboardStatsProps {
  totalCustomers: number
  adminContacts: number
  sellerContacts: number
}

export function DashboardStats({ totalCustomers, adminContacts, sellerContacts }: DashboardStatsProps) {
  // อัตราลูกค้าที่ติดต่อ (unique) ต่อลูกค้าทั้งหมด
  const contactRate = totalCustomers > 0
    ? (((adminContacts + sellerContacts) / totalCustomers) * 100).toFixed(1)
    : '0'

  const stats = [
    {
      title: 'ลูกค้าทั้งหมด',
      value: totalCustomers.toLocaleString(),
      sub: 'คน',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'ติดต่อแอดมิน',
      value: adminContacts.toLocaleString(),
      sub: 'คน',
      icon: Bell,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'ติดต่อผู้ขาย',
      value: sellerContacts.toLocaleString(),
      sub: 'คน',
      icon: PhoneCall,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'อัตราติดต่อ',
      value: `${contactRate}%`,
      sub: 'ของลูกค้าทั้งหมด',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ title, value, sub, icon: Icon, color, bg }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={`${bg} p-2 rounded-lg`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold">{value}</p>
              {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
