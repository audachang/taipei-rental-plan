(function () {
  const options = window.RENTAL_OPTIONS || [];
  const evidence = window.DATA_EVIDENCE || {
    updatedAt: "",
    scope: "尚未載入資料來源。",
    sources: [],
    rentBenchmarks: [],
    collectionQueue: []
  };
  const rentalChoices = window.BEST_RENTAL_CHOICES || {
    updatedAt: "",
    bestOptionName: "最佳方案",
    scope: "尚未載入租賃選擇。",
    choices: [],
    links: []
  };
  const rentalCatalog = window.RENTAL_CHOICES_BY_OPTION || {
    updatedAt: rentalChoices.updatedAt,
    scope: rentalChoices.scope,
    options: {
      [rentalChoices.bestOptionId || "wanhua-longshan"]: {
        optionName: rentalChoices.bestOptionName,
        choices: rentalChoices.choices,
        links: rentalChoices.links
      }
    }
  };
  const state = {
    selected: new Set(options.slice(0, 3).map((option) => option.id)),
    sort: "score",
    filters: {
      rentLimit: 50000,
      commuteLimit: 40,
      buildingAgeLimit: 999,
      petFriendlyOnly: false,
      directOnly: false
    },
    mapHiddenChoices: new Set(),
    weights: {
      commute: 35,
      pickup: 20,
      rent: 15,
      zhongli: 10,
      backup: 10,
      livability: 10
    }
  };

  const elements = {
    rentLimit: document.querySelector("#rentLimit"),
    commuteLimit: document.querySelector("#commuteLimit"),
    buildingAgeLimit: document.querySelector("#buildingAgeLimit"),
    petFriendlyOnly: document.querySelector("#petFriendlyOnly"),
    directOnly: document.querySelector("#directOnly"),
    resetFilters: document.querySelector("#resetFilters"),
    cards: document.querySelector("#cards"),
    template: document.querySelector("#cardTemplate"),
    resultCount: document.querySelector("#resultCount"),
    bestName: document.querySelector("#bestName"),
    bestCommute: document.querySelector("#bestCommute"),
    bestRent: document.querySelector("#bestRent"),
    compareHead: document.querySelector("#compareHead"),
    compareBody: document.querySelector("#compareBody"),
    copySummary: document.querySelector("#copySummary"),
    weightTotal: document.querySelector("#weightTotal"),
    dataScope: document.querySelector("#dataScope"),
    dataUpdated: document.querySelector("#dataUpdated"),
    sourceList: document.querySelector("#sourceList"),
    rentBenchmarks: document.querySelector("#rentBenchmarks"),
    collectionQueue: document.querySelector("#collectionQueue"),
    tabs: document.querySelectorAll(".workspace-tab"),
    tabPanels: document.querySelectorAll(".tab-panel"),
    rentalCandidateName: document.querySelector("#rentalCandidateName"),
    rentalScope: document.querySelector("#rentalScope"),
    rentalUpdated: document.querySelector("#rentalUpdated"),
    rentalChoices: document.querySelector("#rentalChoices"),
    rentalSearchLinks: document.querySelector("#rentalSearchLinks"),
    rentalPreviewScope: document.querySelector("#rentalPreviewScope"),
    rentalPreviewList: document.querySelector("#rentalPreviewList"),
    showRentalDetails: document.querySelector("#showRentalDetails"),
    mapScope: document.querySelector("#mapScope"),
    mapUpdated: document.querySelector("#mapUpdated"),
    rentalMap: document.querySelector("#rentalMap"),
    mapRouteList: document.querySelector("#mapRouteList")
  };

  const schoolPoint = {
    name: "光仁小學",
    address: "台北市萬華區萬大路423巷15號",
    lat: 25.0213,
    lng: 121.5002
  };

  const rentalMapPoints = {
    "wanhua-xiyuan-3br": { lat: 25.0264, lng: 121.4990, label: "西園路二段" },
    "wanhua-juguang-3br": { lat: 25.0320, lng: 121.5024, label: "莒光路生活圈" },
    "wanhua-nanning-2br": { lat: 25.0360, lng: 121.5038, label: "南寧路生活圈" },
    "wanhua-newer-elevator": { lat: 25.0260, lng: 121.5015, label: "萬華電梯住宅搜尋" },
    "wanhua-market-scan": { lat: 25.0248, lng: 121.5008, label: "萬華家庭型掃描" },
    "ximen-hanzhong-2br": { lat: 25.0434, lng: 121.5072, label: "西門站周邊" },
    "xiaonanmen-elevator": { lat: 25.0365, lng: 121.5098, label: "小南門站周邊" },
    "zhongzheng-older-apartment": { lat: 25.0337, lng: 121.5120, label: "中正西側公寓" },
    "ximen-newer-studio-not-main": { lat: 25.0453, lng: 121.5100, label: "西門新屋齡搜尋" },
    "ximen-market-scan": { lat: 25.0406, lng: 121.5088, label: "西門/小南門掃描" },
    "guting-elevator-2br": { lat: 25.0263, lng: 121.5225, label: "古亭站周邊" },
    "nanmen-3br-family": { lat: 25.0328, lng: 121.5130, label: "南門市場生活圈" },
    "daan-guting-newer": { lat: 25.0253, lng: 121.5260, label: "大安/古亭新屋齡搜尋" },
    "guting-older-budget": { lat: 25.0293, lng: 121.5170, label: "古亭老公寓搜尋" },
    "guting-market-scan": { lat: 25.0280, lng: 121.5202, label: "古亭/南門掃描" },
    "banqiao-fuzhong-3br": { lat: 25.0084, lng: 121.4590, label: "府中站周邊" },
    "banqiao-xinpu-elevator": { lat: 25.0237, lng: 121.4688, label: "新埔站周邊" },
    "banqiao-station-family": { lat: 25.0144, lng: 121.4640, label: "板橋車站周邊" },
    "banqiao-older-budget": { lat: 25.0103, lng: 121.4562, label: "府中老公寓搜尋" },
    "banqiao-market-scan": { lat: 25.0160, lng: 121.4645, label: "板橋家庭型掃描" },
    "dingxi-2br-elevator": { lat: 25.0136, lng: 121.5154, label: "頂溪站周邊" },
    "yongan-family-3br": { lat: 25.0024, lng: 121.5117, label: "永安市場周邊" },
    "zhonghe-newer-2br": { lat: 24.9934, lng: 121.5062, label: "中和新屋齡搜尋" },
    "yonghe-older-budget": { lat: 25.0100, lng: 121.5133, label: "永和老公寓搜尋" },
    "dingxi-yongan-market-scan": { lat: 25.0056, lng: 121.5112, label: "頂溪/永安市場掃描" }
  };

  const mapState = {
    map: null,
    layers: null
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function scoreOption(option) {
    const weights = state.weights;
    const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
    const commuteScore = clamp(5 - (option.commuteMinutes - 10) / 8, 1, 5);
    const rentScore = clamp(5 - (option.rent - 35000) / 8000, 1, 5);
    const weighted =
      commuteScore * weights.commute +
      option.pickupScore * weights.pickup +
      rentScore * weights.rent +
      option.zhongliScore * weights.zhongli +
      option.backupScore * weights.backup +
      option.livabilityScore * weights.livability;

    return Math.round((weighted / totalWeight) * 20);
  }

  function getFilteredOptions() {
    return options
      .filter((option) => option.rent <= state.filters.rentLimit)
      .filter((option) => option.commuteMinutes <= state.filters.commuteLimit)
      .filter((option) => !state.filters.directOnly || option.transfers === 0)
      .map((option) => ({ ...option, score: scoreOption(option) }))
      .sort((a, b) => {
        if (state.sort === "commute") return a.commuteMinutes - b.commuteMinutes;
        if (state.sort === "rent") return a.rent - b.rent;
        return b.score - a.score;
      });
  }

  function getBestOption(filteredOptions) {
    if (filteredOptions.length === 0) return null;
    return filteredOptions.reduce((winner, option) => {
      return option.score > winner.score ? option : winner;
    }, filteredOptions[0]);
  }

  function getRentalGroup(optionId) {
    return rentalCatalog.options[optionId] || {
      optionName: "未設定方案",
      choices: [],
      links: []
    };
  }

  function isPetFriendlyCandidate(choice) {
    return ["yes", "candidate"].includes(choice.petPolicyStatus);
  }

  function getFilteredRentalChoices(optionId) {
    return getRentalGroup(optionId).choices.filter((choice) => {
      const ageMatch = choice.buildingAgeYears <= state.filters.buildingAgeLimit;
      const petMatch = !state.filters.petFriendlyOnly || isPetFriendlyCandidate(choice);
      return ageMatch && petMatch;
    });
  }

  function getRentalFilterLabel(prefix) {
    const ageLabel = state.filters.buildingAgeLimit === 999 ? "屋齡不限" : `${prefix || ""}屋齡 ${state.filters.buildingAgeLimit} 年內`;
    const petLabel = state.filters.petFriendlyOnly ? "寵物友善候選" : "寵物不限";
    return `${ageLabel}，${petLabel}`;
  }

  function formatRent(value) {
    return `NT$${Math.round(value / 1000)}k`;
  }

  function formatCurrency(value) {
    return `NT$${Math.round(value).toLocaleString("en-US")}`;
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
    const heading = document.createElement("h3");
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

  function renderCards(filteredOptions) {
    elements.cards.innerHTML = "";

    if (filteredOptions.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "目前沒有符合條件的候選點。請放寬租金、通學時間或轉乘限制。";
      elements.cards.append(empty);
      return;
    }

    filteredOptions.forEach((option) => {
      const node = elements.template.content.firstElementChild.cloneNode(true);
      const checkbox = node.querySelector("input");
      const title = node.querySelector(".select-option span");
      const score = node.querySelector(".score-badge");
      const meta = node.querySelector(".option-meta");
      const metrics = node.querySelector(".metrics");
      const tags = node.querySelector(".tag-list");
      const detailGrid = node.querySelector(".detail-grid");

      checkbox.checked = state.selected.has(option.id);
      checkbox.setAttribute("aria-label", `選取 ${option.name} 進行比較`);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) state.selected.add(option.id);
        else state.selected.delete(option.id);
        render();
      });

      title.textContent = option.name;
      score.textContent = `${option.score}`;
      meta.textContent = `${option.district} · ${option.type} · ${option.transit}`;

      metrics.append(
        metric("到校", option.commuteRange),
        metric("月租", option.rentLabel),
        metric("轉乘", `${option.transfers} 次`),
        metric("步行", `${option.walkMinutes} 分`)
      );

      option.strengths.forEach((strength) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = strength;
        tags.append(tag);
      });

      detailGrid.append(
        listBlock("主要風險", option.risks),
        listBlock("現場勘查", option.checks)
      );

      elements.cards.append(node);
    });
  }

  function renderSummary(filteredOptions) {
    elements.resultCount.textContent = `${filteredOptions.length} 個候選方案符合目前條件`;

    if (filteredOptions.length === 0) {
      elements.bestName.textContent = "-";
      elements.bestCommute.textContent = "-";
      elements.bestRent.textContent = "-";
      return;
    }

    const best = getBestOption(filteredOptions);

    elements.bestName.textContent = `${best.name} (${best.score})`;
    elements.bestCommute.textContent = best.commuteRange;
    elements.bestRent.textContent = best.rentLabel;
  }

  function renderCompareTable() {
    const selected = options
      .filter((option) => state.selected.has(option.id))
      .map((option) => ({ ...option, score: scoreOption(option) }))
      .sort((a, b) => b.score - a.score);

    const rows = [
      ["總分", (option) => option.score],
      ["行政區", (option) => option.district],
      ["定位", (option) => option.type],
      ["月租估計", (option) => option.rentLabel],
      ["到校時間", (option) => option.commuteRange],
      ["代表路線", (option) => option.route],
      ["接送便利", (option) => `${option.pickupScore}/5`],
      ["中壢往返", (option) => `${option.zhongliScore}/5`],
      ["備援能力", (option) => `${option.backupScore}/5`],
      ["生活品質", (option) => `${option.livabilityScore}/5`],
      ["資料狀態", (option) => option.evidence]
    ];

    elements.compareHead.innerHTML = "";
    elements.compareBody.innerHTML = "";

    const headRow = document.createElement("tr");
    const first = document.createElement("th");
    first.textContent = "項目";
    headRow.append(first);

    selected.forEach((option) => {
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
      selected.forEach((option) => {
        const td = document.createElement("td");
        td.textContent = getter(option);
        tr.append(td);
      });
      elements.compareBody.append(tr);
    });
  }

  function renderSources() {
    elements.dataScope.textContent = evidence.scope;
    elements.dataUpdated.textContent = `更新 ${evidence.updatedAt || "-"}`;
    elements.sourceList.innerHTML = "";

    evidence.sources.forEach((source) => {
      const card = document.createElement("article");
      const heading = document.createElement("h3");
      const meta = document.createElement("p");
      const link = document.createElement("a");
      const status = document.createElement("span");

      heading.textContent = source.name;
      meta.textContent = `${source.owner} · ${source.coverage}`;
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "來源";
      status.textContent = source.status;

      card.className = "source-card";
      status.className = "status-pill subtle";
      card.append(heading, meta, link, status);
      elements.sourceList.append(card);
    });
  }

  function renderRentBenchmarks() {
    elements.rentBenchmarks.innerHTML = "";

    evidence.rentBenchmarks.forEach((benchmark) => {
      const tr = document.createElement("tr");
      const range = `${formatCurrency(benchmark.minRent)}-${formatCurrency(benchmark.maxRent)}`;
      [
        benchmark.area,
        `${benchmark.sampleCount} 筆`,
        formatCurrency(benchmark.medianRent),
        range,
        benchmark.note
      ].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });
      elements.rentBenchmarks.append(tr);
    });
  }

  function renderCollectionQueue() {
    elements.collectionQueue.innerHTML = "";

    evidence.collectionQueue.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      elements.collectionQueue.append(li);
    });
  }

  function makeExternalLink(label, url, className) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = label;
    if (className) link.className = className;
    return link;
  }

  function getSchoolWalkEstimate(choice, optionId) {
    if (choice.schoolWalkDistanceLabel && choice.schoolWalkMinutesLabel) {
      return {
        distance: choice.schoolWalkDistanceLabel,
        minutes: choice.schoolWalkMinutesLabel,
        basis: choice.schoolWalkBasis || "以房源地址估計"
      };
    }

    const fallback = {
      "wanhua-longshan": ["約 0.8-2.0 km", "約 12-30 分", "以萬華近校生活圈估計"],
      "ximen-xiaonanmen": ["約 2.0-3.5 km", "約 30-52 分", "以西門/小南門生活圈估計"],
      "guting-nanmen": ["約 3.5-5.0 km", "約 50-75 分", "以古亭/南門生活圈估計"],
      "banqiao-fuzhong": ["約 6.0-8.5 km", "約 90-130 分", "跨河步行不建議，主要供距離感參考"],
      "dingxi-yongan": ["約 4.5-6.5 km", "約 65-100 分", "跨河步行不建議，主要供距離感參考"]
    }[optionId] || ["待精確地址", "待精確地址", "需取得完整門牌"];

    return {
      distance: fallback[0],
      minutes: fallback[1],
      basis: fallback[2]
    };
  }

  function getSchoolWalkUrl(choice) {
    const origin = encodeURIComponent(`${choice.location} ${choice.title}`);
    const destination = encodeURIComponent("台北市萬華區萬大路423巷15號 光仁小學");
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  }

  function getMapPanelVisible() {
    const panel = document.querySelector("#panel-map");
    return Boolean(panel && !panel.hidden);
  }

  function getRouteItems() {
    const items = [];
    options.forEach((option) => {
      getFilteredRentalChoices(option.id).forEach((choice) => {
        const point = rentalMapPoints[choice.id];
        if (!point) return;
        items.push({
          option,
          choice,
          point,
          walk: getSchoolWalkEstimate(choice, option.id)
        });
      });
    });
    return items;
  }

  function getVisibleRouteItems(routeItems) {
    return routeItems.filter((item) => !state.mapHiddenChoices.has(item.choice.id));
  }

  function makeMapIcon(type) {
    return window.L.divIcon({
      className: `map-div-icon ${type}-map-icon`,
      html: '<span class="map-pin" aria-hidden="true"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  function createRoutePopup(item) {
    const popup = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("p");
    const basis = document.createElement("p");
    const route = makeExternalLink("Google 步行路線", getSchoolWalkUrl(item.choice), "secondary-link");

    popup.className = "map-popup";
    title.textContent = item.choice.title;
    meta.textContent = `${item.option.name} · ${item.point.label} · ${item.walk.distance} / ${item.walk.minutes} · ${item.choice.petPolicyLabel || "寵物條件待確認"}`;
    basis.textContent = item.walk.basis;
    popup.append(title, meta, basis, route);
    return popup;
  }

  function ensureMapInitialized() {
    if (!elements.rentalMap || !window.L) return false;
    if (mapState.map) return true;

    mapState.map = window.L.map(elements.rentalMap, {
      scrollWheelZoom: false
    }).setView([schoolPoint.lat, schoolPoint.lng], 13);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapState.map);

    mapState.layers = window.L.layerGroup().addTo(mapState.map);
    window.L.marker([schoolPoint.lat, schoolPoint.lng], { icon: makeMapIcon("school") })
      .bindPopup(`<strong>${schoolPoint.name}</strong><br>${schoolPoint.address}`)
      .addTo(mapState.map);

    return true;
  }

  function renderMapRouteList(routeItems) {
    elements.mapRouteList.innerHTML = "";

    if (routeItems.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state compact";
      empty.textContent = "目前租賃條件下沒有可呈現的地圖項目，請放寬屋齡或寵物篩選。";
      elements.mapRouteList.append(empty);
      return;
    }

    routeItems.forEach((item) => {
      const row = document.createElement("article");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      const text = document.createElement("div");
      const title = document.createElement("h3");
      const meta = document.createElement("p");
      const route = makeExternalLink("Google 步行路線", getSchoolWalkUrl(item.choice), "secondary-link");

      row.className = "map-route-row";
      label.className = "map-toggle";
      checkbox.type = "checkbox";
      checkbox.checked = !state.mapHiddenChoices.has(item.choice.id);
      checkbox.setAttribute("aria-label", `在地圖顯示 ${item.choice.title}`);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) state.mapHiddenChoices.delete(item.choice.id);
        else state.mapHiddenChoices.add(item.choice.id);
        renderRouteMap(getRouteItems());
      });
      title.textContent = item.choice.title;
      meta.textContent = `${item.option.name} · ${item.point.label} · 到校步行 ${item.walk.distance}，${item.walk.minutes} · ${item.choice.petPolicyLabel || "寵物條件待確認"}`;
      text.append(title, meta);
      label.append(checkbox, text);
      row.append(label, route);
      elements.mapRouteList.append(row);
    });
  }

  function renderRouteMap(routeItems) {
    const visibleRouteItems = getVisibleRouteItems(routeItems);
    const filterLabel = getRentalFilterLabel("");
    elements.mapScope.textContent = `${rentalCatalog.scope} 目前條件：${filterLabel}；地圖顯示 ${visibleRouteItems.length} / ${routeItems.length} 筆。`;
    elements.mapUpdated.textContent = `更新 ${rentalCatalog.updatedAt || "-"}`;
    renderMapRouteList(routeItems);

    if (!getMapPanelVisible()) return;

    if (!ensureMapInitialized()) {
      elements.rentalMap.textContent = "地圖套件未載入；下方仍保留每筆 Google 步行路線連結。";
      return;
    }

    mapState.layers.clearLayers();
    const bounds = window.L.latLngBounds([[schoolPoint.lat, schoolPoint.lng]]);

    visibleRouteItems.forEach((item) => {
      const marker = window.L.marker([item.point.lat, item.point.lng], { icon: makeMapIcon("rental") })
        .bindPopup(createRoutePopup(item));

      marker.addTo(mapState.layers);
      bounds.extend([item.point.lat, item.point.lng]);
    });

    mapState.map.invalidateSize();
    if (visibleRouteItems.length > 0) {
      mapState.map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
    } else {
      mapState.map.setView([schoolPoint.lat, schoolPoint.lng], 13);
    }
  }

  function renderRentalPreview(bestOption) {
    elements.rentalPreviewList.innerHTML = "";
    if (!window.RENTAL_CHOICES_BY_OPTION && !window.BEST_RENTAL_CHOICES) {
      elements.rentalPreviewScope.textContent = "租屋資料尚未載入，請重新整理頁面。";
      const empty = document.createElement("div");
      empty.className = "empty-state compact";
      empty.textContent = "租屋資料檔未載入；若剛更新過頁面，請重新整理或清除快取。";
      elements.rentalPreviewList.append(empty);
      return;
    }

    if (!bestOption) {
      elements.rentalPreviewScope.textContent = "目前沒有符合條件的方案。";
      return;
    }

    const choices = getFilteredRentalChoices(bestOption.id).slice(0, 3);
    const filterLabel = getRentalFilterLabel("");
    elements.rentalPreviewScope.textContent = `${bestOption.name} · ${filterLabel} · 顯示 ${choices.length} 筆`;

    if (choices.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state compact";
      empty.textContent = "目前條件下沒有租屋選擇，請放寬屋齡、寵物篩選，或切到完整細項檢查其他方案。";
      elements.rentalPreviewList.append(empty);
      return;
    }

    choices.forEach((choice) => {
      const walk = getSchoolWalkEstimate(choice, bestOption.id);
      const row = document.createElement("article");
      const title = document.createElement("h3");
      const meta = document.createElement("p");
      const link = makeExternalLink("開啟房源", choice.url, "primary-link");
      const route = makeExternalLink("步行路線", getSchoolWalkUrl(choice), "secondary-link");
      const actions = document.createElement("div");

      row.className = "rental-preview-row";
      actions.className = "inline-actions";
      title.textContent = choice.title;
      meta.textContent = `${choice.rentLabel} · ${choice.layout} · ${choice.size} · ${choice.buildingAgeLabel} · ${choice.petPolicyLabel || "寵物條件待確認"} · 到校步行 ${walk.distance}`;
      actions.append(link, route);
      row.append(title, meta, actions);
      elements.rentalPreviewList.append(row);
    });
  }

  function renderRentalChoices() {
    const filterLabel = getRentalFilterLabel("只看");
    elements.rentalCandidateName.textContent = "各方案租賃選擇";
    elements.rentalScope.textContent = `${rentalCatalog.scope} 目前條件：${filterLabel}。`;
    elements.rentalUpdated.textContent = `更新 ${rentalCatalog.updatedAt || "-"}`;
    elements.rentalChoices.innerHTML = "";
    elements.rentalSearchLinks.innerHTML = "";

    if (!window.RENTAL_CHOICES_BY_OPTION && !window.BEST_RENTAL_CHOICES) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "租屋資料檔未載入；請重新整理頁面或清除瀏覽器快取。";
      elements.rentalChoices.append(empty);
      return;
    }

    options.forEach((option) => {
      const group = getRentalGroup(option.id);
      const choices = getFilteredRentalChoices(option.id);
      const groupNode = document.createElement("section");
      const heading = document.createElement("div");
      const title = document.createElement("h3");
      const count = document.createElement("span");
      const list = document.createElement("div");
      const links = document.createElement("div");

      groupNode.className = "rental-option-group";
      heading.className = "rental-group-heading";
      count.className = "status-pill subtle";
      list.className = "rental-choice-list";
      links.className = "link-strip";

      title.textContent = group.optionName || option.name;
      count.textContent = `${choices.length} / 5 筆符合`;
      heading.append(title, count);
      groupNode.append(heading);

      if (choices.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state compact";
        empty.textContent = "目前屋齡或寵物條件下沒有符合的租屋選擇。";
        list.append(empty);
      }

      choices.forEach((choice) => {
        list.append(renderRentalCard(choice, option.id));
      });

      group.links.forEach((item) => {
        links.append(makeExternalLink(item.label, item.url, "source-link"));
      });

      groupNode.append(list, links);
      elements.rentalChoices.append(groupNode);
    });
  }

  function renderRentalCard(choice, optionId) {
    const card = document.createElement("article");
    const top = document.createElement("div");
    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    const meta = document.createElement("p");
    const fit = document.createElement("span");
    const metrics = document.createElement("dl");
    const detail = document.createElement("div");
    const action = document.createElement("p");
    const routeLinks = document.createElement("div");
    const walk = getSchoolWalkEstimate(choice, optionId);

    card.className = "rental-card";
    top.className = "rental-card-top";
    fit.className = "fit-badge";
    metrics.className = "rental-metrics";
    detail.className = "rental-detail-grid";
    action.className = "next-action";
    routeLinks.className = "inline-actions";

    title.textContent = choice.title;
    meta.textContent = `${choice.sourceName} · ${choice.location}`;
    fit.textContent = `家庭適配 ${choice.familyFit}`;
    titleWrap.append(title, meta);
    top.append(titleWrap, fit);

    [
      ["月租", choice.rentLabel],
      ["格局", choice.layout],
      ["坪數", choice.size],
      ["樓層", choice.floor],
      ["屋齡", choice.buildingAgeLabel],
      ["寵物", choice.petPolicyLabel || "待房東確認"],
      ["到校步行", walk.distance],
      ["步行時間", walk.minutes],
      ["距離", choice.distanceLabel],
      ["通學判斷", choice.commuteFit]
    ].forEach(([label, value]) => {
      metrics.append(metric(label, value));
    });

    detail.append(
      listBlock("優點", choice.highlights),
      listBlock("風險", choice.risks)
    );

    action.textContent = choice.nextAction;
    routeLinks.append(
      makeExternalLink("開啟房源", choice.url, "primary-link"),
      makeExternalLink("Google 步行路線", getSchoolWalkUrl(choice), "secondary-link")
    );

    card.append(
      top,
      metrics,
      detail,
      action,
      routeLinks
    );
    return card;
  }

  function activateTab(tabName) {
    elements.tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", `${isActive}`);
    });

    elements.tabPanels.forEach((panel) => {
      const isActive = panel.id === `panel-${tabName}`;
      panel.classList.toggle("active", isActive);
      panel.hidden = !isActive;
    });

    if (tabName === "map") {
      renderRouteMap(getRouteItems());
      window.setTimeout(() => {
        if (mapState.map) mapState.map.invalidateSize();
      }, 0);
    }
  }

  function updateWeightLabels() {
    const total = Object.values(state.weights).reduce((sum, value) => sum + value, 0);
    elements.weightTotal.textContent = `${total}%`;
    document.querySelectorAll(".weight").forEach((input) => {
      input.nextElementSibling.textContent = input.value;
    });
  }

  function buildSummaryText() {
    const ranked = getFilteredOptions().slice(0, 3);
    if (ranked.length === 0) return "目前沒有符合條件的候選方案。";

    const lines = [
      "台北第二居住點候選摘要",
      `篩選條件：月租上限 ${formatRent(state.filters.rentLimit)}，到校上限 ${state.filters.commuteLimit} 分`,
      ""
    ];

    ranked.forEach((option, index) => {
      lines.push(
        `${index + 1}. ${option.name}：${option.score} 分`,
        `   到校 ${option.commuteRange}；月租 ${option.rentLabel}；路線 ${option.route}`,
        `   主要風險：${option.risks.join("；")}`,
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
        elements.copySummary.textContent = "複製摘要";
      }, 1600);
    } catch (_error) {
      window.prompt("複製以下摘要", text);
    }
  }

  function render() {
    updateWeightLabels();
    const filteredOptions = getFilteredOptions();
    const bestOption = getBestOption(filteredOptions);
    renderSummary(filteredOptions);
    renderCards(filteredOptions);
    renderCompareTable();
    renderSources();
    renderRentBenchmarks();
    renderCollectionQueue();
    renderRentalPreview(bestOption);
    renderRentalChoices();
    renderRouteMap(getRouteItems());
  }

  elements.rentLimit.addEventListener("change", (event) => {
    state.filters.rentLimit = Number(event.target.value);
    render();
  });

  elements.commuteLimit.addEventListener("change", (event) => {
    state.filters.commuteLimit = Number(event.target.value);
    render();
  });

  elements.buildingAgeLimit.addEventListener("change", (event) => {
    state.filters.buildingAgeLimit = Number(event.target.value);
    render();
  });

  elements.petFriendlyOnly.addEventListener("change", (event) => {
    state.filters.petFriendlyOnly = event.target.checked;
    render();
  });

  elements.directOnly.addEventListener("change", (event) => {
    state.filters.directOnly = event.target.checked;
    render();
  });

  elements.resetFilters.addEventListener("click", () => {
    state.filters = {
      rentLimit: 50000,
      commuteLimit: 40,
      buildingAgeLimit: 999,
      petFriendlyOnly: false,
      directOnly: false
    };
    elements.rentLimit.value = "50000";
    elements.commuteLimit.value = "40";
    elements.buildingAgeLimit.value = "999";
    elements.petFriendlyOnly.checked = false;
    elements.directOnly.checked = false;
    state.mapHiddenChoices.clear();
    render();
  });

  document.querySelectorAll(".weight").forEach((input) => {
    input.addEventListener("input", (event) => {
      state.weights[event.target.dataset.key] = Number(event.target.value);
      render();
    });
  });

  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.sort = button.dataset.sort;
      render();
    });
  });

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });

  elements.showRentalDetails.addEventListener("click", () => {
    activateTab("rentals");
    document.querySelector("#panel-rentals").scrollIntoView({ block: "start", behavior: "smooth" });
  });

  elements.copySummary.addEventListener("click", copySummary);

  render();
})();
