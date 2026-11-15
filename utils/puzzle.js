// 国家拼图的规则：开关、放置、提示、地理追问、通关和存档。
const store = require('./store.js')
const progress = require('./progress.js')
const engine = require('./engine.js')
const puzzles = require('../data/puzzles.js')
const countries = require('../data/countries.js')

const SNAP = 4   // 吸附容差：碎片中心离目标位置不超过棋盘边长的 4%

function diffName(n) { return puzzles.DIFFS.filter(d => d.n === n)[0].name }

// 开一关。种子决定托盘里碎片的顺序和追问选项的顺序（同拼邀请靠它保持一致）
function create(iso, n, opts) {
  opts = opts || {}
  const seed = opts.seed !== undefined ? opts.seed : Math.floor(Math.random() * 512)
  const rnd = engine.rng(seed * 31 + n)
  const level = puzzles.levels[iso]
  const session = {
    id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36),
    iso, n, seed, code: opts.code || '', replay: !!opts.replay,
    tray: engine.shuffle(level.pieces[n].map(p => p.k), rnd),
    options: engine.shuffle(level.ask.options, rnd),
    locked: [], hintUsed: false,
    phase: 'place',        // place 拼合中 → ask 已拼成待追问 → done 已通关
    firstAnswer: '', tries: 0
  }
  store.update(s => { s.puzzle = session })
  return session
}
function current() { return store.load().puzzle }
function drop() { store.update(s => { s.puzzle = null }) }

function piece(session, k) {
  return puzzles.levels[session.iso].pieces[session.n].filter(p => p.k === k)[0]
}

// 把碎片 k 放到槽位 slot。只有放对才锁定；已锁定的不会重复计数
function place(session, k, slot) {
  if (session.phase !== 'place' || session.locked.indexOf(k) >= 0) return false
  if (k !== slot) return false
  session.locked.push(k)
  if (session.locked.length >= session.n) session.phase = 'ask'
  store.save()
  return true
}
// 拖动松手时的判定：cx、cy 是碎片中心在棋盘上的位置（百分比）
function drop_at(session, k, cx, cy) {
  const b = piece(session, k).box
  const dist = Math.hypot(cx - (b[0] + b[2] / 2), cy - (b[1] + b[3] / 2))
  return dist <= SNAP + 1e-6 ? place(session, k, k) : false   // 刚好等于容差也算放对
}

function hint(session) {
  if (!session.hintUsed) { session.hintUsed = true; store.save() }
  return puzzles.levels[session.iso].hint
}

// 回答地理追问。答错可以不限次重选，不用重拼；答对才算通关
function answer(session, text) {
  if (session.phase !== 'ask') return null
  const ask = puzzles.levels[session.iso].ask
  const right = text === ask.options[0]
  session.tries += 1
  if (!session.firstAnswer) session.firstAnswer = text
  if (!right) { store.save(); return { right: false, retry: ask.retry } }
  session.phase = 'done'
  const mastery = session.firstAnswer === ask.options[0] ? '首答掌握' : '订正后掌握'
  const receipt = store.update(s => {
    const key = session.iso + '_' + session.n
    const first = !s.puzzles[key]
    const xp = first && !session.replay ? 10 : 0
    if (first) s.puzzles[key] = { at: store.today(), mastery }
    const before = progress.level(s.profile.xp).lv
    s.profile.xp += xp
    const after = progress.level(s.profile.xp).lv
    s.learned[session.iso] = true
    progress.daily(s).puzzle[session.iso] = true
    const out = {
      id: session.id, iso: session.iso, n: session.n, name: countries.byId[session.iso].name, diff: diffName(session.n),
      mastery, firstAnswer: session.firstAnswer, answer: ask.options[0], q: ask.q, why: ask.why,
      xp, levelUp: after > before ? after : 0, date: store.today(), code: session.code, seed: session.seed
    }
    s.puzzleLog.unshift(out)
    if (s.puzzleLog.length > 20) s.puzzleLog.length = 20
    if (session.code && !s.invites[session.code]) s.invites[session.code] = { done: true }
    s.puzzle = null
    progress.markLearned(s)   // 拼图通关算当天学习过
    progress.checkBadges(s)
    return out
  })
  return { right: true, receipt }
}

function receipt(id) {
  return store.load().puzzleLog.filter(r => r.id === id)[0] || null
}

module.exports = { SNAP, create, current, drop, piece, place, drop_at, hint, answer, receipt, diffName }
