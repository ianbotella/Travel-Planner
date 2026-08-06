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
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>`
};

const MEDIO_LABEL = {
  vuelo: "avión",
  tren: "tren",
  auto: "auto",
  "tren-auto": "tren + auto",
  quieto: "sin traslado"
};

async function init() {
  const [itinerarioRes, transporteRes, hospedajesRes] = await Promise.all([
    fetch("data/itinerario.json"),
    fetch("data/transporte.json"),
    fetch("data/hospedajes.json")
  ]);
  const data = await itinerarioRes.json();
  const transporte = await transporteRes.json();
  const hospedajes = await hospedajesRes.json();

  renderMasthead(data.viaje);
  renderBlockNav(data.bloques);
  renderPending(data);
  renderChecklist({
    items: transporte.items,
    gridId: "transporte-grid",
    progressId: "transporte-progress",
    variant: "ticket",
    iconFor: (item) => ICONS[item.tipo] || ICONS.quieto,
    subtitleFor: (item) => item.tramo,
    dateFor: (item) => item.fecha,
    noun: { singular: "pasaje reservado", plural: "pasajes reservados" }
  });
  renderChecklist({
    items: hospedajes.items,
    gridId: "hospedajes-grid",
    progressId: "hospedajes-progress",
    variant: "tag",
    iconFor: () => ICONS.hospedaje,
    subtitleFor: () => "",
    dateFor: (item) => item.fechas,
    noun: { singular: "hospedaje confirmado", plural: "hospedajes confirmados" }
  });
  renderTimeline(data);
  setupScrollSpy(data.bloques);
}

function renderMasthead(viaje) {
  document.getElementById("viaje-titulo").textContent = viaje.titulo;
  document.getElementById("viaje-subtitulo").textContent = viaje.subtitulo;
  document.getElementById("viaje-crew").textContent = viaje.integrantes.join(" · ");
}

function renderBlockNav(bloques) {
  const nav = document.getElementById("blocknav");
  const bloquePills = bloques
    .map(
      (b) =>
        `<a class="blocknav__pill" href="#bloque-${b.id}" data-block="${b.id}" style="--block-color:${b.color}">${b.nombre}</a>`
    )
    .join("");
  const extraPills = `
    <span class="blocknav__sep" aria-hidden="true"></span>
    <a class="blocknav__pill blocknav__pill--logistica" href="#transporte-panel">Pasajes</a>
    <a class="blocknav__pill blocknav__pill--logistica" href="#hospedajes-panel">Hospedajes</a>`;
  nav.innerHTML = bloquePills + extraPills;
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

function renderChecklist({ items, gridId, progressId, variant, iconFor, subtitleFor, dateFor, noun }) {
  const grid = document.getElementById(gridId);
  const progress = document.getElementById(progressId);

  const hechos = items.filter((i) => i.hecho).length;
  const total = items.length;
  progress.textContent = `${hechos} de ${total} ${hechos === 1 ? noun.singular : noun.plural}`;

  grid.innerHTML = items.map((item) => checklistCardHtml(item, variant, iconFor, subtitleFor, dateFor)).join("");
}

function checklistCardHtml(item, variant, iconFor, subtitleFor, dateFor) {
  const subtitle = subtitleFor(item);
  const campos = (item.campos || []).filter((c) => item.hecho && c.valor);
  const cardClass = variant === "ticket" ? "ticketcard" : "tagcard";

  const camposHtml = item.hecho
    ? campos.length
      ? `<dl class="${cardClass}__fields">${campos
          .map((c) => `<div><dt>${escapeHtml(c.label)}</dt><dd>${escapeHtml(c.valor)}</dd></div>`)
          .join("")}</dl>`
      : `<p class="${cardClass}__empty">Confirmado — faltan cargar los datos.</p>`
    : `<p class="${cardClass}__empty">Todavía no reservado.</p>`;

  const notasHtml = item.hecho && item.notas ? `<p class="${cardClass}__notas">${escapeHtml(item.notas)}</p>` : "";

  return `
    <article class="${cardClass} ${item.hecho ? "is-done" : "is-pending"}">
      <div class="${cardClass}__main">
        <div class="${cardClass}__check" aria-hidden="true">${item.hecho ? ICONS.check : ""}</div>
        <div class="${cardClass}__body">
          <div class="${cardClass}__icon">${iconFor(item)}</div>
          <h3 class="${cardClass}__title">${escapeHtml(item.titulo)}</h3>
          ${subtitle ? `<p class="${cardClass}__subtitle">${escapeHtml(subtitle)}</p>` : ""}
          <p class="${cardClass}__date">${escapeHtml(dateFor(item))}</p>
        </div>
      </div>
      <div class="${cardClass}__stub">
        ${camposHtml}
        ${notasHtml}
      </div>
    </article>`;
}

function renderTimeline(data) {
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
          ${dias.map((d) => dayCardHtml(d)).join("")}
        </div>
      </section>`
    )
    .join("");

  // habilitar giscus lazy-load al abrir cada <details>
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

function dayCardHtml(d) {
  const icon = ICONS[d.medio] || ICONS.quieto;
  const medioLabel = MEDIO_LABEL[d.medio] || "";
  const avisoHtml = d.aviso
    ? `<div class="daycard__aviso"><strong>A confirmar</strong><span>${escapeHtml(d.aviso)}</span></div>`
    : "";

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
      <details class="daycard__comments" data-term="dia-${d.dia}">
        <summary>Comentarios y sugerencias</summary>
        <div class="giscus-slot"></div>
      </details>
    </article>`;
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