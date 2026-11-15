// 把成绩记录里的一道题，整理成页面上显示用的一行
const countries = require('../data/countries.js')
const store = require('./store.js')

const STATE = {
  correct: { text: '正确', mark: '✓', cls: 'ok' },
  wrong: { text: '答错', mark: '✕', cls: 'no' },
  timeout: { text: '超时', mark: '✕', cls: 'no' },
  skip: { text: '跳过', mark: '»', cls: 'muted' },
  none: { text: '未作答', mark: '–', cls: 'muted' }
}

function row(record, i) {
  const it = record.items[i]
  const c = countries.byId[it.cid]
  const st = STATE[it.state]
  return {
    i, no: store.pad(i + 1), name: c.name, flag: c.flag, kind: it.type === 'map' ? '地图' : '国旗',
    state: it.state, text: st.text, mark: st.mark, cls: st.cls,
    wrong: it.state === 'wrong' || it.state === 'timeout',
    fixed: !!store.load().fixed[record.id + '#' + i]
  }
}
function rows(record) { return record.items.map((it, i) => row(record, i)) }

module.exports = { row, rows, STATE }
