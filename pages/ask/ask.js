const store = require('../../utils/store.js')
const { build, TOPICS } = require('../../utils/questions.js')

function pad(n) { return n < 10 ? '0' + n : '' + n }

Page({
  data: { q: null, result: null },

  onLoad(options) {
    this.topic = TOPICS.filter(t => t.id === options.topic)[0] || TOPICS[0]
    wx.setNavigationBarTitle({ title: '知识问答 · ' + this.topic.label })
    this.start()
  },

  start() {
    this.questions = build(this.topic.id)
    this.answers = []
    this.setData({ result: null })
    this.ask(0, 0)
  },

  ask(index, score) {
    const q = this.questions[index]
    const total = this.questions.length
    this.setData({
      q: {
        index, total, score, pct: Math.round(index * 100 / total),
        text: q.text, explain: q.explain, answer: q.answer, chosen: -1,
        options: q.options.map(text => ({ text, state: '' }))
      }
    })
  },

  onOption(e) {
    const q = this.data.q
    if (q.chosen >= 0) return
    const i = e.currentTarget.dataset.i
    const right = i === q.answer
    this.answers[q.index] = right
    this.setData({
      'q.chosen': i,
      'q.right': right,
      'q.score': q.score + (right ? 1 : 0),
      'q.options': q.options.map((o, k) => ({ text: o.text, state: k === q.answer ? 'right' : (k === i ? 'wrong' : '') }))
    })
  },

  next() {
    const q = this.data.q
    if (q.index + 1 < q.total) this.ask(q.index + 1, q.score)
    else this.finish()
  },

  finish() {
    const q = this.data.q
    const rows = this.questions.map((x, i) => ({ id: i, text: x.text, answer: x.options[x.answer], ok: !!this.answers[i] }))
    const now = new Date()
    store.addRecord({
      time: now.getTime(),
      date: `${now.getMonth() + 1}月${now.getDate()}日 ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      scope: '知识问答 · ' + this.topic.label, score: q.score, total: q.total
    })
    store.addReview(this.questions.filter((x, i) => !this.answers[i] && x.ref).map(x => x.ref))
    this.setData({ q: null, result: { score: q.score, total: q.total, rows, wrongCount: rows.filter(r => !r.ok).length } })
  },

  again() { this.start() },
  back() { wx.navigateBack() }
})
