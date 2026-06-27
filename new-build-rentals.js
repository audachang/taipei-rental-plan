(function () {
  const dataset = window.NEW_BUILD_RENTALS;
  const rentals = dataset.rentals || [];
  const center = dataset.center;

  const elements = {
    schoolName: document.querySelector("#schoolName"),
    schoolAddress: document.querySelector("#schoolAddress"),
    schoolGoogleLink: document.querySelector("#schoolGoogleLink"),
    copyMapBrief: document.querySelector("#copyMapBrief"),
    statusFilter: document.querySelector("#statusFilter"),
    sortRentals: document.querySelector("#sortRentals"),
    rentalMap: document.querySelector("#rentalMap"),
    splitHandle: document.querySelector("#splitHandle"),
    tableBody: document.querySelector("#rentalTableBody"),
    rentalCount: document.querySelector("#rentalCount"),
    updatedAt: document.querySelector("#updatedAt"),
    dataNotes: document.querySelector("#dataNotes")
  };

  const state = {
    status: "all",
    sort: "priority",
    selectedId: null
  };

  const statusClasses = {
    "公開待租": "active",
    "公開待租/歷史": "active",
    "公開待租/需確認": "active",
    "公開待租（非住家）": "watch",
    "歷史/行情": "watch",
    "需確認/已下架參考": "watch",
    "未查到": "none"
  };

  function statusGroup(rental) {
    if (rental.status === "未查到") return "none";
    if (rental.status.includes("歷史") || rental.status.includes("需確認") || rental.status.includes("非住家")) return "track";
    return "active";
  }

  function markerClass(rental) {
    return statusClasses[rental.status] || "watch";
  }

  function googleMapsUrl(rental) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rental.address)}`;
  }

  function rentNumber(rental) {
    const match = rental.rentLabel.match(/([0-9]{2,3}),?([0-9]{3})?/);
    if (!match) return 999999;
    return Number(`${match[1]}${match[2] || ""}`);
  }

  function ageNumber(rental) {
    const match = rental.ageLabel.match(/([0-9]+)/);
    return match ? Number(match[1]) : 999;
  }

  function getVisibleRentals() {
    return rentals
      .filter((rental) => state.status === "all" || statusGroup(rental) === state.status)
      .sort((a, b) => {
        if (state.sort === "distance") return a.distanceMeters - b.distanceMeters;
        if (state.sort === "rent") return rentNumber(a) - rentNumber(b);
        if (state.sort === "age") return ageNumber(a) - ageNumber(b);
        return b.statusRank - a.statusRank || a.distanceMeters - b.distanceMeters;
      });
  }

  function createRentalIcon(rental) {
    return L.divIcon({
      className: `rental-marker ${markerClass(rental)} ${state.selectedId === rental.id ? "selected" : ""}`,
      html: `<span>${rental.statusRank > 0 ? rental.statusRank : ""}</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  }

  function popupHtml(rental) {
    const sourceLink = rental.sourceLinks[0]
      ? `<a href="${rental.sourceLinks[0].url}" target="_blank" rel="noopener noreferrer">${rental.sourceLinks[0].label}</a>`
      : "目前未查到公開待租連結";
    return `
      <div class="map-popup">
        <strong>${rental.building}</strong>
        <p>${rental.address}</p>
        <p>${rental.status}｜${rental.rentLabel}</p>
        <p>${rental.listingSummary}</p>
        <a href="${googleMapsUrl(rental)}" target="_blank" rel="noopener noreferrer">在 Google Maps 開啟</a>
        <span>${sourceLink}</span>
      </div>
    `;
  }

  function linkCell(rental) {
    if (rental.sourceLinks.length === 0) {
      return `<a href="${googleMapsUrl(rental)}" target="_blank" rel="noopener noreferrer">Google Maps</a>`;
    }
    const links = rental.sourceLinks
      .map((item) => `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.label}</a>`)
      .join("");
    return `${links}<a href="${googleMapsUrl(rental)}" target="_blank" rel="noopener noreferrer">Google Maps</a>`;
  }

  function renderTable(visible) {
    elements.tableBody.innerHTML = "";
    elements.rentalCount.textContent = `${visible.length} 筆，中心點為光仁小學`;

    visible.forEach((rental) => {
      const row = document.createElement("tr");
      row.dataset.rentalId = rental.id;
      if (state.selectedId === rental.id) row.classList.add("is-selected");
      row.innerHTML = `
        <td>
          <button class="table-focus-button" type="button" data-focus-id="${rental.id}">${rental.building}</button>
          <span>${rental.address}</span>
        </td>
        <td><span class="status-pill ${markerClass(rental)}">${rental.status}</span><small>${rental.priority}</small></td>
        <td>${rental.rentLabel}<small>${rental.ageLabel}</small></td>
        <td>${rental.layout}<small>${rental.size}</small></td>
        <td>${rental.distanceMeters} m<small>約略距離</small></td>
        <td class="source-cell">${linkCell(rental)}</td>
      `;
      elements.tableBody.append(row);
    });
  }

  let map;
  let markerLayer;
  const markerById = new Map();

  function initMap() {
    map = L.map(elements.rentalMap, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([center.lat, center.lng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const schoolIcon = L.divIcon({
      className: "school-marker",
      html: "<span>學</span>",
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18]
    });

    L.marker([center.lat, center.lng], { icon: schoolIcon })
      .addTo(map)
      .bindPopup(`<strong>${center.name}</strong><p>${center.address}</p><a href="${center.googleMapsUrl}" target="_blank" rel="noopener noreferrer">在 Google Maps 開啟</a>`);

    L.circle([center.lat, center.lng], {
      radius: 500,
      color: "#95451e",
      weight: 1,
      fillColor: "#c65f28",
      fillOpacity: 0.06
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);
  }

  function renderMarkers(visible) {
    markerLayer.clearLayers();
    markerById.clear();

    visible.forEach((rental) => {
      const marker = L.marker([rental.lat, rental.lng], { icon: createRentalIcon(rental) })
        .bindPopup(popupHtml(rental))
        .on("click", () => {
          state.selectedId = rental.id;
          render();
        });
      marker.addTo(markerLayer);
      markerById.set(rental.id, marker);
    });

    const bounds = L.latLngBounds([[center.lat, center.lng], ...visible.map((rental) => [rental.lat, rental.lng])]);
    map.fitBounds(bounds.pad(0.18), { maxZoom: 16 });
  }

  function focusRental(id) {
    const rental = rentals.find((item) => item.id === id);
    const marker = markerById.get(id);
    if (!rental || !marker) return;
    state.selectedId = id;
    render();
    map.setView([rental.lat, rental.lng], 17);
    marker.openPopup();
  }

  function buildBrief() {
    const visible = getVisibleRentals();
    return [
      `光仁小學周邊七年內新建案出租追蹤（更新：${dataset.updatedAt}）`,
      `中心：${center.name}，${center.address}`,
      "",
      ...visible.map((rental, index) => {
        const source = rental.sourceLinks[0]?.url || googleMapsUrl(rental);
        return `${index + 1}. ${rental.building}｜${rental.status}｜${rental.rentLabel}｜${rental.layout}｜距中心約${rental.distanceMeters}m｜${source}`;
      })
    ].join("\n");
  }

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(buildBrief());
      elements.copyMapBrief.textContent = "已複製";
      window.setTimeout(() => {
        elements.copyMapBrief.textContent = "複製租案摘要";
      }, 1600);
    } catch (_error) {
      window.prompt("複製以下內容", buildBrief());
    }
  }

  function setupSplitter() {
    const split = document.querySelector(".map-split");
    let dragging = false;

    function applyRatio(clientX) {
      const rect = split.getBoundingClientRect();
      const ratio = Math.min(72, Math.max(38, ((clientX - rect.left) / rect.width) * 100));
      split.style.setProperty("--map-ratio", `${ratio}%`);
      window.setTimeout(() => map.invalidateSize(), 0);
    }

    elements.splitHandle.addEventListener("pointerdown", (event) => {
      if (window.matchMedia("(max-width: 900px)").matches) return;
      dragging = true;
      elements.splitHandle.setPointerCapture(event.pointerId);
      document.body.classList.add("is-resizing");
    });

    elements.splitHandle.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      applyRatio(event.clientX);
    });

    elements.splitHandle.addEventListener("pointerup", (event) => {
      dragging = false;
      elements.splitHandle.releasePointerCapture(event.pointerId);
      document.body.classList.remove("is-resizing");
    });
  }

  function renderNotes() {
    elements.updatedAt.textContent = `更新：${dataset.updatedAt}`;
    elements.dataNotes.innerHTML = "";
    dataset.notes.forEach((note) => {
      const item = document.createElement("li");
      item.textContent = note;
      elements.dataNotes.append(item);
    });
  }

  function render() {
    const visible = getVisibleRentals();
    renderTable(visible);
    renderMarkers(visible);
  }

  elements.schoolName.textContent = center.name;
  elements.schoolAddress.textContent = center.address;
  elements.schoolGoogleLink.href = center.googleMapsUrl;
  elements.statusFilter.addEventListener("change", (event) => {
    state.status = event.target.value;
    state.selectedId = null;
    render();
  });
  elements.sortRentals.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });
  elements.tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-focus-id]");
    if (button) focusRental(button.dataset.focusId);
  });
  elements.copyMapBrief.addEventListener("click", copyBrief);

  initMap();
  setupSplitter();
  renderNotes();
  render();
})();
