// 十题正式局的规则：出题、计时、爱心、道具、判题、结算。页面只负责显示和转发操作。
const store = require('./store.js')
const progress = require('./progress.js')
const countries = require('../data/countries.js')

const TOTAL = 10
const HEARTS = 3
const LIMIT_MS = 30000
const MODE_NAME = { map: '地图找国家', flag: '国旗竞猜', mix: '限时混合挑战' }

/* ---------- 可复现的随机数：同一个种子得到同一套题 ---------- */

function rng(seed) {
  let a = (seed >>> 0) + 0x9e3779b9
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffle(list, rnd) {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const t = a[i]; a[i] = a[j]; a[j] = t
  }
  return a
}

// 国旗题的四个选项：正确国家 + 三个干扰项（优先同一个大洲），顺序打乱
function flagOptions(c, rnd) {
  const others = shuffle(countries.mapPool.filter(o => o.id !== c.id), rnd)
  const same = others.filter(o => o.continent === c.continent)
  const rest = others.filter(o => o.continent !== c.continent)
  const wrong = same.slice(0, 2).concat(rest).slice(0, 3)
  return shuffle([c].concat(wrong), rnd).map(o => o.id)
}

// 出题。topic 可以限定一个大洲（每日任务用），题目不够 10 道时用其他国家补足但不重复
function buildQuestions(mode, seed, topic) {
  const rnd = rng(seed)
  const pick = (pool, n, used) => {
    let list = shuffle(pool.filter(c => !used[c.id]), rnd)
    if (topic) list = list.filter(c => c.continent === topic).concat(list.filter(c => c.continent !== topic))
    return list.slice(0, n)
  }
  const used = {}
  let maps = [], flags = []
  if (mode === 'map') maps = pick(countries.mapPool, TOTAL, used)
  else if (mode === 'flag') flags = pick(countries.flagPool, TOTAL, used)
  else {
    flags = pick(countries.flagPool, 5, used)
    flags.forEach(c => { used[c.id] = 1 })
    maps = pick(countries.mapPool, 5, used)
  }
  const mapQ = maps.map(c => ({ type: 'map', cid: c.id }))
  const flagQ = flags.map(c => ({ type: 'flag', cid: c.id, options: flagOptions(c, rnd) }))
  if (mode !== 'mix') return shuffle(mapQ.concat(flagQ), rnd)
  // 混合局：同一种题型最多连续 2 道
  for (let tries = 0; tries < 200; tries++) {
    const order = shuffle(mapQ.concat(flagQ), rnd)
    let ok = true
    for (let i = 2; i < order.length; i++) {
      if (order[i].type === order[i - 1].type && order[i].type === order[i - 2].type) { ok = false; break }
    }
    if (ok) return order
  }
  return mapQ.reduce((out, q, i) => out.concat([q, flagQ[i]]), [])
}

/* ---------- 对局 ---------- */

// 开一局新的。opts.code 表示这是一局同题挑战
function create(mode, opts) {
  opts = opts || {}
  const seed = opts.seed !== undefined ? opts.seed : Math.floor(Math.random() * 32768)
  const session = {
    id: 'q' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36),
    mode, seed, topic: opts.topic || '',
    code: opts.code || '', replay: !!opts.replay,
    questions: buildQuestions(mode, seed, opts.topic),
    index: 0, hearts: HEARTS, hints: 1, skips: mode === 'map' ? 0 : 1,
    results: [],          // 每题的最终结果，只写一次
    hintShown: false,     // 当前题是否已经用了提示
    elapsed: 0, since: null   // 当前题已用的时间（毫秒）和最近一次开始计时的时刻
  }
  store.update(s => { s.quiz = session })
  return session
}
function current() { return store.load().quiz }
function drop() { store.update(s => { s.quiz = null }) }
function persist() { store.save() }

function question(session) { return session.questions[session.index] }
function answered(session) { return !!session.results[session.index] }

// 计时：题目可以操作后才开始走
function startClock(session, now) {
  if (answered(session) || session.since !== null) return
  session.since = now
  persist()
}
// 专项局切到后台时暂停；混合局不暂停，回来按截止时间算
function pauseClock(session, now) {
  if (session.mode === 'mix' || session.since === null) return
  session.elapsed += now - session.since
  session.since = null
  persist()
}
function used(session, now) {
  return Math.min(LIMIT_MS, session.elapsed + (session.since !== null ? now - session.since : 0))
}
function remaining(session, now) { return LIMIT_MS - used(session, now) }

// 写入本题的最终结果。同一题只认第一次，重复提交返回已有结果
function settle(session, state, chosen, now) {
  if (session.results[session.index]) return session.results[session.index]
  const q = question(session)
  const res = { type: q.type, cid: q.cid, state, chosen: chosen || '', ms: used(session, now), hint: session.hintShown }
  session.results[session.index] = res
  session.since = null
  if (state === 'wrong' || state === 'timeout') session.hearts = Math.max(0, session.hearts - 1)
  persist()
  return res
}
function answer(session, chosen, now) {
  const q = question(session)
  return settle(session, chosen === q.cid ? 'correct' : 'wrong', chosen, now)
}
function timeout(session, now) { return settle(session, 'timeout', '', now) }
function skip(session, now) {
  if (answered(session) || session.skips < 1 || question(session).type !== 'flag') return null
  session.skips -= 1
  return settle(session, 'skip', '', now)
}
// 提示只给可以推理的线索，不指出答案；一局一次
function hint(session) {
  if (answered(session)) return ''
  const q = question(session), c = countries.byId[q.cid]
  if (!session.hintShown) {
    if (session.hints < 1) return ''
    session.hints -= 1
    session.hintShown = true
    persist()
  }
  return q.type === 'map' ? c.hint : c.flagHint
}

// 这一局是否已经可以结算：爱心用完，或 10 题都处理完
function finished(session) {
  return session.hearts <= 0 || session.results.length >= TOTAL
}
function next(session) {
  session.index += 1
  session.elapsed = 0
  session.since = null
  session.hintShown = false
  persist()
}

/* ---------- 结算 ---------- */

function stars(correct, completed) {
  const s = correct >= 8 ? 3 : correct >= 6 ? 2 : correct >= 1 ? 1 : 0
  return completed ? s : Math.min(1, s)
}

// 生成成绩、发奖励、清掉存档。同一局只结算一次，返回这条成绩记录
function finalize(session) {
  return store.update(s => {
    const done = s.records.filter(r => r.id === session.id)[0]
    if (done) return done
    const items = session.questions.map((q, i) => {
      const r = session.results[i]
      return { type: q.type, cid: q.cid, options: q.options || null, state: r ? r.state : 'none', chosen: r ? r.chosen : '', ms: r ? r.ms : 0 }
    })
    const count = st => items.filter(it => it.state === st).length
    const correct = count('correct')
    const completed = session.results.length >= TOTAL
    const record = {
      id: session.id, mode: session.mode, modeName: MODE_NAME[session.mode], code: session.code, replay: session.replay,
      seed: session.seed, topic: session.topic,
      date: store.today(), time: Date.now(),
      score: correct * 10, correct, wrong: count('wrong') + count('timeout'), timeouts: count('timeout'),
      skipped: count('skip'), unanswered: count('none'),
      ms: items.reduce((t, it) => t + it.ms, 0),
      completed, stars: stars(correct, completed), items,
      xp: 0, points: 0, newRecord: false, levelUp: 0
    }
    // 学习进度：首答正确的国家
    const d = progress.daily(s)
    items.forEach(it => {
      if (it.state !== 'correct') return
      s.learned[it.cid] = true
      if (it.type === 'map') { s.located[it.cid] = true; d.map[it.cid] = true }
      else { s.flags[it.cid] = true; d.flag[it.cid] = true }
    })
    // 奖励：同题挑战的重玩不再发；当天第一次走完 10 题另加 10 积分
    if (!session.replay) {
      const before = progress.level(s.profile.xp).lv
      record.xp = correct * 10
      s.profile.xp += record.xp
      const after = progress.level(s.profile.xp).lv
      if (after > before) record.levelUp = after
      if (completed && !d.fullDone) { d.fullDone = true; record.points = 10; s.profile.points += 10 }
      if (correct > 0 && (s.bests[session.mode] === undefined || record.score > s.bests[session.mode])) {
        s.bests[session.mode] = record.score
        record.newRecord = true
      }
      if (session.code && !s.invites[session.code]) s.invites[session.code] = { first: record.score, stars: record.stars, joined: false }
    }
    s.records.unshift(record)
    if (s.records.length > 30) s.records.length = 30
    s.quiz = null
    progress.markLearned(s)   // 打完一局（包括爱心用完、练习重玩）算当天学习过；上面已经挡掉了重复结算
    progress.checkBadges(s)
    return record
  })
}

function record(id) {
  return store.load().records.filter(r => r.id === id)[0] || null
}

// 回顾里的追问（订正）：答对后，错题标为“已订正”，原成绩不变
function follow(recordId, index, right) {
  return store.update(s => {
    const r = s.records.filter(x => x.id === recordId)[0]
    if (!r || !right) return false
    const it = r.items[index]
    const d = progress.daily(s)
    const key = recordId + '#' + index
    if ((it.state === 'wrong' || it.state === 'timeout') && !s.fixed[key]) { s.fixed[key] = true; d.fixed += 1 }
    if (it.type === 'flag' && it.state === 'correct') d.flagFollow[it.cid] = true
    s.learned[it.cid] = true
    progress.markLearned(s)   // 答对一道追问或订正，也算当天学习过
    progress.checkBadges(s)
    return true
  })
}

module.exports = {
  TOTAL, HEARTS, LIMIT_MS, MODE_NAME, rng, shuffle, buildQuestions,
  create, current, drop, question, answered, startClock, pauseClock, used, remaining,
  answer, timeout, skip, hint, finished, next, finalize, record, follow, stars
}
