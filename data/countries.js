// 国家内容包：定位提示、讲解、追问都在这里。追问的 options 第一项是正确答案，显示时会打乱。
// flag 为空表示还没有国旗素材，这个国家只出地图题。quiz 为 false 的国家只能在地图和图鉴里看到，不出题。
const CONTENT_VERSION = 2   // 题目内容变了就加 1，旧的挑战码会提示“内容已更新”

const list = [
 {
  "id": "MEX",
  "name": "墨西哥",
  "en": "Mexico",
  "continent": "北美洲",
  "flag": "/images/flags/MEX.png",
  "quiz": true,
  "hint": "它在北美洲南部，北面与美国相邻",
  "explain": "墨西哥位于北美洲南部，北接美国，东临墨西哥湾，西临太平洋。",
  "follow": {
   "q": "墨西哥北面的邻国是？",
   "options": [
    "美国",
    "加拿大",
    "巴西"
   ]
  },
  "flagHint": "观察竖条的颜色和中央的图案",
  "flagExplain": "墨西哥国旗是绿、白、红三色竖条，中央有一只站在仙人掌上的鹰。",
  "flagFollow": {
   "q": "墨西哥国旗中央是什么图案？",
   "options": [
    "鹰和仙人掌",
    "枫叶",
    "太阳"
   ]
  }
 },
 {
  "id": "FRA",
  "name": "法国",
  "en": "France",
  "continent": "欧洲",
  "flag": "/images/flags/FRA.png",
  "quiz": true,
  "hint": "它在欧洲西部，西临大西洋",
  "explain": "法国位于欧洲西部，西临大西洋，南临地中海。",
  "follow": {
   "q": "法国南面濒临哪片海？",
   "options": [
    "地中海",
    "波罗的海",
    "红海"
   ]
  },
  "flagHint": "观察三条竖条的颜色顺序",
  "flagExplain": "法国国旗是蓝、白、红三色竖条。",
  "flagFollow": {
   "q": "法国国旗从旗杆一侧起的颜色顺序是？",
   "options": [
    "蓝、白、红",
    "红、白、蓝",
    "绿、白、红"
   ]
  }
 },
 {
  "id": "BRA",
  "name": "巴西",
  "en": "Brazil",
  "continent": "南美洲",
  "flag": "/images/flags/BRA.png",
  "quiz": true,
  "hint": "它在南美洲东部，东临大西洋",
  "explain": "巴西位于南美洲东部，东侧海岸面向大西洋，是南美洲面积最大的国家。",
  "follow": {
   "q": "巴西东侧濒临哪个大洋？",
   "options": [
    "大西洋",
    "太平洋",
    "印度洋"
   ]
  },
  "flagHint": "观察底色和中央的几何图形",
  "flagExplain": "巴西国旗是绿色底，中央有黄色菱形和蓝色圆形。",
  "flagFollow": {
   "q": "巴西国旗中央的黄色图形是？",
   "options": [
    "菱形",
    "三角形",
    "五角星"
   ]
  }
 },
 {
  "id": "ITA",
  "name": "意大利",
  "en": "Italy",
  "continent": "欧洲",
  "flag": "/images/flags/ITA.png",
  "quiz": true,
  "hint": "它在欧洲南部，形状像一只靴子",
  "explain": "意大利位于欧洲南部，亚平宁半岛伸入地中海，形状像一只靴子。",
  "follow": {
   "q": "意大利所在的半岛伸入哪片海？",
   "options": [
    "地中海",
    "北海",
    "黑海"
   ]
  },
  "flagHint": "和法国国旗很像，注意靠旗杆一侧的颜色",
  "flagExplain": "意大利国旗是绿、白、红三色竖条。",
  "flagFollow": {
   "q": "意大利国旗靠旗杆一侧是什么颜色？",
   "options": [
    "绿色",
    "蓝色",
    "红色"
   ]
  }
 },
 {
  "id": "CAN",
  "name": "加拿大",
  "en": "Canada",
  "continent": "北美洲",
  "flag": "/images/flags/CAN.png",
  "quiz": true,
  "hint": "它在北美洲北部，南面与美国相邻",
  "explain": "加拿大位于北美洲北部，南接美国，北临北冰洋。",
  "follow": {
   "q": "加拿大北面濒临哪个大洋？",
   "options": [
    "北冰洋",
    "印度洋",
    "大西洋"
   ]
  },
  "flagHint": "观察中央图案和左右色带",
  "flagExplain": "加拿大国旗两侧是红色竖带，中央白底上有一片红枫叶。",
  "flagFollow": {
   "q": "加拿大国旗中央是什么图案？",
   "options": [
    "枫叶",
    "五角星",
    "太阳"
   ]
  }
 },
 {
  "id": "EGY",
  "name": "埃及",
  "en": "Egypt",
  "continent": "非洲",
  "flag": "/images/flags/EGY.png",
  "quiz": true,
  "hint": "它在非洲东北部，北临地中海",
  "explain": "埃及位于非洲东北部，北临地中海，东临红海，尼罗河纵贯全境。",
  "follow": {
   "q": "埃及东面濒临哪片海？",
   "options": [
    "红海",
    "黑海",
    "里海"
   ]
  },
  "flagHint": "观察三条横条的颜色和中央的徽章",
  "flagExplain": "埃及国旗是红、白、黑三色横条，中央有一只金色的鹰。",
  "flagFollow": {
   "q": "埃及国旗的三种颜色自上而下是？",
   "options": [
    "红、白、黑",
    "黑、红、黄",
    "绿、白、红"
   ]
  }
 },
 {
  "id": "JPN",
  "name": "日本",
  "en": "Japan",
  "continent": "亚洲",
  "flag": "/images/flags/JPN.png",
  "quiz": true,
  "hint": "它是亚洲东部的岛国，在太平洋西北部",
  "explain": "日本是亚洲东部的岛国，位于太平洋西北部，由四个大岛和许多小岛组成。",
  "follow": {
   "q": "日本位于哪个大洋的西北部？",
   "options": [
    "太平洋",
    "大西洋",
    "印度洋"
   ]
  },
  "flagHint": "观察底色和中央的圆形",
  "flagExplain": "日本国旗是白色底，中央有一个红色圆形。",
  "flagFollow": {
   "q": "日本国旗中央的圆是什么颜色？",
   "options": [
    "红色",
    "蓝色",
    "黄色"
   ]
  }
 },
 {
  "id": "AUS",
  "name": "澳大利亚",
  "en": "Australia",
  "continent": "大洋洲",
  "flag": "/images/flags/AUS.png",
  "quiz": true,
  "hint": "它独占一块大陆，在南半球，东临太平洋",
  "explain": "澳大利亚位于南半球，独占澳大利亚大陆，东临太平洋，西临印度洋。",
  "follow": {
   "q": "澳大利亚西面濒临哪个大洋？",
   "options": [
    "印度洋",
    "大西洋",
    "北冰洋"
   ]
  },
  "flagHint": "观察左上角的小旗和白色的星",
  "flagExplain": "澳大利亚国旗是蓝色底，左上角有英国国旗图案，另有一颗大七角星和南十字星座。",
  "flagFollow": {
   "q": "澳大利亚国旗右侧的几颗星代表什么？",
   "options": [
    "南十字星座",
    "北斗七星",
    "猎户座"
   ]
  }
 },
 {
  "id": "ZAF",
  "name": "南非",
  "en": "South Africa",
  "continent": "非洲",
  "flag": "/images/flags/ZAF.png",
  "quiz": true,
  "hint": "它在非洲大陆的最南端",
  "explain": "南非位于非洲大陆最南端，西临大西洋，东临印度洋。",
  "follow": {
   "q": "南非位于非洲大陆的哪个方位？",
   "options": [
    "最南端",
    "最北端",
    "最西端"
   ]
  },
  "flagHint": "观察横放的“Y”形和六种颜色",
  "flagExplain": "南非国旗有一个横放的绿色“Y”形，共有红、白、蓝、绿、黄、黑六种颜色。",
  "flagFollow": {
   "q": "南非国旗中央横放的图形像哪个字母？",
   "options": [
    "Y",
    "X",
    "T"
   ]
  }
 },
 {
  "id": "DEU",
  "name": "德国",
  "en": "Germany",
  "continent": "欧洲",
  "flag": "/images/flags/DEU.png",
  "quiz": true,
  "hint": "它在欧洲中部，北临北海和波罗的海",
  "explain": "德国位于欧洲中部，北临北海和波罗的海，西面与法国相邻。",
  "follow": {
   "q": "德国位于欧洲的哪个部分？",
   "options": [
    "中部",
    "最南端",
    "最东端"
   ]
  },
  "flagHint": "观察三条横条的颜色顺序",
  "flagExplain": "德国国旗是黑、红、金三色横条。",
  "flagFollow": {
   "q": "德国国旗自上而下的颜色顺序是？",
   "options": [
    "黑、红、金",
    "红、白、黑",
    "金、红、黑"
   ]
  }
 },
 {
  "id": "ARG",
  "name": "阿根廷",
  "en": "Argentina",
  "continent": "南美洲",
  "flag": "/images/flags/ARG.png",
  "quiz": true,
  "hint": "它在南美洲南部，东临大西洋",
  "explain": "阿根廷位于南美洲南部，东临大西洋，西面隔安第斯山脉与智利相邻。",
  "follow": {
   "q": "阿根廷西面隔着安第斯山脉的邻国是？",
   "options": [
    "智利",
    "巴西",
    "乌拉圭"
   ]
  },
  "flagHint": "观察横条的颜色和中央的太阳",
  "flagExplain": "阿根廷国旗是浅蓝、白、浅蓝三条横条，中央有一个金色的太阳。",
  "flagFollow": {
   "q": "阿根廷国旗中央是什么图案？",
   "options": [
    "太阳",
    "月亮",
    "五角星"
   ]
  }
 },
 {
  "id": "PER",
  "name": "秘鲁",
  "en": "Peru",
  "continent": "南美洲",
  "flag": "/images/flags/PER.png",
  "quiz": true,
  "hint": "它在南美洲西部，西临太平洋",
  "explain": "秘鲁位于南美洲西部，西临太平洋，安第斯山脉纵贯南北。",
  "follow": {
   "q": "秘鲁西面濒临哪个大洋？",
   "options": [
    "太平洋",
    "大西洋",
    "印度洋"
   ]
  },
  "flagHint": "观察三条竖条的颜色",
  "flagExplain": "秘鲁国旗是红、白、红三条竖条。",
  "flagFollow": {
   "q": "秘鲁国旗中间的竖条是什么颜色？",
   "options": [
    "白色",
    "蓝色",
    "黄色"
   ]
  }
 },
 {
  "id": "CHL",
  "name": "智利",
  "en": "Chile",
  "continent": "南美洲",
  "flag": "/images/flags/CHL.png",
  "quiz": true,
  "hint": "它是南美洲西南部一个南北狭长的国家",
  "explain": "智利位于南美洲西南部，西临太平洋，东靠安第斯山脉，国土南北狭长。",
  "follow": {
   "q": "智利的国土形状有什么特点？",
   "options": [
    "南北狭长",
    "东西狭长",
    "近似圆形"
   ]
  },
  "flagHint": "观察左上角的方块和星",
  "flagExplain": "智利国旗上半部左侧是蓝色方块和一颗白色五角星，右侧为白色，下半部为红色。",
  "flagFollow": {
   "q": "智利国旗左上角的蓝色方块里有什么？",
   "options": [
    "一颗白色五角星",
    "一轮太阳",
    "一片枫叶"
   ]
  }
 },
 {
  "id": "COL",
  "name": "哥伦比亚",
  "en": "Colombia",
  "continent": "南美洲",
  "flag": "/images/flags/COL.png",
  "quiz": true,
  "hint": "它在南美洲西北角，同时濒临太平洋和加勒比海",
  "explain": "哥伦比亚位于南美洲西北部，北临加勒比海，西临太平洋。",
  "follow": {
   "q": "哥伦比亚北面濒临哪片海？",
   "options": [
    "加勒比海",
    "地中海",
    "红海"
   ]
  },
  "flagHint": "观察三条横条的宽度和颜色",
  "flagExplain": "哥伦比亚国旗是黄、蓝、红三色横条，其中黄色占一半宽度。",
  "flagFollow": {
   "q": "哥伦比亚国旗最宽的一条是什么颜色？",
   "options": [
    "黄色",
    "蓝色",
    "红色"
   ]
  }
 },
 {
  "id": "URY",
  "name": "乌拉圭",
  "en": "Uruguay",
  "continent": "南美洲",
  "flag": "/images/flags/URY.png",
  "quiz": true,
  "hint": "它在南美洲东南部，夹在巴西和阿根廷之间",
  "explain": "乌拉圭位于南美洲东南部，北接巴西，西邻阿根廷，东南临大西洋。",
  "follow": {
   "q": "乌拉圭夹在哪两个国家之间？",
   "options": [
    "巴西和阿根廷",
    "智利和秘鲁",
    "哥伦比亚和委内瑞拉"
   ]
  },
  "flagHint": "观察蓝白相间的横条和左上角的太阳",
  "flagExplain": "乌拉圭国旗是白蓝相间的九条横条，左上角有一个金色的太阳。",
  "flagFollow": {
   "q": "乌拉圭国旗左上角是什么图案？",
   "options": [
    "太阳",
    "五角星",
    "月亮"
   ]
  }
 },
 {
  "id": "USA",
  "name": "美国",
  "en": "United States",
  "continent": "北美洲",
  "flag": "/images/flags/USA.png",
  "quiz": true,
  "hint": "它在北美洲中部，北接加拿大，南接墨西哥",
  "explain": "美国本土位于北美洲中部，东临大西洋，西临太平洋。",
  "follow": {
   "q": "美国本土南面的邻国是？",
   "options": [
    "墨西哥",
    "加拿大",
    "古巴"
   ]
  },
  "flagHint": "观察横条和左上角的图案",
  "flagExplain": "美国国旗由红白相间的 13 道横条组成，左上角的蓝底上有 50 颗白色五角星。",
  "flagFollow": {
   "q": "美国国旗左上角的蓝底上有多少颗星？",
   "options": [
    "50 颗",
    "13 颗",
    "5 颗"
   ]
  }
 },
 {
  "id": "CHN",
  "name": "中国",
  "en": "China",
  "continent": "亚洲",
  "flag": "/images/flags/CHN.png",
  "quiz": true,
  "hint": "它在亚洲东部，东临太平洋",
  "explain": "中国位于亚洲东部、太平洋西岸。",
  "follow": {
   "q": "中国位于哪个大洲的东部？",
   "options": [
    "亚洲",
    "欧洲",
    "非洲"
   ]
  },
  "flagHint": "观察底色和左上角星星的数量",
  "flagExplain": "中国国旗是五星红旗，红色底，左上角有一大四小五颗黄色五角星。",
  "flagFollow": {
   "q": "中国国旗上一共有几颗五角星？",
   "options": [
    "五颗",
    "一颗",
    "四颗"
   ]
  }
 },
 {
  "id": "RUS",
  "name": "俄罗斯",
  "en": "Russia",
  "continent": "欧洲",
  "flag": "/images/flags/RUS.png",
  "quiz": true,
  "hint": "它地跨亚欧两洲，面积最大，北临北冰洋",
  "explain": "俄罗斯地跨亚洲和欧洲，北临北冰洋，是世界上面积最大的国家。",
  "follow": {
   "q": "俄罗斯北面濒临哪个大洋？",
   "options": [
    "北冰洋",
    "印度洋",
    "大西洋"
   ]
  },
  "flagHint": "观察三条横条的颜色顺序",
  "flagExplain": "俄罗斯国旗是白、蓝、红三色横条。",
  "flagFollow": {
   "q": "俄罗斯国旗从上到下的颜色顺序是？",
   "options": [
    "白、蓝、红",
    "红、白、蓝",
    "蓝、白、红"
   ]
  }
 },
 {
  "id": "IND",
  "name": "印度",
  "en": "India",
  "continent": "亚洲",
  "flag": "",
  "quiz": true,
  "hint": "它在亚洲南部，是一个伸入印度洋的半岛",
  "explain": "印度位于亚洲南部，主体在印度半岛上，南面是印度洋。",
  "follow": {
   "q": "印度南面是哪个大洋？",
   "options": [
    "印度洋",
    "太平洋",
    "大西洋"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "GBR",
  "name": "英国",
  "en": "United Kingdom",
  "continent": "欧洲",
  "flag": "/images/flags/GBR.png",
  "quiz": true,
  "hint": "它是欧洲西部的岛国，隔海与欧洲大陆相望",
  "explain": "英国是欧洲西部的岛国，东面隔北海、南面隔英吉利海峡与欧洲大陆相望。",
  "follow": {
   "q": "英国和欧洲大陆之间隔着什么？",
   "options": [
    "海峡和海",
    "高山",
    "沙漠"
   ]
  },
  "flagHint": "观察蓝底上的十字图案",
  "flagExplain": "英国国旗是蓝色底，上面叠着红色和白色的正十字与斜十字。",
  "flagFollow": {
   "q": "英国国旗的底色是？",
   "options": [
    "蓝色",
    "红色",
    "绿色"
   ]
  }
 },
 {
  "id": "ESP",
  "name": "西班牙",
  "en": "Spain",
  "continent": "欧洲",
  "flag": "",
  "quiz": true,
  "hint": "它在欧洲西南部的伊比利亚半岛上",
  "explain": "西班牙位于欧洲西南部的伊比利亚半岛，南面隔直布罗陀海峡与非洲相望。",
  "follow": {
   "q": "西班牙南面隔海峡相望的大洲是？",
   "options": [
    "非洲",
    "亚洲",
    "南美洲"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "VEN",
  "name": "委内瑞拉",
  "en": "Venezuela",
  "continent": "南美洲",
  "flag": "",
  "quiz": true,
  "hint": "它在南美洲北部，北临加勒比海",
  "explain": "委内瑞拉位于南美洲北部，北临加勒比海。",
  "follow": {
   "q": "委内瑞拉北面濒临哪片海？",
   "options": [
    "加勒比海",
    "地中海",
    "黑海"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "ECU",
  "name": "厄瓜多尔",
  "en": "Ecuador",
  "continent": "南美洲",
  "flag": "",
  "quiz": true,
  "hint": "它在南美洲西北部，赤道从国土上穿过",
  "explain": "厄瓜多尔位于南美洲西北部，西临太平洋，赤道横穿国境。",
  "follow": {
   "q": "哪条重要的纬线穿过厄瓜多尔？",
   "options": [
    "赤道",
    "北回归线",
    "南极圈"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "BOL",
  "name": "玻利维亚",
  "en": "Bolivia",
  "continent": "南美洲",
  "flag": "/images/flags/BOL.png",
  "quiz": true,
  "hint": "它是南美洲中部的内陆国",
  "explain": "玻利维亚位于南美洲中部，是没有海岸线的内陆国。",
  "follow": {
   "q": "玻利维亚有没有海岸线？",
   "options": [
    "没有，是内陆国",
    "有，临太平洋",
    "有，临大西洋"
   ]
  },
  "flagHint": "观察三条横条的颜色顺序",
  "flagExplain": "玻利维亚国旗是红、黄、绿三色横条。",
  "flagFollow": {
   "q": "玻利维亚国旗从上到下的颜色顺序是？",
   "options": [
    "红、黄、绿",
    "绿、黄、红",
    "黄、蓝、红"
   ]
  }
 },
 {
  "id": "PRY",
  "name": "巴拉圭",
  "en": "Paraguay",
  "continent": "南美洲",
  "flag": "",
  "quiz": true,
  "hint": "它是南美洲中部的内陆国，在巴西和阿根廷之间",
  "explain": "巴拉圭位于南美洲中部，是内陆国，周围是巴西、阿根廷和玻利维亚。",
  "follow": {
   "q": "巴拉圭是不是内陆国？",
   "options": [
    "是",
    "不是，临大西洋",
    "不是，临太平洋"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "GUY",
  "name": "圭亚那",
  "en": "Guyana",
  "continent": "南美洲",
  "flag": "",
  "quiz": false,
  "hint": "",
  "explain": "圭亚那位于南美洲北部，北临大西洋。",
  "follow": {
   "q": "",
   "options": []
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "SUR",
  "name": "苏里南",
  "en": "Suriname",
  "continent": "南美洲",
  "flag": "",
  "quiz": false,
  "hint": "",
  "explain": "苏里南位于南美洲北部，北临大西洋。",
  "follow": {
   "q": "",
   "options": []
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "MNG",
  "name": "蒙古",
  "en": "Mongolia",
  "continent": "亚洲",
  "flag": "",
  "quiz": true,
  "hint": "它是亚洲的内陆国，夹在中国和俄罗斯之间",
  "explain": "蒙古位于亚洲东部，是没有海岸线的内陆国，北邻俄罗斯，南邻中国。",
  "follow": {
   "q": "蒙古北面的邻国是？",
   "options": [
    "俄罗斯",
    "印度",
    "日本"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "KAZ",
  "name": "哈萨克斯坦",
  "en": "Kazakhstan",
  "continent": "亚洲",
  "flag": "",
  "quiz": true,
  "hint": "它在亚洲中部，是世界上面积最大的内陆国",
  "explain": "哈萨克斯坦位于亚洲中部，是世界上面积最大的内陆国，东面与中国相邻。",
  "follow": {
   "q": "哈萨克斯坦东面的邻国是？",
   "options": [
    "中国",
    "印度",
    "土耳其"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "IRN",
  "name": "伊朗",
  "en": "Iran",
  "continent": "亚洲",
  "flag": "",
  "quiz": true,
  "hint": "它在亚洲西部，北靠里海，南临波斯湾",
  "explain": "伊朗位于亚洲西部，北临里海，南临波斯湾。",
  "follow": {
   "q": "伊朗南面濒临哪个海湾？",
   "options": [
    "波斯湾",
    "孟加拉湾",
    "墨西哥湾"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "SAU",
  "name": "沙特阿拉伯",
  "en": "Saudi Arabia",
  "continent": "亚洲",
  "flag": "",
  "quiz": true,
  "hint": "它在亚洲西部的大半岛上，西临红海",
  "explain": "沙特阿拉伯位于亚洲西部，占阿拉伯半岛的大部分，西临红海，东临波斯湾。",
  "follow": {
   "q": "沙特阿拉伯西面濒临哪片海？",
   "options": [
    "红海",
    "黑海",
    "里海"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "TUR",
  "name": "土耳其",
  "en": "Türkiye",
  "continent": "亚洲",
  "flag": "/images/flags/TUR.png",
  "quiz": true,
  "hint": "它地跨亚欧两洲，北临黑海，南临地中海",
  "explain": "土耳其地跨亚洲和欧洲，大部分国土在亚洲西部，北临黑海，南临地中海。",
  "follow": {
   "q": "土耳其北面濒临哪片海？",
   "options": [
    "黑海",
    "红海",
    "波罗的海"
   ]
  },
  "flagHint": "观察底色和上面的月亮、星星",
  "flagExplain": "土耳其国旗是红色底，上面有一弯白色新月和一颗白色五角星。",
  "flagFollow": {
   "q": "土耳其国旗的底色是？",
   "options": [
    "红色",
    "绿色",
    "蓝色"
   ]
  }
 },
 {
  "id": "THA",
  "name": "泰国",
  "en": "Thailand",
  "continent": "亚洲",
  "flag": "/images/flags/THA.png",
  "quiz": true,
  "hint": "它在亚洲东南部的中南半岛中部，南面临海",
  "explain": "泰国位于亚洲东南部的中南半岛中部，南临泰国湾。",
  "follow": {
   "q": "泰国位于哪个半岛上？",
   "options": [
    "中南半岛",
    "阿拉伯半岛",
    "印度半岛"
   ]
  },
  "flagHint": "观察横条的颜色和宽窄",
  "flagExplain": "泰国国旗由红、白、蓝、白、红五条横条组成，中间的蓝条最宽。",
  "flagFollow": {
   "q": "泰国国旗中间最宽的横条是什么颜色？",
   "options": [
    "蓝色",
    "红色",
    "白色"
   ]
  }
 },
 {
  "id": "VNM",
  "name": "越南",
  "en": "Vietnam",
  "continent": "亚洲",
  "flag": "/images/flags/VNM.png",
  "quiz": true,
  "hint": "它在中南半岛东部，国土南北狭长，北面与中国相邻",
  "explain": "越南位于亚洲东南部的中南半岛东部，国土南北狭长，北面与中国相邻。",
  "follow": {
   "q": "越南北面的邻国是？",
   "options": [
    "中国",
    "印度",
    "泰国"
   ]
  },
  "flagHint": "观察底色和中央星星的数量",
  "flagExplain": "越南国旗是红色底，中央有一颗黄色五角星。",
  "flagFollow": {
   "q": "越南国旗上有几颗五角星？",
   "options": [
    "一颗",
    "五颗",
    "三颗"
   ]
  }
 },
 {
  "id": "IDN",
  "name": "印度尼西亚",
  "en": "Indonesia",
  "continent": "亚洲",
  "flag": "/images/flags/IDN.png",
  "quiz": true,
  "hint": "它是亚洲东南部的群岛国家，赤道从中间穿过",
  "explain": "印度尼西亚位于亚洲东南部，由许多岛屿组成，是世界上最大的群岛国家，地处太平洋和印度洋之间，赤道穿过国土。",
  "follow": {
   "q": "印度尼西亚位于哪两个大洋之间？",
   "options": [
    "太平洋和印度洋",
    "大西洋和印度洋",
    "太平洋和大西洋"
   ]
  },
  "flagHint": "观察两条横条的颜色和上下位置",
  "flagExplain": "印度尼西亚国旗是上红下白两条横条。",
  "flagFollow": {
   "q": "印度尼西亚国旗上半部分是什么颜色？",
   "options": [
    "红色",
    "白色",
    "蓝色"
   ]
  }
 },
 {
  "id": "PHL",
  "name": "菲律宾",
  "en": "Philippines",
  "continent": "亚洲",
  "flag": "",
  "quiz": true,
  "hint": "它是亚洲东南部的群岛国家，东临太平洋",
  "explain": "菲律宾是亚洲东南部的群岛国家，东临太平洋，西临南海。",
  "follow": {
   "q": "菲律宾东面濒临哪个大洋？",
   "options": [
    "太平洋",
    "印度洋",
    "大西洋"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "UKR",
  "name": "乌克兰",
  "en": "Ukraine",
  "continent": "欧洲",
  "flag": "/images/flags/UKR.png",
  "quiz": true,
  "hint": "它在欧洲东部，南临黑海",
  "explain": "乌克兰位于欧洲东部，南临黑海，东面与俄罗斯相邻。",
  "follow": {
   "q": "乌克兰南面濒临哪片海？",
   "options": [
    "黑海",
    "波罗的海",
    "北海"
   ]
  },
  "flagHint": "观察两条横条的颜色和上下位置",
  "flagExplain": "乌克兰国旗是上蓝下黄两条横条。",
  "flagFollow": {
   "q": "乌克兰国旗下半部分是什么颜色？",
   "options": [
    "黄色",
    "蓝色",
    "红色"
   ]
  }
 },
 {
  "id": "POL",
  "name": "波兰",
  "en": "Poland",
  "continent": "欧洲",
  "flag": "/images/flags/POL.png",
  "quiz": true,
  "hint": "它在欧洲中部，北临波罗的海，西面与德国相邻",
  "explain": "波兰位于欧洲中部，北临波罗的海，西面与德国相邻。",
  "follow": {
   "q": "波兰北面濒临哪片海？",
   "options": [
    "波罗的海",
    "地中海",
    "黑海"
   ]
  },
  "flagHint": "观察两条横条的颜色和上下位置",
  "flagExplain": "波兰国旗是上白下红两条横条。",
  "flagFollow": {
   "q": "波兰国旗上半部分是什么颜色？",
   "options": [
    "白色",
    "红色",
    "蓝色"
   ]
  }
 },
 {
  "id": "SWE",
  "name": "瑞典",
  "en": "Sweden",
  "continent": "欧洲",
  "flag": "/images/flags/SWE.png",
  "quiz": true,
  "hint": "它在欧洲北部的斯堪的纳维亚半岛东部，东临波罗的海",
  "explain": "瑞典位于欧洲北部的斯堪的纳维亚半岛东部，东临波罗的海，西面与挪威相邻。",
  "follow": {
   "q": "瑞典西面的邻国是？",
   "options": [
    "挪威",
    "波兰",
    "法国"
   ]
  },
  "flagHint": "观察底色和十字的颜色",
  "flagExplain": "瑞典国旗是蓝色底，上面有一个偏向旗杆一侧的黄色十字。",
  "flagFollow": {
   "q": "瑞典国旗上的十字是什么颜色？",
   "options": [
    "黄色",
    "红色",
    "白色"
   ]
  }
 },
 {
  "id": "NOR",
  "name": "挪威",
  "en": "Norway",
  "continent": "欧洲",
  "flag": "/images/flags/NOR.png",
  "quiz": true,
  "hint": "它在欧洲北部的斯堪的纳维亚半岛西部，海岸线曲折漫长",
  "explain": "挪威位于欧洲北部的斯堪的纳维亚半岛西部，西面濒临大西洋，东面与瑞典相邻。",
  "follow": {
   "q": "挪威东面的邻国是？",
   "options": [
    "瑞典",
    "德国",
    "西班牙"
   ]
  },
  "flagHint": "观察底色和十字的颜色",
  "flagExplain": "挪威国旗是红色底，上面有一个带白边的蓝色十字。",
  "flagFollow": {
   "q": "挪威国旗的底色是？",
   "options": [
    "红色",
    "蓝色",
    "白色"
   ]
  }
 },
 {
  "id": "ISL",
  "name": "冰岛",
  "en": "Iceland",
  "continent": "欧洲",
  "flag": "/images/flags/ISL.png",
  "quiz": true,
  "hint": "它是欧洲西北部的岛国，在北大西洋上，靠近北极圈",
  "explain": "冰岛是欧洲西北部的岛国，位于北大西洋，靠近北极圈。",
  "follow": {
   "q": "冰岛位于哪个大洋上？",
   "options": [
    "大西洋",
    "太平洋",
    "印度洋"
   ]
  },
  "flagHint": "观察底色和十字的颜色",
  "flagExplain": "冰岛国旗是蓝色底，上面有一个带白边的红色十字。",
  "flagFollow": {
   "q": "冰岛国旗的底色是？",
   "options": [
    "蓝色",
    "红色",
    "绿色"
   ]
  }
 },
 {
  "id": "DZA",
  "name": "阿尔及利亚",
  "en": "Algeria",
  "continent": "非洲",
  "flag": "",
  "quiz": true,
  "hint": "它在非洲北部，北临地中海，是非洲面积最大的国家",
  "explain": "阿尔及利亚位于非洲北部，北临地中海，是非洲面积最大的国家，南部是撒哈拉沙漠。",
  "follow": {
   "q": "阿尔及利亚北面濒临哪片海？",
   "options": [
    "地中海",
    "红海",
    "黑海"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "LBY",
  "name": "利比亚",
  "en": "Libya",
  "continent": "非洲",
  "flag": "",
  "quiz": true,
  "hint": "它在非洲北部，北临地中海，东面与埃及相邻",
  "explain": "利比亚位于非洲北部，北临地中海，东面与埃及相邻。",
  "follow": {
   "q": "利比亚东面的邻国是？",
   "options": [
    "埃及",
    "南非",
    "尼日利亚"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "SDN",
  "name": "苏丹",
  "en": "Sudan",
  "continent": "非洲",
  "flag": "/images/flags/SDN.png",
  "quiz": true,
  "hint": "它在非洲东北部，东临红海，北面与埃及相邻",
  "explain": "苏丹位于非洲东北部，东临红海，北面与埃及相邻，尼罗河从境内流过。",
  "follow": {
   "q": "苏丹东面濒临哪片海？",
   "options": [
    "红海",
    "地中海",
    "黑海"
   ]
  },
  "flagHint": "观察横条的颜色和旗杆一侧的三角形",
  "flagExplain": "苏丹国旗是红、白、黑三条横条，旗杆一侧有一个绿色三角形。",
  "flagFollow": {
   "q": "苏丹国旗旗杆一侧的三角形是什么颜色？",
   "options": [
    "绿色",
    "蓝色",
    "黄色"
   ]
  }
 },
 {
  "id": "ETH",
  "name": "埃塞俄比亚",
  "en": "Ethiopia",
  "continent": "非洲",
  "flag": "",
  "quiz": true,
  "hint": "它是非洲东部的内陆国，境内多高原",
  "explain": "埃塞俄比亚位于非洲东部，是没有海岸线的内陆国，境内多高原。",
  "follow": {
   "q": "埃塞俄比亚位于非洲的哪个部分？",
   "options": [
    "东部",
    "西部",
    "南部"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "NGA",
  "name": "尼日利亚",
  "en": "Nigeria",
  "continent": "非洲",
  "flag": "/images/flags/NGA.png",
  "quiz": true,
  "hint": "它在非洲西部，南临几内亚湾",
  "explain": "尼日利亚位于非洲西部，南临几内亚湾，是非洲人口最多的国家。",
  "follow": {
   "q": "尼日利亚南面濒临哪个海湾？",
   "options": [
    "几内亚湾",
    "波斯湾",
    "孟加拉湾"
   ]
  },
  "flagHint": "观察三条竖条的颜色",
  "flagExplain": "尼日利亚国旗是绿、白、绿三条竖条。",
  "flagFollow": {
   "q": "尼日利亚国旗中间的竖条是什么颜色？",
   "options": [
    "白色",
    "绿色",
    "红色"
   ]
  }
 },
 {
  "id": "COD",
  "name": "刚果（金）",
  "en": "DR Congo",
  "continent": "非洲",
  "flag": "",
  "quiz": true,
  "hint": "它在非洲中部，面积很大，赤道从北部穿过",
  "explain": "刚果（金）全称刚果民主共和国，位于非洲中部，赤道穿过国土北部，大部分国土在刚果盆地。",
  "follow": {
   "q": "哪条重要的纬线穿过刚果（金）？",
   "options": [
    "赤道",
    "北回归线",
    "南回归线"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "KEN",
  "name": "肯尼亚",
  "en": "Kenya",
  "continent": "非洲",
  "flag": "",
  "quiz": true,
  "hint": "它在非洲东部，赤道从中间穿过，东南临印度洋",
  "explain": "肯尼亚位于非洲东部，赤道横穿国土中部，东南濒临印度洋。",
  "follow": {
   "q": "肯尼亚东南面濒临哪个大洋？",
   "options": [
    "印度洋",
    "大西洋",
    "太平洋"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "TZA",
  "name": "坦桑尼亚",
  "en": "Tanzania",
  "continent": "非洲",
  "flag": "",
  "quiz": true,
  "hint": "它在非洲东部、赤道以南，东临印度洋",
  "explain": "坦桑尼亚位于非洲东部、赤道以南，东临印度洋，北面与肯尼亚相邻。",
  "follow": {
   "q": "坦桑尼亚北面的邻国是？",
   "options": [
    "肯尼亚",
    "埃及",
    "南非"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 },
 {
  "id": "MDG",
  "name": "马达加斯加",
  "en": "Madagascar",
  "continent": "非洲",
  "flag": "/images/flags/MDG.png",
  "quiz": true,
  "hint": "它是非洲大陆东南面印度洋上的岛国",
  "explain": "马达加斯加是非洲大陆东南面印度洋上的岛国，隔莫桑比克海峡与非洲大陆相望。",
  "follow": {
   "q": "马达加斯加位于哪个大洋上？",
   "options": [
    "印度洋",
    "大西洋",
    "北冰洋"
   ]
  },
  "flagHint": "观察旗杆一侧的竖条和右侧两条横条的颜色",
  "flagExplain": "马达加斯加国旗的旗杆一侧是白色竖条，右侧是上红下绿两条横条。",
  "flagFollow": {
   "q": "马达加斯加国旗旗杆一侧的竖条是什么颜色？",
   "options": [
    "白色",
    "红色",
    "绿色"
   ]
  }
 },
 {
  "id": "NZL",
  "name": "新西兰",
  "en": "New Zealand",
  "continent": "大洋洲",
  "flag": "",
  "quiz": true,
  "hint": "它是大洋洲的岛国，在澳大利亚的东南方",
  "explain": "新西兰是大洋洲的岛国，位于太平洋西南部、澳大利亚东南方，主要由北岛和南岛组成。",
  "follow": {
   "q": "新西兰位于哪个大洋上？",
   "options": [
    "太平洋",
    "印度洋",
    "大西洋"
   ]
  },
  "flagHint": "",
  "flagExplain": "",
  "flagFollow": {
   "q": "",
   "options": []
  }
 }
]

const byId = {}
list.forEach((c, i) => { c.index = i; byId[c.id] = c })

module.exports = {
  CONTENT_VERSION, list, byId,
  mapPool: list.filter(c => c.quiz),
  flagPool: list.filter(c => c.quiz && c.flag),
  CONTINENTS: ['亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲']
}
