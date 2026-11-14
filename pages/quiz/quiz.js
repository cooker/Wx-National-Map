const geo = require('../../data/geo.js')
const store = require('../../utils/store.js')
const { TOPICS } = require('../../utils/questions.js')

const CONTINENTS = ['亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲']

Page({
  data: { scopes: [], scope: '全部', count: 0, best: '', topics: TOPICS, topic: 'mix', askBest: '', reviewCount: 0, records: [] },

  onShow() {
    const scopes = [{ name: '全部', label: '全部国家', sub: geo.countries.length + ' 个国家', count: geo.countries.length }]
      .concat(CONTINENTS.map(name => {
        const n = geo.countries.filter(c => c.continent === name).length
        return { name, label: name, sub: n + ' 个国家', count: n }
      }))
      .concat([
        { name: '大洲大洋', label: '大洲大洋', sub: '七大洲、四大洋', count: geo.continents.length + geo.oceans.length },
        { name: '山河湖海', label: '山河湖海', sub: geo.features.length + ' 处', count: geo.features.length }
      ])
    this.setData({ scopes })
    this.pick(this.data.scope)
  },

  onScope(e) { this.pick(e.currentTarget.dataset.name) },

  // 某个范围的最好成绩
  bestOf(scope) {
    const mine = store.records().filter(r => r.scope === scope)
    if (!mine.length) return ''
    const best = mine.reduce((a, b) => (b.score / b.total > a.score / a.total ? b : a))
    return `${best.score} / ${best.total}`
  },

  pick(scope) {
    const total = this.data.scopes.filter(s => s.name === scope)[0].count
    this.setData({
      scope,
      count: Math.min(10, total),
      best: this.bestOf(scope),
      askBest: this.bestOf('知识问答 · ' + this.topicLabel(this.data.topic)),
      // 复习清单里能在地图上找的知识点数量
      reviewCount: store.review().filter(n => geo.byName[n] && ['continent', 'ocean', 'country', 'feature', 'region'].indexOf(geo.byName[n].type) >= 0).length,
      records: store.records().slice(0, 5)
    })
  },

  start() {
    wx.navigateTo({ url: '/pages/play/play?scope=' + encodeURIComponent(this.data.scope) })
  },
  topicLabel(id) { return TOPICS.filter(t => t.id === id)[0].label },
  onTopic(e) {
    const topic = e.currentTarget.dataset.id
    this.setData({ topic, askBest: this.bestOf('知识问答 · ' + this.topicLabel(topic)) })
  },
  startAsk() {
    wx.navigateTo({ url: '/pages/ask/ask?topic=' + this.data.topic })
  },
  startReview() {
    wx.navigateTo({ url: '/pages/play/play?scope=' + encodeURIComponent('错题') })
  },
  onShareAppMessage() {
    return { title: '世界地理地图：来做地理测验', path: '/pages/quiz/quiz' }
  }
})
