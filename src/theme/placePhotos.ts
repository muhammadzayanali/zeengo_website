/** Curated Moscow / desk photography. Used when the catalog has no usable image. */

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=68`

export const HERO_MOSCOW = u('photo-1513326738677-b964603b136d', 1800)

const PORTRAITS = [
  u('photo-1547448415-e9f5b28e570d'),
  u('photo-1566073771259-6a8506099945'),
  u('photo-1551882547-ff40c63fe5fa'),
  u('photo-1445019980597-93fa8acb246c'),
  u('photo-1520250497591-112f2f40a3f4'),
  u('photo-1414235077428-338989a2e8c0'),
  u('photo-1559339352-11d035aa65de'),
  u('photo-1503095396549-807759245bf0'),
  u('photo-1507608616759-54f48f0af0ee'),
  u('photo-1553284965-83fd3e82fa5a'),
  u('photo-1469854523086-cc02fe5d8800'),
  u('photo-1488646953014-85cb44e25828'),
  u('photo-1519331379826-f10be5486c6f'),
  u('photo-1472162072942-cd5647fa9830'),
  u('photo-1436491865332-7a61a109cc05'),
  u('photo-1476514525535-07fb3b4ae5f1'),
]

const KEYWORDS: Array<{ test: RegExp; src: string }> = [
  { test: /basil|red square|кремл|собор/i, src: u('photo-1513326738677-b964603b136d') },
  { test: /hotel|adagio|ambassador|stay|suite|kosterev/i, src: u('photo-1566073771259-6a8506099945') },
  { test: /restaurant|food|chaihona|uzbekistan|halal|eat/i, src: u('photo-1414235077428-338989a2e8c0') },
  { test: /theatre|theater|bolshoi|театр/i, src: u('photo-1503095396549-807759245bf0') },
  { test: /balloon|منطاد|aeron/i, src: u('photo-1507608616759-54f48f0af0ee') },
  { test: /horse|akhilles|خيل/i, src: u('photo-1553284965-83fd3e82fa5a') },
  { test: /circus|kids|island|dolphin|family/i, src: u('photo-1472162072942-cd5647fa9830') },
  { test: /cruise|river|катер/i, src: u('photo-1476514525535-07fb3b4ae5f1') },
  { test: /car|driver|transfer|airport/i, src: u('photo-1449965408869-eaa3f722e40d') },
  { test: /park|garden|парк/i, src: u('photo-1519331379826-f10be5486c6f') },
]

function hashSeed(s: string): number {
  let n = 0
  for (let i = 0; i < s.length; i += 1) n = (n * 31 + s.charCodeAt(i)) >>> 0
  return n
}

export function resolvePlacePhoto(
  title: string,
  seed = title,
  provided?: string | null,
): string {
  const raw = (provided || '').trim()
  if (raw.startsWith('http') && !raw.includes('placeholder')) return raw
  const hit = KEYWORDS.find((k) => k.test.test(title))
  if (hit) return hit.src
  return PORTRAITS[hashSeed(seed) % PORTRAITS.length]
}

export const DESK_PHOTOS = {
  stay: u('photo-1551882547-ff40c63fe5fa', 700),
  car: u('photo-1449965408869-eaa3f722e40d', 700),
  guide: u('photo-1529626455594-4ff0802cfb7e', 700),
  money: u('photo-1580519542036-c47de6196ba5', 700),
}
