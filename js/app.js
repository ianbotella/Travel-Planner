/* ==============================================================
   Configuración de giscus — completar después de activarlo
   en https://giscus.app apuntando a este repo.
   ============================================================== */
const GISCUS_CONFIG = {
  repo: "TU-USUARIO/TU-REPO",
  repoId: "REPO_ID_AQUI",
  category: "Itinerario",
  categoryId: "CATEGORY_ID_AQUI",
  mapping: "specific", // cada día es un "término" propio dentro del mismo repo
  lang: "es"
};

const ICONS = {
  vuelo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12l-8-3-5-8-2 1 3 8-7 1-3-3-2 1 3 5 3 5 2-1-2-4 6-2 5 6 2-1-3-8z"/></svg>`,
  tren: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 11h14M9 16l-2 4M15 16l2 4"/><circle cx="9" cy="7" r="0.5"/><circle cx="15" cy="7" r="0.5"/></svg>`,
  auto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16V11l2-5h12l2 5v5"/><path d="M4 16h16M7 16v2M17 16v2"/><circle cx="7.5" cy="13.5" r="0.5"/><circle cx="16.5" cy="13.5" r="0.5"/></svg>`,
  "tren-auto": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="8" height="8" rx="2"/><path d="M3 9h8"/><path d="M14 20v-3l1-3h6l1 3v3"/><path d="M14 20h8M16 20v1M20 20v1"/></svg>`,
  quieto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>`,
  hospedaje: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20V9l9-6 9 6v11"/><path d="M9 20v-7h6v7"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>`,
  maleta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M4 13h16"/></svg>`
};

const MEDIO_LABEL = {
  vuelo: "avión",
  tren: "tren",
  auto: "auto",
  "tren-auto": "tren + auto",
  quieto: "sin traslado"
};

/* Texto para la nota liviana del día de cierre (diaFin) de un pasaje */
const PASAJE_FIN_VERBO = {
  tren: "Llega hoy",
  auto: "Devolución hoy",
  "tren-auto": "Llega hoy",
  vuelo: "Llega hoy"
};

/* Estado en memoria de los datos cargados, para poder actualizarlos
   tras un guardado sin tener que releer los JSON */
const STATE = { data: null, transporte: null, hospedajes: null, lookups: null };

const GH_TOKEN_KEY = "tp_gh_token";
const REPO_OWNER = location.hostname.endsWith(".github.io") ? location.hostname.split(".")[0] : "ianbotella";
const REPO_NAME = location.pathname.split("/").filter(Boolean)[0] || "Travel-Planner";

async function init() {
  const [itinerarioRes, transporteRes, hospedajesRes] = await Promise.all([
    fetch("data/itinerario.json"),
    fetch("data/transporte.json"),
    fetch("data/hospedajes.json")
  ]);
  STATE.data = await itinerarioRes.json();
  STATE.transporte = await transporteRes.json();
  STATE.hospedajes = await hospedajesRes.json();
  STATE.lookups = buildLookups(STATE.transporte.items, STATE.hospedajes.items);

  renderMasthead(STATE.data.viaje);
  renderBlockNav(STATE.data.bloques);
  renderPending(STATE.data);
  renderStatus(STATE.transporte.items, STATE.hospedajes.items);
  renderTimeline(STATE.data, STATE.lookups);
  setupScrollSpy(STATE.data.bloques);
  setupEditing();
  setupSettingsModal();
}

/* Arma mapas día -> item para no recorrer todo en cada tarjeta */
function buildLookups(transporteItems, hospedajesItems) {
  const pasajePorDia = new Map();
  const pasajeFinPorDia = new Map();
  transporteItems.forEach((item) => {
    if (item.dia) addToMap(pasajePorDia, item.dia, item);
    if (item.diaFin && item.diaFin !== item.dia) addToMap(pasajeFinPorDia, item.diaFin, item);
  });

  const hospedajeInicioPorDia = new Map();
  const hospedajeFinPorDia = new Map();
  hospedajesItems.forEach((item) => {
    if (item.diaInicio) addToMap(hospedajeInicioPorDia, item.diaInicio, item);
    if (item.diaFin) addToMap(hospedajeFinPorDia, item.diaFin, item);
  });

  return { pasajePorDia, pasajeFinPorDia, hospedajeInicioPorDia, hospedajeFinPorDia };
}

function addToMap(map, key, item) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(item);
}

function renderMasthead(viaje) {
  document.getElementById("viaje-titulo").textContent = viaje.titulo;
  document.getElementById("viaje-subtitulo").textContent = viaje.subtitulo;
  document.getElementById("viaje-crew").textContent = viaje.integrantes.join(" · ");
}

function renderStatus(transporteItems, hospedajesItems) {
  const tHechos = transporteItems.filter((i) => i.hecho).length;
  const hHechos = hospedajesItems.filter((i) => i.hecho).length;
  document.getElementById("viaje-status").textContent =
    `${tHechos} de ${transporteItems.length} pasajes reservados · ${hHechos} de ${hospedajesItems.length} hospedajes confirmados`;
}

function renderBlockNav(bloques) {
  const nav = document.getElementById("blocknav");
  nav.innerHTML = bloques
    .map(
      (b) =>
        `<a class="blocknav__pill" href="#bloque-${b.id}" data-block="${b.id}" style="--block-color:${b.color}">${b.nombre}</a>`
    )
    .join("");
}

function renderPending(data) {
  const conAviso = data.dias.filter((d) => d.aviso);
  if (!conAviso.length) return;

  const panel = document.getElementById("pending-panel");
  const list = document.getElementById("pending-list");
  panel.hidden = false;

  list.innerHTML = conAviso
    .map(
      (d) =>
        `<li><a href="#dia-${d.dia}">Día ${d.dia} — ${escapeHtml(d.tramo)}</a><br>${escapeHtml(d.aviso)}</li>`
    )
    .join("");
}

function renderTimeline(data, lookups) {
  const timeline = document.getElementById("timeline");
  const porBloque = data.bloques.map((bloque) => ({
    bloque,
    dias: data.dias.filter((d) => d.bloque === bloque.id)
  }));

  timeline.innerHTML = porBloque
    .map(
      ({ bloque, dias }) => `
      <section class="blocksection" id="bloque-${bloque.id}" style="--block-color:${bloque.color}">
        <span class="blocksection__label">${bloque.nombre}</span>
        <div class="blocksection__track">
          ${dias.map((d) => dayCardHtml(d, lookups)).join("")}
        </div>
      </section>`
    )
    .join("");

  // habilitar giscus lazy-load al abrir cada <details> de comentarios
  timeline.querySelectorAll(".daycard__comments").forEach((details) => {
    details.addEventListener(
      "toggle",
      () => {
        if (details.open) loadGiscusInto(details.querySelector(".giscus-slot"), details.dataset.term);
      },
      { once: true }
    );
  });
}

function dayCardHtml(d, lookups) {
  const icon = ICONS[d.medio] || ICONS.quieto;
  const medioLabel = MEDIO_LABEL[d.medio] || "";
  const avisoHtml = d.aviso
    ? `<div class="daycard__aviso"><strong>A confirmar</strong><span>${escapeHtml(d.aviso)}</span></div>`
    : "";

  const pasajes = lookups.pasajePorDia.get(d.dia) || [];
  const pasajesFin = lookups.pasajeFinPorDia.get(d.dia) || [];
  const hospedajesInicio = lookups.hospedajeInicioPorDia.get(d.dia) || [];
  const hospedajesFin = lookups.hospedajeFinPorDia.get(d.dia) || [];

  const logiHtml = [
    ...pasajes.map((item) => logiboxHtml(item, "pasaje", "primary")),
    ...hospedajesInicio.map((item) => logiboxHtml(item, "hospedaje", "primary")),
    ...pasajesFin.map((item) => logiboxHtml(item, "pasaje", "secondary")),
    ...hospedajesFin.map((item) => logiboxHtml(item, "hospedaje", "secondary"))
  ].join("");

  return `
    <article class="daycard" id="dia-${d.dia}">
      <div class="daycard__head">
        <span class="daycard__num">DÍA ${String(d.dia).padStart(2, "0")}</span>
        <span class="daycard__fecha">${escapeHtml(d.fecha)}</span>
        <span class="daycard__medio">${icon}${medioLabel}</span>
      </div>
      <h3 class="daycard__tramo">${escapeHtml(d.tramo)}</h3>
      <p class="daycard__notas">${escapeHtml(d.notas)}</p>
      ${avisoHtml}
      ${logiHtml}
      <details class="daycard__comments" data-term="dia-${d.dia}">
        <summary>Comentarios y sugerencias</summary>
        <div class="giscus-slot"></div>
      </details>
    </article>`;
}

/* Caja colapsable de pasaje u hospedaje embebida en la tarjeta del día.
   context "primary": la reserva arranca/aplica ese día (caja completa).
   context "secondary": nota liviana de cierre (devolución/checkout/llegada). */
function logiboxHtml(item, kind, context) {
  const isHospedaje = kind === "hospedaje";
  const icon = isHospedaje ? ICONS.hospedaje : ICONS[item.tipo] || ICONS.quieto;
  const modifier = context === "secondary" ? " is-secondary" : "";
  const doneClass = item.hecho ? "is-done" : "is-pending";
  const checkMark = item.hecho ? ICONS.check : "";

  const camposConValor = (item.campos || []).filter((c) => c.valor);

  if (context === "secondary") {
    const verbo = isHospedaje ? "Salís hoy de" : PASAJE_FIN_VERBO[item.tipo] || "Termina hoy";
    const nombre = item.hecho && camposConValor[0] ? camposConValor[0].valor : item.titulo;
    const detalle = item.hecho
      ? camposConValor.length
        ? `<dl class="logibox__fields">${camposConValor
            .map((c) => `<div><dt>${escapeHtml(c.label)}</dt><dd>${escapeHtml(c.valor)}</dd></div>`)
            .join("")}</dl>`
        : `<p class="logibox__empty">Confirmado — faltan cargar los datos.</p>`
      : `<p class="logibox__empty">Todavía no reservado.</p>`;

    return `
      <details class="logibox logibox--${kind}${modifier} ${doneClass}" data-item-id="${item.id}" data-kind="${kind}">
        <summary>
          <span class="logibox__check" aria-hidden="true">${checkMark}</span>
          <span class="logibox__icon" aria-hidden="true">${icon}</span>
          <span class="logibox__summary">${escapeHtml(verbo)}: ${escapeHtml(nombre)}</span>
        </summary>
        <div class="logibox__detail">${detalle}</div>
      </details>`;
  }

  // primary — formulario editable con los campos de la reserva
  const summary = item.hecho
    ? camposConValor.length
      ? camposConValor.slice(0, 2).map((c) => escapeHtml(c.valor)).join(" · ")
      : "Confirmado"
    : "Pendiente de reservar";

  const camposHtml = (item.campos || [])
    .map(
      (c, i) => `
      <label class="logibox__field">
        <span>${escapeHtml(c.label)}</span>
        <input type="text" name="campo-${i}" value="${escapeHtml(c.valor)}" placeholder="${escapeHtml(c.label)}">
      </label>`
    )
    .join("");

  return `
    <details class="logibox logibox--${kind} ${doneClass}" data-item-id="${item.id}" data-kind="${kind}">
      <summary>
        <span class="logibox__check" aria-hidden="true">${checkMark}</span>
        <span class="logibox__icon" aria-hidden="true">${icon}</span>
        <span class="logibox__summary"><strong>${escapeHtml(item.titulo)}</strong> · ${summary}</span>
      </summary>
      <div class="logibox__detail">
        <form class="logibox__form" data-item-id="${item.id}" data-kind="${kind}">
          ${camposHtml}
          <label class="logibox__field logibox__field--notas">
            <span>Notas</span>
            <textarea name="notas" rows="2" placeholder="Notas">${escapeHtml(item.notas || "")}</textarea>
          </label>
          <div class="logibox__actions">
            <button type="submit" class="logibox__save">Guardar</button>
            ${item.hecho ? `<button type="button" class="logibox__unmark">Marcar como pendiente</button>` : ""}
            <span class="logibox__save-status" aria-live="polite"></span>
          </div>
        </form>
      </div>
    </details>`;
}

/* Reemplaza en el DOM todas las apariciones (primaria y secundaria)
   de un item con su HTML actualizado, preservando el estado abierto/cerrado */
function refreshLogiboxesForItem(kind, item) {
  document.querySelectorAll(`.logibox[data-item-id="${item.id}"]`).forEach((el) => {
    const context = el.classList.contains("is-secondary") ? "secondary" : "primary";
    const wasOpen = el.open;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = logiboxHtml(item, kind, context).trim();
    const newEl = wrapper.firstElementChild;
    newEl.open = wasOpen;
    el.replaceWith(newEl);
  });
}

/* Delegación de eventos sobre el timeline: los logiboxes se regeneran
   dinámicamente, así que conviene escuchar en el contenedor fijo */
function setupEditing() {
  const timeline = document.getElementById("timeline");

  timeline.addEventListener("submit", (e) => {
    const form = e.target.closest(".logibox__form");
    if (!form) return;
    e.preventDefault();
    guardarReserva(form.dataset.kind, form.dataset.itemId, form, true);
  });

  timeline.addEventListener("click", (e) => {
    const btn = e.target.closest(".logibox__unmark");
    if (!btn) return;
    const form = btn.closest(".logibox__form");
    if (form) guardarReserva(form.dataset.kind, form.dataset.itemId, form, false);
  });
}

/* Guarda los campos de una reserva directamente en el repo de GitHub
   (Contents API) y refleja el resultado en el estado local + DOM */
async function guardarReserva(kind, itemId, form, hecho) {
  const token = getGhToken();
  const statusEl = form.querySelector(".logibox__save-status");
  const saveBtn = form.querySelector(".logibox__save");
  const unmarkBtn = form.querySelector(".logibox__unmark");

  if (!token) {
    if (statusEl) statusEl.textContent = "Configurá tu token para poder guardar (botón ⚙ arriba).";
    openSettingsModal();
    return;
  }

  if (saveBtn) saveBtn.disabled = true;
  if (unmarkBtn) unmarkBtn.disabled = true;
  if (statusEl) statusEl.textContent = "Guardando…";

  try {
    const filename = kind === "hospedaje" ? "hospedajes.json" : "transporte.json";
    const path = `data/${filename}`;
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    };

    const getRes = await fetch(apiUrl, { headers });
    if (!getRes.ok) throw new Error(`No se pudo leer ${filename} (HTTP ${getRes.status})`);
    const fileMeta = await getRes.json();
    const fileContent = JSON.parse(b64DecodeUnicode(fileMeta.content));

    const item = fileContent.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`No se encontró "${itemId}" en ${filename}`);

    const formData = new FormData(form);
    item.campos = (item.campos || []).map((c, i) => ({
      ...c,
      valor: (formData.get(`campo-${i}`) || "").toString().trim()
    }));
    item.notas = (formData.get("notas") || "").toString().trim();
    item.hecho = hecho;

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `Actualizar reserva: ${item.titulo || itemId}`,
        content: b64EncodeUnicode(JSON.stringify(fileContent, null, 2) + "\n"),
        sha: fileMeta.sha
      })
    });
    if (!putRes.ok) {
      const errBody = await putRes.json().catch(() => ({}));
      throw new Error(errBody.message || `No se pudo guardar (HTTP ${putRes.status})`);
    }

    const list = kind === "hospedaje" ? STATE.hospedajes.items : STATE.transporte.items;
    const idx = list.findIndex((i) => i.id === itemId);
    const updatedItem = idx !== -1 ? Object.assign(list[idx], item) : item;

    refreshLogiboxesForItem(kind, updatedItem);
    renderStatus(STATE.transporte.items, STATE.hospedajes.items);
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = `Error: ${err.message}`;
    if (saveBtn) saveBtn.disabled = false;
    if (unmarkBtn) unmarkBtn.disabled = false;
  }
}

function getGhToken() {
  return localStorage.getItem(GH_TOKEN_KEY) || "";
}

function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))));
}

function b64DecodeUnicode(str) {
  return decodeURIComponent(
    atob(str)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

function openSettingsModal() {
  const modal = document.getElementById("settings-modal");
  const statusEl = document.getElementById("settings-token-status");
  if (statusEl) {
    statusEl.textContent = getGhToken() ? "Token guardado en este navegador." : "Todavía no cargaste un token.";
  }
  if (modal) modal.hidden = false;
}

function closeSettingsModal() {
  const modal = document.getElementById("settings-modal");
  if (modal) modal.hidden = true;
}

function setupSettingsModal() {
  const openBtn = document.getElementById("settings-open-btn");
  const modal = document.getElementById("settings-modal");
  const input = document.getElementById("settings-token-input");
  const saveBtn = document.getElementById("settings-save-btn");
  const clearBtn = document.getElementById("settings-clear-btn");
  const statusEl = document.getElementById("settings-token-status");

  openBtn.addEventListener("click", () => {
    input.value = "";
    openSettingsModal();
  });

  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeSettingsModal));

  saveBtn.addEventListener("click", () => {
    const value = input.value.trim();
    if (!value) return;
    localStorage.setItem(GH_TOKEN_KEY, value);
    input.value = "";
    statusEl.textContent = "Token guardado en este navegador.";
  });

  clearBtn.addEventListener("click", () => {
    localStorage.removeItem(GH_TOKEN_KEY);
    statusEl.textContent = "Todavía no cargaste un token.";
  });
}

function loadGiscusInto(slot, term) {
  if (!slot || slot.dataset.loaded) return;
  slot.dataset.loaded = "true";

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", GISCUS_CONFIG.repo);
  script.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
  script.setAttribute("data-category", GISCUS_CONFIG.category);
  script.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
  script.setAttribute("data-mapping", GISCUS_CONFIG.mapping);
  script.setAttribute("data-term", term);
  script.setAttribute("data-strict", "0");
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "top");
  script.setAttribute("data-theme", "light");
  script.setAttribute("data-lang", GISCUS_CONFIG.lang);
  slot.appendChild(script);
}

function setupScrollSpy(bloques) {
  const sections = bloques
    .map((b) => document.getElementById(`bloque-${b.id}`))
    .filter(Boolean);
  const pills = document.querySelectorAll(".blocknav__pill");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id.replace("bloque-", "");
        pills.forEach((p) => p.removeAttribute("data-active"));
        const active = document.querySelector(`.blocknav__pill[data-block="${id}"]`);
        if (active) active.setAttribute("data-active", "true");
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

init();