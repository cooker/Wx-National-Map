// 知识问答（选择题）的出题器：题目从 data/geo.js 和 data/lessons.js 里的内容自动生成。
const geo = require('../data/geo.js')
const { lessons } = require('../data/lessons.js')

function shuffle(list) {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]; a[i] = a[j]; a[j] = t
  }
  return a
}
// 一道题：answer 是正确选项，others 是干扰项；ref 是对应知识点的名字（答错时放进复习清单）
function make(text, answer, others, explain, ref) {
  const wrong = shuffle(others.filter((o, i) => o !== answer && others.indexOf(o) === i)).slice(0, 3)
  const options = shuffle([answer].concat(wrong))
  return { text, options, answer: options.indexOf(answer), explain, ref: ref || '' }
}

const CONTINENTS = ['亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲']
const CROSS = ['俄罗斯', '土耳其', '埃及']   // 地跨两洲的国家不出“位于哪个大洲”的题

function capitalQuestions() {
  return geo.countries.filter(c => c.capital !== c.name).map(c => {
    const same = geo.countries.filter(o => o.continent === c.continent && o.capital !== o.name).map(o => o.capital)
    const pool = same.length >= 4 ? same : geo.countries.map(o => o.capital)
    return make(`${c.name}的首都是哪里？`, c.capital, pool, `${c.name}的首都是${c.capital}。`, c.name)
  })
}
function continentQuestions() {
  return geo.countries.filter(c => CROSS.indexOf(c.name) < 0).map(c =>
    make(`${c.name}位于哪个大洲？`, c.continent, CONTINENTS, c.desc, c.name))
}
function recordQuestions() {
  const l = lessons.filter(x => x.title === '世界之最')[0]
  if (!l) return []
  const names = l.steps.map(s => s.item.name)
  return l.steps.filter(s => s.note).map(s =>
    make(`“${s.note}”是下面哪一个？`, s.item.name, names, s.item.desc, s.item.name))
}
function boundaryQuestions() {
  const list = [
    ['亚洲', '非洲', '苏伊士运河'], ['欧洲', '非洲', '直布罗陀海峡'], ['亚洲', '北美洲', '白令海峡'],
    ['北美洲', '南美洲', '巴拿马运河'], ['南美洲', '南极洲', '德雷克海峡']
  ]
  const pool = list.map(x => x[2]).concat(['马六甲海峡', '霍尔木兹海峡', '英吉利海峡'])
  return list.map(x => make(`${x[0]}和${x[1]}的分界线是？`, x[2], pool, geo.byName[x[2]].desc, x[2]))
}
function gridQuestions() {
  const d = n => geo.byName[n].desc
  const half = '20°W 和 160°E 组成的经线圈'
  return [
    make('南、北半球的分界线是？', '赤道', ['北回归线', '本初子午线', '180°经线'], d('赤道'), '赤道'),
    make('最长的纬线是？', '赤道', ['北回归线', '北极圈', '南极圈'], d('赤道'), '赤道'),
    make('东、西半球的分界线是？', half, ['0°和 180°经线组成的经线圈', '赤道', '南、北回归线'], d('西经20°经线'), '西经20°经线'),
    make('东经和西经的起始线是？', '本初子午线（0°经线）', ['180°经线', '赤道', '20°W 经线'], d('本初子午线'), '本初子午线'),
    make('热带和北温带的分界线是？', '北回归线', ['赤道', '北极圈', '南回归线'], d('北回归线'), '北回归线'),
    make('北温带和北寒带的分界线是？', '北极圈', ['北回归线', '赤道', '南极圈'], d('北极圈'), '北极圈'),
    make('五带中，有太阳直射现象的是？', '热带', ['北温带', '南温带', '北寒带'], d('热带'), '热带'),
    make('五带中，有极昼和极夜现象的是？', '寒带', ['热带', '温带', '热带和温带'], d('北寒带'), '北寒带')
  ]
}

// 给出经纬度，判断是哪个国家的首都
function coordQuestions() {
  const label = c => `${c.capital}（${c.name}）`
  return geo.countries.map(c =>
    make(`（${c.coord.replace(' ', '，')}）附近是哪个国家的首都？`, label(c), geo.countries.map(label),
      `${c.capital}大约在 ${c.coord}。先看南北纬和东西经判断在哪个大洲，再排除。`, c.name))
}

// 时区：由经度求时区，由时区求区时
function zoneQuestions() {
  const list = []
  geo.countries.forEach(c => {
    const deg = Math.round(c.lng)
    const n = Math.round(deg / 15)
    if (Math.abs(deg / 15 - n) > 0.4) return   // 太靠近时区边界的不出题
    const lngText = `${Math.abs(deg)}°${deg >= 0 ? 'E' : 'W'}`
    list.push(make(`${c.capital}的经度约为 ${lngText}，按经度计算它位于哪个时区？`, geo.zoneName(n),
      [geo.zoneName(n + 1), geo.zoneName(n - 1), geo.zoneName(-n), geo.zoneName(n + 2), geo.zoneName(n - 2)],
      `时区数 = 经度 ÷ 15，四舍五入。${Math.abs(deg)} ÷ 15 ≈ ${(Math.abs(deg) / 15).toFixed(1)}，所以是${geo.zoneName(n)}。这是按经度算的理论时区，各国实际采用的时间可能不同。`, ''))
  })
  const clock = h => (h < 0 ? `前一天 ${h + 24}:00` : h >= 24 ? `第二天 ${h - 24}:00` : `当天 ${h}:00`)
  for (let n = -11; n <= 11; n++) {
    if (n === 8) continue
    const diff = n - 8
    const h = 12 + diff
    list.push(make(`东8区（北京时间）是 12:00 时，${geo.zoneName(n)}是几点？`, clock(h),
      [clock(h + 1), clock(h - 1), clock(12 - diff), clock(h + 2), clock(h - 2)],
      `${geo.zoneName(n)}在东8区以${diff > 0 ? '东' : '西'}，相差 ${Math.abs(diff)} 个时区。向东每过一个时区加 1 小时，向西减 1 小时，所以是${clock(h)}。`, ''))
  }
  return list
}

// 洋流、渔场、板块、气压带和风带
function physicalQuestions() {
  const d = n => geo.byName[n].desc
  const currents = geo.physical.filter(i => /暖流$|寒流$/.test(i.name))
  const warm = currents.filter(i => /暖流$/.test(i.name)).map(i => i.name)
  const cold = currents.filter(i => /寒流$/.test(i.name)).map(i => i.name)
  const strip = n => n.replace(/暖流$|寒流$/, '洋流')   // 题目里不直接露出“暖”“寒”
  const list = []
  cold.forEach(n => list.push(make('下列洋流中，属于寒流的是？', strip(n), warm.map(strip), d(n), n)))
  warm.forEach(n => list.push(make('下列洋流中，属于暖流的是？', strip(n), cold.map(strip), d(n), n)))
  const causes = {
    '北海道渔场': '日本暖流和千岛寒流交汇',
    '纽芬兰渔场': '墨西哥湾暖流和拉布拉多寒流交汇',
    '北海渔场': '北大西洋暖流和北冰洋南下的冷海水交汇',
    '秘鲁渔场': '上升流把深层的营养盐类带到表层'
  }
  Object.keys(causes).forEach(n => list.push(make(`${n}的成因是？`, causes[n], Object.keys(causes).map(k => causes[k]), d(n), n)))
  // 洋流沿哪一段海岸流动
  const coast = {
    '日本暖流': '亚洲东岸', '千岛寒流': '亚洲东北岸', '加利福尼亚寒流': '北美洲西岸', '墨西哥湾暖流': '北美洲东南岸',
    '拉布拉多寒流': '北美洲东北岸', '加那利寒流': '非洲西北岸', '本格拉寒流': '非洲西南岸', '秘鲁寒流': '南美洲西岸',
    '巴西暖流': '南美洲东岸', '东澳大利亚暖流': '澳大利亚东岸', '西澳大利亚寒流': '澳大利亚西岸'
  }
  const coasts = Object.keys(coast).map(k => coast[k])
  Object.keys(coast).forEach(n => list.push(make(`${n}沿哪一段海岸流动？`, coast[n], coasts, d(n), n)))
  // 气候类型：由成因、由特征判断
  const climate = [
    ['热带雨林气候', '终年受赤道低气压带控制', '全年高温多雨'],
    ['热带草原气候', '受赤道低气压带和信风带交替控制', '全年高温，分干、湿两季'],
    ['热带沙漠气候', '终年受副热带高气压带或信风带控制', '全年炎热干燥'],
    ['地中海气候', '受副热带高气压带和西风带交替控制', '夏季炎热干燥，冬季温和多雨'],
    ['温带海洋性气候', '终年受西风带控制', '全年温和湿润'],
    ['温带季风气候', '', '夏季高温多雨，冬季寒冷干燥'],
    ['亚热带季风气候', '', '夏季高温多雨，冬季温和少雨'],
    ['温带大陆性气候', '', '冬冷夏热，全年降水少']
  ]
  const cnames = climate.map(c => c[0])
  climate.forEach(c => {
    if (c[1]) list.push(make(`“${c[1]}”形成的气候类型是？`, c[0], cnames.filter(n => climate.filter(x => x[0] === n)[0][1]), d(c[0]), c[0]))
    list.push(make(`气候特征是“${c[2]}”的气候类型是？`, c[0], cnames, d(c[0]), c[0]))
  })
  const plates = ['亚欧板块', '非洲板块', '美洲板块', '太平洋板块', '印度洋板块', '南极洲板块']
  return list.concat([
    make('中低纬度海区，大洋东岸（大陆西岸）的洋流一般是？', '寒流', ['暖流', '季风洋流', '西风漂流'], d('加利福尼亚寒流'), ''),
    make('北半球中低纬度海区，大洋环流的流动方向是？', '顺时针', ['逆时针', '自西向东', '自东向西'], '中低纬度海区的洋流以副热带为中心组成环流：北半球顺时针，南半球逆时针。', ''),
    make('南半球中低纬度海区，大洋环流的流动方向是？', '逆时针', ['顺时针', '自西向东', '自东向西'], '中低纬度海区的洋流以副热带为中心组成环流：北半球顺时针，南半球逆时针。', ''),
    make('暖流对沿岸气候的影响是？', '增温增湿', ['降温减湿', '增温减湿', '降温增湿'], d('日本暖流'), ''),
    make('寒流对沿岸气候的影响是？', '降温减湿', ['增温增湿', '增温减湿', '降温增湿'], d('加利福尼亚寒流'), ''),
    make('全球共有几个气压带、几个风带？', '7 个气压带、6 个风带', ['6 个气压带、7 个风带', '5 个气压带、6 个风带', '7 个气压带、7 个风带'], '气压带有赤道低气压带、南北副热带高气压带、南北副极地低气压带、南北极地高气压带，共 7 个；风带有南北信风带、南北盛行西风带、南北极地东风带，共 6 个。', ''),
    make('赤道低气压带控制的地区，降水类型主要是？', '对流雨', ['锋面雨', '地形雨', '台风雨'], d('赤道低气压带'), '赤道低气压带'),
    make('副热带高气压带控制的地区，气候特点是？', '炎热干燥', ['高温多雨', '温和湿润', '寒冷干燥'], d('副热带高气压带（北）'), '副热带高气压带（北）'),
    make('北半球夏季，气压带和风带的位置怎样移动？', '向北移', ['向南移', '向东移', '不移动'], '气压带和风带随太阳直射点的移动而移动：北半球夏季向北移，冬季向南移。', ''),
    make('1 月，北半球同纬度的陆地和海洋相比，气温怎样？', '陆地气温低', ['陆地气温高', '两者相同', '无法比较'], '1 月北半球是冬季。陆地降温比海洋快，所以同纬度陆地气温比海洋低，等温线在大陆上向南（低纬）凸出。', ''),
    make('1 月，北半球大陆上的等温线向哪个方向凸出？', '向南（低纬）凸出', ['向北（高纬）凸出', '向东凸出', '不弯曲'], '等温线向低纬凸出，说明这里比同纬度其他地方冷。1 月北半球陆地比海洋冷，所以大陆上的等温线向南凸出。', ''),
    make('等温线向高纬方向凸出，说明这个地方的气温比同纬度其他地方怎样？', '偏高', ['偏低', '相同', '变化大'], '“凸高为高”：等温线向高纬凸出，说明这里气温比同纬度其他地方高，比如暖流经过的海区。', ''),
    make('南半球的等温线比北半球平直，主要原因是？', '南半球海洋面积大', ['南半球陆地面积大', '南半球纬度高', '南半球洋流少'], '海洋的性质比较单一，气温随纬度变化均匀，所以海洋面积大的南半球等温线比较平直。', ''),
    make('与地中海气候相对应的自然带是？', '亚热带常绿硬叶林带', ['亚热带常绿阔叶林带', '温带落叶阔叶林带', '热带草原带'], d('地中海气候'), '地中海气候'),
    make('与亚热带季风气候相对应的自然带是？', '亚热带常绿阔叶林带', ['亚热带常绿硬叶林带', '温带落叶阔叶林带', '热带季雨林带'], d('亚热带季风气候'), '亚热带季风气候'),
    make('与温带海洋性气候、温带季风气候相对应的自然带是？', '温带落叶阔叶林带', ['亚寒带针叶林带', '温带草原带', '亚热带常绿阔叶林带'], d('温带海洋性气候'), '温带海洋性气候'),
    make('受地转偏向力影响，北半球水平运动的物体向哪边偏？', '向右偏', ['向左偏', '不偏转', '向上偏'], '地转偏向力使水平运动的物体在北半球向右偏，南半球向左偏，赤道上不偏转。', ''),
    make('六大板块中，几乎全部是海洋的是？', '太平洋板块', plates, d('太平洋板块'), '太平洋板块'),
    make('按六大板块的划分，阿拉伯半岛属于哪个板块？', '印度洋板块', ['亚欧板块', '非洲板块', '太平洋板块'], d('印度洋板块'), '印度洋板块'),
    make('喜马拉雅山脉是哪两个板块碰撞挤压形成的？', '亚欧板块和印度洋板块', ['亚欧板块和太平洋板块', '非洲板块和印度洋板块', '亚欧板块和非洲板块'], d('喜马拉雅山脉'), '喜马拉雅山脉'),
    make('南北纬30°附近的气压带是？', '副热带高气压带', ['赤道低气压带', '副极地低气压带', '极地高气压带'], d('副热带高气压带（北）'), '副热带高气压带（北）'),
    make('南北纬60°附近的气压带是？', '副极地低气压带', ['赤道低气压带', '副热带高气压带', '极地高气压带'], d('副极地低气压带（北）'), '副极地低气压带（北）'),
    make('北半球盛行西风带的风向是？', '西南风', ['西北风', '东北风', '东南风'], d('盛行西风带（北）'), '盛行西风带（北）'),
    make('南半球盛行西风带的风向是？', '西北风', ['西南风', '东北风', '东南风'], d('盛行西风带（南）'), '盛行西风带（南）'),
    make('南半球低纬度信风带的风向是？', '东南风', ['东北风', '西南风', '西北风'], d('东南信风带'), '东南信风带'),
    make('世界上规模最大的洋流是？', '西风漂流', ['墨西哥湾暖流', '日本暖流', '秘鲁寒流'], d('西风漂流'), '西风漂流'),
    make('北印度洋的洋流在夏季的流动方向是？', '顺时针', ['逆时针', '自北向南', '自南向北'], d('北印度洋季风洋流'), '北印度洋季风洋流')
  ])
}

const TOPICS = [
  { id: 'mix', label: '综合', sub: '初中内容混合出题' },
  { id: 'grid', label: '经纬线和五带', sub: '半球、五带的划分' },
  { id: 'country', label: '国家', sub: '首都、所在大洲、经纬度定位' },
  { id: 'record', label: '世界之最和分界线', sub: '地形、河湖、海峡' },
  { id: 'zone', label: '高中 · 时区计算', sub: '由经度求时区，由时区求区时' },
  { id: 'physical', label: '高中 · 自然地理', sub: '洋流、渔场、板块、气压带和风带、气候类型' }
]

// 每次 10 题：按专题抽题，再打乱顺序
function build(topic) {
  const take = (list, n) => shuffle(list).slice(0, n)
  let list
  if (topic === 'grid') list = gridQuestions()
  else if (topic === 'country') list = [].concat(take(capitalQuestions(), 4), take(continentQuestions(), 3), take(coordQuestions(), 3))
  else if (topic === 'record') list = [].concat(take(recordQuestions(), 7), take(boundaryQuestions(), 3))
  else if (topic === 'zone') {
    const all = zoneQuestions()
    list = [].concat(take(all.filter(q => q.text.indexOf('经度') >= 0), 5), take(all.filter(q => q.text.indexOf('经度') < 0), 5))
  } else if (topic === 'physical') list = physicalQuestions()
  else {
    list = [].concat(take(gridQuestions(), 2), take(boundaryQuestions(), 1), take(recordQuestions(), 3), take(capitalQuestions(), 2), take(continentQuestions(), 2))
  }
  return take(list, 10)
}

module.exports = { build, TOPICS }
