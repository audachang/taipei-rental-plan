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
  const state = {
    selected: new Set(options.slice(0, 3).map((option) => option.id)),
    sort: "score",
    filters: {
      rentLimit: 50000,
      commuteLimit: 40,
      directOnly: false
    },
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
    rentalSearchLinks: document.querySelector("#rentalSearchLinks")
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

    const best = filteredOptions.reduce((winner, option) => {
      return option.score > winner.score ? option : winner;
    }, filteredOptions[0]);

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

  function renderRentalChoices() {
    elements.rentalCandidateName.textContent = `${rentalChoices.bestOptionName}租賃選擇`;
    elements.rentalScope.textContent = rentalChoices.scope;
    elements.rentalUpdated.textContent = `更新 ${rentalChoices.updatedAt || "-"}`;
    elements.rentalChoices.innerHTML = "";
    elements.rentalSearchLinks.innerHTML = "";

    if (rentalChoices.choices.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "目前沒有租賃選擇資料。";
      elements.rentalChoices.append(empty);
      return;
    }

    rentalChoices.choices.forEach((choice) => {
      const card = document.createElement("article");
      const top = document.createElement("div");
      const titleWrap = document.createElement("div");
      const title = document.createElement("h3");
      const meta = document.createElement("p");
      const fit = document.createElement("span");
      const metrics = document.createElement("dl");
      const detail = document.createElement("div");
      const action = document.createElement("p");

      card.className = "rental-card";
      top.className = "rental-card-top";
      fit.className = "fit-badge";
      metrics.className = "rental-metrics";
      detail.className = "rental-detail-grid";
      action.className = "next-action";

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

      card.append(
        top,
        metrics,
        detail,
        action,
        makeExternalLink("開啟房源", choice.url, "primary-link")
      );
      elements.rentalChoices.append(card);
    });

    rentalChoices.links.forEach((item) => {
      elements.rentalSearchLinks.append(makeExternalLink(item.label, item.url, "source-link"));
    });
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
    renderSummary(filteredOptions);
    renderCards(filteredOptions);
    renderCompareTable();
    renderSources();
    renderRentBenchmarks();
    renderCollectionQueue();
    renderRentalChoices();
  }

  elements.rentLimit.addEventListener("change", (event) => {
    state.filters.rentLimit = Number(event.target.value);
    render();
  });

  elements.commuteLimit.addEventListener("change", (event) => {
    state.filters.commuteLimit = Number(event.target.value);
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
      directOnly: false
    };
    elements.rentLimit.value = "50000";
    elements.commuteLimit.value = "40";
    elements.directOnly.checked = false;
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

  elements.copySummary.addEventListener("click", copySummary);

  render();
})();
