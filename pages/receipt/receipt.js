const puzzle = require('../../utils/puzzle.js')
const puzzles = require('../../data/puzzles.js')

Page({
  data: { r: null, pieces: [], base: '' },

  onLoad(options) {
    const r = puzzle.receipt(options.id)
    if (!r) { wx.redirectTo({ url: '/pages/puzzle-select/puzzle-select' }); return }
    this.r = r
    this.setData({
      r,
      base: `/images/puzzle/${r.iso}_base${r.n}.png`,
      pieces: puzzles.levels[r.iso].pieces[r.n].map(p => ({
        k: p.k, src: `/images/puzzle/${r.iso}_${r.n}_${p.k}.png`,
        style: `left:${p.box[0]}%;top:${p.box[1]}%;width:${p.box[2]}%;height:${p.box[3]}%`
      }))
    })
  },

  again() {
    puzzle.create(this.r.iso, this.r.n)
    wx.redirectTo({ url: '/pages/puzzle/puzzle?resume=1' })
  },
  other() { wx.redirectTo({ url: '/pages/puzzle-select/puzzle-select' }) },
  share() { wx.navigateTo({ url: '/pages/share/share?kind=puzzle&id=' + this.r.id }) },
  home() { wx.reLaunch({ url: '/pages/home/home' }) }
})
