const geo = require('../../data/geo.js')
const store = require('../../utils/store.js')
const app = getApp()

const MIN_ZOOM = 3    // 小程序 map 组件允许的最小级别
const MAX_ZOOM = 12   // 学地理不需要街道级别
const HOME = { longitude: 105, latitude: 30 }

// 缩放层级：级别越大，显示的知识点越细
const TIERS = [
  { name: '大洲大洋', types: ['continent', 'ocean'], tip: '双指张开或拖动滑块放大，可看到国家和首都' },
  { name: '国家首都', types: ['country', 'ocean'], tip: '继续放大，可看到山脉、河流和海峡' },
  { name: '山河湖海', types: ['country', 'feature'], tip: '点任意标记查看知识卡片' }
]
function tierOf(zoom) {
  if (zoom < 4) return 0
  if (zoom < 5.5) return 1
  return 2
}

const FILTERS = [
  { type: 'continent', label: '大洲' },
  { type: 'ocean', label: '大洋' },
  { type: 'country', label: '国家' },
  { type: 'feature', label: '山河湖海' }
]

// 重要纬线：赤道、南北回归线、南北极圈
function latLine(lat, color, dotted) {
  const points = []
  for (let lng = -179; lng <= 179; lng += 2) points.push({ latitude: lat, longitude: lng })
  return { points, color, width: 2, dottedLine: dotted }
}
const GRID_LINES = [
  latLine(0, '#c62828', false),
  latLine(23.44, '#ef6c00', true),
  latLine(-23.44, '#ef6c00', true),
  latLine(66.56, '#1565c0', true),
  latLine(-66.56, '#1565c0', true)
]

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)) }
function round1(v) { return Math.round(v * 10) / 10 }
function coordText(lat, lng) {
  return `${Math.abs(Math.round(lat))}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(Math.round(lng))}°${lng >= 0 ? 'E' : 'W'}`
}

function toMarker(item, selected) {
  return {
    id: item.id,
    latitude: item.lat,
    longitude: item.lng,
    iconPath: `/images/${item.type}.png`,
    width: selected ? 24 : 18,
    height: selected ? 24 : 18,
    anchor: { x: 0.5, y: 0.5 },
    callout: {
      content: item.name,
      display: 'ALWAYS',
      fontSize: 12,
      color: selected ? '#ffffff' : '#1f2933',
      bgColor: selected ? item.color : '#ffffff',
      borderColor: item.color,
      borderWidth: 1,
      borderRadius: 10,
      padding: 4,
      textAlign: 'center'
    }
  }
}

Page({
  data: {
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    // 绑定到 map 组件
    longitude: HOME.longitude,
    latitude: HOME.latitude,
    scale: MIN_ZOOM,
    markers: [],
    polyline: GRID_LINES,
    satellite: false,
    // 界面状态
    zoom: MIN_ZOOM,
    centerText: coordText(HOME.latitude, HOME.longitude),
    tier: 0,
    tierTip: TIERS[0].tip,
    steps: TIERS.map(t => t.name),
    chips: [],
    showGrid: true,
    showLayers: false,
    selected: null,
    isFav: false,
    keyword: '',
    results: []
  },

  onLoad() {
    this.filters = { continent: true, ocean: true, country: true, feature: true }
    this.refresh()
  },

  onReady() {
    this.mapCtx = wx.createMapContext('worldMap', this)
  },

  // 从知识库、测验、我的页面跳回来时，定位到指定的知识点
  onShow() {
    const id = app.globalData.focusId
    if (id !== null && id !== undefined) {
      app.globalData.focusId = null
      const item = geo.all[id]
      if (item) this.select(item, true)
    } else if (this.data.selected) {
      this.setData({ isFav: store.isFav(this.data.selected.name) })
    }
  },

  /* ---------- 缩放 ---------- */

  // 双指缩放或拖动结束后，把地图的真实状态同步回 data
  onRegionChange(e) {
    if (e.type !== 'end') return
    this.readView(view => {
      const d = this.data
      const moved =
        Math.abs(view.scale - d.scale) > 0.01 ||
        Math.abs(view.longitude - d.longitude) > 0.0001 ||
        Math.abs(view.latitude - d.latitude) > 0.0001
      if (!moved) return
      this.setData({
        scale: view.scale,
        longitude: view.longitude,
        latitude: view.latitude,
        zoom: round1(view.scale),
        centerText: coordText(view.latitude, view.longitude)
      })
      this.refresh()
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

  // 以当前中心为基准缩放到指定级别
  zoomTo(target) {
    target = clamp(target, MIN_ZOOM, MAX_ZOOM)
    this.readView(view => {
      this.setData({ scale: target, zoom: round1(target), longitude: view.longitude, latitude: view.latitude })
      this.refresh()
    })
  },
  zoomIn() { this.zoomTo(Math.floor(this.data.zoom + 0.001) + 1) },
  zoomOut() { this.zoomTo(Math.ceil(this.data.zoom - 0.001) - 1) },
  onSliderChange(e) { this.zoomTo(e.detail.value) },

  resetView() {
    this.setData({
      longitude: HOME.longitude, latitude: HOME.latitude, scale: MIN_ZOOM, zoom: MIN_ZOOM,
      centerText: coordText(HOME.latitude, HOME.longitude), selected: null
    })
    this.refresh()
  },

  flyTo(item, zoom) {
    this.setData({
      longitude: item.lng, latitude: item.lat, scale: zoom, zoom: round1(zoom),
      centerText: coordText(item.lat, item.lng)
    })
  },

  /* ---------- 知识点标记 ---------- */

  // 根据缩放层级、筛选开关和当前选中项，重新生成标记
  refresh() {
    const tier = tierOf(this.data.zoom)
    const types = TIERS[tier].types
    const sel = this.data.selected
    const items = geo.all.filter(i => types.indexOf(i.type) >= 0 && this.filters[i.type])
    if (sel && !items.some(i => i.id === sel.id)) items.push(geo.all[sel.id])
    this.setData({
      tier,
      tierTip: TIERS[tier].tip,
      markers: items.map(i => toMarker(i, !!sel && sel.id === i.id)),
      chips: FILTERS.map(f => ({
        type: f.type,
        label: f.label,
        color: geo.TYPE_COLOR[f.type],
        on: this.filters[f.type],
        active: this.filters[f.type] && types.indexOf(f.type) >= 0
      }))
    })
  },

  toggleFilter(e) {
    const type = e.currentTarget.dataset.type
    this.filters[type] = !this.filters[type]
    this.refresh()
  },

  select(item, fly) {
    store.markLearned(item.name)
    this.setData({ selected: item, isFav: store.isFav(item.name), showLayers: false, keyword: '', results: [] })
    if (fly) this.flyTo(item, Math.max(item.zoom, item.type === 'country' ? 4 : MIN_ZOOM))
    this.refresh()
  },

  onMarkerTap(e) {
    const item = geo.all[e.detail.markerId]
    if (item) this.select(item, false)
  },

  closeCard() {
    this.setData({ selected: null })
    this.refresh()
  },

  onLocate() {
    const item = this.data.selected
    if (!item) return
    this.flyTo(item, Math.max(item.zoom, this.data.zoom))
    this.refresh()
  },

  toggleFav() {
    const item = this.data.selected
    if (!item) return
    const on = store.toggleFav(item.name)
    this.setData({ isFav: on })
    wx.showToast({ title: on ? '已加入学习清单' : '已移出学习清单', icon: 'none' })
  },

  // 用当前国家所在的大洲出一组题
  quizMe() {
    const item = this.data.selected
    const scope = item && item.continent ? item.continent : '全部'
    wx.navigateTo({ url: '/pages/play/play?scope=' + encodeURIComponent(scope) })
  },

  /* ---------- 搜索 ---------- */

  onSearchInput(e) {
    const keyword = e.detail.value.trim()
    const results = keyword
      ? geo.all.filter(i => i.name.indexOf(keyword) >= 0 || (i.capital && i.capital.indexOf(keyword) >= 0)).slice(0, 6)
      : []
    this.setData({ keyword, results })
  },
  clearSearch() { this.setData({ keyword: '', results: [] }) },
  onResultTap(e) {
    const item = geo.all[e.currentTarget.dataset.id]
    if (item) this.select(item, true)
  },

  /* ---------- 图层 ---------- */

  openLayers() { this.setData({ showLayers: true, selected: null }); this.refresh() },
  closeLayers() { this.setData({ showLayers: false }) },
  setBasemap(e) { this.setData({ satellite: e.currentTarget.dataset.sat === '1' }) },
  toggleGrid() {
    const showGrid = !this.data.showGrid
    this.setData({ showGrid, polyline: showGrid ? GRID_LINES : [] })
  },
  noop() {}
})
