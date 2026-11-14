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
    const pool = this.scope === '全部' ? geo.countries : geo.countries.filter(c => c.continent === this.scope)
    this.questions = shuffle(pool).slice(0, QUIZ_COUNT)
    this.answers = []   // 每题是否一次答对
    this.setData({ result: null, longitude: 20, latitude: 20, scale: MIN_ZOOM, zoom: MIN_ZOOM })
    this.ask(0, 0)
  },

  ask(index, score) {
    const total = this.questions.length
    this.setData({
      markers: geo.countries.map(i => toMarker(i, false)),
      q: { index, total, score, target: this.questions[index].name, tries: 0, solved: null, pct: Math.round(index * 100 / total) }
    })
  },

  /* ---------- 缩放 ---------- */

  onRegionChange(e) {
    if (e.type !== 'end') return
    this.readView(view => {
      const d = this.data
      if (Math.abs(view.scale - d.scale) > 0.01 || Math.abs(view.longitude - d.longitude) > 0.0001 || Math.abs(view.latitude - d.latitude) > 0.0001) {
        this.setData({ scale: view.scale, longitude: view.longitude, latitude: view.latitude, zoom: Math.round(view.scale * 10) / 10 })
      }
    })
  },
  readView(cb) {
    const ctx = this.mapCtx
    if (!ctx) return
    ctx.getScale({
      success: s => ctx.getCenterLocation({
        success: c => cb({ scale: s.scale, longitude: c.longitude, latitude: c.latitude })
      })
    })
  },
  zoomTo(target) {
    target = clamp(target, MIN_ZOOM, MAX_ZOOM)
    this.readView(view => this.setData({ scale: target, zoom: target, longitude: view.longitude, latitude: view.latitude }))
  },
  zoomIn() { this.zoomTo(Math.floor(this.data.zoom + 0.001) + 1) },
  zoomOut() { this.zoomTo(Math.ceil(this.data.zoom - 0.001) - 1) },

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
    this.setData({
      'q.solved': target,
      'q.first': first,
      'q.score': q.score + (first ? 1 : 0),
      markers: geo.countries.map(i => toMarker(i, i.id === target.id))
    })
  },

  // 提示：把地图移到目标所在的大洲（用过提示就不算一次答对）
  hint() {
    const q = this.data.q
    const target = this.questions[q.index]
    const cont = geo.byName[target.continent]
    this.setData({ 'q.tries': q.tries + 1, longitude: cont.lng, latitude: cont.lat, scale: 4, zoom: 4 })
    wx.showToast({ title: `提示：它在${cont.name}`, icon: 'none' })
  },

  // 跳过：直接告诉答案，本题不得分
  skip() {
    const q = this.data.q
    const target = this.questions[q.index]
    this.answers[q.index] = false
    this.setData({
      'q.solved': target,
      'q.first': false,
      'q.skipped': true,
      longitude: target.lng, latitude: target.lat, scale: 4, zoom: 4,
      markers: geo.countries.map(i => toMarker(i, i.id === target.id))
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
