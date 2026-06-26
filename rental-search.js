(function () {
  const rentalData = window.RENTAL_CHOICES_BY_OPTION || { options: {} };
  const areaEntries = Object.entries(rentalData.options || {});

  const sourceCatalog = [
    {
      group: "租屋平台",
      sources: [
        { label: "591 租屋", mode: "direct", base: "https://rent.591.com.tw/list?kind=1&keywords=" },
        { label: "樂屋網", mode: "google", domain: "rent.rakuya.com.tw" },
        { label: "好房網租屋", mode: "google", domain: "rent.housefun.com.tw" },
        { label: "房價網出租", mode: "google", domain: "rent.houseprice.tw" }
      ]
    },
    {
      group: "大型房仲",
      sources: [
        { label: "永慶房屋", mode: "google", domain: "yungching.com.tw" },
        { label: "信義房屋", mode: "google", domain: "sinyi.com.tw" },
        { label: "住商不動產", mode: "google", domain: "hbhousing.com.tw" },
        { label: "台灣房屋", mode: "google", domain: "taiwanhouse.com.tw" }
      ]
    },
    {
      group: "補充仲介與社群",
      sources: [
        { label: "中信房屋", mode: "google", domain: "cthouse.com.tw" },
        { label: "太平洋房屋", mode: "google", domain: "pacific.com.tw" },
        { label: "有巢氏房屋", mode: "google", domain: "u-trust.com.tw" },
        { label: "Google 全網補查", mode: "google" }
      ]
    }
  ];

  const elements = {
    areaSelect: document.querySelector("#areaSelect"),
    areaScope: document.querySelector("#areaScope"),
    rentLimit: document.querySelector("#searchRentLimit"),
    roomLimit: document.querySelector("#roomLimit"),
    agePreference: document.querySelector("#agePreference"),
    priority: document.querySelector("#listingPriority"),
    selectedAreaName: document.querySelector("#selectedAreaName"),
    searchStrategy: document.querySelector("#searchStrategy"),
    sourceCount: document.querySelector("#sourceCount"),
    sourceGroups: document.querySelector("#sourceGroups"),
    listingCount: document.querySelector("#listingCount"),
    listingCards: document.querySelector("#listingCards"),
    openPrimarySearches: document.querySelector("#openPrimarySearches"),
    copySearchBrief: document.querySelector("#copySearchBrief"),
    copyShortlist: document.querySelector("#copyShortlist"),
    sourceGroupTemplate: document.querySelector("#sourceGroupTemplate"),
    listingTemplate: document.querySelector("#listingTemplate")
  };

  const state = {
    areaId: areaEntries[0]?.[0] || "",
    filters: {
      rentLimit: Number(elements.rentLimit.value),
      rooms: Number(elements.roomLimit.value),
      agePreference: elements.agePreference.value,
      priority: elements.priority.value
    }
  };

  function getArea() {
    return rentalData.options[state.areaId] || areaEntries[0]?.[1] || { optionName: "未設定", choices: [], links: [] };
  }

  function areaKeywords(area) {
    return `${area.optionName} 整層 2房 3房 租屋 家庭`;
  }

  function buildSearchUrl(source, area) {
    const query = areaKeywords(area);
    if (source.mode === "direct") return `${source.base}${encodeURIComponent(query)}`;
    const site = source.domain ? `site:${source.domain} ` : "";
    return `https://www.google.com/search?q=${encodeURIComponent(`${site}${query}`)}`;
  }

  function formatRent(value) {
    return `NT$${Math.round(value / 1000)}k`;
  }

  function parseRentCeiling(label) {
    const values = [...label.matchAll(/([0-9]{2,3}(?:,[0-9]{3})?)/g)].map((match) => Number(match[1].replace(/,/g, "")));
    if (values.length > 0) return Math.max(...values);
    const compact = [...label.matchAll(/([0-9]+)k/gi)].map((match) => Number(match[1]) * 1000);
    return compact.length ? Math.max(...compact) : 999999;
  }

  function parseRooms(layout) {
    const matches = [...layout.matchAll(/([0-9]+)\s*房/g)].map((match) => Number(match[1]));
    return matches.length ? Math.max(...matches) : 0;
  }

  function fitScore(value) {
    if (value === "高") return 18;
    if (value === "中高") return 14;
    if (value === "中") return 9;
    if (value === "篩選入口") return 8;
    return 4;
  }

  function scoreChoice(choice) {
    const rentCeiling = parseRentCeiling(choice.rentLabel);
    const rooms = parseRooms(choice.layout);
    const age = choice.buildingAgeYears || 999;
    const priority = state.filters.priority;
    let score = 48;

    score += fitScore(choice.familyFit);
    score += rentCeiling <= state.filters.rentLimit ? 13 : -12;
    score += rooms >= state.filters.rooms ? 10 : -14;
    score += age <= 20 ? 8 : age <= 30 ? 5 : age <= 40 ? 1 : -4;
    score += choice.petPolicyStatus === "candidate" ? 3 : 0;
    score += choice.sourceName.includes("搜尋") || choice.id.includes("scan") ? 2 : 5;

    if (priority === "commute") score += choice.commuteFit.includes("短程") || choice.commuteFit.includes("近校") ? 12 : -2;
    if (priority === "space") score += rooms >= 3 || choice.size.includes("32") || choice.size.includes("40") ? 12 : -2;
    if (priority === "newer") score += age <= 20 || choice.floor.includes("電梯") ? 12 : -3;
    if (priority === "budget") score += rentCeiling <= state.filters.rentLimit ? 12 : -8;

    if (state.filters.agePreference !== "any") {
      const maxAge = Number(state.filters.agePreference);
      score += age <= maxAge ? 7 : -6;
    }

    return Math.max(1, Math.min(100, score));
  }

  function recommendationLabel(score) {
    if (score >= 82) return "優先聯絡";
    if (score >= 70) return "保留看屋";
    if (score >= 58) return "條件符合再追";
    return "低優先";
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

  function getRankedChoices() {
    return getArea().choices
      .map((choice) => ({ ...choice, score: scoreChoice(choice) }))
      .sort((a, b) => b.score - a.score);
  }

  function renderAreas() {
    elements.areaSelect.innerHTML = "";
    areaEntries.forEach(([id, area]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = area.optionName;
      elements.areaSelect.append(option);
    });
    elements.areaSelect.value = state.areaId;
  }

  function renderSummary(area, ranked) {
    const best = ranked[0];
    elements.selectedAreaName.textContent = area.optionName;
    elements.areaScope.textContent = area.scope || rentalData.scope || "以既有候選房源與搜尋入口建立廣搜清單。";
    elements.searchStrategy.textContent = best
      ? `${recommendationLabel(best.score)}：先處理「${best.title}」，再用下方來源補查同區新上架物件。`
      : "此區尚未建立房源入口，請先回資料檔補候選搜尋。";
  }

  function renderSources(area) {
    const existingLinks = (area.links || []).map((link) => ({
      group: "已整理入口",
      label: link.label,
      url: link.url
    }));
    const generatedLinks = sourceCatalog.flatMap((group) => {
      return group.sources.map((source) => ({
        group: group.group,
        label: source.label,
        url: buildSearchUrl(source, area)
      }));
    });

    const links = [...existingLinks, ...generatedLinks];
    const groups = new Map();
    links.forEach((link) => {
      if (!groups.has(link.group)) groups.set(link.group, []);
      groups.get(link.group).push(link);
    });

    elements.sourceGroups.innerHTML = "";
    elements.sourceCount.textContent = `${links.length} 個入口`;

    groups.forEach((items, groupName) => {
      const node = elements.sourceGroupTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector("h3").textContent = groupName;
      const sourceLinks = node.querySelector(".source-links");
      items.forEach((item) => {
        const anchor = document.createElement("a");
        anchor.href = item.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = item.label;
        sourceLinks.append(anchor);
      });
      elements.sourceGroups.append(node);
    });
  }

  function renderListings(ranked) {
    elements.listingCards.innerHTML = "";
    elements.listingCount.textContent = `${ranked.length} 筆候選或搜尋入口，依目前偏好排序`;

    if (ranked.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "這個區域尚未建立房源追蹤資料。";
      elements.listingCards.append(empty);
      return;
    }

    ranked.forEach((choice) => {
      const node = elements.listingTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector("h3").textContent = choice.title;
      node.querySelector(".option-meta").textContent = `${choice.sourceName} · ${choice.location} · ${choice.distanceLabel}`;
      node.querySelector(".score-badge").textContent = `${choice.score}`;

      const metrics = node.querySelector(".listing-metrics");
      metrics.append(
        metric("租金", choice.rentLabel),
        metric("格局", choice.layout),
        metric("坪數", choice.size),
        metric("屋齡", choice.buildingAgeLabel)
      );

      const reason = node.querySelector(".listing-reason");
      reason.textContent = `${recommendationLabel(choice.score)}：${choice.commuteFit}`;

      const tags = node.querySelector(".tag-list");
      [choice.familyFit, choice.petPolicyLabel, ...choice.highlights].slice(0, 5).forEach((text) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = text;
        tags.append(tag);
      });

      node.querySelector(".detail-grid").append(
        listBlock("主要風險", choice.risks),
        listBlock("下一步", [choice.nextAction, choice.schoolWalkBasis])
      );

      const link = node.querySelector(".listing-link");
      link.href = choice.url;
      link.textContent = "開啟房源或搜尋";
      elements.listingCards.append(node);
    });
  }

  function buildBrief() {
    const area = getArea();
    return [
      `您好，我正在找 ${area.optionName} 附近可長租的整層住家。`,
      `基本條件：${state.filters.rooms}房以上，月租希望 ${formatRent(state.filters.rentLimit)} 以內，家庭三人入住。`,
      "請協助確認：完整地址、實際可租狀態、管理費、屋齡、電梯、可否開伙、可否報稅或租補、是否接受長租。",
      "通學需求：需能在平日早上穩定前往臺北市萬華區萬大路423巷15號附近。"
    ].join("\n");
  }

  function buildShortlist() {
    const area = getArea();
    const ranked = getRankedChoices().slice(0, 5);
    const lines = [`${area.optionName} 租賃看屋清單`, `篩選：${state.filters.rooms}房以上，${formatRent(state.filters.rentLimit)} 以內`, ""];
    ranked.forEach((choice, index) => {
      lines.push(
        `${index + 1}. ${choice.title}｜${choice.score}分｜${recommendationLabel(choice.score)}`,
        `   ${choice.rentLabel}；${choice.layout}；${choice.size}；${choice.location}`,
        `   下一步：${choice.nextAction}`,
        `   ${choice.url}`,
        ""
      );
    });
    return lines.join("\n");
  }

  async function copyText(text, button, label) {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "已複製";
      window.setTimeout(() => {
        button.textContent = label;
      }, 1600);
    } catch (_error) {
      window.prompt("複製以下內容", text);
    }
  }

  function openPrimarySearches() {
    const area = getArea();
    const urls = [
      ...(area.links || []).slice(0, 3).map((link) => link.url),
      ...sourceCatalog[1].sources.slice(0, 2).map((source) => buildSearchUrl(source, area))
    ];
    urls.forEach((url) => window.open(url, "_blank", "noopener,noreferrer"));
  }

  function render() {
    const area = getArea();
    const ranked = getRankedChoices();
    renderSummary(area, ranked);
    renderSources(area);
    renderListings(ranked);
  }

  renderAreas();
  render();

  elements.areaSelect.addEventListener("change", (event) => {
    state.areaId = event.target.value;
    render();
  });

  [elements.rentLimit, elements.roomLimit, elements.agePreference, elements.priority].forEach((element) => {
    element.addEventListener("change", () => {
      state.filters.rentLimit = Number(elements.rentLimit.value);
      state.filters.rooms = Number(elements.roomLimit.value);
      state.filters.agePreference = elements.agePreference.value;
      state.filters.priority = elements.priority.value;
      render();
    });
  });

  elements.openPrimarySearches.addEventListener("click", openPrimarySearches);
  elements.copySearchBrief.addEventListener("click", () => copyText(buildBrief(), elements.copySearchBrief, "複製聯絡仲介條件"));
  elements.copyShortlist.addEventListener("click", () => copyText(buildShortlist(), elements.copyShortlist, "複製看屋清單"));
})();
