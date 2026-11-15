const store = require('../../utils/store.js')
const code = require('../../utils/code.js')
const engine = require('../../utils/engine.js')
const puzzle = require('../../utils/puzzle.js')
const countries = require('../../data/countries.js')

const REASON = {
  invalid: { title: '没有找到这个挑战码', text: '请核对同学发来的 6 位挑战码，注意区分字母和数字。' },
  expired: { title: '这个邀请已经过期', text: '挑战码的有效期是 7 天。可以请同学重新发一个，或者先去做普通练习。' },
  version: { title: '题目内容已经更新', text: '这个挑战码对应的是旧版内容，现在没法再出同一套题。可以请同学重新发一个。' }
}

Page({
  data: { ok: false, bad: null, kind: 'quiz', code: '', title: '', stats: [], text: '', daysLeft: 0, played: false, join: false },

  onLoad(options) {
    const c = code.parse(options.code)
    this.c = c
    if (!c.ok) { this.setData({ bad: REASON[c.reason], code: c.code }); return }
    const s = store.load()
    const base = { ok: true, code: c.code, daysLeft: c.daysLeft, played: !!s.invites[c.code], join: !!s.join[c.code] }
    if (c.kind === 'puzzle') {
      this.setData(Object.assign(base, {
        kind: 'puzzle', title: `国家拼图 · ${countries.byId[c.iso].name}`,
        stats: [{ b: countries.byId[c.iso].name, s: '同一个国家' }, { b: puzzle.diffName(c.n), s: '同一个难度' }, { b: `0/${c.n}`, s: '从空棋盘开始' }],
        text: '碎片的切法、托盘里的顺序和地理追问都和发起人相同。你从空棋盘开始，不继承对方的进度。'
      }))
    } else {
      this.setData(Object.assign(base, {
        kind: 'quiz', title: engine.MODE_NAME[c.mode],
        stats: [{ b: '10 题', s: '相同题单' }, { b: '30 秒', s: '每题限时' }, { b: '3 颗', s: '起始爱心' }],
        text: '题目、顺序、选项和道具规则都和发起人相同。你从第 1 题独立开始，成绩只记在自己的手机上。'
      }))
    }
  },

  toggle(e) {
    const v = e.detail.value
    this.setData({ join: v })
    store.update(s => { s.join[this.c.code] = v })
  },

  start() {
    const c = this.c
    if (c.kind === 'puzzle') { wx.redirectTo({ url: '/pages/puzzle/puzzle?code=' + c.code }); return }
    const go = () => wx.redirectTo({ url: '/pages/game/game?code=' + c.code })
    if (!engine.current()) { go(); return }
    wx.showModal({
      title: '还有一局十题挑战没打完', content: '开始同题挑战会放弃上一局的进度。', confirmText: '开始同题挑战', cancelText: '先不开始',
      success: res => { if (res.confirm) { engine.drop(); go() } }
    })
  },
  practice() { wx.redirectTo({ url: '/pages/hub/hub' }) },
  home() { wx.reLaunch({ url: '/pages/home/home' }) }
})
