window.DATA_EVIDENCE = {
  updatedAt: "2026-06-26",
  scope: "第一批資料只納入政府開放資料的租賃實價摘要；精確房源地址與早尖峰交通時間仍需逐筆實測。",
  sources: [
    {
      name: "臺北市實價周報",
      owner: "臺北市政府地政局",
      url: "https://data.taipei/dataset/detail?id=a9a97996-3a55-46c8-9076-e5ebdefad6dc",
      retrieved: "2026-06-26",
      coverage: "收錄至 2026-06-17，每 7 日更新",
      status: "已匯入臺北市候選區摘要"
    },
    {
      name: "新北市不動產實價登錄資訊-租賃案件",
      owner: "新北市政府地政局",
      url: "https://data.ntpc.gov.tw/datasets/18d62577-1d5f-4967-ab9c-d71faba8cde1",
      retrieved: "2026-06-26",
      coverage: "平台資料量 46,974 筆，欄位含鄉鎮市區、總額元、出租型態等",
      status: "待匯入板橋、永和、中和摘要"
    },
    {
      name: "光仁小學官方網站",
      owner: "天主教光仁小學",
      url: "https://www.kjes.tp.edu.tw/",
      retrieved: "2026-06-26",
      coverage: "校址：臺北市萬大路423巷15號",
      status: "已確認目的地"
    }
  ],
  rentBenchmarks: [
    {
      area: "萬華區",
      source: "臺北市實價周報",
      sampleCount: 25,
      medianRent: 30000,
      minRent: 10000,
      maxRent: 70000,
      note: "整棟(戶)出租；含續租與社宅代管案件，需再比對實際上市房源。"
    },
    {
      area: "中正區",
      source: "臺北市實價周報",
      sampleCount: 6,
      medianRent: 70000,
      minRent: 30000,
      maxRent: 150000,
      note: "樣本少且高總價離群值明顯，適合當壓力測試而非單一預算答案。"
    },
    {
      area: "大安區",
      source: "臺北市實價周報",
      sampleCount: 18,
      medianRent: 40000,
      minRent: 20000,
      maxRent: 180000,
      note: "用來輔助古亭/南門外溢選項；仍需以捷運站與學校端路線重算。"
    }
  ],
  collectionQueue: [
    "用新北市租賃案件資料補齊板橋、永和、中和的整戶租金摘要。",
    "對每個候選生活圈挑 3-5 個實際房源地址，重算到光仁小學的早尖峰到校時間。",
    "實測 7:00-7:50 到校、16:00-18:00 放學/下班回程，分別記錄雨天與一般天。",
    "把每筆房源的管理費、坪數、電梯、停車、可開伙與兒童生活風險納入比較。"
  ]
};
