const geo = require('../../data/geo.js')
const store = require('../../utils/store.js')

const SCOPES = ['全部', '亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲']

Page({
  data: { scopes: [], scope: '全部', count: 0, best: null, records: [] },

  onShow() {
    const scopes = SCOPES.map(name => ({
      name,
      count: name === '全部' ? geo.countries.length : geo.countries.filter(c => c.continent === name).length
    }))
    this.setData({ scopes })
    this.pick(this.data.scope)
  },

  onScope(e) { this.pick(e.currentTarget.dataset.name) },

  pick(scope) {
    const all = store.records()
    const mine = all.filter(r => r.scope === scope)
    const best = mine.length ? mine.reduce((a, b) => (b.score / b.total > a.score / a.total ? b : a)) : null
    const total = this.data.scopes.filter(s => s.name === scope)[0].count
    this.setData({
      scope,
      count: Math.min(10, total),
      best: best ? `${best.score} / ${best.total}` : '',
      records: all.slice(0, 5)
    })
  },

  start() {
    wx.navigateTo({ url: '/pages/play/play?scope=' + encodeURIComponent(this.data.scope) })
  }
})
