// 本地学习记录：已学、学习清单、需要复习、测验成绩。全部按知识点的名字存。
function read(key, def) {
  try {
    const v = wx.getStorageSync(key)
    return v === '' || v === undefined || v === null ? def : v
  } catch (e) {
    return def
  }
}
function write(key, value) {
  try { wx.setStorageSync(key, value) } catch (e) {}
}
function toggleIn(key, name) {
  const list = read(key, [])
  const i = list.indexOf(name)
  if (i >= 0) list.splice(i, 1)
  else list.unshift(name)
  write(key, list)
  return i < 0
}

module.exports = {
  learned: () => read('learned', {}),
  markLearned(name) {
    const m = read('learned', {})
    if (!m[name]) { m[name] = true; write('learned', m) }
  },

  favs: () => read('favs', []),
  isFav: name => read('favs', []).indexOf(name) >= 0,
  toggleFav: name => toggleIn('favs', name),

  review: () => read('review', []),
  addReview(names) {
    const list = read('review', [])
    names.forEach(n => { if (list.indexOf(n) < 0) list.unshift(n) })
    write('review', list)
  },
  removeReview(name) {
    write('review', read('review', []).filter(n => n !== name))
  },

  records: () => read('records', []),
  addRecord(rec) {
    const list = read('records', [])
    list.unshift(rec)
    write('records', list.slice(0, 20))
  },

  // 地图的显示设置（筛选、图层），下次打开时恢复
  prefs: () => read('mapPrefs', {}),
  savePrefs: p => write('mapPrefs', p),

  // 讲完的专题课（按课名记）
  lessonsDone: () => read('lessonsDone', {}),
  markLesson(title) {
    const m = read('lessonsDone', {})
    if (!m[title]) { m[title] = true; write('lessonsDone', m) }
  },

  clearAll() {
    ['learned', 'favs', 'review', 'records', 'lessonsDone'].forEach(k => {
      try { wx.removeStorageSync(k) } catch (e) {}
    })
  }
}
