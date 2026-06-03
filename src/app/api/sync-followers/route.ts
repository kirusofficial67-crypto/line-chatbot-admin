import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { lineClient } from '@/lib/line'

// ดึง follower IDs ทั้งหมดจาก LINE (รองรับ pagination)
async function getAllFollowerIds(): Promise<string[]> {
  const ids: string[] = []
  let nextToken: string | undefined = undefined

  do {
    const url: string = nextToken
      ? `https://api.line.me/v2/bot/followers/ids?limit=1000&start=${nextToken}`
      : 'https://api.line.me/v2/bot/followers/ids?limit=1000'

    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` },
    })

    if (!res.ok) {
      console.error('[sync-followers] LINE API error:', res.status, await res.text())
      break
    }

    const data: { userIds?: string[]; next?: string } = await res.json()
    ids.push(...(data.userIds || []))
    nextToken = data.next
  } while (nextToken)

  return ids
}

async function syncFollowers(req: NextRequest) {
  // ตรวจสอบ auth — admin เรียกหรือ cron secret
  const cronSecret = req.headers.get('x-cron-secret')
  const isCron = cronSecret === process.env.CRON_SECRET

  if (!isCron) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const followerIds = await getAllFollowerIds()

    if (followerIds.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No followers found' })
    }

    let synced = 0
    let errors = 0

    // Process ทีละ 10 คน เพื่อไม่ให้ rate limit
    const BATCH = 10
    for (let i = 0; i < followerIds.length; i += BATCH) {
      const batch = followerIds.slice(i, i + BATCH)
      await Promise.allSettled(
        batch.map(async (userId) => {
          try {
            // ดึง profile จาก LINE
            let profile = { displayName: 'Unknown', pictureUrl: '', statusMessage: '' }
            try {
              const p = await lineClient.getProfile(userId)
              profile = {
                displayName: p.displayName,
                pictureUrl: p.pictureUrl ?? '',
                statusMessage: p.statusMessage ?? '',
              }
            } catch {}

            // upsert เข้าฐานข้อมูล
            await prisma.customer.upsert({
              where: { lineUserId: userId },
              update: {
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
                statusMessage: profile.statusMessage,
              },
              create: {
                lineUserId: userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
                statusMessage: profile.statusMessage,
              },
            })
            synced++
          } catch {
            errors++
          }
        })
      )
      // หน่วงเล็กน้อยระหว่าง batch ป้องกัน rate limit
      if (i + BATCH < followerIds.length) {
        await new Promise(r => setTimeout(r, 200))
      }
    }

    console.log(`[sync-followers] Done: ${synced} synced, ${errors} errors`)
    return NextResponse.json({
      success: true,
      total: followerIds.length,
      synced,
      errors,
    })
  } catch (e) {
    console.error('[sync-followers] Error:', e)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

// POST — เรียกจาก admin dashboard
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return syncFollowers(req)
}

// GET — เรียกจาก Vercel Cron Job (ทุก 12 ชม.)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return syncFollowers(req)
}
