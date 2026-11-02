const app = document.getElementById("app");
const SECTIONS = [
  ["art", "The story of the art"],
  ["artist", "The story of the artist"],
  ["place", "The story of the place"],
  ["history", "History of art, artist & place"],
  ["future", "Our vision for the future"]
];
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

// Decorative motif per art form, drawn as an SVG pattern (no external images).
function motif(kind, color) {
  const f = "rgba(255,255,255,.55)";
  const shapes = {
    fish: `<path d="M4 20c8-14 20-14 28 0-8 14-20 14-28 0z M32 20l8-8v16z" fill="${f}"/>`,
    triangles: `<path d="M20 6l12 22H8z" fill="none" stroke="${f}" stroke-width="3"/><circle cx="20" cy="34" r="3" fill="${f}"/>`,
    lotus: `<path d="M20 34c-12-4-14-16-4-22 2 8 8 8 8 0 10 6 8 18-4 22z" fill="${f}"/>`,
    vine: `<path d="M6 34c10-6 4-18 14-18s6 12 14 6" fill="none" stroke="${f}" stroke-width="3"/><circle cx="20" cy="16" r="3" fill="${f}"/>`,
    arch: `<path d="M8 36V18a12 12 0 0124 0v18" fill="none" stroke="${f}" stroke-width="3"/><circle cx="20" cy="22" r="3" fill="${f}"/>`,
    dots: `<circle cx="10" cy="10" r="3" fill="${f}"/><circle cx="24" cy="14" r="2" fill="${f}"/><circle cx="16" cy="26" r="3" fill="${f}"/><circle cx="32" cy="32" r="2" fill="${f}"/>`,
    scroll: `<path d="M6 12h28M6 20h28M6 28h20" stroke="${f}" stroke-width="3" fill="none"/><circle cx="34" cy="28" r="4" fill="${f}"/>`,
    diamond: `<path d="M20 4l14 16-14 16L6 20z" fill="none" stroke="${f}" stroke-width="3"/>`,
    spiral: `<path d="M20 20m0-2a2 2 0 110 4 6 6 0 11-8-6 10 10 0 1118 6" fill="none" stroke="${f}" stroke-width="3"/>`
  };
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>${shapes[kind] || shapes.dots}</svg>`;
  return `background-color:${color};background-image:url("data:image/svg+xml,${encodeURIComponent(svg)}");background-size:40px 40px`;
}

// Map of India with one pin per art-form centre. Skips quietly if Leaflet failed to load.
function makeMap(el, arts, opts = {}) {
  if (!window.L) { el.innerHTML = '<p class="empty">The map could not be loaded. Check your connection.</p>'; return null; }
  const map = L.map(el, {scrollWheelZoom: false}).setView([22.5, 79], 4.4);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 12, attribution: "&copy; OpenStreetMap contributors"}).addTo(map);
  const pts = [];
  arts.forEach(a => (PINS[a.id] || []).forEach(([lat, lng, label]) => {
    const icon = L.divIcon({className: "", html: `<div class="pin" style="background:${a.color}"></div>`, iconSize: [18, 18]});
    const link = opts.noLink ? "" : `<br><a href="#/art/${a.id}">Read the story →</a>`;
    L.marker([lat, lng], {icon, title: a.name}).addTo(map).bindPopup(`<b>${esc(a.name)}</b><br>${esc(label)}, ${esc(a.state)}${link}`);
    pts.push([lat, lng]);
  }));
  if (opts.fit && pts.length) map.fitBounds(pts, {padding: [40, 40], maxZoom: 8});
  return map;
}

function home() {
  const states = [...new Set(ARTS.flatMap(a => a.state.split(" · ")))].sort();
  app.innerHTML = `
  <section class="hero">
    <h1>Every Indian art form has a place, a maker and a story.</h1>
    <p>Explore India's art forms through five lenses: the art, the artist, the place, their history, and our vision for their future.</p>
  </section>
  <div class="tools">
    <input id="q" type="search" placeholder="Search art forms, places, themes…" aria-label="Search">
    <select id="st" aria-label="Filter by state"><option value="">All states</option>${states.map(s => `<option>${esc(s)}</option>`).join("")}</select>
  </div>
  <div id="map" class="map" role="region" aria-label="Map of India showing where each art form comes from"></div>
  <p class="mapnote">Pins show where each art form is centred. Tap a pin to open its story.</p>
  <div class="grid" id="grid"></div>`;
  let map = null;
  const draw = () => {
    const q = document.getElementById("q").value.toLowerCase();
    const st = document.getElementById("st").value;
    const list = ARTS.filter(a =>
      (!st || a.state.includes(st)) &&
      (!q || JSON.stringify(a).toLowerCase().includes(q)));
    if (map) map.remove();
    map = makeMap(document.getElementById("map"), list, {fit: list.length < ARTS.length});
    document.getElementById("grid").innerHTML = list.length ? list.map(a => `
      <a class="card" href="#/art/${a.id}">
        <div class="art" style='${motif(a.motif, a.color)}'></div>
        <div class="body"><div class="where">${esc(a.state)}</div><h3>${esc(a.name)}</h3><p>${esc(a.tagline)}</p></div>
      </a>`).join("") : `<p class="empty">No art forms match your search yet.</p>`;
  };
  document.getElementById("q").oninput = draw;
  document.getElementById("st").onchange = draw;
  draw();
}

// Photo with a visible credit line. Returns "" when no image has been added yet.
function figure(id, kind, caption) {
  const im = (window.IMAGES[id] || {})[kind];
  if (!im) return "";
  return `<figure class="photo ${kind}"><img src="${esc(im.src)}" alt="${esc(im.alt)}" loading="lazy">
    <figcaption>${esc(caption)}${im.caption ? " " + esc(im.caption) : ""} <small>Photo: ${esc(im.author || "Unknown")} · <a href="${esc(im.page)}" target="_blank" rel="noopener">${esc(im.license)}</a></small></figcaption></figure>`;
}

function body(key, a) {
  if (key === "history") {
    return `<ul class="timeline">${a.history.map(([when, what]) => `<li><b>${esc(when)}</b>${esc(what)}</li>`).join("")}</ul>`;
  }
  if (key === "future") {
    return `<div class="vision"><h4>What we hope to do</h4><ul>${a.future.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
  }
  const extra = key === "art" ? figure(a.id, "art", a.name + ".") : key === "artist" ? figure(a.id, "artist", "") : "";
  return extra + a[key].map(p => `<p>${esc(p)}</p>`).join("");
}

function detail(id) {
  const i = ARTS.findIndex(a => a.id === id);
  if (i < 0) return home();
  const a = ARTS[i], prev = ARTS[(i + ARTS.length - 1) % ARTS.length], next = ARTS[(i + 1) % ARTS.length];
  document.title = `${a.name} · Story of Art`;
  app.innerHTML = `
  <div class="detail-hero" style='${motif(a.motif, a.color)}'><div class="inner">
    <div class="where">${esc(a.place)}</div><h1>${esc(a.name)}</h1><p>${esc(a.tagline)}</p>
    <div class="facts">${a.facts.map(f => `<span>${esc(f)}</span>`).join("")}</div>
  </div></div>
  <nav class="subnav">${SECTIONS.map(([k, t]) => `<a href="#/art/${a.id}" data-go="${k}">${t}</a>`).join("")}</nav>
  ${SECTIONS.map(([k, t], n) => `<section class="story" id="${k}"><div class="kicker">${n + 1} of 5</div><h2>${t}</h2>${body(k, a)}</section>`).join("")}
  <div class="pager"><a href="#/art/${prev.id}">← ${esc(prev.name)}</a><a href="#/art/${next.id}">${esc(next.name)} →</a></div>`;
  const holder = document.getElementById("place");
  const mapEl = document.createElement("div");
  mapEl.className = "map mini";
  mapEl.setAttribute("role", "region");
  mapEl.setAttribute("aria-label", `Map showing where ${a.name} comes from`);
  holder.querySelector("h2").after(mapEl);
  makeMap(mapEl, [a], {fit: true, noLink: true});
  app.querySelectorAll("[data-go]").forEach(l => l.onclick = e => {
    e.preventDefault();
    document.getElementById(l.dataset.go).scrollIntoView({behavior: "smooth"});
  });
  window.scrollTo(0, 0);
}

function about() {
  app.innerHTML = `<section class="hero"><h1>About Story of Art</h1>
  <p>Story of Art tells the story of India's art forms through the geography that shaped them. Each art form is told in five parts: the art, the artist, the place, the history of all three, and our vision for what comes next.</p>
  <p class="note">This is a first draft. Names, dates and claims should be verified with practitioners, scholars and community organisations before wider publication. Corrections are welcome.</p></section>`;
}

function route() {
  const h = location.hash.replace(/^#\/?/, "").split("/");
  document.title = "Story of Art · Indian Art Forms";
  if (h[0] === "art" && h[1]) return detail(h[1]);
  if (h[0] === "about") return about();
  window.scrollTo(0, 0);
  home();
}
addEventListener("hashchange", route);
route();
