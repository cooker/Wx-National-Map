const geo = require('../../data/geo.js')
const store = require('../../utils/store.js')
const app = getApp()

Page({
  data: { progress: [], favs: [], review: [] },

  onShow() { this.build() },

  build() {
    const learned = store.learned()
    const bar = (label, list, color) => {
      const done = list.filter(i => learned[i.name]).length
      return { label, color, text: `${done} / ${list.length}`, pct: Math.round(done * 100 / list.length) }
    }
    const rows = names => names.map(n => geo.byName[n]).filter(Boolean).map(i => ({
      id: i.id, name: i.name, color: i.color, sub: i.capital ? '首都 ' + i.capital : i.typeLabel
    }))
    this.setData({
      progress: [
        bar('大洲和大洋', geo.continents.concat(geo.oceans), geo.TYPE_COLOR.continent),
        bar('国家', geo.countries, geo.TYPE_COLOR.country),
        bar('山河湖海', geo.features, geo.TYPE_COLOR.feature)
      ],
      favs: rows(store.favs()),
      review: rows(store.review())
    })
  },

  onRowTap(e) {
    app.globalData.focusId = e.currentTarget.dataset.id
    wx.switchTab({ url: '/pages/index/index' })
  },

  onReviewed(e) {
    store.removeReview(e.currentTarget.dataset.name)
    this.build()
  },

  clearAll() {
    wx.showModal({
      title: '清空学习记录',
      content: '已学标记、学习清单、复习清单和测验成绩都会被删除，不能恢复。',
      confirmText: '清空',
      confirmColor: '#b3261e',
      success: res => {
        if (!res.confirm) return
        store.clearAll()
        this.build()
      }
    })
  }
})
