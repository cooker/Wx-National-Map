// 成长：经验和等级、每日任务、成就。
const store = require('./store.js')
const countries = require('../data/countries.js')

const XP_PER_LEVEL = 1000

function level(xp) {
  return { lv: Math.floor(xp / XP_PER_LEVEL) + 1, cur: xp % XP_PER_LEVEL, need: XP_PER_LEVEL, pct: Math.round((xp % XP_PER_LEVEL) / 10) }
}

// 每天的任务进度；换了一天就清零
function daily(s) {
  const d = store.today()
  if (!s.daily || s.daily.date !== d) {
    s.daily = { date: d, fullDone: false, map: {}, flag: {}, flagFollow: {}, puzzle: {}, fixed: 0, claimed: {} }
  }
  return s.daily
}

/* ---------- 连续学习 ---------- */

// 旧存档没有 streak 字段，或者字段不完整，都当作从零开始
function streakOf(s) {
  const k = s.streak || {}
  return { last: typeof k.last === 'string' ? k.last : '', n: k.n > 0 ? k.n : 0, best: k.best > 0 ? k.best : 0 }
}
// 在 day 这天完成了一次学习之后，连续记录变成什么样。不改传入的对象
function nextStreak(k, day) {
  // 当天已经记过；或者手机日期被调回过去：都不动，避免重复计数或倒着算
  if (k.last && k.last >= day) return k
  const n = k.last === store.dayBefore(day) ? k.n + 1 : 1
  return { last: day, n, best: Math.max(k.best, n) }
}
// 记一个学习日：打完一局十题、拼图通关、在回顾里答对追问时调用。同一天调多少次结果都一样；不发经验和积分
function markLearned(s, day) {
  s.streak = nextStreak(streakOf(s), day || store.today())
  return s.streak
}
// 页面上显示用。n 是到今天还有效的连续天数：昨天或今天学过才算，断了就是 0
function streak(day) {
  day = day || store.today()
  const k = streakOf(store.load())
  const doneToday = k.last === day
  const atRisk = !doneToday && k.n > 0 && k.last === store.dayBefore(day)   // 今天不学，明天就从头算
  return { n: doneToday || atRisk ? k.n : 0, best: k.best, doneToday, atRisk }
}

/* ---------- 每日任务 ---------- */

const TASKS = {
  puzzle: { icon: '🧩', tone: 'green', name: '轮廓侦探', need: 2, text: '拼成 2 个不同国家，各答对一道地理追问。', go: '/pages/puzzle-select/puzzle-select',
    count: d => Object.keys(d.puzzle).length },
  map: { icon: '🗺️', tone: 'blue', name: '地图侦察员', need: 3, text: '正确定位 3 个不同的南美洲国家。', go: '/pages/game/game?mode=map&topic=南美洲',
    count: d => Object.keys(d.map).filter(id => countries.byId[id].continent === '南美洲').length },
  flag: { icon: '🚩', tone: 'purple', name: '国旗观察员', need: 2, text: '答对 2 面不同的国旗，并在回顾里各答对一道图案追问。', go: '/pages/game/game?mode=flag',
    count: d => Object.keys(d.flag).filter(id => d.flagFollow[id]).length },
  fix: { icon: '🛠️', tone: '', name: '错题修复师', need: 1, text: '从题目回顾里订正 1 道答错的题。', go: '/pages/rank/rank',
    count: d => d.fixed }
}
const POINTS_PER_TASK = 5

// 当天派发的三个任务：拼图、地图固定，第三个按日期在“国旗”和“订正”之间轮换
function tasks() {
  return store.update(s => {
    const d = daily(s)
    const day = Number(d.date.slice(-2))
    const hasMistake = s.records.some(r => r.items.some((it, i) => (it.state === 'wrong' || it.state === 'timeout') && !s.fixed[r.id + '#' + i]))
    const ids = ['puzzle', 'map', day % 2 === 0 && hasMistake ? 'fix' : 'flag']
    return ids.map(id => {
      const t = TASKS[id]
      const n = Math.min(t.need, t.count(d))
      const status = d.claimed[id] ? 'claimed' : n >= t.need ? 'done' : n > 0 ? 'doing' : 'todo'
      return { id, icon: t.icon, tone: t.tone, name: t.name, text: t.text, go: t.go, n, need: t.need, pct: Math.round(n * 100 / t.need), status, points: POINTS_PER_TASK }
    })
  })
}
function claim(id) {
  const list = tasks()
  const t = list.filter(x => x.id === id)[0]
  if (!t || t.status !== 'done') return false
  store.update(s => { daily(s).claimed[id] = true; s.profile.points += POINTS_PER_TASK })
  return true
}

/* ---------- 成就 ---------- */

const BADGES = [
  { id: 'first', icon: '🏅', name: '初次启航', text: '完成第一次十题挑战。', need: 1, count: s => Math.min(1, s.records.length) },
  { id: 'puzzle1', icon: '🧩', name: '轮廓新手', text: '第一次通关国家拼图。', need: 1, count: s => Math.min(1, Object.keys(s.puzzles).length) },
  { id: 'map10', icon: '🧭', name: '地图达人', text: '在正式局中正确定位 10 个不同国家。', need: 10, count: s => Object.keys(s.located).length, go: '/pages/game/game?mode=map', goText: '去地图找国家' },
  { id: 'flag5', icon: '🚩', name: '旗帜观察', text: '答对 5 面不同的国旗。', need: 5, count: s => Object.keys(s.flags).length, go: '/pages/game/game?mode=flag', goText: '去国旗竞猜' },
  { id: 'cont3', icon: '🌍', name: '跨洲探险', text: '在 3 个不同的大洲各正确定位 1 个国家。', need: 3,
    count: s => Object.keys(Object.keys(s.located).reduce((m, id) => { m[countries.byId[id].continent] = 1; return m }, {})).length, go: '/pages/game/game?mode=map', goText: '去地图找国家' },
  { id: 'fix3', icon: '🔍', name: '错题修复', text: '订正 3 道答错的题。', need: 3, count: s => Object.keys(s.fixed).length, go: '/pages/rank/rank', goText: '去看最近的挑战' },
  // 连续学习只发徽章，不发经验和积分。进度按当前还有效的连续天数算，断了会回到 0，已拿到的徽章不收回
  { id: 'streak3', icon: '🔥', name: '三天不断', text: '连续 3 天都完成一项学习。', need: 3, count: () => streak().n, go: '/pages/tasks/tasks', goText: '去看今天的任务' },
  { id: 'streak7', icon: '📅', name: '一周坚持', text: '连续 7 天都完成一项学习。', need: 7, count: () => streak().n, go: '/pages/tasks/tasks', goText: '去看今天的任务' }
]

// 检查有没有新达成的成就，有就记下来（没看过的会在首页显示红点）
function checkBadges(s) {
  BADGES.forEach(b => {
    if (!s.badges[b.id] && b.count(s) >= b.need) s.badges[b.id] = { at: store.today(), seen: false }
  })
}
function badges() {
  const s = store.load()
  return BADGES.map(b => {
    const n = Math.min(b.need, b.count(s))
    return { id: b.id, icon: b.icon, name: b.name, text: b.text, n, need: b.need, pct: Math.round(n * 100 / b.need), got: !!s.badges[b.id], go: b.go || '', goText: b.goText || '' }
  })
}
function hasNewBadge() {
  const s = store.load()
  return Object.keys(s.badges).some(id => !s.badges[id].seen)
}
function markBadgesSeen() {
  store.update(s => Object.keys(s.badges).forEach(id => { s.badges[id].seen = true }))
}

module.exports = { level, daily, tasks, claim, badges, hasNewBadge, markBadgesSeen, checkBadges, XP_PER_LEVEL, BADGES, streakOf, nextStreak, markLearned, streak }
