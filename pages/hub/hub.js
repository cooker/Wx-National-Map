const engine = require('../../utils/engine.js')
const code = require('../../utils/code.js')

Page({
  data: { input: '' },

  // 限时混合挑战：有没打完的十题局先问
  startMix() {
    const old = engine.current()
    if (!old) { wx.navigateTo({ url: '/pages/game/game?mode=mix' }); return }
    wx.showModal({
      title: `上次的“${engine.MODE_NAME[old.mode]}”还没打完`,
      content: `已经做到第 ${Math.min(old.index + 1, engine.TOTAL)} 题。继续上次的进度，还是放弃它开始限时挑战？`,
      confirmText: '继续', cancelText: '放弃并新开',
      success: res => {
        if (res.confirm) wx.navigateTo({ url: '/pages/game/game?resume=1' })
        else if (res.cancel) { engine.drop(); wx.navigateTo({ url: '/pages/game/game?mode=mix' }) }
      }
    })
  },
  puzzles() { wx.navigateTo({ url: '/pages/puzzle-select/puzzle-select' }) },

  onInput(e) {
    this.setData({ input: e.detail.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) })
  },
  // 输入挑战码：有效、过期、无效都交给承接页说明
  useCode() {
    if (this.data.input.length < 6) { wx.showToast({ title: '挑战码是 6 位字母和数字', icon: 'none' }); return }
    wx.navigateTo({ url: '/pages/invite/invite?code=' + this.data.input })
  }
})
