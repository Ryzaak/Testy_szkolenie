const POWTORKI = 2;          // ile razy pytanie wraca po błędnej odpowiedzi
const LITERY = ["A", "B", "C", "D"];

let zakladki = [];
let zakladka = null;         // { id, nazwa, plik }
let pytania = [];
let stan = null;
let biezace = null;          // { p, opcje, odpowiedziano }
let startCzasu = null;       // kiedy zaczęło się bieżące odliczanie (ms)

const klucz = () => "testy_v2_" + zakladka.id;
function nowyStan() {
  return { p: {}, odp: 0, dobre: 0, ostatnie: [], tematy: null, czas: 0 };
}
function wczytaj() {
  try { return { ...nowyStan(), ...JSON.parse(localStorage.getItem(klucz())) }; }
  catch { return nowyStan(); }
}
function zapisz() {
  try { localStorage.setItem(klucz(), JSON.stringify(stan)); } catch {}
}
function tasuj(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// --- czas rozwiązywania: liczy tylko, gdy karta jest widoczna i są pytania do zrobienia ---
function zatrzymajCzas() {
  if (startCzasu !== null) { stan.czas += Date.now() - startCzasu; startCzasu = null; zapisz(); }
}
function wznowCzas() {
  if (startCzasu === null && biezace && !document.hidden) startCzasu = Date.now();
}
function formatCzas(ms) {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sek = s % 60;
  const dw = n => String(n).padStart(2, "0");
  return h ? `${h}:${dw(m)}:${dw(sek)}` : `${m}:${dw(sek)}`;
}
function rysujCzas() {
  if (!stan) return;
  const ms = stan.czas + (startCzasu !== null ? Date.now() - startCzasu : 0);
  document.getElementById("sCzas").textContent = formatCzas(ms);
}
setInterval(rysujCzas, 1000);
setInterval(() => { if (startCzasu !== null) { zatrzymajCzas(); wznowCzas(); } }, 15000);
document.addEventListener("visibilitychange", () => { document.hidden ? zatrzymajCzas() : wznowCzas(); });
window.addEventListener("pagehide", zatrzymajCzas);

function wybrane() { return pytania.filter(p => stan.tematy.includes(p.temat)); }

function odswiezStatystyki() {
  const w = wybrane();
  let done = 0, retry = 0;
  for (const p of w) {
    const s = stan.p[p.id];
    if (s?.s === "done") done++; else if (s?.s === "retry") retry++;
  }
  document.getElementById("sDone").textContent = `${done}/${w.length}`;
  document.getElementById("sRetry").textContent = retry;
  document.getElementById("sNew").textContent = w.length - done - retry;
  document.getElementById("sAcc").textContent = stan.odp ? Math.round(100 * stan.dobre / stan.odp) + "%" : "–";
  document.getElementById("bar").style.width = w.length ? (100 * done / w.length) + "%" : "0";
  rysujCzas();
}

function rysujZakladki() {
  const box = document.getElementById("tabs");
  box.innerHTML = "";
  for (const z of zakladki) {
    const b = document.createElement("button");
    b.className = "tab" + (z.id === zakladka?.id ? " on" : "");
    b.innerHTML = `<b>${esc(z.kod || z.id)}</b> – ${esc(z.nazwa)}`;
    b.onclick = () => { if (z.id !== zakladka.id) otworz(z.id); };
    box.appendChild(b);
  }
}

function rysujTematy() {
  const tematy = [...new Set(pytania.map(p => p.temat))];
  const box = document.getElementById("chips");
  box.innerHTML = "";
  for (const t of tematy) {
    const ile = pytania.filter(p => p.temat === t).length;
    const b = document.createElement("button");
    b.className = "chip" + (stan.tematy.includes(t) ? " on" : "");
    b.textContent = `${t} (${ile})`;
    b.onclick = () => {
      if (stan.tematy.includes(t)) {
        if (stan.tematy.length === 1) return;   // co najmniej jeden temat
        stan.tematy = stan.tematy.filter(x => x !== t);
      } else stan.tematy.push(t);
      zapisz(); rysujTematy();
      if (!biezace || biezace.odpowiedziano || !stan.tematy.includes(biezace.p.temat)) nastepne();
      else odswiezStatystyki();
    };
    box.appendChild(b);
  }
}

function losuj() {
  const pula = wybrane().filter(p => stan.p[p.id]?.s !== "done");
  if (!pula.length) return null;
  // żeby to samo pytanie nie wracało od razu, pomijamy kilka ostatnich
  const odstep = Math.min(4, pula.length - 1);
  const pomin = new Set(odstep ? stan.ostatnie.slice(-odstep) : []);
  const kandydaci = pula.filter(p => !pomin.has(p.id));
  return kandydaci[Math.floor(Math.random() * kandydaci.length)];
}

function nastepne() {
  const p = losuj();
  const card = document.getElementById("card");
  if (!p) {
    zatrzymajCzas();
    biezace = null;
    odswiezStatystyki();
    card.innerHTML = `<div class="done"><h2>Wszystkie pytania opanowane 🎯</h2>
      <p>Skuteczność: ${stan.odp ? Math.round(100 * stan.dobre / stan.odp) : 0}% (${stan.dobre}/${stan.odp} odpowiedzi),
      czas: ${formatCzas(stan.czas)}.</p>
      <p><button class="btn primary" id="odNowa">Zacznij od nowa</button></p></div>`;
    document.getElementById("odNowa").onclick = resetuj;
    return;
  }
  const s = stan.p[p.id] || (stan.p[p.id] = { s: "new", left: 0, zle: 0, ile: 0 });
  s.ile = (s.ile || 0) + 1;
  zapisz();
  const opcje = tasuj([{ t: p.poprawna, ok: true }, ...p.bledne.map(t => ({ t, ok: false }))]);
  biezace = { p, opcje, odpowiedziano: false };
  wznowCzas();
  odswiezStatystyki();
  const status = s.s === "retry" ? `<span class="tag retry">powtórka</span>` : "";
  const zrodlo = p.zrodlo === "test" ? `<span class="tag test">z testu</span>` : `<span class="tag pres">z prezentacji</span>`;
  card.innerHTML = `
    <div class="meta"><span>${esc(p.temat)} ${zrodlo}</span>
      <span>${status}<span class="licznik" title="Ile razy to pytanie już się pojawiło">${s.ile}</span></span></div>
    <div class="q">${esc(p.pytanie)}</div>
    <div class="opts">${opcje.map((o, i) =>
      `<button class="opt" data-i="${i}"><span class="l">${LITERY[i]}</span><span>${esc(o.t)}</span></button>`).join("")}
    </div>
    <div class="feedback" id="fb"></div>
    <div class="next" id="nx"><button class="btn primary" id="dalej">Następne pytanie →</button></div>`;
  document.getElementById("dalej").onclick = nastepne;
  card.querySelectorAll(".opt").forEach(b => b.onclick = () => odpowiedz(+b.dataset.i));
}

function odpowiedz(i) {
  if (!biezace || biezace.odpowiedziano) return;
  biezace.odpowiedziano = true;
  const { p, opcje } = biezace;
  const trafione = opcje[i].ok;
  document.querySelectorAll(".opt").forEach((b, k) => {
    b.disabled = true;
    if (opcje[k].ok) b.classList.add("correct");
    else if (k === i) b.classList.add("wrong");
    else b.classList.add("dim");
  });

  const s = stan.p[p.id];
  stan.odp++;
  if (trafione) {
    stan.dobre++;
    if (s.s === "retry") { s.left--; if (s.left <= 0) s.s = "done"; }
    else s.s = "done";
  } else {
    s.s = "retry"; s.left = POWTORKI; s.zle++;
  }
  stan.ostatnie = [...stan.ostatnie, p.id].slice(-10);
  zapisz();

  const poprawnaLitera = LITERY[opcje.findIndex(o => o.ok)];
  const fb = document.getElementById("fb");
  fb.className = "feedback show " + (trafione ? "ok" : "bad");
  fb.innerHTML = `<h3>${trafione ? "Dobrze!" : `Źle – poprawna odpowiedź to ${poprawnaLitera}`}</h3>
    <p>${esc(p.wyjasnienie)}</p>`;
  document.getElementById("nx").classList.add("show");
  odswiezStatystyki();
}

function resetuj() {
  startCzasu = null;
  const { tematy, znane } = stan;
  stan = nowyStan();
  Object.assign(stan, { tematy, znane });
  zapisz();
  nastepne();
}
document.getElementById("reset").onclick = resetuj;

document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const k = e.key.toLowerCase();
  const idx = ["1", "2", "3", "4"].indexOf(k) >= 0 ? +k - 1 : ["a", "b", "c", "d"].indexOf(k);
  if (idx >= 0 && biezace && !biezace.odpowiedziano) { odpowiedz(idx); e.preventDefault(); }
  else if ((k === "enter" || k === " ") && biezace?.odpowiedziano) { nastepne(); e.preventDefault(); }
});

async function otworz(id) {
  if (stan) zatrzymajCzas();
  biezace = null;
  zakladka = zakladki.find(z => z.id === id) || zakladki[0];
  try { localStorage.setItem("testy_zakladka", zakladka.id); } catch {}
  history.replaceState(null, "", "#" + zakladka.id);
  rysujZakladki();
  const kod = zakladka.kod || zakladka.id;
  document.getElementById("tytul").innerHTML = `${esc(kod)} – ${esc(zakladka.nazwa)}`;
  document.title = `${kod} – ${zakladka.nazwa}`;
  document.getElementById("card").textContent = "Ładowanie pytań…";
  try {
    pytania = await fetch("dane/" + zakladka.plik, { cache: "no-store" }).then(r => r.json());
  } catch {
    document.getElementById("card").textContent = "Nie udało się wczytać pytań tej zakładki.";
    return;
  }
  stan = wczytaj();
  const wszystkie = [...new Set(pytania.map(p => p.temat))];
  // tematy, których viewer jeszcze nie widział (np. dodane później), włączamy od razu
  const znane = stan.znane || stan.tematy || [];
  stan.tematy = (stan.tematy || wszystkie).filter(t => wszystkie.includes(t));
  stan.tematy.push(...wszystkie.filter(t => !znane.includes(t) && !stan.tematy.includes(t)));
  if (!stan.tematy.length) stan.tematy = wszystkie;
  stan.znane = wszystkie;
  zapisz();
  rysujTematy();
  nastepne();
}

fetch("dane/zakladki.json", { cache: "no-store" }).then(r => r.json()).then(z => {
  zakladki = z;
  let start = location.hash.slice(1);
  if (!zakladki.some(x => x.id === start)) {
    try { start = localStorage.getItem("testy_zakladka"); } catch { start = null; }
  }
  otworz(start);
}).catch(() => {
  document.getElementById("card").textContent = "Nie udało się wczytać listy zakładek – otwórz stronę przez app.py albo z internetu.";
});
