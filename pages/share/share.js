const engine = require('../../utils/engine.js')
const puzzle = require('../../utils/puzzle.js')
const code = require('../../utils/code.js')

Page({
  data: { kind: 'quiz', blocked: false, code: '', title: '', sub: '', scoreText: '', withScore: false, days: code.VALID_DAYS },

  onLoad(options) {
    if (options.kind === 'puzzle') {
      const p = puzzle.receipt(options.id)
      if (!p) { wx.navigateBack(); return }
      // 拼图邀请只公开国家、难度和片数，不带棋盘进度和追问答案
      this.setData({ kind: 'puzzle', code: p.code || code.forPuzzle(p.iso, p.n, p.seed), title: `来拼一个国家：${p.name}`, sub: `${p.diff} · ${p.n} 片 · 从空棋盘开始` })
      return
    }
    const r = engine.record(options.id)
    if (!r) { wx.navigateBack(); return }
    if (r.topic) { this.setData({ blocked: true }); return }   // 每日任务的专题局题目是按主题挑的，不能做成同题邀请
    this.setData({
      kind: 'quiz', code: r.code || code.forQuiz(r.mode, r.seed),
      title: '一起挑战世界地理！', sub: `${r.modeName} · 同一套 10 题`,
      scoreText: `${r.score} 分 · ${r.stars} 星`
    })
  },

  toggle(e) { this.setData({ withScore: e.detail.value }) },
  copy() { wx.setClipboardData({ data: this.data.code }) },
  back() { wx.navigateBack() },

  // 发给好友的卡片：默认不带分数，不带错题、答案和任何个人信息
  onShareAppMessage() {
    const d = this.data
    const title = d.kind === 'puzzle' ? d.title
      : d.withScore ? `我在 GeoQuest 拿了 ${d.scoreText}，来试试同一套 10 题` : '我完成了 GeoQuest 地理挑战，来试试同一套 10 题'
    return { title, path: '/pages/invite/invite?code=' + d.code }
  },

  // 保存图片：把邀请卡画到画布上，存进相册，由用户自己决定发到哪里
  save() {
    const d = this.data
    wx.createSelectorQuery().select('#card').fields({ node: true, size: true }).exec(res => {
      if (!res[0] || !res[0].node) { wx.showToast({ title: '生成图片失败', icon: 'none' }); return }
      const canvas = res[0].node, W = 600, H = 800
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#1273d6'); g.addColorStop(1, '#4fb0ea')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#def8ff'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText('GEOQUEST · FRIENDS CHALLENGE', W / 2, 70)
      const text = () => {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 50px sans-serif'
        ctx.fillText(d.title, W / 2, 440)
        ctx.font = '26px sans-serif'
        ctx.fillText(d.sub, W / 2, 486)
        if (d.withScore && d.scoreText) ctx.fillText('我的成绩：' + d.scoreText, W / 2, 526)
        ctx.fillStyle = '#fff4db'
        ctx.fillRect(120, 560, 360, 150)
        ctx.fillStyle = '#69583e'
        ctx.font = '22px sans-serif'
        ctx.fillText('同题挑战码', W / 2, 600)
        ctx.fillText(`有效期 ${d.days} 天 · 在“地理挑战”里输入`, W / 2, 692)
        ctx.fillStyle = '#284b80'
        ctx.font = 'bold 60px monospace'
        ctx.fillText(d.code, W / 2, 662)
        wx.canvasToTempFilePath({
          canvas,
          success: f => wx.saveImageToPhotosAlbum({
            filePath: f.tempFilePath,
            success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
            fail: () => wx.showToast({ title: '没有保存，可以改用复制挑战码', icon: 'none' })
          }),
          fail: () => wx.showToast({ title: '生成图片失败', icon: 'none' })
        })
      }
      const img = canvas.createImage()
      img.onload = () => { ctx.drawImage(img, 170, 100, 260, 260); text() }
      img.onerror = text
      img.src = '/images/explorer.png'
    })
  }
})
