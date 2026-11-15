// 挑战码：6 位字母数字，里面编进了玩法、出题种子、生成日期和内容版本。
// 两台手机只要内容版本相同，输入同一个码就会得到同一套题（同样的顺序和选项），不需要服务器。
// 码里不含答案，也不含发起人的任何信息。有效期 7 天。
const { CONTENT_VERSION } = require('../data/countries.js')
const puzzles = require('../data/puzzles.js')

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'   // 去掉了容易看错的 I、O、0、1
const KINDS = ['mix', 'map', 'flag', 'puzzle']
const EPOCH = Date.UTC(2026, 0, 1)
const VALID_DAYS = 7

function dayNumber(d) {
  d = d || new Date()
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000)
}

// 30 位：玩法 2 位 | 日期 11 位 | 内容 15 位 | 版本 2 位
function pack(kind, day, payload) {
  let n = ((KINDS.indexOf(kind) & 3) * 2048 + (day & 2047)) * 32768 + (payload & 32767)
  n = n * 4 + (CONTENT_VERSION & 3)
  let out = ''
  for (let i = 0; i < 6; i++) { out = ALPHA[n % 32] + out; n = Math.floor(n / 32) }
  return out
}

function forQuiz(mode, seed, date) {
  return pack(mode, dayNumber(date), seed)
}
function forPuzzle(iso, n, seed, date) {
  const c = puzzles.ORDER.indexOf(iso)
  const d = puzzles.DIFFS.findIndex(x => x.n === n)
  return pack('puzzle', dayNumber(date), c * 2048 + d * 512 + (seed & 511))
}

// 解析挑战码。ok 为 false 时 reason 是 invalid（不是有效的码）、expired（过期）或 version（内容已更新）
function parse(text, date) {
  const code = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (code.length !== 6) return { ok: false, reason: 'invalid', code }
  let n = 0
  for (let i = 0; i < 6; i++) {
    const v = ALPHA.indexOf(code[i])
    if (v < 0) return { ok: false, reason: 'invalid', code }
    n = n * 32 + v
  }
  const version = n % 4; n = Math.floor(n / 4)
  const payload = n % 32768; n = Math.floor(n / 32768)
  const day = n % 2048
  const kind = KINDS[Math.floor(n / 2048)]
  const age = dayNumber(date) - day
  if (age < 0) return { ok: false, reason: 'invalid', code }
  const out = { code, kind, mode: kind, seed: payload, daysLeft: VALID_DAYS - age }
  if (kind === 'puzzle') {
    out.iso = puzzles.ORDER[Math.floor(payload / 2048)]
    const diff = puzzles.DIFFS[Math.floor(payload / 512) % 4]
    out.n = diff ? diff.n : 0
    out.seed = payload % 512
    if (!out.iso || !diff) return { ok: false, reason: 'invalid', code }
  }
  if (age > VALID_DAYS) return Object.assign(out, { ok: false, reason: 'expired' })
  if (version !== (CONTENT_VERSION & 3)) return Object.assign(out, { ok: false, reason: 'version' })
  return Object.assign(out, { ok: true })
}

module.exports = { forQuiz, forPuzzle, parse, VALID_DAYS }
