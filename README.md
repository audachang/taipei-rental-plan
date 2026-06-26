# Taipei Rental Plan

這個專案用來規劃 2026/08 起光仁小學通學與第二居住點選擇。

## 目前成果

- `index.html`: 可直接開啟的互動比較網頁。
- `styles.css`: 介面樣式。
- `app.js`: 篩選、排序、權重計分、比較表與摘要產生邏輯。
- `data/options.js`: 候選居住點資料。現在是示範資料，後續應替換為實查房源與交通紀錄。
- `data/evidence.js`: 第一批資料來源、租金摘要與下一步採集清單。
- `data/rental-choices.js`: 目前最佳方案下的租賃選擇、看屋重點與外部連結。

## 線上部署

預計部署在 GitHub Pages：

```text
https://audachang.github.io/taipei-rental-plan/
```

## 使用方式

直接用瀏覽器開啟：

```text
C:\Users\audachang\Dropbox\09_AI-testing-sites\Codex\taipei-rental-plan\index.html
```

若之後需要接 API 或載入外部 JSON，可以再改成小型前端專案或啟動本機伺服器。

## 更新候選點

編輯 `data/options.js` 的 `window.RENTAL_OPTIONS`。每個候選點建議至少保留：

- `name`: 候選區域名稱。
- `district`: 行政區或生活圈。
- `rent`: 月租估計或實際房源租金。
- `commuteMinutes`: 平日早上到光仁小學的估計分鐘數。
- `walkMinutes`: 到主要交通節點或學校端步行時間。
- `transfers`: 轉乘次數。
- `pickupScore`: 接送便利性，1 到 5 分。
- `zhongliScore`: 往返中壢/中大北村便利性，1 到 5 分。
- `backupScore`: 雨天、臨時接送、計程車備援便利性，1 到 5 分。
- `livabilityScore`: 居住機能與家庭生活便利性，1 到 5 分。
- `risks`: 主要風險。
- `checks`: 現場勘查事項。

## 資料品質規則

不要把估計值和實測值混在一起。實測後請在 `evidence` 裡標示日期、時段、資料來源與是否為雨天/尖峰。

租屋平台連結是即時市場線索，不是穩定資料。每次看屋或決策前都要重新點開 `data/rental-choices.js` 裡的連結，確認房源仍存在、價格未變、地址可核對。

## 目前資料來源

- 臺北市實價周報：已匯入萬華、中正、大安的整戶租賃摘要。
- 新北市不動產實價登錄資訊-租賃案件：已列入來源清單，待補板橋、永和、中和摘要。
- 光仁小學官方網站：用來確認目的地地址。
