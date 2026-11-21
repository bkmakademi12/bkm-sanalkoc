/*!
 * BKM Sanal Etüt — Ders Programı bileşeni
 * Ders Dağıtım programının yayınladığı programı portalda gösterir.
 *
 * Kullanım:
 *   <div id="dersProgrami"></div>
 *   <script src="bkm-ders-programi-widget.js"></script>
 *   BKMDersProgrami.goster(document.getElementById('dersProgrami'), {
 *     yol: 'kurumlar/bkmakademicarsi/dersProgrami',   // yayın yolu
 *     sinif: '8-A',            // ya da: ogretmen: 'Ayşe Yılmaz'
 *     // Veri kaynağı (biri yeterli):
 *     // - sayfada Firebase (compat) SDK varsa otomatik kullanılır ve canlı güncellenir
 *     // - dbUrl: 'https://...firebasedatabase.app'  (REST ile okur)
 *     // - veri: {...}  (yayın verisinin kendisi)
 *   });
 */
(function (global) {
  'use strict';
  var CSS = '.bkmdp{font-family:inherit;color:#1b2433}.bkmdp *{box-sizing:border-box}' +
    '.bkmdp-ust{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px}' +
    '.bkmdp-bas{font-weight:700;font-size:17px;color:#1f3b64}.bkmdp-alt{font-size:12px;color:#6b7689}' +
    '.bkmdp-simdi{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}' +
    '.bkmdp-sk{flex:1;min-width:200px;border-radius:10px;padding:10px 12px;border:1px solid #e2e7ef;background:#fff}' +
    '.bkmdp-sk small{display:block;font-size:11px;color:#6b7689;text-transform:uppercase;letter-spacing:.4px}.bkmdp-sk b{font-size:15px}' +
    '.bkmdp-sk.aktif{border-color:#7fcf9f;background:#effaf3}' +
    '.bkmdp-tab{width:100%;border-collapse:collapse;table-layout:fixed;background:#fff;border-radius:10px;overflow:hidden}' +
    '.bkmdp-tab th{font-size:12px;background:#f6f8fb;padding:7px 3px;border:1px solid #edf0f5}.bkmdp-tab th.bugun{background:#1f3b64;color:#fff}' +
    '.bkmdp-tab td{border:1px solid #edf0f5;padding:2px;height:50px;vertical-align:top}.bkmdp-tab td.bugun{background:#fbfcff}' +
    '.bkmdp-tab .sa{width:56px;font-size:11px;color:#6b7689;text-align:center;vertical-align:middle}.bkmdp-tab .sa b{display:block;color:#1b2433;font-size:13px}' +
    '.bkmdp-d{border-left:4px solid #999;border-radius:6px;padding:3px 6px;height:100%;font-size:11.5px;line-height:1.25;overflow:hidden}' +
    '.bkmdp-d b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bkmdp-d span{display:block;color:#4a5568;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.bkmdp-d.su-an{box-shadow:0 0 0 2px #f08a24}' +
    '.bkmdp-ogle td{height:auto;text-align:center;font-size:11px;color:#9a5a12;background:#fff7ec;padding:2px}' +
    '.bkmdp-gunler{display:none;gap:4px;overflow-x:auto;margin-bottom:8px}.bkmdp-gunler button{border:1px solid #e2e7ef;background:#fff;border-radius:16px;padding:5px 12px;font:inherit;font-size:13px;white-space:nowrap}' +
    '.bkmdp-gunler button.akt{background:#1f3b64;color:#fff;border-color:#1f3b64}' +
    '.bkmdp-liste{display:none}.bkmdp-li{display:flex;gap:10px;align-items:stretch;margin-bottom:6px}.bkmdp-li .bkmdp-s{width:58px;flex:none;text-align:center;font-size:11px;color:#6b7689;padding-top:4px}.bkmdp-li .bkmdp-s b{display:block;font-size:14px;color:#1b2433}.bkmdp-li .bkmdp-d{flex:1;min-height:44px}' +
    '.bkmdp-bos{color:#6b7689;text-align:center;padding:24px;background:#fff;border-radius:10px;border:1px dashed #d5dce6}' +
    '@media (max-width:640px){.bkmdp .bkmdp-tab{display:none}.bkmdp .bkmdp-gunler{display:flex}.bkmdp .bkmdp-liste{display:block}}';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hexA(h, a) { h = (h || '#888').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function key(s) { return String(s).trim().replace(/[.#$\[\]\/]/g, '-'); }
  function cssYukle() { if (document.getElementById('bkmdp-css')) return; var st = document.createElement('style'); st.id = 'bkmdp-css'; st.textContent = CSS; document.head.appendChild(st); }
  function dk(s) { var p = String(s).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  // JS gününü (0=Pazar) yayındaki gün sırasına çevir
  var TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  function bul(veri, o) {
    if (!veri) return null;
    var grup = o.ogretmen ? veri.ogretmenler : veri.siniflar, ad = o.ogretmen || o.sinif;
    if (!grup || !ad) return null;
    if (grup[key(ad)]) return grup[key(ad)];
    for (var k in grup) { var x = grup[k]; if (x && (x.pid === ad || String(x.ad).toLocaleUpperCase('tr-TR') === String(ad).toLocaleUpperCase('tr-TR'))) return x; }
    return null;
  }

  function ciz(el, veri, o, durum) {
    var kayit = bul(veri, o);
    if (!veri || !veri.meta) { el.innerHTML = '<div class="bkmdp bkmdp-bos">Ders programı henüz yayınlanmadı.</div>'; return; }
    if (!kayit) { el.innerHTML = '<div class="bkmdp bkmdp-bos">' + esc(o.ogretmen || o.sinif) + ' için yayınlanmış program bulunamadı.</div>'; return; }
    var M = veri.meta, gunler = M.gunler || [], saat = M.saatler || [], d = kayit.dersler || {};
    var simdi = new Date(), bugun = gunler.indexOf(TR[simdi.getDay()]), nowM = simdi.getHours() * 60 + simdi.getMinutes();
    var aktifS = -1, siradaki = null;
    if (bugun >= 0) for (var s = 0; s < saat.length; s++) {
      if (nowM >= dk(saat[s].bas) && nowM < dk(saat[s].bit)) aktifS = s;
      if (!siradaki && dk(saat[s].bas) > nowM && d[bugun + '_' + s]) siradaki = { s: s, x: d[bugun + '_' + s] };
    }
    var su = aktifS >= 0 ? d[bugun + '_' + aktifS] : null;
    var alt = function (x) { return o.ogretmen ? (x.sinif || '') : (x.ogretmen || ''); };
    if (durum.gun == null) durum.gun = bugun >= 0 ? bugun : 0;
    var h = '<div class="bkmdp"><div class="bkmdp-ust"><div><div class="bkmdp-bas">' + esc(kayit.ad) + ' · Haftalık Ders Programı</div><div class="bkmdp-alt">' + esc(M.okulAdi || '') + ' · Güncelleme: ' + esc(M.guncellemeMetin || '') + ' · ' + (kayit.haftalikSaat || 0) + ' ders saati</div></div></div>';
    if (bugun >= 0) {
      h += '<div class="bkmdp-simdi"><div class="bkmdp-sk' + (su ? ' aktif' : '') + '"><small>Şu an</small><b>' + (su ? esc(su.ders) + '</b> · ' + esc(alt(su)) : (aktifS >= 0 ? 'Boş saat</b>' : 'Ders saati dışında</b>')) + '</div>' +
        '<div class="bkmdp-sk"><small>Sıradaki</small><b>' + (siradaki ? esc(siradaki.x.ders) + '</b> · ' + esc(saat[siradaki.s].bas) + ' · ' + esc(alt(siradaki.x)) : 'Bugün başka ders yok</b>') + '</div></div>';
    }
    // masaüstü tablo
    h += '<table class="bkmdp-tab"><thead><tr><th class="sa">Saat</th>' + gunler.map(function (g, i) { return '<th class="' + (i === bugun ? 'bugun' : '') + '">' + esc(g) + '</th>'; }).join('') + '</tr></thead><tbody>';
    for (s = 0; s < saat.length; s++) {
      if (M.ogleSonrasi && s === M.ogleSonrasi) h += '<tr class="bkmdp-ogle"><td colspan="' + (gunler.length + 1) + '">Öğle arası</td></tr>';
      h += '<tr><td class="sa"><b>' + (s + 1) + '</b>' + esc(saat[s].bas) + '</td>';
      for (var g = 0; g < gunler.length; g++) {
        var x = d[g + '_' + s];
        h += '<td class="' + (g === bugun ? 'bugun' : '') + '">' + (x ? '<div class="bkmdp-d' + (g === bugun && s === aktifS ? ' su-an' : '') + '" style="background:' + hexA(x.renk, 0.18) + ';border-left-color:' + esc(x.renk) + '"><b>' + esc(x.ders) + '</b><span>' + esc(alt(x)) + (x.derslik ? ' · ' + esc(x.derslik) : '') + '</span></div>' : '') + '</td>';
      }
      h += '</tr>';
    }
    h += '</tbody></table>';
    // mobil gün listesi
    h += '<div class="bkmdp-gunler">' + gunler.map(function (gg, i) { return '<button data-bkmdp-gun="' + i + '" class="' + (i === durum.gun ? 'akt' : '') + '">' + esc(gg) + (i === bugun ? ' •' : '') + '</button>'; }).join('') + '</div><div class="bkmdp-liste">';
    var var1 = false;
    for (s = 0; s < saat.length; s++) {
      x = d[durum.gun + '_' + s]; if (!x) continue; var1 = true;
      h += '<div class="bkmdp-li"><div class="bkmdp-s"><b>' + (s + 1) + '</b>' + esc(saat[s].bas) + '</div><div class="bkmdp-d' + (durum.gun === bugun && s === aktifS ? ' su-an' : '') + '" style="background:' + hexA(x.renk, 0.18) + ';border-left-color:' + esc(x.renk) + '"><b>' + esc(x.ders) + '</b><span>' + esc(alt(x)) + (x.derslik ? ' · ' + esc(x.derslik) : '') + '</span></div></div>';
    }
    if (!var1) h += '<div class="bkmdp-bos">Bu gün ders yok.</div>';
    h += '</div></div>';
    el.innerHTML = h;
  }

  function goster(el, o) {
    o = o || {};
    cssYukle();
    var durum = { gun: null }, son = null, kapat = null;
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-bkmdp-gun]'); if (!b) return; durum.gun = +b.getAttribute('data-bkmdp-gun'); ciz(el, son, o, durum); });
    function al(v) { son = v; ciz(el, v, o, durum); }
    var zamanlayici = setInterval(function () { if (son) ciz(el, son, o, durum); }, 60000);
    el.innerHTML = '<div class="bkmdp bkmdp-bos">Ders programı yükleniyor…</div>';
    if (o.veri) al(o.veri);
    else if (!o.dbUrl && global.firebase && global.firebase.database) {
      var ref = global.firebase.database().ref(o.yol);
      var cb = function (snap) { al(snap.val()); };
      ref.on('value', cb); kapat = function () { ref.off('value', cb); };
    } else if (o.dbUrl) {
      fetch(String(o.dbUrl).replace(/\/+$/, '') + '/' + String(o.yol).replace(/^\/+/, '') + '.json' + (o.auth ? '?auth=' + encodeURIComponent(o.auth) : ''))
        .then(function (r) { return r.json(); }).then(al)
        .catch(function () { el.innerHTML = '<div class="bkmdp bkmdp-bos">Ders programı yüklenemedi.</div>'; });
    } else el.innerHTML = '<div class="bkmdp bkmdp-bos">Veri kaynağı tanımlı değil.</div>';
    return { yenile: function () { if (son) ciz(el, son, o, durum); }, kapat: function () { clearInterval(zamanlayici); if (kapat) kapat(); } };
  }
  global.BKMDersProgrami = { goster: goster };
})(typeof window !== 'undefined' ? window : this);
