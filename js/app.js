/* ==============================================================
   Configuración de giscus — completar después de activarlo
   en https://giscus.app apuntando a este repo.
   ============================================================== */
const GISCUS_CONFIG = {
  repo: "ianbotella/Travel-Planner",
  repoId: "R_kgDOTvoYAQ",
  category: "Itinerario",
  categoryId: "DIC_kwDOTvoYAc4DCyYt",
  mapping: "specific", // cada día es un "término" propio dentro del mismo repo
  lang: "es"
};

const ICONS = {
  vuelo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12l-8-3-5-8-2 1 3 8-7 1-3-3-2 1 3 5 3 5 2-1-2-4 6-2 5 6 2-1-3-8z"/></svg>`,
  tren: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 11h14M9 16l-2 4M15 16l2 4"/><circle cx="9" cy="7" r="0.5"/><circle cx="15" cy="7" r="0.5"/></svg>`,
  auto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16V11l2-5h12l2 5v5"/><path d="M4 16h16M7 16v2M17 16v2"/><circle cx="7.5" cy="13.5" r="0.5"/><circle cx="16.5" cy="13.5" r="0.5"/></svg>`,
  "tren-auto": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="8" height="8" rx="2"/><path d="M3 9h8"/><path d="M14 20v-3l1-3h6l1 3v3"/><path d="M14 20h8M16 20v1M20 20v1"/></svg>`,
  quieto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>`
};

const MEDIO_LABEL = {
  vuelo: "avión",
  tren: "tren",
  auto: "auto",
  "tren-auto": "tren + auto",
  quieto: "sin traslado"
};

async function init() {
  const res = await fetch("data/itinerario.json");
  const data = await res.json();

  renderMasthead(data.viaje);
  renderBlockNav(data.bloques);
  renderPending(data);
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