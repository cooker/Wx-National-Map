// 示意世界地图的几何工具：判断点了哪个国家。
const world = require('../data/world.js')
const countries = require('../data/countries.js')

// 多边形是扁平数组 [x0, y0, x1, y1, ...]，坐标是 经度×10、纬度×10
function inPoly(poly, x, y) {
  let inside = false
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const xi = poly[i], yi = poly[i + 1], xj = poly[j], yj = poly[j + 1]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function inPart(part, x, y) {
  if (part.region && !inPoly(world.regions[part.region], x, y)) return false
  return part.lands.some(name => inPoly(world.lands[name], x, y))
}

// 先查画在上层的国家，再查“铺满整块陆地”的国家
const ORDER = world.countries.filter(c => !c.base).concat(world.countries.filter(c => c.base))

// 返回国家 id；点在没有收录的陆地上返回 'other'；点在海里返回 null
function hit(lng, lat) {
  const x = lng * 10, y = lat * 10
  for (let i = 0; i < ORDER.length; i++) {
    const c = ORDER[i]
    if (c.parts.some(p => inPart(p, x, y))) return c.id || 'other'
  }
  for (const name in world.lands) if (inPoly(world.lands[name], x, y)) return 'other'
  return null
}

// 带容差的点选：手指点偏一点也能选中小国家。
// 正好点在某个国家上就用它；否则在周围 radius（度）的一圈上取样，只有一个国家时才算选中它，
// 有两个以上就不猜，仍按原来的结果处理。
function hitNear(lng, lat, radius) {
  const center = hit(lng, lat)
  if (center && center !== 'other') return center
  const found = {}
  for (let ring = 1; ring <= 2; ring++) {
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * i / 4
      const id = hit(lng + Math.cos(a) * radius * ring / 2, lat + Math.sin(a) * radius * ring / 2)
      if (id && id !== 'other') found[id] = true
    }
  }
  const ids = Object.keys(found)
  return ids.length === 1 ? ids[0] : center
}

function nameOf(id) {
  return countries.byId[id] ? countries.byId[id].name : ''
}

module.exports = { hit, hitNear, nameOf, world }
