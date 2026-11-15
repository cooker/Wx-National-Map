const store = require('../../utils/store.js')
const puzzle = require('../../utils/puzzle.js')
const puzzles = require('../../data/puzzles.js')
const countries = require('../../data/countries.js')

Page({
  data: { list: [], iso: 'BRA', name: '巴西', diffs: puzzles.DIFFS, n: 4, tip: puzzles.DIFFS[0].tip },

  // 从国家详情进来时，直接选中那个国家
  onLoad(options) {
    if (options.iso && puzzles.levels[options.iso]) this.setData({ iso: options.iso, name: countries.byId[options.iso].name })
  },

  onShow() {
    const done = store.load().puzzles
    this.setData({
      list: puzzles.ORDER.map(iso => ({
        iso, name: countries.byId[iso].name, continent: countries.byId[iso].continent,
        img: `/images/puzzle/${iso}_base6.png`,
        cleared: puzzles.DIFFS.filter(d => done[iso + '_' + d.n]).length
      }))
    })
  },

  pick(e) {
    const iso = e.currentTarget.dataset.iso
    this.setData({ iso, name: countries.byId[iso].name })
  },
  diff(e) {
    const n = Number(e.currentTarget.dataset.n)
    this.setData({ n, tip: puzzles.DIFFS.filter(d => d.n === n)[0].tip })
  },

  start() {
    const go = () => {
      puzzle.create(this.data.iso, this.data.n)
      wx.navigateTo({ url: '/pages/puzzle/puzzle?resume=1' })
    }
    const old = puzzle.current()
    if (!old) { go(); return }
    wx.showModal({
      title: `${countries.byId[old.iso].name}的拼图还没拼完`,
      content: '继续拼上一关，还是放弃它开始新的一关？',
      confirmText: '继续上一关', cancelText: '放弃并新开',
      success: res => {
        if (res.confirm) wx.navigateTo({ url: '/pages/puzzle/puzzle?resume=1' })
        else if (res.cancel) go()
      }
    })
  }
})
