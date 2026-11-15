const store = require('../../utils/store.js')
const code = require('../../utils/code.js')
const insight = require('../../utils/insight.js')

Page({
  data: { tab: 0, best: null, weak: [], weakNote: '', weakEmpty: '', records: [], puzzles: [], invites: [] },

  onShow() {
    const s = store.load()
    const scored = s.records.filter(r => !r.replay)
    const best = scored.slice().sort((a, b) => b.score - a.score)[0] || null
    // 最近容易错的：只看存档里留着的最近几局（最多 30 局），练习重玩不算
    const weak = insight.weakSpots(s.records, 5, s.fixed)
    this.setData({
      weak,
      weakNote: scored.length ? `按最近 ${scored.length} 局统计` : '',
      weakEmpty: weak.length ? '' : scored.length ? '最近这几局里，没有需要重点练的国家。' : '打完一局十题挑战后，这里会列出最近答错的国家。',
      best: best ? { score: best.score, text: `${best.modeName} · 个人最高分` } : null,
      records: s.records.slice(0, 8).map(r => ({
        id: r.id, name: r.replay ? r.modeName + '（练习重玩）' : r.modeName, score: r.score,
        sub: `${r.date.slice(5)} · ${r.correct} 对 ${r.wrong} 错${r.skipped ? ' · 跳过 ' + r.skipped : ''}${r.unanswered ? ' · 余 ' + r.unanswered + ' 题未答' : ''}`
      })),
      puzzles: s.puzzleLog.slice(0, 5).map(p => ({ id: p.id, name: `${p.name} · ${p.diff}`, sub: `${p.n}/${p.n} 已拼成 · ${p.mastery}` })),
      // 我参加过的同题挑战：只有自己的首次成绩
      invites: Object.keys(s.invites).map(c => {
        const v = s.invites[c], p = code.parse(c)
        return { code: c, joined: !!s.join[c], text: v.done ? '国家拼图 · 已完成' : `首次成绩 ${v.first} 分`, live: p.ok }
      })
    })
  },

  tab(e) { this.setData({ tab: Number(e.currentTarget.dataset.t) }) },
  country(e) { wx.navigateTo({ url: '/pages/country/country?id=' + e.currentTarget.dataset.id }) },
  review(e) { wx.navigateTo({ url: '/pages/review/review?id=' + e.currentTarget.dataset.id }) },
  receipt(e) { wx.navigateTo({ url: '/pages/receipt/receipt?id=' + e.currentTarget.dataset.id }) },
  join(e) {
    const c = e.currentTarget.dataset.code
    store.update(s => { s.join[c] = e.detail.value })
  },
  home() { wx.reLaunch({ url: '/pages/home/home' }) }
})
