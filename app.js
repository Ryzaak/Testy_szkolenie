const POWTORKI = 2;          // ile razy pytanie wraca po błędnej odpowiedzi
const LITERY = ["A", "B", "C", "D"];
const PARY = [["Prawda", "Fałsz"], ["Tak", "Nie"]];

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
  odswiezWynik();
}
setInterval(rysujCzas, 1000);
setInterval(() => { if (startCzasu !== null) { zatrzymajCzas(); wznowCzas(); } }, 15000);
document.addEventListener("visibilitychange", () => { document.hidden ? zatrzymajCzas() : wznowCzas(); });
window.addEventListener("pagehide", zatrzymajCzas);

function wybrane() { return pytania.filter(p => stan.tematy.includes(p.temat)); }

// --- wynik: ten sam, co po przerobieniu wszystkich pytań, dostępny także w trakcie ---
function htmlWyniku(koniec) {
  const w = wybrane();
  const czas = stan.czas + (startCzasu !== null ? Date.now() - startCzasu : 0);
  const sk = stan.odp ? Math.round(100 * stan.dobre / stan.odp) + "%" : "–";
  const tematy = stan.tematy.filter(t => w.some(p => p.temat === t));
  let done = 0;
  const wiersze = tematy.map(t => {
    const pt = w.filter(p => p.temat === t);
    let d = 0, bylo = 0, zle = 0;
    for (const p of pt) {
      const s = stan.p[p.id];
      if (s?.s === "done") d++;
      if (s && (s.s === "done" || s.s === "retry")) bylo++;
      if (s?.zle) zle++;
    }
    done += d;
    const pierwszy = bylo ? Math.round(100 * (bylo - zle) / bylo) + "%" : "–";
    return `<tr><td>${esc(t)}</td><td>${d}/${pt.length}</td><td>${zle}</td><td>${pierwszy}</td></tr>`;
  }).join("");
  return `<h2>${koniec ? "Wszystkie pytania opanowane 🎯" : "📊 Wynik na teraz"}</h2>
    <div class="duze">
      <div><b>${sk}</b><span>skuteczność (${stan.dobre}/${stan.odp} odpowiedzi)</span></div>
      <div><b>${done}/${w.length}</b><span>opanowane</span></div>
      <div><b>${formatCzas(czas)}</b><span>czas</span></div>
    </div>
    <table><tr><th>Test / temat</th><th>opanowane</th><th>pytania z błędem</th><th>dobrze za 1. razem</th></tr>${wiersze}</table>`;
}
function pokazWynik() {
  const box = document.getElementById("wynik");
  if (!box.hidden) { ukryjWynik(); return; }
  box.innerHTML = `<div id="wynikTresc"></div><div class="stopka"><button class="btn primary" id="ukryjWynik">Wróć do pytań</button></div>`;
  box.hidden = false;
  odswiezWynik();
  document.getElementById("pokazWynikTxt").textContent = "ukryj wynik";
  document.getElementById("pokazWynik").classList.add("on");
  document.getElementById("ukryjWynik").onclick = pokazWynik;
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}
// gdy wynik jest widoczny, odświeża się razem ze statystykami i co sekundę (czas)
function odswiezWynik() {
  const box = document.getElementById("wynik");
  if (box.hidden || !stan || !pytania.length) return;
  const t = document.getElementById("wynikTresc");
  if (t) t.innerHTML = htmlWyniku(false);
}
function ukryjWynik() {
  document.getElementById("wynik").hidden = true;
  document.getElementById("pokazWynikTxt").textContent = "pokaż wynik";
  document.getElementById("pokazWynik").classList.remove("on");
}
document.getElementById("pokazWynik").onclick = pokazWynik;

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
  const boxEx = document.getElementById("tabsEx"), box = document.getElementById("tabs");
  boxEx.innerHTML = box.innerHTML = "";
  const inne = document.getElementById("inne");
  const akt = !zakladka?.wyrozniona ? zakladka : null;
  document.getElementById("inneAkt").textContent = akt ? "– otwarte: " + (akt.kod || akt.id) : "";
  for (const z of zakladki) {
    const b = document.createElement("button");
    b.className = "tab" + (z.wyrozniona ? " ex" : "") + (z.id === zakladka?.id ? " on" : "");
    b.innerHTML = `<span class="kod">${esc(z.kod || z.id)}</span><span class="nazwa">${esc(z.nazwa)}</span>`;
    b.onclick = () => { if (z.id !== zakladka?.id) otworz(z.id); };
    (z.wyrozniona ? boxEx : box).appendChild(b);
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
    ukryjWynik();
    card.innerHTML = `<div class="done wynik-koniec">${htmlWyniku(true)}
      <p><button class="btn primary" id="odNowa">Zacznij od nowa</button></p></div>`;
    document.getElementById("odNowa").onclick = resetuj;
    return;
  }
  const s = stan.p[p.id] || (stan.p[p.id] = { s: "new", left: 0, zle: 0, ile: 0 });
  s.ile = (s.ile || 0) + 1;
  zapisz();
  // pytania prawda/fałsz i tak/nie mają stałą kolejność odpowiedzi, pozostałe są tasowane
  const para = p.bledne.length === 1 && PARY.find(x => x.includes(p.poprawna) && x.includes(p.bledne[0]));
  const opcje = para
    ? para.map(t => ({ t, ok: t === p.poprawna }))
    : tasuj([{ t: p.poprawna, ok: true }, ...p.bledne.map(t => ({ t, ok: false }))]);
  biezace = { p, opcje, odpowiedziano: false };
  wznowCzas();
  odswiezStatystyki();
  const status = s.s === "retry" ? `<span class="tag retry">powtórka</span>` : "";
  const ETYKIETY = { test: ["test", "z testu"], prezentacje: ["pres", "z prezentacji"], wlasne: ["wlasne", "opracowane"] };
  const [klasa, napis] = ETYKIETY[p.zrodlo] || ETYKIETY.prezentacje;
  const zrodlo = `<span class="tag ${klasa}">${napis}</span>`;
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
  ukryjWynik();
  nastepne();
}
document.getElementById("reset").onclick = resetuj;

document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const k = e.key.toLowerCase();
  const idx = ["1", "2", "3", "4"].indexOf(k) >= 0 ? +k - 1 : ["a", "b", "c", "d"].indexOf(k);
  if (idx >= 0 && biezace && !biezace.odpowiedziano && idx < biezace.opcje.length) { odpowiedz(idx); e.preventDefault(); }
  else if ((k === "enter" || k === " ") && biezace?.odpowiedziano) { nastepne(); e.preventDefault(); }
});

function ekranStartowy() {
  zakladka = null; biezace = null; stan = null;
  document.body.classList.add("start");
  rysujZakladki();
  document.getElementById("tytul").textContent = "Wybierz test";
  document.title = "Testy – nauka";
  document.getElementById("card").innerHTML = `<div class="done"><h2>Wybierz test 👆</h2>
    <p>Kliknij „Egzamin końcowy”, „Egzamin – spoza programu” albo rozwiń „Pozostałe testy”.</p></div>`;
}

async function otworz(id) {
  document.body.classList.remove("start");
  if (stan) zatrzymajCzas();
  biezace = null;
  ukryjWynik();
  zakladka = zakladki.find(z => z.id === id) || zakladki[0];
  try { localStorage.setItem("testy_zakladka", zakladka.id); } catch {}
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
  // bez wybranego testu w adresie strona startuje bez otwartej zakładki
  const start = location.hash.slice(1);
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  if (zakladki.some(x => x.id === start)) otworz(start);
  else ekranStartowy();
}).catch(() => {
  document.getElementById("card").textContent = "Nie udało się wczytać listy zakładek – otwórz stronę przez app.py albo z internetu.";
});
