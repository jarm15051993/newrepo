import { prisma } from '@/lib/prisma'

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

/**
 * Sets a setting value. If the key already exists it is only overwritten
 * when `overwriteExisting` is true (default false — safe for one-time stamps
 * like membershipRequiredSince).
 */
export async function setSetting(
  key: string,
  value: string,
  overwriteExisting = false,
): Promise<void> {
  await prisma.setting.upsert({
    where:  { key },
    update: overwriteExisting ? { value } : {},
    create: { key, value },
  })
}
