// Exports the creative deck (v2.html) in two formats per version:
//   showcase/v2/<version>/behance/  numbered modules to upload in order (JPG stills + animated GIFs)
//   showcase/v2/<version>/Isaac-Newking-Portfolio-<version>.pdf  flattened 4K pages with clickable contents
// usage: node scripts/deck/export_v2.js <framesDir> [short|long]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const FR = path.resolve(process.argv[2]), only = process.argv[3];
const root = process.cwd(), url = (v) => `file://${root}/scripts/deck/v2.html?v=${v}&frames=${encodeURIComponent(FR)}`;

(async () => {
  const b = await chromium.launch();
  for (const v of only ? [only] : ['short', 'long']) {
    const out = path.join(root, 'showcase/v2', v), mod = path.join(out, 'behance'), tmp = path.join(out, '.tmp');
    fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(mod, { recursive: true }); fs.mkdirSync(tmp, { recursive: true });
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
    await p.goto(url(v)); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1000);
    const motion = await p.evaluate(() => window.PAGES);
    const els = await p.$$('.pg');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(tmp, `${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 82 });
    const links = await p.evaluate(() => { const all = [...document.querySelectorAll('.pg')], toc = document.querySelector('.toc'), tr = toc.getBoundingClientRect();
      return { page: all.indexOf(toc), items: [...toc.querySelectorAll('a')].map((a) => { const r = a.getBoundingClientRect(); return { x: r.left - tr.left, y: r.top - tr.top, w: r.width, h: r.height, to: all.indexOf(document.getElementById(a.getAttribute('href').slice(1))) }; }) }; });
    // PDF: one flattened image per page, contents links laid over the contents page
    let html = '<!doctype html><html><head><style>@page{size:1920px 1080px;margin:0} html,body{margin:0;background:#050505} .pg{position:relative;width:1920px;height:1080px;page-break-after:always;overflow:hidden} .pg img{width:1920px;height:1080px;display:block} .pg a{position:absolute;display:block}</style></head><body>';
    els.forEach((_, i) => { html += `<div class="pg" id="p${i}"><img src="${String(i + 1).padStart(2, '0')}.jpg">`; if (i === links.page) links.items.forEach((l) => { html += `<a href="#p${l.to}" style="left:${l.x}px;top:${l.y}px;width:${l.w}px;height:${l.h}px"></a>`; }); html += '</div>'; });
    fs.writeFileSync(path.join(tmp, 'flat.html'), html + '</body></html>');
    const q = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    await q.goto('file://' + path.join(tmp, 'flat.html')); await q.waitForLoadState('networkidle');
    await q.pdf({ path: path.join(out, `Isaac-Newking-Portfolio-${v}.pdf`), width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
    await q.close();
    // Behance modules: stills as 1920px JPGs, motion pages as 1400px GIFs
    const r = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await r.goto(url(v)); await r.waitForLoadState('networkidle'); await r.evaluate(() => document.fonts.ready); await r.waitForTimeout(800);
    const pgs = await r.$$('.pg');
    for (let i = 0; i < pgs.length; i++) {
      const name = String(i + 1).padStart(2, '0'), kind = motion[i];
      if (!kind) { execSync(`python3 -c "from PIL import Image; Image.open('${tmp}/${name}.jpg').convert('RGB').resize((1920,1080), Image.LANCZOS).save('${mod}/${name}.jpg', quality=88)"`); continue; }
      const fd = path.join(tmp, 'f' + name); fs.mkdirSync(fd);
      if (kind === 'video') {
        for (let k = 0; k < 36; k++) { await r.evaluate((k) => window.setFrame(k), k); await r.waitForTimeout(60); await pgs[i].screenshot({ path: path.join(fd, `${String(k).padStart(3, '0')}.png`) }); }
        await r.evaluate(() => window.setFrame(0));
      } else if (kind === 'svc') {
        let f = 0; const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        for (let k = 0; k < 7; k++) {
          for (let h = 0; h < 5; h++) { await r.evaluate((a) => window.setSvc(a), k); await pgs[i].screenshot({ path: path.join(fd, `${String(f++).padStart(3, '0')}.png`) }); }
          if (k === 6) break;
          for (let s = 1; s <= 6; s++) { await r.evaluate((a) => window.setSvc(a), k + ease(s / 6)); await pgs[i].screenshot({ path: path.join(fd, `${String(f++).padStart(3, '0')}.png`) }); }
        }
        await r.evaluate(() => window.setSvc(2));
      } else {
        // pixel reveal: the whole cover, or just the photo on the about page, sharpens from big blocks
        await pgs[i].screenshot({ path: path.join(fd, 'still.png') });
        execSync(`python3 ${root}/scripts/deck/pixel_frames.py ${fd} ${kind}`);
      }
      execSync(`ffmpeg -y -loglevel error -framerate ${kind === 'video' ? 9 : 12} -i ${fd}/%03d.png -vf "scale=1400:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" -loop 0 ${mod}/${name}.gif`);
    }
    await r.close(); await p.close();
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(v, els.length, 'pages');
  }
  await b.close();
})();
