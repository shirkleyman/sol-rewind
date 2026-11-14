// Dev-only bot that plays a level in the browser, to smoke test the whole flow. In dev, load it with a script tag pointing at /tools/autoplay.js, then call window.__play(levelId, maxDays).
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  window.__log = [];
  window.__done = false;
  const log = (m) => window.__log.push(m);
  async function waitFor(fn, ms = 20000) {
    const t = Date.now();
    while (Date.now() - t < ms) {
      const v = fn();
      if (v) return v;
      await sleep(20);
    }
    return null;
  }
  async function play() {
    const title = $('.gt')?.innerText;
    if (title === 'Aim the solar panel') {
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          const sn = $('#sn'), zn = $('#zn');
          if (!sn || !zn) return false;
          const s = parseFloat(sn.style.left), z = parseFloat(zn.style.left) + parseFloat(zn.style.width) / 2;
          return Math.abs(s - z) < 2;
        }, 8000);
        $('#stp')?.click();
        await sleep(250);
      }
    } else if (title === 'Pump the water') {
      const t = Date.now();
      while (Date.now() - t < 6500 && $('#pp')) {
        const c = $('.clog');
        if (c) c.click(); else $('#pp').click();
        await sleep(110);
      }
    } else if (title === 'Catch the storm particles') {
      const t = Date.now();
      while (Date.now() - t < 25000 && $('#ar')) {
        const ar = $('#ar');
        const rect = ar.getBoundingClientRect();
        const ps = $$('.pt2:not(.decoy)')
          .map((p) => {
            const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(p.style.transform);
            return m ? { x: +m[1] + 12, y: +m[2] } : null;
          })
          .filter(Boolean)
          .sort((a, b) => b.y - a.y);
        if (ps.length) ar.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: rect.left + ps[0].x, clientY: rect.top + 100, pointerType: 'mouse' }));
        await sleep(30);
      }
    } else if (title === 'Match the plant cards') {
      const cards = $$('.cd');
      const face = {};
      const done = new Set();
      for (let a = 0; a < cards.length; a++) {
        if (done.has(a)) continue;
        for (let j = a + 1; j < cards.length; j++) {
          if (done.has(j)) continue;
          if (!cards[a].classList.contains('up')) { cards[a].click(); await sleep(30); }
          face[a] = cards[a].innerHTML;
          cards[j].click();
          face[j] = cards[j].innerHTML;
          await sleep(60);
          if (face[j] === face[a]) { done.add(a); done.add(j); break; }
          await sleep(720);
        }
      }
    } else if (title === 'Copy the sample pattern') {
      const seq = [];
      const bs = $$('.sbt');
      let last = -1;
      const obs = setInterval(() => {
        const i = bs.findIndex((b) => b.classList.contains('lit'));
        if (i !== -1 && i !== last) { seq.push(i); last = i; }
        if (i === -1) last = -1;
      }, 15);
      await waitFor(() => /Your turn/.test($('#sm')?.innerText || ''), 15000);
      clearInterval(obs);
      for (const i of seq) { bs[i].click(); await sleep(60); }
    } else if (title === 'Dust sensor') {
      for (let r = 0; r < 4; r++) {
        await waitFor(() => $('.light.go'), 10000);
        await sleep(60);
        $('#tap')?.click();
        await sleep(1000);
      }
    } else if (title === 'Steady breathing') {
      $('#bt').addEventListener('animationstart', () => setTimeout(() => $('#tap')?.click(), 0));
      await waitFor(() => $('#collect'), 12000);
    } else if (title === 'Fix the wiring') {
      const t = Date.now();
      while (Date.now() - t < 14000 && $('.tiles')) {
        $$('.tile.hot').forEach((x) => x.click());
        await sleep(40);
      }
    } else log('unknown game ' + title);
    const col = await waitFor(() => $('#collect'), 12000);
    log(title + ' -> ' + ($('.ga')?.innerText.replace(/\n+/g, ' | ') || ''));
    col?.click();
    await sleep(1300);
  }
  async function level(id, maxDays = 12) {
    const node = $(`.node[data-i="${id}"]`);
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await sleep(300);
    $('[data-act="start"]').click();
    await sleep(300);
    for (let day = 1; day <= maxDays; day++) {
      if ($('.ov [data-act="map"]')) break;
      await sleep(400);
      for (let i = 0; i < 4 && $('.sp-ov'); i++) {
        log('surprise: ' + ($('.sp-title')?.innerText || ''));
        ($('#sp-ok') || $('#sp-skip') || $('.sp-ov button'))?.click();
        await sleep(500);
      }
      const st = $$('.st').map((s) => s.dataset.t);
      const meter = $$('.meters .mt').map((m) => parseFloat(m.innerText.match(/\d+/)?.[0] || 0));
      const al = $('.al')?.innerText || '';
      const order = [];
      if (/out of order/.test(al) && st.includes('repair')) order.push('repair');
      if (/solar storm/.test(al) && st.includes('shield')) order.push('shield');
      if (meter[0] < 45 && st.includes('power')) order.push('power');
      if (meter[1] < 30 && st.includes('water')) order.push('water');
      if (meter[2] < 35 && st.includes('rest')) order.push('rest');
      order.push('exp', 'power', 'water');
      let did = 0;
      const want = $$('.st').length ? Number(($('.chip:nth-of-type(2)')?.innerText.match(/of (\d)/) || [0, 2])[1]) : 2;
      for (const k of order) {
        if (did >= want) break;
        const btn = $(`.st[data-t="${k}"]`);
        if (!btn || btn.classList.contains('broken')) continue;
        btn.click();
        await sleep(900);
        if ($('.gm')) { await play(); did++; } else await sleep(100);
      }
      log(`day ${day} tasks ${did}`);
      if ($('.ov [data-act="map"]')) break;
      if ($('#end')) $('#end').click();
      await sleep(500);
    }
    log('result: ' + ($('.ov .box')?.innerText.replace(/\n+/g, ' | ') || 'no overlay'));
    window.__done = true;
  }
  window.__play = async (id, maxDays) => { try { await level(id, maxDays); } catch (e) { log('ERR ' + e); } window.__done = true; };
})();
