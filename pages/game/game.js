const store = require('../../utils/store.js')
const engine = require('../../utils/engine.js')
const code = require('../../utils/code.js')
const geo = require('../../utils/geo.js')
const countries = require('../../data/countries.js')

const LETTERS = ['A', 'B', 'C', 'D']
const STATE_TEXT = { correct: '回答正确', wrong: '首答错误', timeout: '超时未答', skip: '已跳过' }
const WORLD_VIEW = { lng: -20, lat: 12, span: 210 }

Page({
  data: {
    qNo: 1, total: engine.TOTAL, timeText: '00:30', low: false, hearts: [],
    type: 'map', name: '', flag: '', options: [],
    hints: 1, skips: 0, hintText: '',
    feedback: null,          // 提交后的反馈；有值时计时已经停了
    view: WORLD_VIEW, marks: {}
  },

  onLoad(options) {
    let session = null
    if (options.resume) session = engine.current()
    else if (options.code) {
      // 同题挑战：题目、顺序、选项都由挑战码决定；用过的码再玩算“练习重玩”
      const c = code.parse(options.code)
      if (c.ok && c.kind !== 'puzzle') session = engine.create(c.mode, { seed: c.seed, code: c.code, replay: !!store.load().invites[c.code] })
    } else if (options.mode) {
      session = engine.create(options.mode, { topic: options.topic ? decodeURIComponent(options.topic) : '' })
    }
    if (!session) { wx.redirectTo({ url: '/pages/home/home' }); return }
    this.session = session
    wx.setNavigationBarTitle({ title: session.replay ? '练习重玩' : session.code ? '同题挑战' : engine.MODE_NAME[session.mode] })
    this.show()
  },

  onShow() {
    if (!this.session) return
    // 回到前台：已经准备好的题继续计时
    if (this.ready && !engine.answered(this.session)) engine.startClock(this.session, Date.now())
    this.timer = setInterval(() => this.tick(), 200)
    this.tick()
  },
  onHide() { this.stop() },
  onUnload() { this.stop() },
  stop() {
    clearInterval(this.timer)
    if (this.session && store.load().quiz) engine.pauseClock(this.session, Date.now())
  },

  /* ---------- 显示当前题 ---------- */
  show() {
    const s = this.session
    const q = engine.question(s)
    const c = countries.byId[q.cid]
    this.ready = false
    this.setData({
      qNo: s.index + 1,
      hearts: [0, 1, 2].map(i => i < s.hearts),
      type: q.type, name: c.name, flag: c.flag,
      options: q.type === 'flag' ? q.options.map((id, i) => ({ id, label: `${LETTERS[i]}. ${countries.byId[id].name}`, state: '' })) : [],
      hints: s.hints, skips: s.skips, hintText: s.hintShown ? (q.type === 'map' ? c.hint : c.flagHint) : '',
      feedback: null, marks: {}, view: WORLD_VIEW
    })
    // 存档里这题已经有结果（比如答完就退出了），直接显示反馈
    if (engine.answered(s)) this.reveal(s.results[s.index])
  },

  // 地图画好、国旗图加载完，这道题才算“可以操作”，从这时开始计时
  onReady_() {
    this.ready = true
    if (this.session && !engine.answered(this.session)) engine.startClock(this.session, Date.now())
  },

  tick() {
    const s = this.session
    if (!s || engine.answered(s)) return
    const left = engine.remaining(s, Date.now())
    const sec = Math.ceil(left / 1000)
    const text = '00:' + store.pad(Math.max(0, sec))
    if (text !== this.data.timeText) this.setData({ timeText: text, low: sec <= 5 })
    if (left <= 0) this.reveal(engine.timeout(s, Date.now()))
  },

  /* ---------- 作答 ---------- */
  // 地图：轻点国家即提交；点海面不算；点到没收录的陆地只提示
  onPick(e) {
    const s = this.session
    if (engine.answered(s) || !this.ready) return
    const id = e.detail.id
    if (!id) return
    if (id === 'other') { wx.showToast({ title: '这片地区还没有收录，不算作答', icon: 'none' }); return }
    this.reveal(engine.answer(s, id, Date.now()))
  },
  onOption(e) {
    const s = this.session
    if (engine.answered(s) || !this.ready) return
    this.reveal(engine.answer(s, e.currentTarget.dataset.id, Date.now()))
  },
  onHint() {
    const s = this.session
    if (engine.answered(s)) return
    const text = engine.hint(s)
    if (!text) { wx.showToast({ title: '本局的提示已经用完', icon: 'none' }); return }
    this.setData({ hintText: text, hints: s.hints })
  },
  onSkip() {
    const s = this.session
    const res = engine.skip(s, Date.now())
    if (!res) { wx.showToast({ title: '本局的跳过已经用完', icon: 'none' }); return }
    this.reveal(res)
  },

  // 显示本题的结果和一条学习线索
  reveal(res) {
    const s = this.session
    const q = engine.question(s)
    const c = countries.byId[q.cid]
    const right = res.state === 'correct'
    if (!this.data.feedback && wx.vibrateShort) wx.vibrateShort({ type: right ? 'light' : 'heavy' })   // 对错有不同的震动
    const chosenName = res.chosen ? geo.nameOf(res.chosen) : ''
    const last = engine.finished(s)
    const data = {
      hearts: [0, 1, 2].map(i => i < s.hearts), hints: s.hints, skips: s.skips,
      timeText: '00:' + store.pad(Math.ceil((engine.LIMIT_MS - res.ms) / 1000)), low: false,
      feedback: {
        right, state: res.state, title: STATE_TEXT[res.state], chosenName, correctName: c.name,
        clue: q.type === 'map' ? c.explain : c.flagExplain,
        nextText: last ? (s.hearts <= 0 ? '查看本次结果' : '查看成绩') : '下一题'
      }
    }
    if (q.type === 'flag') {
      data.options = this.data.options.map(o => ({ id: o.id, label: o.label, state: o.id === q.cid ? 'good' : (o.id === res.chosen ? 'bad' : '') }))
    } else {
      data.marks = { correct: q.cid, chosen: res.chosen }
      data.view = this.focus(q.cid, res.chosen)
    }
    this.setData(data)
  },
  // 答完后把视野移到正确国家（和选错的国家）附近
  focus(a, b) {
    const boxes = [a, b].filter(id => id && geo.world.info[id]).map(id => geo.world.info[id].box)
    const x0 = Math.min.apply(null, boxes.map(v => v[0])), x1 = Math.max.apply(null, boxes.map(v => v[2]))
    const y0 = Math.min.apply(null, boxes.map(v => v[1])), y1 = Math.max.apply(null, boxes.map(v => v[3]))
    return { lng: (x0 + x1) / 2, lat: (y0 + y1) / 2, span: Math.min(360, Math.max(50, (x1 - x0) * 1.8, (y1 - y0) * 1.6)) }
  },

  onNext() {
    const s = this.session
    if (!engine.answered(s)) return
    if (engine.finished(s)) {
      const record = engine.finalize(s)
      this.session = null
      wx.redirectTo({ url: '/pages/result/result?id=' + record.id })
      return
    }
    engine.next(s)
    this.show()
  },

  zoomIn() { this.selectComponent('#map').zoomIn() },
  zoomOut() { this.selectComponent('#map').zoomOut() },
  recenter() { this.selectComponent('#map').reset() }
})
