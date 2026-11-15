const store = require('../../utils/store.js')
const countries = require('../../data/countries.js')

Page({
  data: { keyword: '', continent: '全部', chips: ['全部'].concat(countries.CONTINENTS), groups: [], learned: 0, total: countries.list.length },

  onShow() { this.build() },

  build() {
    const { keyword, continent } = this.data
    const learned = store.load().learned
    const kw = keyword.toLowerCase()
    const list = countries.list
      .filter(c => continent === '全部' || c.continent === continent)
      .filter(c => !kw || c.name.indexOf(keyword) >= 0 || c.en.toLowerCase().indexOf(kw) >= 0)
      .map(c => ({ id: c.id, name: c.name, flag: c.flag, continent: c.continent, learned: !!learned[c.id] }))
    const groups = countries.CONTINENTS.map(name => ({ name, items: list.filter(c => c.continent === name) })).filter(g => g.items.length)
    this.setData({ groups, learned: Object.keys(learned).length })
  },

  onInput(e) { this.setData({ keyword: e.detail.value.trim() }); this.build() },
  chip(e) { this.setData({ continent: e.currentTarget.dataset.name }); this.build() },
  clear() { this.setData({ keyword: '', continent: '全部' }); this.build() },
  open(e) { wx.navigateTo({ url: '/pages/country/country?id=' + e.currentTarget.dataset.id }) },
  home() { wx.reLaunch({ url: '/pages/home/home' }) }
})
