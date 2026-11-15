const store = require('../../utils/store.js')
const engine = require('../../utils/engine.js')
const view = require('../../utils/view.js')

Page({
  data: { r: null, time: '', onlyWrong: false, rows: [], wrongCount: 0, todo: -1 },

  onLoad(options) {
    this.id = options.id
  },
  // 从讲解页回来时，订正状态可能变了，所以每次显示都重新整理
  onShow() {
    const r = engine.record(this.id)
    if (!r) { wx.navigateBack(); return }
    const all = view.rows(r)
    const wrong = all.filter(x => x.wrong)
    const todo = wrong.filter(x => !x.fixed)[0]
    this.all = all
    this.setData({ r, time: store.clock(r.ms), wrongCount: wrong.length, todo: todo ? todo.i : -1, rows: this.data.onlyWrong ? wrong : all })
  },

  tab(e) {
    const onlyWrong = e.currentTarget.dataset.w === '1'
    this.setData({ onlyWrong, rows: onlyWrong ? this.all.filter(x => x.wrong) : this.all })
  },
  one(e) { wx.navigateTo({ url: `/pages/explain/explain?id=${this.id}&i=${e.currentTarget.dataset.i}` }) },
  fix() { wx.navigateTo({ url: `/pages/explain/explain?id=${this.id}&i=${this.data.todo}` }) },
  back() { wx.navigateBack() }
})
