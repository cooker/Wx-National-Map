// 本机存档：玩家进度、未完成的对局、历史记录都放在一个对象里，整体读写。
const KEY = 'geoquest'

function blank() {
  return {
    v: 1,
    profile: { name: '地理小探险家', xp: 0, points: 0 },
    quiz: null,        // 未结束的十题局
    puzzle: null,      // 未结束的拼图
    records: [],       // 十题局的成绩，新的在前，最多 30 条
    bests: {},         // 各模式的最高分
    located: {},       // 在地图题里首答正确过的国家
    flags: {},         // 在国旗题里首答正确过的国家
    learned: {},       // 图鉴里标“已学习”的国家
    fixed: {},         // 订正过的错题，键是 记录id#题号
    puzzles: {},       // 拼图通关记录，键是 国家_片数
    puzzleLog: [],     // 最近完成的拼图，最多 20 条
    badges: {},        // 已获得的成就
    daily: null,       // 当天的任务进度
    invites: {},       // 用过的挑战码和第一次的成绩；再用同一个码算练习重玩
    join: {},          // 每个挑战码是否愿意在好友榜上展示
    streak: { last: '', n: 0, best: 0 }   // 连续学习：最近一个学习日、到那天为止连续几天、最长连续几天
  }
}

let state = null

function load() {
  if (state) return state
  let saved = null
  try { saved = wx.getStorageSync(KEY) } catch (e) {}
  state = Object.assign(blank(), saved && saved.v === 1 ? saved : {})
  return state
}
function save() {
  try { wx.setStorageSync(KEY, state) } catch (e) {}
}
// 改存档都走这里：fn 里直接改 state，结束后落盘
function update(fn) {
  const s = load()
  const out = fn(s)
  save()
  return out
}
function reset() {
  state = blank()
  save()
}

function pad(n) { return n < 10 ? '0' + n : '' + n }
// 玩家所在时区的自然日
function today(d) {
  d = d || new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
// 某个自然日的前一天。交给 Date 去处理月底、年底和闰年
function dayBefore(day) {
  const p = day.split('-').map(Number)
  return today(new Date(p[0], p[1] - 1, p[2] - 1))
}
function clock(ms) {
  const s = Math.round(ms / 1000)
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

module.exports = { load, save, update, reset, today, dayBefore, clock, pad }
