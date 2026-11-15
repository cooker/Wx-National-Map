// 示意世界地图：用 canvas 画，支持拖动、双指缩放，轻点一个国家会发出 pick 事件。
// 拖动、缩放、点在海面上都不算作答。
const geo = require('../../utils/geo.js')
const world = geo.world

const COLORS = ['#f6a6c4', '#fbe08a', '#9ad97f', '#c3a8ee', '#8fc4f2', '#f8c08a', '#9fdcc9']
const SEA = '#2f9be8', LAND = '#f0e6c8', COAST = '#6f8f86', BORDER = '#ffffffcc'

Component({
  properties: {
    // 初始视野：中心经纬度和横向跨度（度）。回中时回到这里
    view: { type: Object, value: { lng: -20, lat: 12, span: 210 } },
    // 是否把轻点当作“选择国家”
    pickable: { type: Boolean, value: true },
    // 高亮：{ correct: 国家id, chosen: 国家id }。correct 绿色，chosen（选错的）红色，都带国名
    marks: { type: Object, value: {} }
  },

  observers: {
    marks() { this.draw() },
    view() { if (this.ctx) { this.reset() } }
  },

  lifetimes: {
    ready() {
      this.createSelectorQuery().select('#map').fields({ node: true, size: true, rect: true }).exec(res => {
        if (!res[0] || !res[0].node) return
        const canvas = res[0].node
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 2
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.dpr = dpr
        this.w = res[0].width
        this.h = res[0].height
        this.left = res[0].left || 0
        this.top = res[0].top || 0
        this.reset()
        this.triggerEvent('ready')
      })
    }
  },

  methods: {
    /* ---------- 视野 ---------- */
    reset() {
      const v = this.data.view
      this.cx = v.lng
      this.cy = v.lat
      this.k = this.w / v.span          // 每一度经纬度占多少像素
      this.clamp()
      this.draw()
    },
    zoom(factor) {
      this.k *= factor
      this.clamp()
      this.draw()
    },
    zoomIn() { this.zoom(1.5) },
    zoomOut() { this.zoom(1 / 1.5) },
    clamp() {
      const minK = this.w / 360, maxK = this.w / 14
      this.k = Math.min(maxK, Math.max(minK, this.k))
      const halfLng = this.w / 2 / this.k, halfLat = this.h / 2 / this.k
      this.cx = halfLng >= 180 ? 0 : Math.min(180 - halfLng, Math.max(-180 + halfLng, this.cx))
      this.cy = halfLat >= 90 ? 0 : Math.min(90 - halfLat, Math.max(-90 + halfLat, this.cy))
    },

    /* ---------- 画图 ---------- */
    trace(poly) {
      const ctx = this.ctx, k = this.k / 10, ox = this.w / 2 - this.cx * this.k, oy = this.h / 2 + this.cy * this.k
      ctx.moveTo(ox + poly[0] * k, oy - poly[1] * k)
      for (let i = 2; i < poly.length; i += 2) ctx.lineTo(ox + poly[i] * k, oy - poly[i + 1] * k)
      ctx.closePath()
    },
    // 给一个国家上色。有 region 的部分先用所在陆块做裁剪，这样国界不会画到海里
    paint(country, fill, stroke, lineWidth) {
      const ctx = this.ctx
      country.parts.forEach(part => {
        ctx.save()
        ctx.beginPath()
        part.lands.forEach(name => this.trace(world.lands[name]))
        if (part.region) {
          ctx.clip()
          ctx.beginPath()
          this.trace(world.regions[part.region])
        }
        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = stroke
        ctx.lineWidth = lineWidth
        ctx.stroke()
        ctx.restore()
      })
    },
    label(id, color) {
      const info = world.info[id]
      if (!info) return
      const ctx = this.ctx
      const x = this.w / 2 + (info.c[0] - this.cx) * this.k, y = this.h / 2 - (info.c[1] - this.cy) * this.k
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 4
      ctx.strokeStyle = '#ffffff'
      ctx.strokeText(geo.nameOf(id), x, y)
      ctx.fillStyle = color
      ctx.fillText(geo.nameOf(id), x, y)
    },
    draw() {
      const ctx = this.ctx
      if (!ctx) return
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
      ctx.fillStyle = SEA
      ctx.fillRect(0, 0, this.w, this.h)
      ctx.lineJoin = 'round'
      // 所有陆地先铺一层底色
      ctx.beginPath()
      for (const name in world.lands) this.trace(world.lands[name])
      ctx.fillStyle = LAND
      ctx.fill()
      // 再给收录的国家上色：先画铺满陆块的，再画上层的
      const list = world.countries
      list.forEach((c, i) => { if (c.base && c.id) this.paint(c, COLORS[i % COLORS.length], BORDER, 1) })
      list.forEach((c, i) => { if (!c.base) this.paint(c, c.id ? COLORS[i % COLORS.length] : LAND, BORDER, 1) })
      // 海岸线
      ctx.beginPath()
      for (const name in world.lands) this.trace(world.lands[name])
      ctx.strokeStyle = COAST
      ctx.lineWidth = 0.8
      ctx.stroke()
      // 作答后的高亮
      const m = this.data.marks || {}
      const find = id => list.filter(c => c.id === id)[0]
      if (m.chosen && m.chosen !== m.correct && find(m.chosen)) this.paint(find(m.chosen), '#f4a58f', '#b33a2a', 2.5)
      if (m.correct && find(m.correct)) this.paint(find(m.correct), '#7ed957', '#2c7a2c', 2.5)
      if (m.chosen && m.chosen !== m.correct) this.label(m.chosen, '#8f2a1c')
      if (m.correct) this.label(m.correct, '#1f5c22')
    },

    /* ---------- 手势 ---------- */
    // 触点在画布里的位置。多数环境直接给 x、y，没有时用屏幕坐标减去画布的位置
    points(e) {
      return Array.prototype.map.call(e.touches, t => ({
        x: t.x !== undefined ? t.x : t.clientX - this.left,
        y: t.y !== undefined ? t.y : t.clientY - this.top
      }))
    },
    onStart(e) {
      const t = this.points(e)
      this.moved = false
      this.startTime = Date.now()
      this.last = t.length === 1 ? { x: t[0].x, y: t[0].y } : null
      this.pinch = t.length >= 2 ? Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) : 0
      if (t.length >= 2) this.moved = true
      this.tapAt = t.length === 1 ? { x: t[0].x, y: t[0].y } : null
    },
    onMove(e) {
      const t = this.points(e)
      if (t.length >= 2) {
        const d = Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y)
        if (this.pinch) this.k *= d / this.pinch
        this.pinch = d
        this.moved = true
        this.last = null
      } else if (this.last) {
        const dx = t[0].x - this.last.x, dy = t[0].y - this.last.y
        if (this.tapAt && Math.hypot(t[0].x - this.tapAt.x, t[0].y - this.tapAt.y) > 6) this.moved = true
        this.cx -= dx / this.k
        this.cy += dy / this.k
        this.last = { x: t[0].x, y: t[0].y }
      } else {
        this.last = { x: t[0].x, y: t[0].y }   // 从双指变回单指
      }
      this.clamp()
      this.draw()
    },
    onEnd(e) {
      if (e.touches.length) { this.last = null; this.pinch = 0; return }
      const tap = !this.moved && this.tapAt && Date.now() - this.startTime < 600
      if (!tap || !this.data.pickable) return
      const lng = this.cx + (this.tapAt.x - this.w / 2) / this.k
      const lat = this.cy - (this.tapAt.y - this.h / 2) / this.k
      // 容差约 12 像素，换算成经纬度
      this.triggerEvent('pick', { id: geo.hitNear(lng, lat, 12 / this.k) })
    }
  }
})
