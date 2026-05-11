export interface NotificationTarget {
  id: string
  name: string
  lineUserId: string
  isActive: boolean
}

export interface Part {
  id?: string
  type: string
  content: string | null
  imageUrl: string | null
  linkUrl: string | null
  linkLabel: string | null
  order: number
}

export interface MenuWithNotifications {
  id: string
  label: string
  description?: string | null
  type: string
  content?: string | null
  imageUrl?: string | null
  linkUrl?: string | null
  phoneNumber?: string | null
  order: number
  isActive: boolean
  emoji?: string | null
  parentId?: string | null
  shippingCompany?: string | null
  shippingAddress?: string | null
  shippingZones?: string | null
  shippingRates?: string | null
  shippingContact?: string | null
  shippingMapUrl?: string | null
  notifications: { targetId: string; target: NotificationTarget }[]
  parts: Part[]
}
