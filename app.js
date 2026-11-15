App({
  onLaunch() {
    // 读一次存档，后面各页面共用内存里的这份
    require('./utils/store.js').load()
  }
})
