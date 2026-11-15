const progress = require('../../utils/progress.js')

const BTN = { todo: '前往', doing: '继续', done: '领取', claimed: '已领取' }

Page({
  data: { list: [], streak: { n: 0, text: '' } },

  onShow() { this.load() },
  load() {
    const k = progress.streak()
    // 一句话说清现在的状态；今天不学会断的时候直接说出来
    const text = k.doneToday ? (k.best > k.n ? `今天已经学过了。最长连续 ${k.best} 天。` : '今天已经学过了。')
      : k.atRisk ? '今天还没学。完成下面任意一项就能接上，不然明天从第 1 天算起。'
      : k.best > 1 ? `之前最长连续 ${k.best} 天。今天完成一项，重新从第 1 天开始。`
      : k.best > 0 ? '今天完成一项，重新从第 1 天开始。'
      : '打完一局十题、拼成一个国家或订正一道题，就算学了一天。'
    this.setData({
      streak: { n: k.n, text },
      list: progress.tasks().map(t => Object.assign(t, { btn: BTN[t.status] }))
    })
  },

  act(e) {
    const t = this.data.list[e.currentTarget.dataset.i]
    if (t.status === 'claimed') return
    if (t.status === 'done') {
      if (progress.claim(t.id)) wx.showToast({ title: `+${t.points} 积分`, icon: 'success' })
      this.load()
      return
    }
    wx.navigateTo({ url: t.go })
  },
  home() { wx.reLaunch({ url: '/pages/home/home' }) }
})
