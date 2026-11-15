const store = require('../../utils/store.js')
const progress = require('../../utils/progress.js')
const engine = require('../../utils/engine.js')
const puzzle = require('../../utils/puzzle.js')

Page({
  data: { top: 44, name: '', lv: 1, cur: 0, need: 1000, pct: 0, points: 0, newBadge: false, resume: null, taskText: '', taskDot: false, pending: null, firstRun: false, streak: null },

  onLoad() {
    // 头像和等级放在左上角，和右上角的胶囊按钮对齐
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
    if (menu && menu.top) this.setData({ top: menu.top })
  },

  onShow() {
    const s = store.load()
    const lv = progress.level(s.profile.xp)
    const tasks = progress.tasks()
    const finished = tasks.filter(t => t.status === 'done' || t.status === 'claimed').length
    // 没打完的对局直接显示在首页，点一下就能接着玩
    const quiz = engine.current(), pz = puzzle.current()
    let pending = null
    if (quiz) pending = { kind: 'quiz', title: `继续：${engine.MODE_NAME[quiz.mode]}`, sub: `第 ${Math.min(quiz.index + 1, engine.TOTAL)} / ${engine.TOTAL} 题 · 还有 ${quiz.hearts} 颗爱心` }
    else if (pz) pending = { kind: 'puzzle', title: `继续：${require('../../data/countries.js').byId[pz.iso].name}拼图`, sub: pz.phase === 'ask' ? '已经拼成，还差一道地理追问' : `已拼 ${pz.locked.length} / ${pz.n} 片` }
    // 连续学习：有连续天数时才显示，新玩家和断了的不显示
    const k = progress.streak()
    this.setData({
      streak: k.n > 0 ? { n: k.n, text: k.doneToday ? `已连续学习 ${k.n} 天` : `已连续学习 ${k.n} 天 · 今天还没学` } : null,
      name: s.profile.name, lv: lv.lv, cur: lv.cur, need: lv.need, pct: lv.pct, points: s.profile.points,
      newBadge: progress.hasNewBadge(), resume: null,
      taskText: `${finished}/${tasks.length}`, taskDot: tasks.some(t => t.status === 'done'),
      pending,
      firstRun: !s.records.length && !s.puzzleLog.length && !quiz && !pz
    })
  },

  showLevel() {
    const d = this.data
    wx.showModal({
      title: `Lv.${d.lv} ${d.name}`,
      content: `答对一题得 10 经验，首次拼成一个国家得 10 经验。每 1000 经验升一级，现在是 ${d.cur} / ${d.need}。\n积分来自每日任务和每天第一次打完十题，现在有 ${d.points} 分，只用来记录学习进度。`,
      showCancel: false, confirmText: '知道了'
    })
  },

  // 开始专项：有没打完的十题局，先问要不要继续
  start(e) {
    const mode = e.currentTarget.dataset.mode
    const old = engine.current()
    if (old) {
      this.setData({ resume: { kind: 'quiz', mode, title: `上次的“${engine.MODE_NAME[old.mode]}”还没打完`, text: `已经做到第 ${Math.min(old.index + 1, engine.TOTAL)} 题，还剩 ${old.hearts} 颗爱心。继续上次的进度，还是放弃它重新开始？` } })
      return
    }
    wx.navigateTo({ url: '/pages/game/game?mode=' + mode })
  },
  // 地理挑战：有没拼完的拼图，也先问
  hub() {
    const old = puzzle.current()
    if (old) {
      const name = require('../../data/countries.js').byId[old.iso].name
      this.setData({ resume: { kind: 'puzzle', title: `${name}的拼图还没拼完`, text: old.phase === 'ask' ? '已经拼成了，还差一道地理追问。' : `已拼 ${old.locked.length} / ${old.n} 片。继续拼，还是放弃它去选别的？` } })
      return
    }
    wx.navigateTo({ url: '/pages/hub/hub' })
  },
  resumeYes() {
    const r = this.data.resume
    this.setData({ resume: null })
    wx.navigateTo({ url: r.kind === 'quiz' ? '/pages/game/game?resume=1' : '/pages/puzzle/puzzle?resume=1' })
  },
  resumeNo() {
    const r = this.data.resume
    this.setData({ resume: null })
    if (r.kind === 'quiz') { engine.drop(); wx.navigateTo({ url: '/pages/game/game?mode=' + r.mode }) }
    else { puzzle.drop(); wx.navigateTo({ url: '/pages/hub/hub' }) }
  },
  resumeClose() { this.setData({ resume: null }) },
  // 首页上的“继续”卡片
  goPending() {
    wx.navigateTo({ url: this.data.pending.kind === 'quiz' ? '/pages/game/game?resume=1' : '/pages/puzzle/puzzle?resume=1' })
  },

  go(e) { wx.navigateTo({ url: e.currentTarget.dataset.url }) },
  noop() {},

  onShareAppMessage() {
    return { title: 'GeoQuest：一起挑战世界地理', path: '/pages/home/home' }
  }
})
