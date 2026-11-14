const geo = require('../../data/geo.js')
const { lessons } = require('../../data/lessons.js')
const climate = require('../../data/climate.js')
const store = require('../../utils/store.js')
const app = getApp()

const MIN_ZOOM = 3    // 小程序 map 组件允许的最小级别
const MAX_ZOOM = 12   // 学地理不需要街道级别
const HOME = { longitude: 105, latitude: 30 }

// 缩放层级：级别越大，显示的知识点越细
const TIERS = [
  { name: '大洲大洋', types: ['continent', 'ocean', 'grid', 'physical'], tip: '双指张开或拖动滑块放大，可看到国家和首都' },
  { name: '国家首都', types: ['country', 'ocean', 'region', 'physical'], tip: '继续放大，可看到山脉、河流和海峡' },
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
  { type: 'feature', label: '山河湖海' },
  { type: 'region', label: '区域' },
  { type: 'grid', label: '经纬线' },
  { type: 'physical', label: '高中自然' }
]

const TROPIC = 23.44   // 回归线纬度
const POLAR = 66.56    // 极圈纬度
const EDGE = 85        // 地图能显示到的最高纬度

// 一条纬线上的一串点（点取密一些，线才会沿着纬线走）
function latPoints(lat, from, to, step) {
  const points = []
  // 经度不取到正负 180，避免落在地图的接缝上
  for (let lng = from; step > 0 ? lng <= to : lng >= to; lng += step) points.push({ latitude: lat, longitude: Math.max(-179.9, Math.min(179.9, lng)) })
  return points
}

// 重要纬线：赤道、南北回归线、南北极圈
function latLine(lat, color, dotted) {
  return { points: latPoints(lat, -179, 179, 2), color, width: 2, dottedLine: dotted }
}
// 重要经线：本初子午线、180°经线，以及东西半球的分界线 20°W 和 160°E
function lngLine(lng, color, dotted) {
  const points = []
  for (let lat = -EDGE; lat <= EDGE; lat += 5) points.push({ latitude: lat, longitude: lng })
  return { points, color, width: 2, dottedLine: dotted }
}
const GRID_LINES = [
  lngLine(0, '#37474f', false),
  lngLine(179.9, '#37474f', true),
  lngLine(-20, '#6a1b9a', true),
  lngLine(160, '#6a1b9a', true),
  latLine(0, '#c62828', false),
  latLine(TROPIC, '#ef6c00', true),
  latLine(-TROPIC, '#ef6c00', true),
  latLine(POLAR, '#1565c0', true),
  latLine(-POLAR, '#1565c0', true)
]

// 五带：热带、南北温带、南北寒带，用半透明色块表示
// 一条带如果画成绕地球一整圈的多边形，地图会分不清哪边是里面，
// 所以拆成 6 段，每段只跨 60° 经度。
function band(south, north, fill) {
  const parts = []
  for (let west = -180; west < 180; west += 60) {
    const east = west + 60
    parts.push({
      points: latPoints(north, west, east, 10).concat(latPoints(south, east, west, -10)),
      fillColor: fill, strokeColor: fill, strokeWidth: 0, zIndex: 1
    })
  }
  return parts
}
const ZONE_BANDS = [].concat(
  band(POLAR, EDGE, '#1565c033'),
  band(TROPIC, POLAR, '#2e7d3226'),
  band(-TROPIC, TROPIC, '#ef6c0033'),
  band(-POLAR, -TROPIC, '#2e7d3226'),
  band(-EDGE, -POLAR, '#1565c033')
)

// 洋流流向：红色是暖流，蓝色是寒流，箭头表示流动方向（[纬度, 经度] 依次连成线）
const CURRENT_PATHS = [
  ['warm', [[20, 124], [25, 125.5], [30, 131], [34, 139], [36, 145]]],                 // 日本暖流
  ['warm', [[38, 150], [42, 170], [44, -170], [45, -150], [46, -135]]],                // 北太平洋暖流
  ['cold', [[46, -128], [40, -127], [33, -122], [25, -116], [21, -113]]],              // 加利福尼亚寒流
  ['cold', [[58, 163], [52, 159], [46, 153], [42, 147]]],                              // 千岛寒流
  ['warm', [[25, -80], [30, -79], [35, -74], [39, -65], [42, -55]]],                   // 墨西哥湾暖流
  ['warm', [[43, -48], [48, -35], [53, -22], [58, -10], [64, 2]]],                     // 北大西洋暖流
  ['cold', [[38, -13], [32, -13], [26, -17], [20, -19], [15, -20]]],                   // 加那利寒流
  ['cold', [[62, -60], [57, -57], [52, -52], [47, -50]]],                              // 拉布拉多寒流
  ['cold', [[-42, -76], [-32, -74], [-22, -73], [-12, -79], [-5, -83]]],               // 秘鲁寒流
  ['warm', [[-8, -34], [-15, -37.5], [-23, -40], [-30, -46], [-36, -52]]],             // 巴西暖流
  ['cold', [[-34, 16], [-28, 13.5], [-20, 10.5], [-12, 10]]],                          // 本格拉寒流
  ['warm', [[-15, 150], [-22, 154.5], [-30, 155], [-37, 152.5]]],                      // 东澳大利亚暖流
  ['cold', [[-36, 112], [-30, 111], [-24, 110], [-17, 112]]],                          // 西澳大利亚寒流
  ['cold', [[-52, 20], [-52, 50], [-52, 80], [-52, 110], [-52, 140]]],                 // 西风漂流（印度洋段）
  ['cold', [[-55, -160], [-55, -130], [-55, -100], [-56, -80]]],                       // 西风漂流（太平洋段）
  ['warm', [[10, 52], [16, 60], [14, 70], [8, 76], [5, 68], [6, 58]]]                  // 北印度洋季风洋流（夏季，顺时针）
]
const CURRENT_LINES = CURRENT_PATHS.map(c => ({
  points: c[1].map(p => ({ latitude: p[0], longitude: p[1] })),
  color: c[0] === 'warm' ? '#d32f2f' : '#1565c0', width: 4, arrowLine: true
}))

// 气压带：红色是低气压带，蓝色是高气压带
const BELT_BANDS = [].concat(
  band(-5, 5, '#e5393540'),
  band(25, 35, '#1e88e540'), band(-35, -25, '#1e88e540'),
  band(55, 65, '#e5393540'), band(-65, -55, '#e5393540'),
  band(78, EDGE, '#1e88e540'), band(-EDGE, -78, '#1e88e540')
)
// 风带：每隔 60° 经度画一组箭头，从风的来向指向去向
function wind(fromLat, toLat, shift) {
  const lines = []
  for (let lng = -150; lng <= 150; lng += 60) {
    lines.push({
      points: [{ latitude: fromLat, longitude: lng + (shift > 0 ? 0 : -shift) }, { latitude: toLat, longitude: lng + (shift > 0 ? shift : 0) }],
      color: '#37474f', width: 3, arrowLine: true
    })
  }
  return lines
}
const WIND_ARROWS = [].concat(
  wind(22, 8, -10),     // 东北信风：从东北吹向西南
  wind(-22, -8, -10),   // 东南信风：从东南吹向西北
  wind(37, 53, 12),     // 北半球盛行西风（西南风）
  wind(-37, -53, 12),   // 南半球盛行西风（西北风）
  wind(76, 67, -12),    // 北半球极地东风（东北风）
  wind(-76, -67, -12)   // 南半球极地东风（东南风）
)

// 等温线上的温度标注：用只有文字的标记来显示（id 从 10000 起，点了没有反应）
const ISO_MARKERS = climate.isoLabels.map((l, i) => ({
  id: 10000 + i, latitude: l[1], longitude: l[2], iconPath: '/images/blank.png', width: 1, height: 1,
  anchor: { x: 0.5, y: 0.5 },
  callout: { content: l[0], display: 'ALWAYS', fontSize: 11, color: '#ffffff', bgColor: l[3], borderRadius: 4, padding: 3, textAlign: 'center' }
}))

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)) }
function round1(v) { return Math.round(v * 10) / 10 }
function coordText(lat, lng) {
  return `${Math.abs(Math.round(lat))}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(Math.round(lng))}°${lng >= 0 ? 'E' : 'W'}`
}

function toMarker(item, selected, label) {
  return {
    id: item.id,
    latitude: item.lat,
    longitude: item.lng,
    iconPath: `/images/${item.type}.png`,
    width: selected ? 26 : 18,
    height: selected ? 26 : 18,
    anchor: { x: 0.5, y: 0.5 },
    callout: {
      content: label,
      display: 'ALWAYS',
      fontSize: selected ? 14 : 12,
      color: selected ? '#ffffff' : '#1f2933',
      bgColor: selected ? item.color : '#ffffff',
      borderColor: item.color,
      borderWidth: 1,
      borderRadius: 10,
      padding: selected ? 6 : 4,
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
    polyline: [],
    polygons: [],
    legends: {},
    satellite: false,
    // 界面状态
    zoom: MIN_ZOOM,
    centerText: coordText(HOME.latitude, HOME.longitude),
    tier: 0,
    tierName: TIERS[0].name,
    chips: [],
    showGrid: true,
    showZones: false,
    showCurrents: false,
    showBelts: false,
    showClimate: false,
    showIso: false,
    showLegend: false,
    climateLegend: climate.CLIMATES.map(c => ({ name: c.name, zone: c.zone, color: c.color })),
    hideNames: false,
    showLayers: false,
    showLessons: false,
    lessonList: lessons.map(l => ({ id: l.id, title: l.title, intro: l.intro, count: l.steps.length })),
    lesson: null,      // 正在上的专题课
    selected: null,
    isFav: false,
    keyword: '',
    results: []
  },

  onLoad() {
    // 恢复上次的显示设置。经纬线、洋流板块的标记默认不显示，在筛选里打开或上专题课时出现
    const p = store.prefs()
    this.filters = Object.assign(
      { continent: true, ocean: true, country: true, feature: true, region: true, grid: false, physical: false },
      p.filters || {}
    )
    this.lessonLayers = {}
    this.actual = { scale: MIN_ZOOM, longitude: HOME.longitude, latitude: HOME.latitude }
    this.setData({
      showGrid: p.showGrid !== false,
      showZones: !!p.showZones,
      showCurrents: !!p.showCurrents,
      showBelts: !!p.showBelts,
      showClimate: !!p.showClimate,
      showIso: !!p.showIso,
      hideNames: !!p.hideNames,
      satellite: !!p.satellite
    })
    this.updateOverlays()
    this.refresh()
  },

  onReady() {
    this.mapCtx = wx.createMapContext('worldMap', this)
  },

  onShareAppMessage() {
    return { title: '世界地理地图：在地图上学地理', path: '/pages/index/index' }
  },

  savePrefs() {
    const d = this.data
    store.savePrefs({
      filters: this.filters, showGrid: d.showGrid, showZones: d.showZones, showCurrents: d.showCurrents, showBelts: d.showBelts, showClimate: d.showClimate, showIso: d.showIso,
      hideNames: d.hideNames, satellite: d.satellite
    })
  },

  // 地图上叠加的线和色块：自己在图层里打开的，加上当前专题课临时需要的
  updateOverlays() {
    const d = this.data
    const need = this.lessonLayers || {}
    const grid = d.showGrid || !!need.grid
    const zones = d.showZones || !!need.zones
    const currents = d.showCurrents || !!need.currents
    const belts = d.showBelts || !!need.belts
    const clim = d.showClimate || !!need.climate
    const iso = d.showIso || !!need.iso
    this.isoOn = iso
    this.setData({
      polyline: [].concat(grid ? GRID_LINES : [], currents ? CURRENT_LINES : [], belts ? WIND_ARROWS : [], iso ? climate.isoLines : []),
      polygons: [].concat(zones ? ZONE_BANDS : [], belts ? BELT_BANDS : [], clim ? climate.climatePolygons : []),
      legends: { zones, currents, belts, climate: clim, iso }
    })
  },

  // 从其他页面跳回来时，开始指定的专题课，或定位到指定的知识点
  onShow() {
    const g = app.globalData
    if (g.lessonId !== null && g.lessonId !== undefined) {
      const id = g.lessonId
      g.lessonId = null
      this.startLesson(id)
    } else if (g.focusId !== null && g.focusId !== undefined) {
      const item = geo.all[g.focusId]
      g.focusId = null
      if (item) { this.exitLesson(); this.select(item, true) }
    } else if (this.data.selected) {
      this.setData({ isFav: store.isFav(this.data.selected.name) })
    }
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
  onSliderChange(e) { this.zoomTo(e.detail.value) },

  viewText(view) {
    return { zoom: round1(view.scale), centerText: coordText(view.latitude, view.longitude) }
  },

  // 用户用手势改变了视野：只更新显示；缩放层级变了才重画标记
  onViewChanged(view) {
    this.actual = view
    const t = this.viewText(view)
    if (t.zoom !== this.data.zoom || t.centerText !== this.data.centerText) this.setData(t)
    if (!this.data.lesson && tierOf(t.zoom) !== this.data.tier) this.refresh()
  },
  afterZoom() {
    if (!this.data.lesson && tierOf(this.data.zoom) !== this.data.tier) this.refresh()
  },

  resetView() {
    this.setData({ selected: null })
    this.moveTo(HOME.longitude, HOME.latitude, MIN_ZOOM)
    this.refresh()
  },

  flyTo(item, zoom) {
    this.moveTo(item.lng, item.lat, zoom)
  },

  /* ---------- 知识点标记 ---------- */

  // 重新生成地图上的标记
  refresh() {
    const lesson = this.data.lesson
    if (lesson) {
      // 专题课：只显示这节课的知识点，按讲解顺序编号
      const steps = lessons[lesson.id].steps
      this.setData({
        markers: steps.map((s, i) => toMarker(s.item, i === lesson.index, `${i + 1} ${s.item.name}`)).concat(this.isoOn ? ISO_MARKERS : [])
      })
      return
    }
    // 自由探索：由缩放层级和筛选开关决定显示哪些，课堂提问时不显示名字
    const tier = tierOf(this.data.zoom)
    const types = TIERS[tier].types
    const sel = this.data.selected
    const hide = this.data.hideNames
    const items = geo.all.filter(i => types.indexOf(i.type) >= 0 && this.filters[i.type])
    if (sel && !items.some(i => i.id === sel.id)) items.push(geo.all[sel.id])
    this.setData({
      tier,
      tierName: TIERS[tier].name,
      markers: items.map(i => {
        const isSel = !!sel && sel.id === i.id
        return toMarker(i, isSel, hide && !isSel ? '？' : i.name)
      }).concat(this.isoOn ? ISO_MARKERS : []),
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
    this.savePrefs()
    this.refresh()
  },

  select(item, fly) {
    store.markLearned(item.name)
    this.setData({ selected: item, isFav: store.isFav(item.name), showLayers: false, showLessons: false, keyword: '', results: [] })
    if (fly) this.flyTo(item, Math.max(item.zoom, item.type === 'country' ? 4 : MIN_ZOOM))
    this.refresh()
  },

  onMarkerTap(e) {
    const item = geo.all[e.detail.markerId]
    if (!item) return
    const lesson = this.data.lesson
    if (lesson) {
      const i = lessons[lesson.id].steps.findIndex(s => s.item.id === item.id)
      if (i >= 0) this.lessonGo(i)
      return
    }
    this.select(item, false)
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
    const item = this.data.lesson ? this.data.lesson.item : this.data.selected
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

  /* ---------- 专题课 ---------- */

  openLessons() {
    const done = store.lessonsDone()
    this.setData({
      showLessons: true, showLayers: false, selected: null,
      lessonList: lessons.map(l => ({ id: l.id, title: l.title, intro: l.intro, count: l.steps.length, done: !!done[l.title] }))
    })
    this.refresh()
  },
  closeLessons() { this.setData({ showLessons: false }) },
  onLessonTap(e) { this.startLesson(e.currentTarget.dataset.id) },

  startLesson(id) {
    if (!lessons[id]) return
    // 这节课需要的图层临时打开，退出课程后恢复
    this.lessonLayers = lessons[id].layers
    this.setData({ showLessons: false, showLayers: false, showLegend: false, selected: null, keyword: '', results: [] })
    this.updateOverlays()
    this.lessonGo(0, id)
  },

  // 讲到第 index 个知识点
  lessonGo(index, id) {
    const lessonId = id === undefined ? this.data.lesson.id : id
    const l = lessons[lessonId]
    const step = l.steps[index]
    store.markLearned(step.item.name)
    this.setData({
      lesson: {
        id: lessonId, title: l.title, intro: l.intro,
        index, total: l.steps.length, pct: Math.round((index + 1) * 100 / l.steps.length),
        item: step.item, note: step.note,
        isFirst: index === 0, isLast: index === l.steps.length - 1
      },
      isFav: store.isFav(step.item.name)
    })
    this.flyTo(step.item, step.item.zoom)
    this.refresh()
  },
  lessonPrev() { if (!this.data.lesson.isFirst) this.lessonGo(this.data.lesson.index - 1) },
  lessonNext() {
    if (this.data.lesson.isLast) {
      store.markLesson(this.data.lesson.title)
      wx.showToast({ title: `“${this.data.lesson.title}”学完了`, icon: 'none' })
      this.exitLesson()
    } else {
      this.lessonGo(this.data.lesson.index + 1)
    }
  },
  exitLesson() {
    if (!this.data.lesson) return
    this.lessonLayers = {}
    this.setData({ lesson: null })
    this.updateOverlays()
    this.refresh()
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

  openLayers() { this.setData({ showLayers: true, showLessons: false, selected: null }); this.refresh() },
  closeLayers() { this.setData({ showLayers: false }) },
  setBasemap(e) { this.setData({ satellite: e.currentTarget.dataset.sat === '1' }); this.savePrefs() },
  toggleGrid() {
    this.setData({ showGrid: !this.data.showGrid })
    this.savePrefs()
    this.updateOverlays()
  },
  toggleZones() {
    this.setData({ showZones: !this.data.showZones })
    this.savePrefs()
    this.updateOverlays()
  },
  toggleCurrents() {
    this.setData({ showCurrents: !this.data.showCurrents })
    this.savePrefs()
    this.updateOverlays()
  },
  toggleClimate() {
    this.setData({ showClimate: !this.data.showClimate })
    this.savePrefs()
    this.updateOverlays()
  },
  toggleIso() {
    this.setData({ showIso: !this.data.showIso })
    this.savePrefs()
    this.updateOverlays()
    this.refresh()
  },
  openLegend() { this.setData({ showLegend: true, showLayers: false, selected: null }); this.refresh() },
  closeLegend() { this.setData({ showLegend: false }) },
  toggleBelts() {
    this.setData({ showBelts: !this.data.showBelts })
    this.savePrefs()
    this.updateOverlays()
  },
  // 课堂提问：标记上不显示名字，点开才看到答案
  toggleHideNames() {
    this.setData({ hideNames: !this.data.hideNames })
    this.savePrefs()
    this.refresh()
  },
  noop() {}
})
