const store = require('../../utils/store.js')
const engine = require('../../utils/engine.js')
const view = require('../../utils/view.js')
const progress = require('../../utils/progress.js')

Page({
  data: { r: null, time: '', stars: [], preview: [], extra: '', todoCount: 0, todoFirst: -1, claimable: 0 },

  onLoad(options) {
    const r = engine.record(options.id)
    if (!r) { wx.redirectTo({ url: '/pages/home/home' }); return }
    this.record = r
    const all = view.rows(r)
    // 回顾只摘三行：尽量有对有错
    const wrong = all.filter(x => x.wrong), right = all.filter(x => x.state === 'correct')
    const preview = right.slice(0, 1).concat(wrong.slice(0, 1), right.slice(1, 2), wrong.slice(1, 3), all).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3).sort((a, b) => a.i - b.i)
    const parts = []
    if (r.skipped) parts.push(`跳过 ${r.skipped} 题`)
    if (r.unanswered) parts.push(`未作答 ${r.unanswered} 题（不算错题）`)
    this.setData({
      r, time: store.clock(r.ms), preview, extra: parts.join('，'),
      stars: [0, 1, 2].map(i => i < r.stars)
    })
  },

  // 每次回到结算页都重新算“下一步”：还有几道错题没订正、有没有任务可以领奖
  onShow() {
    if (!this.record) return
    const todo = view.rows(this.record).filter(x => x.wrong && !x.fixed)
    this.setData({
      todoCount: todo.length, todoFirst: todo.length ? todo[0].i : -1,
      claimable: progress.tasks().filter(t => t.status === 'done').length
    })
  },
  fix() { wx.navigateTo({ url: `/pages/explain/explain?id=${this.record.id}&i=${this.data.todoFirst}` }) },
  tasks() { wx.navigateTo({ url: '/pages/tasks/tasks' }) },

  all() { wx.navigateTo({ url: '/pages/review/review?id=' + this.record.id }) },
  one(e) { wx.navigateTo({ url: `/pages/explain/explain?id=${this.record.id}&i=${e.currentTarget.dataset.i}` }) },
  home() { wx.reLaunch({ url: '/pages/home/home' }) },
  share() { wx.navigateTo({ url: '/pages/share/share?kind=quiz&id=' + this.record.id }) },
  // 再来一局：普通局重新抽题；同题挑战保留原题，记为练习重玩
  again() {
    const r = this.record
    wx.redirectTo({ url: r.code ? '/pages/game/game?code=' + r.code : '/pages/game/game?mode=' + r.mode })
  }
})
