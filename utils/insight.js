// 学习数据：从本机保存的十题记录里，找出最近容易错的国家。只读存档，不联网、不上传。
const countries = require('../data/countries.js')

const KIND = { map: '地图', flag: '国旗' }

// 参与统计的记录：同题挑战的练习重玩不算（题目是见过的，不代表真实水平）
function counted(records) {
  return (records || []).filter(r => r && !r.replay && r.items)
}

// 按“国家 + 题型”汇总首答结果。records 新的在前。
// 只数答对和答错/超时；跳过、没答到的题不算错，也不算一次作答。
function tally(records) {
  const map = {}, list = []
  counted(records).forEach((r, ri) => {
    r.items.forEach((it, i) => {
      const right = it.state === 'correct'
      const miss = it.state === 'wrong' || it.state === 'timeout'
      if (!right && !miss) return
      const key = it.type + ':' + it.cid
      let t = map[key]
      if (!t) {
        // 第一次遇到就是最近的一次作答，记下它的结果
        t = map[key] = { key, type: it.type, cid: it.cid, right: 0, wrong: 0, total: 0, lastRight: right, lastAt: ri, lastMiss: '' }
        list.push(t)
      }
      t.total += 1
      if (right) t.right += 1
      else { t.wrong += 1; if (!t.lastMiss) t.lastMiss = r.id + '#' + i }   // 最近一次答错的题，用来查有没有订正过
    })
  })
  return list
}

// 薄弱点的规则：最近的记录里至少答错（或超时）过一次，并且最近一次作答没有答对。
// 也就是说，之后在正式局里首答答对了，就不再列出；只在回顾里订正过的仍然列出，但标上“已订正”，
// 因为订正答的是追问，不等于下次能在地图上找到它或认出它的国旗。
// 排序：错得多的在前，次数相同看谁错得更近。
function weakSpots(records, limit, fixed) {
  fixed = fixed || {}
  return tally(records)
    .filter(t => t.wrong >= 1 && !t.lastRight)
    .sort((a, b) => b.wrong - a.wrong || a.lastAt - b.lastAt)
    .slice(0, limit || 5)
    .map(t => {
      const c = countries.byId[t.cid] || {}
      return {
        key: t.key, cid: t.cid, type: t.type, kind: KIND[t.type] || '', name: c.name || t.cid, flag: c.flag || '',
        right: t.right, wrong: t.wrong, total: t.total, fixed: !!fixed[t.lastMiss],
        text: `错 ${t.wrong} 次 / 共 ${t.total} 次`
      }
    })
}

module.exports = { counted, tally, weakSpots }
