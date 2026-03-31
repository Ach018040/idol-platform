import { EventItem, Group, Member, getEvents, getGroups, getMembers } from '@/lib/data'

export type ActivityLevel = 'very-active' | 'active' | 'warm' | 'quiet' | 'inactive'

export type IdolActivity = {
  name: string
  type: 'group' | 'member'
  relatedGroup?: string
  events90d: number
  events30d: number
  lastEventDate: string | null
  activityScore: number
  level: ActivityLevel
}

function normalizeText(value?: string | null): string {
  return (value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[【】\[\]（）()・/\\｜|\-_.:,，。!！?？]/g, '')
}

function eventDateValue(event: EventItem): string | null {
  return event.event_date || event.start_time || null
}

function withinDays(dateValue: string | null, days: number): boolean {
  if (!dateValue) return false
  const ts = new Date(dateValue).getTime()
  if (!Number.isFinite(ts)) return false
  const diff = Date.now() - ts
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000
}

function eventSearchText(event: EventItem): string {
  return normalizeText([
    event.title,
    event.venue,
    event.city,
    event.organizer,
    event.source_url,
  ].filter(Boolean).join(' '))
}

function detectLevel(events90d: number): ActivityLevel {
  if (events90d >= 8) return 'very-active'
  if (events90d >= 4) return 'active'
  if (events90d >= 2) return 'warm'
  if (events90d >= 1) return 'quiet'
  return 'inactive'
}

function score(events30d: number, events90d: number): number {
  return events30d * 3 + events90d
}

function latestDate(values: string[]): string | null {
  if (values.length === 0) return null
  return values.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
}

export function analyzeGroupActivity(groups = getGroups(), events = getEvents()): IdolActivity[] {
  return groups.map((group: Group) => {
    const names = [group.display_name, group.group].filter(Boolean).map((v) => normalizeText(v))
    const matched = events.filter((event) => {
      const text = eventSearchText(event)
      return names.some((name) => name && text.includes(name))
    })

    const dates = matched.map(eventDateValue).filter(Boolean) as string[]
    const events30d = matched.filter((event) => withinDays(eventDateValue(event), 30)).length
    const events90d = matched.filter((event) => withinDays(eventDateValue(event), 90)).length

    return {
      name: group.display_name || group.group,
      type: 'group',
      events30d,
      events90d,
      lastEventDate: latestDate(dates),
      activityScore: score(events30d, events90d),
      level: detectLevel(events90d),
    }
  }).sort((a, b) => b.activityScore - a.activityScore || b.events90d - a.events90d)
}

export function analyzeMemberActivity(members = getMembers(), groups = getGroups(), events = getEvents()): IdolActivity[] {
  const groupActivity = analyzeGroupActivity(groups, events)
  const groupMap = new Map(groupActivity.map((g) => [normalizeText(g.name), g]))

  return members.map((member: Member) => {
    const names = [member.name, member.nickname].filter(Boolean).map((v) => normalizeText(v))
    const matched = events.filter((event) => {
      const text = eventSearchText(event)
      return names.some((name) => name && text.includes(name))
    })

    const dates = matched.map(eventDateValue).filter(Boolean) as string[]
    const direct30d = matched.filter((event) => withinDays(eventDateValue(event), 30)).length
    const direct90d = matched.filter((event) => withinDays(eventDateValue(event), 90)).length

    const fallbackGroup = groupMap.get(normalizeText(member.group))
    const events30d = direct30d > 0 ? direct30d : fallbackGroup?.events30d ?? 0
    const events90d = direct90d > 0 ? direct90d : fallbackGroup?.events90d ?? 0
    const lastEventDate = latestDate(dates) || fallbackGroup?.lastEventDate || null

    return {
      name: member.name,
      type: 'member',
      relatedGroup: member.group,
      events30d,
      events90d,
      lastEventDate,
      activityScore: score(events30d, events90d),
      level: detectLevel(events90d),
    }
  }).sort((a, b) => b.activityScore - a.activityScore || b.events90d - a.events90d)
}

export function summarizeActivity() {
  const groupActivity = analyzeGroupActivity()
  const memberActivity = analyzeMemberActivity()

  return {
    generatedAt: new Date().toISOString(),
    groupsTracked: groupActivity.length,
    membersTracked: memberActivity.length,
    activeGroups90d: groupActivity.filter((item) => item.events90d > 0).length,
    activeMembers90d: memberActivity.filter((item) => item.events90d > 0).length,
    topGroups: groupActivity.slice(0, 10),
    topMembers: memberActivity.slice(0, 20),
  }
}
