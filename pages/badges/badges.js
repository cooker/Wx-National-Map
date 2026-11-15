const progress = require('../../utils/progress.js')

Page({
  data: { list: [], got: 0, next: null },

  onShow() {
    const list = progress.badges()
    // 下一枚：还没拿到的里面，进度最高的那个
    const next = list.filter(b => !b.got).sort((a, b) => b.pct - a.pct)[0] || null
    this.setData({ list, got: list.filter(b => b.got).length, next })
    progress.markBadgesSeen()   // 看过之后，首页的红点消失
  },

  go() { if (this.data.next && this.data.next.go) wx.navigateTo({ url: this.data.next.go }) },
  detail(e) {
    const b = this.data.list[e.currentTarget.dataset.i]
    wx.showModal({ title: b.name, content: `${b.text}\n${b.got ? '已获得' : '当前进度 ' + b.n + ' / ' + b.need}`, showCancel: false, confirmText: '知道了' })
  },
  tasks() { wx.redirectTo({ url: '/pages/tasks/tasks' }) }
})
