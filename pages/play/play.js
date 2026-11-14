const geo = require('../../data/geo.js')
const store = require('../../utils/store.js')
const app = getApp()

const MIN_ZOOM = 3
const MAX_ZOOM = 12
const QUIZ_COUNT = 10

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)) }
function shuffle(list) {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]; a[i] = a[j]; a[j] = t
  }
  return a
}
function pad(n) { return n < 10 ? '0' + n : '' + n }

// 测验里的标记只有圆点，不显示名字；答对的那个变绿并显示名字
function toMarker(item, solved) {
  const m = {
    id: item.id,
    latitude: item.lat,
    longitude: item.lng,
    iconPath: solved ? '/images/feature.png' : '/images/quiz.png',
    width: solved ? 24 : 20,
    height: solved ? 24 : 20,
    anchor: { x: 0.5, y: 0.5 }
  }
  if (solved) {
    m.callout = {
      content: item.name, display: 'ALWAYS', fontSize: 12, color: '#ffffff',
      bgColor: '#2e7d32', borderRadius: 10, padding: 4, textAlign: 'center'
    }
  }
  return m
}

Page({
  data: {
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    longitude: 20,
    latitude: 20,
    scale: MIN_ZOOM,
    zoom: MIN_ZOOM,
    markers: [],
    q: null,        // 当前题目的状态
    result: null    // 全部答完后的成绩
  },

  onLoad(options) {
    this.scope = options.scope ? decodeURIComponent(options.scope) : '全部'
    this.start()
  },

  onReady() {
    this.mapCtx = wx.createMapContext('quizMap', this)
  },

  start() {
    // 出题范围：全部国家、某个大洲的国家、大洲大洋、山河湖海
    let pool
    const findable = ['continent', 'ocean', 'country', 'feature', 'region']
    if (this.scope === '错题') pool = store.review().map(n => geo.byName[n]).filter(i => i && findable.indexOf(i.type) >= 0)
    else if (this.scope === '大洲大洋') pool = geo.continents.concat(geo.oceans)
    else if (this.scope === '山河湖海') pool = geo.features
    else if (this.scope === '全部') pool = geo.countries
    else pool = geo.countries.filter(c => c.continent === this.scope)
    // 地图上的圆点：考国家时放全部国家，其他范围放该范围的全部知识点
    if (!pool.length) { wx.navigateBack(); return }
    if (this.scope === '错题') {
      const types = pool.map(i => i.type)
      this.dots = geo.all.filter(i => types.indexOf(i.type) >= 0)
    } else {
      this.dots = pool[0].type === 'country' ? geo.countries : pool
    }
    this.questions = shuffle(pool).slice(0, QUIZ_COUNT)
    this.answers = []   // 每题是否一次答对
    this.setData({ result: null })
    if (!this.actual) this.actual = { scale: MIN_ZOOM, longitude: 20, latitude: 20 }
    this.moveTo(20, 20, MIN_ZOOM)
    this.ask(0, 0)
  },

  ask(index, score) {
    const total = this.questions.length
    this.setData({
      markers: this.dots.map(i => toMarker(i, false)),
      q: { index, total, score, target: this.questions[index].name, tries: 0, solved: null, pct: Math.round(index * 100 / total) }
    })
  },

  /* ---------- 缩放 ----------
     map 组件的 scale、longitude、latitude 只在“想让地图动”的时候才写。
     用户用手指缩放、拖动时不往回写（往回写会和手势打架，出现回弹、跳动），
     只把地图的真实状态记在 this.actual 里，并更新界面上显示的级别。 */

  onRegionChange(e) {
    if (e.type !== 'end') return
    const d = e.detail || {}
    if (typeof d.scale === 'number' && d.centerLocation) {
      this.onViewChanged({ scale: d.scale, longitude: d.centerLocation.longitude, latitude: d.centerLocation.latitude })
    } else {
      this.readView(view => this.onViewChanged(view))
    }
  },

  readView(cb) {
    const ctx = this.mapCtx
    if (!ctx) { cb(this.actual); return }
    ctx.getScale({
      success: s => ctx.getCenterLocation({
        success: c => cb({ scale: s.scale, longitude: c.longitude, latitude: c.latitude }),
        fail: () => cb(this.actual)
      }),
      fail: () => cb(this.actual)
    })
  },

  // 让地图移动到指定的中心和级别
  moveTo(longitude, latitude, zoom) {
    zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM)
    const go = () => this.setData(Object.assign({ longitude, latitude, scale: zoom }, this.viewText({ longitude, latitude, scale: zoom })))
    const a = this.actual
    const d = this.data
    const stale =
      Math.abs(a.scale - d.scale) > 0.01 ||
      Math.abs(a.longitude - d.longitude) > 0.0001 ||
      Math.abs(a.latitude - d.latitude) > 0.0001
    this.actual = { scale: zoom, longitude, latitude }
    // 绑定值如果已经和地图的真实状态不一致（用户用手动过），先对齐一次（画面不会动）再发目标，
    // 否则新目标恰好等于旧绑定值时，地图不会有反应
    if (stale) this.setData({ scale: a.scale, longitude: a.longitude, latitude: a.latitude }, go)
    else go()
  },

  // 以当前中心为基准缩放到指定级别
  zoomTo(target) {
    this.readView(view => {
      this.actual = view
      this.moveTo(view.longitude, view.latitude, target)
      this.afterZoom()
    })
  },
  zoomIn() { this.zoomTo(Math.floor(this.data.zoom + 0.001) + 1) },
  zoomOut() { this.zoomTo(Math.ceil(this.data.zoom - 0.001) - 1) },

  viewText(view) { return { zoom: Math.round(view.scale * 10) / 10 } },
  onViewChanged(view) {
    this.actual = view
    const t = this.viewText(view)
    if (t.zoom !== this.data.zoom) this.setData(t)
  },
  afterZoom() {},

  /* ---------- 答题 ---------- */

  onMarkerTap(e) {
    const q = this.data.q
    const item = geo.all[e.detail.markerId]
    if (!item || !q || q.solved) return
    const target = this.questions[q.index]
    if (item.id !== target.id) {
      this.setData({ 'q.tries': q.tries + 1 })
      wx.showToast({ title: `这里是${item.name}，再找找`, icon: 'none' })
      return
    }
    const first = q.tries === 0
    this.answers[q.index] = first
    if (first && this.scope === '错题') store.removeReview(target.name)   // 重练时一次找对，就移出复习清单
    this.setData({
      'q.solved': target,
      'q.first': first,
      'q.score': q.score + (first ? 1 : 0),
      markers: this.dots.map(i => toMarker(i, i.id === target.id))
    })
  },

  // 提示（用过提示就不算一次答对）：国家提示所在大洲，其他知识点把地图移到它附近
  hint() {
    const q = this.data.q
    const target = this.questions[q.index]
    const cont = target.continent ? geo.byName[target.continent] : null
    if (cont) {
      this.setData({ 'q.tries': q.tries + 1 })
      this.moveTo(cont.lng, cont.lat, 4)
      wx.showToast({ title: `提示：它在${cont.name}`, icon: 'none' })
    } else {
      const lng = clamp(target.lng + (Math.random() * 16 - 8), -170, 170)
      const lat = clamp(target.lat + (Math.random() * 10 - 5), -75, 75)
      this.setData({ 'q.tries': q.tries + 1 })
      this.moveTo(lng, lat, 4)
      wx.showToast({ title: '提示：就在这一片', icon: 'none' })
    }
  },

  // 跳过：直接告诉答案，本题不得分
  skip() {
    const q = this.data.q
    const target = this.questions[q.index]
    this.answers[q.index] = false
    this.moveTo(target.lng, target.lat, 4)
    this.setData({
      'q.solved': target,
      'q.first': false,
      'q.skipped': true,
      markers: this.dots.map(i => toMarker(i, i.id === target.id))
    })
  },

  next() {
    const q = this.data.q
    if (q.index + 1 < q.total) this.ask(q.index + 1, q.score)
    else this.finish()
  },

  finish() {
    const q = this.data.q
    const rows = this.questions.map((c, i) => ({ id: c.id, name: c.name, ok: !!this.answers[i] }))
    const wrong = rows.filter(r => !r.ok)
    const now = new Date()
    store.addRecord({
      time: now.getTime(),
      date: `${now.getMonth() + 1}月${now.getDate()}日 ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      scope: this.scope, score: q.score, total: q.total
    })
    store.addReview(wrong.map(r => r.name))
    this.setData({
      q: null,
      result: { score: q.score, total: q.total, pct: Math.round(q.score * 100 / q.total), rows, wrongCount: wrong.length, firstWrongId: wrong.length ? wrong[0].id : null }
    })
  },

  /* ---------- 成绩页 ---------- */

  again() { this.start() },
  backToMap() { wx.switchTab({ url: '/pages/index/index' }) },
  reviewWrong() {
    app.globalData.focusId = this.data.result.firstWrongId
    wx.switchTab({ url: '/pages/index/index' })
  }
})
