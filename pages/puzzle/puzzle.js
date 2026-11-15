const puzzle = require('../../utils/puzzle.js')
const code = require('../../utils/code.js')
const store = require('../../utils/store.js')
const puzzles = require('../../data/puzzles.js')
const countries = require('../../data/countries.js')

const NAMES = 'ABCDEFGHI'

Page({
  data: {
    name: '', continent: '', diff: '', iso: '', n: 4, lockedCount: 0, pct: 0,
    base: '', placed: [], tray: [], slots: [],
    tapMode: false, picked: -1, hintLeft: 1, hintText: '',
    float: null,          // 正在拖动的碎片
    phase: 'place', ask: null, retry: ''
  },

  onLoad(options) {
    let s = null
    if (options.code) {
      // 同拼邀请：国家、难度、托盘顺序、追问选项顺序都由挑战码决定，从空棋盘开始
      const c = code.parse(options.code)
      if (c.ok && c.kind === 'puzzle') s = puzzle.create(c.iso, c.n, { seed: c.seed, code: c.code, replay: !!store.load().invites[c.code] })
    } else {
      s = puzzle.current()
    }
    if (!s) { wx.redirectTo({ url: '/pages/puzzle-select/puzzle-select' }); return }
    this.session = s
    this.render()
  },

  img(k) { return `/images/puzzle/${this.session.iso}_${this.session.n}_${k}.png` },
  boxStyle(b) { return `left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%` },

  render() {
    const s = this.session
    const c = countries.byId[s.iso]
    const level = puzzles.levels[s.iso]
    const left = s.tray.filter(k => s.locked.indexOf(k) < 0)
    this.setData({
      name: c.name, continent: c.continent, diff: puzzle.diffName(s.n), iso: s.iso, n: s.n,
      lockedCount: s.locked.length, pct: Math.round(s.locked.length * 100 / s.n),
      base: `/images/puzzle/${s.iso}_base${s.n}.png`,
      placed: s.locked.map(k => ({ k, src: this.img(k), style: this.boxStyle(puzzle.piece(s, k).box) })),
      // 托盘里的碎片按开局时洗好的顺序排，字母只是托盘里的代号，和位置无关
      tray: left.map(k => {
        const b = puzzle.piece(s, k).box
        return { k, src: this.img(k), label: '碎片 ' + NAMES[s.tray.indexOf(k)], ratio: b[2] / b[3] }
      }),
      // 点选放置时显示的空位：只标方位，不透露该放哪一片
      slots: level.pieces[s.n].filter(p => s.locked.indexOf(p.k) < 0).map(p => ({ k: p.k, pos: p.pos, style: this.boxStyle(p.box) })),
      hintLeft: s.hintUsed ? 0 : 1,
      phase: s.phase,
      ask: s.phase === 'ask' ? { q: level.ask.q, options: s.options.map(text => ({ text, state: '' })) } : null
    })
  },

  /* ---------- 拖动放置 ---------- */
  dragStart(e) {
    if (this.data.tapMode || this.session.phase !== 'place') return
    const k = e.currentTarget.dataset.k
    const t = e.touches[0]
    wx.createSelectorQuery().select('#board').boundingClientRect(rect => {
      if (!rect) return
      this.rect = rect
      const b = puzzle.piece(this.session, k).box
      const w = rect.width * b[2] / 100, h = rect.height * b[3] / 100
      this.drag = { k, w, h }
      this.setData({ float: { k, src: this.img(k), style: `left:${t.clientX - w / 2}px;top:${t.clientY - h / 2}px;width:${w}px;height:${h}px` } })
    }).exec()
  },
  dragMove(e) {
    if (!this.drag) return
    const t = e.touches[0], d = this.drag
    d.x = t.clientX
    d.y = t.clientY
    this.setData({ 'float.style': `left:${t.clientX - d.w / 2}px;top:${t.clientY - d.h / 2}px;width:${d.w}px;height:${d.h}px` })
  },
  // 松手才判定：碎片中心离目标位置不超过棋盘边长的 4% 就吸附；否则回托盘，不扣分
  dragEnd() {
    const d = this.drag
    this.drag = null
    this.setData({ float: null })
    if (!d || d.x === undefined) return
    const r = this.rect
    const cx = (d.x - r.left) / r.width * 100, cy = (d.y - r.top) / r.height * 100
    if (puzzle.drop_at(this.session, d.k, cx, cy)) { if (wx.vibrateShort) wx.vibrateShort({ type: 'light' }); this.render() }
    else wx.showToast({ title: '看看外边缘，再试一次', icon: 'none' })
  },

  /* ---------- 点选放置：先选碎片，再选位置 ---------- */
  toggleMode() { this.setData({ tapMode: !this.data.tapMode, picked: -1 }) },
  pickPiece(e) {
    if (!this.data.tapMode) return
    const k = e.currentTarget.dataset.k
    this.setData({ picked: this.data.picked === k ? -1 : k })
  },
  pickSlot(e) {
    if (this.data.picked < 0) { wx.showToast({ title: '先在托盘里选一片碎片', icon: 'none' }); return }
    const ok = puzzle.place(this.session, this.data.picked, e.currentTarget.dataset.k)
    this.setData({ picked: -1 })
    if (ok) this.render()
    else wx.showToast({ title: '看看外边缘，再试一次', icon: 'none' })
  },

  onHint() {
    const used = this.session.hintUsed
    this.setData({ hintText: puzzle.hint(this.session), hintLeft: 0 })
    if (used) wx.showToast({ title: '这一关的提示已经用过，再给你看一遍', icon: 'none' })
  },

  /* ---------- 拼成后的地理追问 ---------- */
  answer(e) {
    const text = e.currentTarget.dataset.text
    const res = puzzle.answer(this.session, text)
    if (!res) return
    if (res.right) { wx.redirectTo({ url: '/pages/receipt/receipt?id=' + res.receipt.id }); return }
    this.setData({
      retry: res.retry,
      'ask.options': this.data.ask.options.map(o => ({ text: o.text, state: o.text === text || o.state === 'bad' ? 'bad' : '' }))
    })
  },

  noop() {}
})
