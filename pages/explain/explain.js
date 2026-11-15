const store = require('../../utils/store.js')
const engine = require('../../utils/engine.js')
const view = require('../../utils/view.js')
const geo = require('../../utils/geo.js')
const countries = require('../../data/countries.js')

Page({
  data: { nextWrong: -1, row: null, c: null, isMap: true, total: 10, firstText: '', chosenName: '', marks: {}, mapView: null, options: [], why: '', q: '', choices: [], done: false, tryAgain: false },

  onLoad(options) {
    const r = engine.record(options.id)
    const i = Number(options.i)
    if (!r || !r.items[i]) { wx.navigateBack(); return }
    this.recordId = r.id
    this.index = i
    const it = r.items[i]
    const c = countries.byId[it.cid]
    const row = view.row(r, i)
    const isMap = it.type === 'map'
    const follow = isMap ? c.follow : c.flagFollow
    // 追问的选项顺序每道题固定，重进页面不会变
    const rnd = engine.rng(i * 97 + c.index)
    const info = geo.world.info[c.id]
    this.answer = follow.options[0]
    this.setData({
      row, c, isMap,
      firstText: it.state === 'correct' ? '首答正确' : it.state === 'wrong' ? '首答错误' : view.STATE[it.state].text,
      chosenName: it.chosen ? geo.nameOf(it.chosen) : '',
      marks: isMap ? { correct: c.id, chosen: it.chosen } : {},
      mapView: isMap && info ? { lng: (info.box[0] + info.box[2]) / 2, lat: (info.box[1] + info.box[3]) / 2, span: Math.min(360, Math.max(70, (info.box[2] - info.box[0]) * 2.2)) } : null,
      options: isMap ? [] : it.options.map(id => ({ id, name: countries.byId[id].name, state: id === c.id ? 'good' : (id === it.chosen ? 'bad' : '') })),
      why: isMap ? c.explain : c.flagExplain,
      q: follow.q,
      choices: engine.shuffle(follow.options, rnd).map(text => ({ text, state: '' })),
      done: row.fixed
    })
    this.findNext()
  },

  // 这一局里下一道还没订正的错题（不含当前这道）
  findNext() {
    const r = engine.record(this.recordId)
    const todo = view.rows(r).filter(x => x.wrong && !x.fixed && x.i !== this.index)
    this.setData({ nextWrong: todo.length ? todo[0].i : -1 })
  },
  next() { wx.redirectTo({ url: `/pages/explain/explain?id=${this.recordId}&i=${this.data.nextWrong}` }) },
  back() { wx.navigateBack() },

  // 订正 / 追问：不限时，答错可以再选，不影响原来的成绩
  choose(e) {
    if (this.data.done) return
    const text = e.currentTarget.dataset.text
    const right = text === this.answer
    this.setData({
      choices: this.data.choices.map(o => ({ text: o.text, state: o.text === text ? (right ? 'good' : 'bad') : (o.state === 'bad' ? 'bad' : '') })),
      done: right, tryAgain: !right
    })
    if (right) {
      engine.follow(this.recordId, this.index, true)
      wx.showToast({ title: this.data.row.wrong ? '已订正' : '答对了', icon: 'success' })
      this.findNext()
    }
  },

  atlas() { wx.navigateTo({ url: '/pages/country/country?id=' + this.data.c.id }) }
})
