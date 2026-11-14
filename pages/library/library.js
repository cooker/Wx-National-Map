const geo = require('../../data/geo.js')
const { lessons } = require('../../data/lessons.js')
const store = require('../../utils/store.js')
const app = getApp()

const TABS = ['国家', '大洲大洋', '地理事物', '专题课']
const CONTINENTS = ['全部', '亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲']

Page({
  data: { tabs: TABS, tab: 0, continents: CONTINENTS, continent: '全部', keyword: '', groups: [], lessonList: lessons.map(l => ({ id: l.id, title: l.title, intro: l.intro, count: l.steps.length })) },

  onShow() { this.build() },

  onTab(e) { this.setData({ tab: e.currentTarget.dataset.i }); this.build() },
  onContinent(e) { this.setData({ continent: e.currentTarget.dataset.name }); this.build() },
  onSearchInput(e) { this.setData({ keyword: e.detail.value.trim() }); this.build() },

  build() {
    const { tab, continent, keyword } = this.data
    const learned = store.learned()
    const match = i => !keyword || i.name.indexOf(keyword) >= 0 || (i.capital && i.capital.indexOf(keyword) >= 0)
    const group = (title, unit, list) => {
      const items = list.filter(match).map(i => ({
        id: i.id, name: i.name, color: i.color,
        sub: i.capital ? '首都 ' + i.capital : i.desc,
        learned: !!learned[i.name]
      }))
      const done = items.filter(i => i.learned).length
      return { title, sub: `${items.length} ${unit} · 已学 ${done} 个`, pct: items.length ? Math.round(done * 100 / items.length) : 0, items }
    }

    let groups
    if (tab === 0) {
      groups = CONTINENTS.slice(1)
        .filter(c => continent === '全部' || continent === c)
        .map(c => group(c, '个国家', geo.countries.filter(i => i.continent === c)))
    } else if (tab === 1) {
      groups = [group('七大洲', '个大洲', geo.continents), group('四大洋', '个大洋', geo.oceans)]
    } else if (tab === 2) {
      groups = [group('山河湖海', '处', geo.features), group('区域', '个', geo.regions), group('经纬线与五带', '项', geo.grids), group('洋流、板块、气压带（高中）', '项', geo.physical)]
    } else {
      groups = []
    }
    this.setData({ groups: groups.filter(g => g.items.length) })
  },

  // 点专题课：回到地图开始讲解
  onLessonTap(e) {
    app.globalData.lessonId = e.currentTarget.dataset.id
    wx.switchTab({ url: '/pages/index/index' })
  },

  // 点一行：回到地图并定位
  onRowTap(e) {
    app.globalData.focusId = e.currentTarget.dataset.id
    wx.switchTab({ url: '/pages/index/index' })
  }
})
