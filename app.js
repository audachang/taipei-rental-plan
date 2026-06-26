(function () {
  const baseOptions = (window.RENTAL_OPTIONS || []).map((option) => ({
    ...option,
    sourceType: "已整理候選",
    recommendation: option.strengths[0] || "可納入比較",
    caution: option.risks[0] || "需以實際地址驗證"
  }));

  const evidence = window.DATA_EVIDENCE || { rentBenchmarks: [] };

  const regionPresets = [
    {
      aliases: ["萬華", "萬華區", "龍山寺", "西園", "萬大路", "萬華車站"],
      option: {
        name: "萬華近校生活圈",
        district: "萬華區",
        type: "近校優先",
        rent: 40000,
        rentLabel: "NT$30k-50k",
        commuteMinutes: 14,
        commuteRange: "10-22 分",
        walkMinutes: 8,
        transfers: 0,
        pickupScore: 5,
        zhongliScore: 3,
        backupScore: 5,
        livabilityScore: 3,
        quietScore: 2,
        route: "步行、公車或短程計程車到光仁小學",
        transit: "公車、步行、計程車",
        strengths: ["通學最穩", "臨時接送成本低", "接送反應時間短"],
        risks: ["街廓品質差異大", "部分路段噪音與車流較高"],
        checks: ["早上 7:10 實走到校", "晚上確認街廓照明", "比較校門周邊臨停壓力"],
        recommendation: "若核心目標是降低每日通學變數，這類區域通常最有利。",
        caution: "要用實際巷弄排除噪音、潮濕與夜間安全落差。"
      }
    },
    {
      aliases: ["中正", "中正區", "西門", "小南門", "北門", "台北車站", "臺北車站"],
      option: {
        name: "中正西側 / 西門小南門",
        district: "中正區 / 萬華邊界",
        type: "都心折衷",
        rent: 54000,
        rentLabel: "NT$45k-70k",
        commuteMinutes: 22,
        commuteRange: "15-32 分",
        walkMinutes: 8,
        transfers: 0,
        pickupScore: 4,
        zhongliScore: 4,
        backupScore: 5,
        livabilityScore: 4,
        quietScore: 3,
        route: "短程計程車、公車或捷運銜接",
        transit: "捷運、公車、計程車",
        strengths: ["交通選項多", "往台北車站與中壢轉接方便", "生活機能完整"],
        risks: ["租金較高", "商圈人流與噪音需避開"],
        checks: ["夜間走一次住宅周邊", "確認住宅用途不是商辦混用", "估算固定計程車備援成本"],
        recommendation: "適合需要兼顧通學、台北車站轉接與都心機能的折衷方案。",
        caution: "租金和環境安靜度要逐棟看，不能只看捷運站名。"
      }
    },
    {
      aliases: ["古亭", "南門", "大安", "大安區", "東門", "師大"],
      option: {
        name: "古亭 / 南門 / 大安邊界",
        district: "中正區 / 大安區",
        type: "生活品質優先",
        rent: 60000,
        rentLabel: "NT$50k-85k",
        commuteMinutes: 32,
        commuteRange: "24-45 分",
        walkMinutes: 10,
        transfers: 1,
        pickupScore: 3,
        zhongliScore: 4,
        backupScore: 4,
        livabilityScore: 5,
        quietScore: 4,
        route: "捷運、公車或計程車到萬華",
        transit: "捷運、公車",
        strengths: ["生活品質穩", "教育與日常資源好", "住宅街廓相對成熟"],
        risks: ["到校時間比近校不穩", "同預算坪數可能縮小"],
        checks: ["實測 7:00 到校", "比較同租金坪數", "確認放學回程是否遇尖峰壅塞"],
        recommendation: "適合把日常生活品質放得比通學最短更高的方案。",
        caution: "需確認早尖峰和放學回程，不宜只用平日離峰時間估算。"
      }
    },
    {
      aliases: ["板橋", "府中", "新埔", "板橋車站", "江子翠"],
      option: {
        name: "板橋府中 / 新埔",
        district: "新北市板橋區",
        type: "空間預算折衷",
        rent: 43000,
        rentLabel: "NT$35k-55k",
        commuteMinutes: 38,
        commuteRange: "30-50 分",
        walkMinutes: 11,
        transfers: 1,
        pickupScore: 2,
        zhongliScore: 4,
        backupScore: 3,
        livabilityScore: 4,
        quietScore: 3,
        route: "板南線轉公車/步行或計程車",
        transit: "捷運、公車、台鐵",
        strengths: ["同預算空間可能較好", "跨城交通強", "生活機能完整"],
        risks: ["接送反應時間較長", "雨天與臨時狀況成本較高"],
        checks: ["早尖峰實測到校", "確認步行到捷運站時間", "比較計程車備援成本"],
        recommendation: "適合用較好的空間與跨城交通，交換較長的接送反應時間。",
        caution: "只保留能穩定 45 分內到校的精確地址。"
      }
    },
    {
      aliases: ["永和", "中和", "頂溪", "永安市場", "景安"],
      option: {
        name: "頂溪 / 永安市場 / 中和",
        district: "新北市永和區 / 中和區",
        type: "生活機能折衷",
        rent: 45000,
        rentLabel: "NT$34k-58k",
        commuteMinutes: 36,
        commuteRange: "28-50 分",
        walkMinutes: 10,
        transfers: 1,
        pickupScore: 2,
        zhongliScore: 3,
        backupScore: 3,
        livabilityScore: 5,
        quietScore: 3,
        route: "中和新蘆線轉乘、公車或過河計程車",
        transit: "捷運、公車、計程車",
        strengths: ["採買便利", "租屋供給多", "生活機能密集"],
        risks: ["過河尖峰變異大", "臨時接送不如台北端"],
        checks: ["測雨天計程車等待", "早尖峰過河實測", "確認巷弄停車與接送點"],
        recommendation: "適合重視生活機能與租金彈性，但願意承擔過河時間變異的情境。",
        caution: "過河路線必須用雨天與尖峰情境驗證。"
      }
    },
    {
      aliases: ["信義", "信義區", "市政府", "永春", "象山"],
      option: {
        name: "信義 / 市政府生活圈",
        district: "臺北市信義區",
        type: "都心機能高租金",
        rent: 65000,
        rentLabel: "NT$55k-95k",
        commuteMinutes: 42,
        commuteRange: "35-55 分",
        walkMinutes: 9,
        transfers: 1,
        pickupScore: 2,
        zhongliScore: 3,
        backupScore: 4,
        livabilityScore: 5,
        quietScore: 3,
        route: "捷運板南線/公車銜接萬華",
        transit: "捷運、公車、計程車",
        strengths: ["生活與工作機能強", "新屋齡供給較多", "交通備援多"],
        risks: ["租金壓力高", "到校距離偏長", "商圈噪音需篩街廓"],
        checks: ["確認早尖峰車程", "比較租金與坪數", "避開大型商圈噪音街廓"],
        recommendation: "除非工作或生活重心明確在信義，否則通學與租金通常不如西側方案。",
        caution: "需避免用高租金買到較長且不穩的通學時間。"
      }
    },
    {
      aliases: ["松山", "松山區", "南京復興", "小巨蛋", "民生社區"],
      option: {
        name: "松山 / 南京復興 / 民生社區",
        district: "臺北市松山區",
        type: "生活品質高但距離較遠",
        rent: 58000,
        rentLabel: "NT$48k-80k",
        commuteMinutes: 43,
        commuteRange: "34-58 分",
        walkMinutes: 10,
        transfers: 1,
        pickupScore: 2,
        zhongliScore: 3,
        backupScore: 4,
        livabilityScore: 5,
        quietScore: 4,
        route: "捷運或公車跨市中心到萬華",
        transit: "捷運、公車、計程車",
        strengths: ["住宅環境成熟", "生活品質好", "家庭日常資源多"],
        risks: ["通學距離偏長", "租金不低", "尖峰穿越市中心時間變異"],
        checks: ["早上 7:00 實測", "比較雨天車程", "確認離捷運站步行距離"],
        recommendation: "適合強烈偏好安定住宅環境，但需要接受較弱的通學效率。",
        caution: "若到校穩定性是核心，松山通常需要很強的房源優勢才值得保留。"
      }
    },
    {
      aliases: ["士林", "北投", "天母", "石牌", "芝山"],
      option: {
        name: "士林 / 北投 / 天母",
        district: "臺北市士林區 / 北投區",
        type: "環境品質優先",
        rent: 56000,
        rentLabel: "NT$45k-85k",
        commuteMinutes: 55,
        commuteRange: "45-70 分",
        walkMinutes: 12,
        transfers: 1,
        pickupScore: 1,
        zhongliScore: 2,
        backupScore: 3,
        livabilityScore: 5,
        quietScore: 5,
        route: "捷運淡水信義線轉乘或車行",
        transit: "捷運、公車、計程車",
        strengths: ["環境與空間感較好", "家庭生活品質高", "安靜街廓較多"],
        risks: ["到校時間長", "臨時接送反應慢", "跨城往返不利"],
        checks: ["只保留特殊理由房源", "測尖峰到校", "估算長期接送疲勞"],
        recommendation: "除非家庭生活重心在北側，否則作為光仁通學第二居住點的效率偏弱。",
        caution: "需把每日通學負擔量化，避免被環境品質單點吸引。"
      }
    }
  ];

  const defaultRegion = {
    district: "待判定",
    type: "初估區域",
    rent: 52000,
    rentLabel: "NT$45k-65k",
    commuteMinutes: 42,
    commuteRange: "35-55 分",
    walkMinutes: 10,
    transfers: 1,
    pickupScore: 2,
    zhongliScore: 3,
    backupScore: 3,
    livabilityScore: 3,
    quietScore: 3,
    route: "需以實際地址查 Google Maps 與尖峰時間",
    transit: "待查",
    strengths: ["可先納入比較", "需要用實際地址校正"],
    risks: ["目前只有名稱推估", "租金與通學時間可能偏差大"],
    checks: ["取得候選房源門牌", "重算早尖峰到校時間", "確認租金、屋齡與生活機能"],
    recommendation: "這是初估卡，適合先放入比較清單，後續要用實際地址替換。",
    caution: "未有精確房源或交通實測前，不應作為最終決策。"
  };

  const priorityWeights = {
    balanced: { commute: 32, pickup: 18, rent: 18, zhongli: 10, backup: 12, livability: 10 },
    commute: { commute: 45, pickup: 25, rent: 10, zhongli: 5, backup: 10, livability: 5 },
    rent: { commute: 24, pickup: 12, rent: 34, zhongli: 8, backup: 10, livability: 12 },
    livability: { commute: 22, pickup: 10, rent: 12, zhongli: 8, backup: 13, livability: 35 },
    zhongli: { commute: 25, pickup: 12, rent: 12, zhongli: 31, backup: 10, livability: 10 }
  };

  const state = {
    optionPool: [...baseOptions],
    selected: new Set(baseOptions.slice(0, 3).map((option) => option.id)),
    sort: "score",
    priority: "balanced",
    filters: {
      rentLimit: 60000,
      commuteLimit: 45
    }
  };

  const elements = {
    addRegionForm: document.querySelector("#addRegionForm"),
    regionInput: document.querySelector("#regionInput"),
    regionSuggestions: document.querySelector("#regionSuggestions"),
    addRegionStatus: document.querySelector("#addRegionStatus"),
    selectedRegions: document.querySelector("#selectedRegions"),
    resetRegions: document.querySelector("#resetRegions"),
    priority: document.querySelector("#priority"),
    rentLimit: document.querySelector("#rentLimit"),
    commuteLimit: document.querySelector("#commuteLimit"),
    cards: document.querySelector("#cards"),
    template: document.querySelector("#cardTemplate"),
    resultCount: document.querySelector("#resultCount"),
    bestName: document.querySelector("#bestName"),
    bestReason: document.querySelector("#bestReason"),
    bestCaution: document.querySelector("#bestCaution"),
    compareHead: document.querySelector("#compareHead"),
    compareBody: document.querySelector("#compareBody"),
    copySummary: document.querySelector("#copySummary")
  };

  function slugify(text) {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u4e00-\u9fff-]/g, "");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function makeOptionId(name) {
    return `custom-${slugify(name) || Date.now()}`;
  }

  function getRentBenchmark(option) {
    return evidence.rentBenchmarks?.find((benchmark) => {
      return option.district.includes(benchmark.area) || option.name.includes(benchmark.area);
    });
  }

  function createOptionFromPreset(input, preset) {
    const id = makeOptionId(input);
    return {
      ...preset.option,
      id,
      name: preset.option.name,
      sourceType: "名稱推估",
      evidence: `由「${input}」對應到生活圈模板；需用實際地址校正。`
    };
  }

  function createDefaultOption(input) {
    return {
      ...defaultRegion,
      id: makeOptionId(input),
      name: input,
      sourceType: "初估",
      evidence: `由使用者輸入「${input}」建立；尚未連結實價與交通資料。`
    };
  }

  function findExistingOption(input) {
    const normalized = input.trim().toLowerCase();
    return state.optionPool.find((option) => {
      return option.name.toLowerCase() === normalized || option.district.toLowerCase() === normalized;
    });
  }

  function inferOption(input) {
    const trimmed = input.trim();
    const existing = findExistingOption(trimmed);
    if (existing) return existing;

    const preset = regionPresets.find((item) => item.aliases.some((alias) => trimmed.includes(alias) || alias.includes(trimmed)));
    if (preset) return createOptionFromPreset(trimmed, preset);
    return createDefaultOption(trimmed);
  }

  function scoreOption(option) {
    const weights = priorityWeights[state.priority] || priorityWeights.balanced;
    const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
    const commuteScore = clamp(5 - (option.commuteMinutes - 10) / 9, 1, 5);
    const rentScore = clamp(5 - (option.rent - 32000) / 9000, 1, 5);
    const weighted =
      commuteScore * weights.commute +
      option.pickupScore * weights.pickup +
      rentScore * weights.rent +
      option.zhongliScore * weights.zhongli +
      option.backupScore * weights.backup +
      option.livabilityScore * weights.livability;

    return Math.round((weighted / totalWeight) * 20);
  }

  function getSelectedOptions() {
    return state.optionPool
      .filter((option) => state.selected.has(option.id))
      .map((option) => ({ ...option, score: scoreOption(option) }));
  }

  function getVisibleOptions() {
    return getSelectedOptions()
      .filter((option) => option.rent <= state.filters.rentLimit)
      .filter((option) => option.commuteMinutes <= state.filters.commuteLimit)
      .sort((a, b) => {
        if (state.sort === "commute") return a.commuteMinutes - b.commuteMinutes;
        if (state.sort === "rent") return a.rent - b.rent;
        return b.score - a.score;
      });
  }

  function getBestOption(options) {
    if (options.length === 0) return null;
    return options.reduce((winner, option) => (option.score > winner.score ? option : winner), options[0]);
  }

  function formatRent(value) {
    return `NT$${Math.round(value / 1000)}k`;
  }

  function metric(label, value) {
    const wrapper = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    wrapper.append(dt, dd);
    return wrapper;
  }

  function listBlock(title, items) {
    const block = document.createElement("div");
    const heading = document.createElement("h4");
    const list = document.createElement("ul");
    heading.textContent = title;
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });
    block.append(heading, list);
    return block;
  }

  function getRecommendationLabel(option) {
    if (option.score >= 82) return "優先看屋";
    if (option.score >= 70) return "保留比較";
    if (option.score >= 58) return "需特定房源優勢";
    return "低優先";
  }

  function renderSuggestions() {
    const labels = new Set();
    baseOptions.forEach((option) => {
      labels.add(option.name);
      labels.add(option.district);
    });
    regionPresets.forEach((preset) => preset.aliases.forEach((alias) => labels.add(alias)));
    elements.regionSuggestions.innerHTML = "";
    [...labels].sort((a, b) => a.localeCompare(b, "zh-Hant")).forEach((label) => {
      const option = document.createElement("option");
      option.value = label;
      elements.regionSuggestions.append(option);
    });
  }

  function renderSelectedRegions() {
    const selectedOptions = getSelectedOptions();
    elements.selectedRegions.innerHTML = "";

    if (selectedOptions.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "尚未選擇區域。";
      elements.selectedRegions.append(empty);
      return;
    }

    selectedOptions.forEach((option) => {
      const chip = document.createElement("button");
      chip.className = "region-chip";
      chip.type = "button";
      chip.textContent = `${option.name} ×`;
      chip.setAttribute("aria-label", `移除 ${option.name}`);
      chip.addEventListener("click", () => {
        state.selected.delete(option.id);
        render();
      });
      elements.selectedRegions.append(chip);
    });
  }

  function renderSummary(visibleOptions) {
    const selectedCount = state.selected.size;
    const hiddenCount = selectedCount - visibleOptions.length;
    elements.resultCount.textContent = `${visibleOptions.length} 個區域符合條件${hiddenCount > 0 ? `，${hiddenCount} 個被篩選隱藏` : ""}`;

    const best = getBestOption(visibleOptions);
    if (!best) {
      elements.bestName.textContent = "-";
      elements.bestReason.textContent = "目前沒有符合條件的區域，請放寬租金或通學時間上限。";
      elements.bestCaution.textContent = "-";
      return;
    }

    elements.bestName.textContent = `${best.name} (${best.score} 分，${getRecommendationLabel(best)})`;
    elements.bestReason.textContent = best.recommendation || best.strengths.join("、");
    elements.bestCaution.textContent = best.caution || best.risks[0] || "需以實際地址驗證。";
  }

  function renderCards(visibleOptions) {
    elements.cards.innerHTML = "";

    if (visibleOptions.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "目前沒有符合條件的區域。請新增區域，或放寬月租與到校時間限制。";
      elements.cards.append(empty);
      return;
    }

    visibleOptions.forEach((option) => {
      const benchmark = getRentBenchmark(option);
      const node = elements.template.content.firstElementChild.cloneNode(true);
      const title = node.querySelector("h3");
      const score = node.querySelector(".score-badge");
      const meta = node.querySelector(".option-meta");
      const metrics = node.querySelector(".metrics");
      const recommendationText = node.querySelector(".recommendation-text");
      const tags = node.querySelector(".tag-list");
      const detailGrid = node.querySelector(".detail-grid");

      title.textContent = option.name;
      score.textContent = `${option.score}`;
      meta.textContent = `${option.district} · ${option.type} · ${option.sourceType || "候選區域"}`;

      metrics.append(
        metric("到校", option.commuteRange),
        metric("月租", option.rentLabel),
        metric("轉乘", `${option.transfers} 次`),
        metric("接送", `${option.pickupScore}/5`)
      );

      const rec = document.createElement("p");
      rec.textContent = `${getRecommendationLabel(option)}：${option.recommendation || option.strengths[0]}`;
      recommendationText.append(rec);

      [...option.strengths, benchmark ? `${benchmark.area} 實價中位 ${formatRent(benchmark.medianRent)}` : "需補租金樣本"].slice(0, 4).forEach((strength) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = strength;
        tags.append(tag);
      });

      detailGrid.append(
        listBlock("主要風險", option.risks),
        listBlock("現場驗證", option.checks)
      );

      elements.cards.append(node);
    });
  }

  function renderCompareTable(visibleOptions) {
    const rows = [
      ["推薦分數", (option) => `${option.score} (${getRecommendationLabel(option)})`],
      ["行政區 / 生活圈", (option) => option.district],
      ["定位", (option) => option.type],
      ["月租估計", (option) => option.rentLabel],
      ["到校時間", (option) => option.commuteRange],
      ["代表路線", (option) => option.route],
      ["接送便利", (option) => `${option.pickupScore}/5`],
      ["中壢往返", (option) => `${option.zhongliScore}/5`],
      ["備援能力", (option) => `${option.backupScore}/5`],
      ["生活品質", (option) => `${option.livabilityScore}/5`],
      ["主要風險", (option) => option.risks.join("；")],
      ["資料狀態", (option) => option.evidence || "候選區域初估，需實測。"]
    ];

    elements.compareHead.innerHTML = "";
    elements.compareBody.innerHTML = "";

    const headRow = document.createElement("tr");
    const first = document.createElement("th");
    first.textContent = "項目";
    headRow.append(first);
    visibleOptions.forEach((option) => {
      const th = document.createElement("th");
      th.textContent = option.name;
      headRow.append(th);
    });
    elements.compareHead.append(headRow);

    rows.forEach(([label, getter]) => {
      const tr = document.createElement("tr");
      const th = document.createElement("td");
      th.textContent = label;
      tr.append(th);
      visibleOptions.forEach((option) => {
        const td = document.createElement("td");
        td.textContent = getter(option);
        tr.append(td);
      });
      elements.compareBody.append(tr);
    });
  }

  function buildSummaryText() {
    const ranked = getVisibleOptions().slice(0, 4);
    if (ranked.length === 0) return "目前沒有符合條件的區域。";

    const lines = [
      "台北居住區域推薦摘要",
      `偏好：${elements.priority.options[elements.priority.selectedIndex].textContent}`,
      `篩選：月租上限 ${formatRent(state.filters.rentLimit)}；到校上限 ${state.filters.commuteLimit} 分`,
      ""
    ];

    ranked.forEach((option, index) => {
      lines.push(
        `${index + 1}. ${option.name}：${option.score} 分，${getRecommendationLabel(option)}`,
        `   到校 ${option.commuteRange}；月租 ${option.rentLabel}；${option.recommendation || option.strengths[0]}`,
        `   驗證重點：${option.checks.join("；")}`,
        ""
      );
    });

    return lines.join("\n");
  }

  async function copySummary() {
    const text = buildSummaryText();
    try {
      await navigator.clipboard.writeText(text);
      elements.copySummary.textContent = "已複製";
      window.setTimeout(() => {
        elements.copySummary.textContent = "複製推薦摘要";
      }, 1600);
    } catch (_error) {
      window.prompt("複製以下摘要", text);
    }
  }

  function addRegion(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      elements.addRegionStatus.textContent = "請先輸入區域名稱。";
      return;
    }

    const inferred = inferOption(trimmed);
    const duplicate = state.optionPool.find((option) => {
      return option.id === inferred.id || option.name === inferred.name;
    });

    const option = duplicate || inferred;
    if (!duplicate) state.optionPool.push(option);
    state.selected.add(option.id);
    elements.regionInput.value = "";
    elements.addRegionStatus.textContent = duplicate ? `${option.name} 已在比較清單中。` : `已新增 ${option.name}。`;
    render();
  }

  function render() {
    const visibleOptions = getVisibleOptions();
    renderSelectedRegions();
    renderSummary(visibleOptions);
    renderCards(visibleOptions);
    renderCompareTable(visibleOptions);
  }

  elements.addRegionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addRegion(elements.regionInput.value);
  });

  elements.resetRegions.addEventListener("click", () => {
    state.selected = new Set(baseOptions.slice(0, 3).map((option) => option.id));
    state.optionPool = [...baseOptions];
    elements.addRegionStatus.textContent = "已回到預設三個比較區域。";
    render();
  });

  elements.priority.addEventListener("change", (event) => {
    state.priority = event.target.value;
    render();
  });

  elements.rentLimit.addEventListener("change", (event) => {
    state.filters.rentLimit = Number(event.target.value);
    render();
  });

  elements.commuteLimit.addEventListener("change", (event) => {
    state.filters.commuteLimit = Number(event.target.value);
    render();
  });

  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.sort = button.dataset.sort;
      render();
    });
  });

  elements.copySummary.addEventListener("click", copySummary);

  renderSuggestions();
  render();
})();
