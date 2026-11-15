const store = require('../../utils/store.js')
const geo = require('../../utils/geo.js')
const countries = require('../../data/countries.js')
const puzzles = require('../../data/puzzles.js')

Page({
  data: { c: null, learned: false, mapView: null, marks: {}, hasPuzzle: false },

  onLoad(options) {
    const c = countries.byId[options.id]
    if (!c) { wx.navigateBack(); return }
    const info = geo.world.info[c.id]
    this.setData({
      c, learned: !!store.load().learned[c.id],
      marks: { correct: c.id },
      mapView: info ? { lng: (info.box[0] + info.box[2]) / 2, lat: (info.box[1] + info.box[3]) / 2, span: Math.min(360, Math.max(80, (info.box[2] - info.box[0]) * 2.4)) } : null,
      hasPuzzle: !!puzzles.levels[c.id]
    })
    wx.setNavigationBarTitle({ title: c.name })
  },

  puzzle() { wx.navigateTo({ url: '/pages/puzzle-select/puzzle-select?iso=' + this.data.c.id }) },
  back() { wx.navigateBack() }
})
