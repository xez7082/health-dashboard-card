/**
 * HEALTH DASHBOARD CARD — V6.1
 * 500px strict sans scroll | Avatar cliquable | Auto-grid capteurs
 */

const CAT = {
  forme:     { label: '⚡ Forme',    color: '#06b6d4', bg: 'rgba(6,182,212,0.07)'   },
  sommeil:   { label: '🌙 Sommeil',  color: '#818cf8', bg: 'rgba(129,140,248,0.07)' },
  sante:     { label: '🩺 Santé',    color: '#10b981', bg: 'rgba(16,185,129,0.07)'  },
  nutrition: { label: '🥗 Nutrition',color: '#f59e0b', bg: 'rgba(245,158,11,0.07)'  },
};

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._editingImage = false;
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  static getStubConfig() {
    return {
      current_person_idx: 0,
      people: [{ name: 'Moi', weight_entity: '', start: 80, ideal: 75, image: '', sensors: [] }]
    };
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!Array.isArray(this._config.people)) {
      const old = this._config.people;
      this._config.people = old && old.name ? [old] : [];
    }
    if (!this._config.people.length)
      this._config.people = [{ name: 'Nouveau', sensors: [], start: 80, ideal: 75 }];
    if (this._config.current_person_idx === undefined) this._config.current_person_idx = 0;
    this.render();
  }

  set hass(hass) { this._hass = hass; this.update(); }

  _fmt(v) {
    const n = parseFloat(v);
    return isNaN(n) ? v : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config.people[this._config.current_person_idx];
    if (!p) return;

    (p.sensors || []).forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`s-${i}-v`);
      if (el && s.entity && this._hass.states[s.entity])
        el.textContent = this._fmt(this._hass.states[s.entity].state) + (s.unit || '');
    });

    const stateW = p.weight_entity && this._hass.states[p.weight_entity];
    if (stateW) {
      const cur = parseFloat(stateW.state);
      const start = parseFloat(p.start) || cur;
      const ideal = parseFloat(p.ideal) || cur;
      const diff = (cur - start).toFixed(2);
      const total = Math.abs(start - ideal);
      const done = Math.abs(start - cur);
      const pct = total ? Math.min(100, Math.max(0, (done / total) * 100)) : 0;

      const set = (id, txt) => { const e = this.shadowRoot.getElementById(id); if (e) e.textContent = txt; };
      set('weight-val', cur.toFixed(2) + ' kg');
      set('prog-pct', Math.round(pct) + '% atteint');
      set('reste-val', Math.abs(cur - ideal).toFixed(2) + ' kg restants');

      const dEl = this.shadowRoot.getElementById('diff-val');
      if (dEl) {
        dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
        dEl.style.color = cur <= start ? '#10b981' : '#ef4444';
      }
      const bar = this.shadowRoot.getElementById('prog-bar');
      if (bar) bar.style.width = pct + '%';
    }
  }

  _groups(sensors) {
    const g = {};
    (sensors || []).forEach((s, i) => {
      const c = s.cat || 'forme';
      if (!g[c]) g[c] = [];
      g[c].push({ ...s, _idx: i });
    });
    return g;
  }

  render() {
    if (!this._config) return;
    const idx = this._config.current_person_idx;
    const p = this._config.people[idx] || this._config.people[0];
    const groups = this._groups(p.sensors);
    const cats = Object.keys(CAT).filter(k => groups[k]?.length > 0);
    const initials = (p.name || '?')[0].toUpperCase();

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .card {
          font-family: 'Roboto', 'Segoe UI', sans-serif;
          background: #0d1321;
          border-radius: 20px;
          color: #e2e8f0;
          border: 1px solid #1e2d3d;
          height: 500px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #06b6d4, #818cf8, #10b981);
          z-index: 5;
        }

        .hero {
          flex-shrink: 0;
          padding: 14px 14px 10px;
          background: #111827;
          border-bottom: 1px solid #1e2d3d;
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
        }

        .av-wrap {
          position: relative;
          width: 44px; height: 44px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .av-wrap:hover .av-overlay { opacity: 1; }
        .avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: #1e2d3d;
          border: 2px solid #06b6d4;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .av-initials { font-size: 17px; font-weight: 800; color: #06b6d4; }
        .av-overlay {
          position: absolute; inset: 0;
          border-radius: 50%;
          background: rgba(6,182,212,0.8);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .img-popup {
          position: absolute;
          top: 58px; left: 10px;
          width: 260px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 10px;
          padding: 10px;
          z-index: 50;
          display: flex; gap: 6px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
        .img-popup input {
          flex: 1; padding: 6px 8px;
          background: #0f172a; color: #e2e8f0;
          border: 1px solid #334155; border-radius: 6px;
          font-size: 11px; outline: none;
        }
        .img-popup button {
          padding: 6px 10px; border-radius: 6px; border: none;
          background: #06b6d4; color: #000; font-weight: 700; cursor: pointer; font-size: 11px;
        }

        .name { font-size: 14px; font-weight: 700; color: #f1f5f9; }
        .subtitle { font-size: 10px; color: #64748b; margin-top: 1px; letter-spacing: 0.8px; text-transform: uppercase; }

        .ecg { flex: 1; height: 30px; overflow: hidden; opacity: 0.5; min-width: 60px; position: relative; }
        .ecg svg { position: absolute; left: 0; top: 0; width: 200%; height: 100%; animation: ecg 2s linear infinite; }
        @keyframes ecg { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .sw-btns { display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end; }
        .sw-btn {
          background: #1e2d3d; border: 1px solid #2d4057;
          color: #94a3b8; padding: 5px 10px; border-radius: 20px;
          cursor: pointer; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .sw-btn.on { background: #06b6d4; border-color: #06b6d4; color: #0d1321; }

        .body {
          flex: 1;
          min-height: 0;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          overflow: hidden;
        }

        .section {
          flex: 1;
          min-height: 0;
          border-radius: 12px;
          border: 1px solid;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sec-hdr {
          flex-shrink: 0;
          display: flex; align-items: center; gap: 7px;
          padding: 5px 11px;
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.8px; text-transform: uppercase;
        }
        .dot { width: 6px; height: 6px; border-radius: 50%; animation: pdot 2s infinite; flex-shrink: 0; }
        @keyframes pdot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }
        .sensor-grid {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(65px, 1fr));
          gap: 5px;
          padding: 5px 8px 8px;
          align-content: stretch;
        }
        .sensor-box {
          border-radius: 9px;
          padding: 5px 4px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 2px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          text-align: center;
          min-height: 0;
          overflow: hidden;
        }
        .s-name {
          font-size: 8px; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.4px; font-weight: 700;
          line-height: 1.2; font-family: sans-serif;
        }
        .s-val {
          font-size: 12px; font-weight: 800;
          font-family: 'Courier New', monospace; letter-spacing: -0.5px; line-height: 1;
        }

        .wcard {
          flex-shrink: 0;
          background: #111827;
          border-radius: 12px;
          padding: 10px 13px;
          border: 1px solid #1e3a5f;
        }
        .wrow { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 7px; }
        .wlbl { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; font-family: sans-serif; }
        .wval { font-size: 22px; font-weight: 900; color: #06b6d4; line-height: 1; margin-top: 1px; font-family: 'Courier New', monospace; }
        .diff-val { font-size: 14px; font-weight: 700; font-family: 'Courier New', monospace; }
        .prog-pct { font-size: 9px; color: #06b6d4; font-weight: 700; margin-top: 1px; font-family: sans-serif; }
        .track { height: 5px; background: #1e2d3d; border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
        .bar { height: 100%; background: linear-gradient(90deg, #06b6d4, #10b981); width: 0%; border-radius: 3px; transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }
        .wfooter { display: flex; justify-content: space-between; font-size: 8px; color: #64748b; font-weight: 700; font-family: sans-serif; }

        .empty { flex: 1; display: flex; align-items: center; justify-content: center; color: #334155; font-size: 12px; text-align: center; font-family: sans-serif; line-height: 1.6; }
      </style>

      <div class="card">
        <div class="hero">
          <div class="av-wrap" id="av-btn">
            <div class="avatar">
              ${p.image
                ? `<img src="${p.image}" alt="${p.name}">`
                : `<span class="av-initials">${initials}</span>`}
            </div>
            <div class="av-overlay">📷</div>
          </div>

          ${this._editingImage ? `
            <div class="img-popup" id="img-popup">
              <input type="text" id="img-input" placeholder="URL de la photo (https://…)" value="${p.image || ''}">
              <button id="img-ok">OK</button>
            </div>
          ` : ''}

          <div>
            <div class="name">${p.name || 'Utilisateur'}</div>
            <div class="subtitle">Tableau de bord santé</div>
          </div>
          <div class="ecg">
            <svg viewBox="0 0 200 30" fill="none" preserveAspectRatio="none">
              <path d="M0,15 L25,15 L32,4 L39,26 L46,2 L53,28 L60,15 L100,15 L107,4 L114,26 L121,2 L128,28 L135,15 L200,15" stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          ${this._config.people.length > 1 ? `
            <div class="sw-btns">
              ${this._config.people.map((person, i) => `
                <button class="sw-btn ${idx === i ? 'on' : ''}" id="btn-p-${i}">${(person.name || 'P'+(i+1)).substring(0,7).toUpperCase()}</button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="body">
          ${cats.length === 0
            ? `<div class="empty">Aucun capteur configuré.<br>Ajoutez des capteurs dans l'éditeur ✏️</div>`
            : cats.map(cat => {
                const cfg = CAT[cat];
                return `
                  <div class="section" style="border-color:${cfg.color}2e; background:${cfg.bg};">
                    <div class="sec-hdr" style="background:${cfg.color}12; color:${cfg.color};">
                      <span class="dot" style="background:${cfg.color};"></span>
                      ${cfg.label}
                    </div>
                    <div class="sensor-grid">
                      ${groups[cat].map(s => `
                        <div class="sensor-box" style="border-color:${s.col || cfg.color}2e;">
                          <ha-icon icon="${s.icon || 'mdi:heart'}" style="--mdc-icon-size:16px; color:${s.col || cfg.color};"></ha-icon>
                          <div class="s-name">${s.name || '—'}</div>
                          <div class="s-val" id="s-${s._idx}-v" style="color:${s.col || cfg.color};">--</div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
              }).join('')
          }

          <div class="wcard">
            <div class="wrow">
              <div>
                <div class="wlbl">⚖ Poids actuel</div>
                <div class="wval" id="weight-val">--</div>
              </div>
              <div style="text-align:right;">
                <div class="diff-val" id="diff-val">--</div>
                <div class="prog-pct" id="prog-pct">0% atteint</div>
              </div>
            </div>
            <div class="track"><div class="bar" id="prog-bar"></div></div>
            <div class="wfooter">
              <span>🏁 Départ : ${p.start} kg</span>
              <span id="reste-val">-- restants</span>
              <span>🎯 But : ${p.ideal} kg</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Avatar → toggle popup
    this.shadowRoot.getElementById('av-btn').onclick = (e) => {
      e.stopPropagation();
      this._editingImage = !this._editingImage;
      this.render();
    };

    // Valider URL
    const imgOk = this.shadowRoot.getElementById('img-ok');
    if (imgOk) {
      imgOk.onclick = (e) => {
        e.stopPropagation();
        const val = this.shadowRoot.getElementById('img-input').value.trim();
        this._config.people[idx].image = val;
        this._editingImage = false;
        this._fire();
      };
    }

    // Fermer popup si clic ailleurs sur la carte
    this.shadowRoot.querySelector('.card').addEventListener('click', (e) => {
      if (this._editingImage && !e.target.closest('#av-btn') && !e.target.closest('#img-popup')) {
        this._editingImage = false;
        this.render();
      }
    });

    // Switchers personnes
    this._config.people.forEach((_, i) => {
      const btn = this.shadowRoot.getElementById(`btn-p-${i}`);
      if (btn) btn.onclick = (e) => { e.stopPropagation(); this._config.current_person_idx = i; this._fire(); };
    });

    if (this._hass) this.update();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
    this.render();
  }
}


/** ================================================================
 *  ÉDITEUR — V6.1
 * ================================================================ */
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'profil'; this._expandedSensor = null; }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  get _p() { return this._config.people[this._config.current_person_idx || 0]; }

  render() {
    if (!this._config) return;
    const idx = this._config.current_person_idx || 0;
    const p = this._p;

    this.innerHTML = `
      <style>
        .ed { padding: 14px; background: #0d0d1a; color: #e2e8f0; font-family: 'Segoe UI', sans-serif; font-size: 13px; border-radius: 12px; }
        *, *::before, *::after { box-sizing: border-box; }
        input, select { width: 100%; padding: 8px 10px; background: #1a1a2e; color: #e2e8f0; border: 1px solid #2d2d44; border-radius: 8px; font-size: 12px; outline: none; }
        input:focus, select:focus { border-color: #06b6d4; }
        input[type="color"] { height: 36px; padding: 2px 4px; cursor: pointer; }
        label { font-size: 10px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; display: block; }
        .hint { font-size: 10px; color: #475569; margin-top: 4px; font-style: italic; }
        .stitle { font-size: 11px; font-weight: 800; color: #06b6d4; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .group { background: #12121f; border-radius: 10px; padding: 12px; margin-bottom: 10px; border: 1px solid #1e1e32; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
        .tab-bar { display: flex; gap: 8px; margin-bottom: 14px; }
        .tab { padding: 8px 14px; border-radius: 8px; cursor: pointer; border: none; font-size: 12px; font-weight: 700; }
        .p-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .p-tab { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1px solid; }
        .s-card { background: #12121f; border-radius: 10px; border-left: 3px solid; margin-bottom: 8px; overflow: hidden; }
        .s-hdr { padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
        .s-hdr-l { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; }
        .s-body { padding: 12px; border-top: 1px solid #1e1e32; }
        .del-btn { background: #7f1d1d; color: #fca5a5; padding: 4px 9px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-weight: 700; }
        .add-btn { width: 100%; padding: 10px; background: #0c4a6e; color: #38bdf8; border: 1px dashed #0369a1; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; }
        .badge { font-size: 10px; padding: 2px 7px; border-radius: 10px; font-weight: 700; }
        .av-preview {
          width: 52px; height: 52px; border-radius: 50%; overflow: hidden;
          background: #1e2d3d; border: 2px solid #06b6d4;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; color: #06b6d4; flex-shrink: 0;
        }
        .av-preview img { width: 100%; height: 100%; object-fit: cover; }
        .av-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .av-info { flex: 1; }
      </style>

      <div class="ed">

        <div class="stitle">👥 Profils</div>
        <div class="p-tabs">
          ${this._config.people.map((person, i) => `
            <div class="p-tab" id="sel-${i}"
              style="background:${idx===i?'#06b6d4':'#1a1a2e'}; color:${idx===i?'#000':'#94a3b8'}; border-color:${idx===i?'#06b6d4':'#2d2d44'};">
              ${idx===i?'✓ ':''}${(person.name||'Personne '+(i+1)).substring(0,12)}
            </div>
          `).join('')}
          <div class="p-tab" id="add-p" style="background:#0a2a1a; color:#10b981; border-color:#10b981;">+ Nouveau</div>
        </div>

        <div class="tab-bar">
          <button class="tab" id="t-profil"
            style="background:${this._tab==='profil'?'#06b6d4':'#2a2a3e'}; color:${this._tab==='profil'?'#000':'#94a3b8'};">
            👤 Profil & Poids
          </button>
          <button class="tab" id="t-capteurs"
            style="background:${this._tab==='capteurs'?'#06b6d4':'#2a2a3e'}; color:${this._tab==='capteurs'?'#000':'#94a3b8'};">
            📊 Capteurs (${(p.sensors||[]).length})
          </button>
        </div>

        ${this._tab === 'profil' ? `

          <div class="group">
            <div class="stitle">🖼 Photo de profil</div>
            <div class="av-row">
              <div class="av-preview" id="av-prev">
                ${p.image ? `<img src="${p.image}" alt="">` : (p.name||'?')[0].toUpperCase()}
              </div>
              <div class="av-info">
                <label>URL de la photo</label>
                <input type="text" data-f="image" id="img-url-input" value="${p.image||''}" placeholder="https://exemple.com/photo.jpg">
                <div class="hint">Coller l'adresse web d'une image • L'avatar se met à jour en direct</div>
              </div>
            </div>
            <label>Nom affiché sur la carte</label>
            <input type="text" data-f="name" value="${p.name||''}">
          </div>

          <div class="group">
            <div class="stitle">⚖ Suivi du poids</div>
            <label>Entité Home Assistant (capteur de poids)</label>
            <input type="text" data-f="weight_entity" value="${p.weight_entity||''}" placeholder="sensor.withings_weight">
            <div class="hint">L'état de cette entité doit contenir la valeur en kg</div>
            <div class="row2">
              <div>
                <label>Poids de départ (kg)</label>
                <input type="number" data-f="start" value="${p.start||80}" step="0.1">
              </div>
              <div>
                <label>Objectif (kg)</label>
                <input type="number" data-f="ideal" value="${p.ideal||75}" step="0.1">
              </div>
            </div>
            <div class="hint" style="margin-top:6px;">La barre de progression se calcule automatiquement entre ces deux valeurs</div>
          </div>

          ${this._config.people.length > 1
            ? `<button style="width:100%; padding:9px; background:#7f1d1d; color:#fca5a5; border:none; border-radius:8px; cursor:pointer; font-weight:700;" id="del-p">🗑 Supprimer ce profil</button>`
            : ''}

        ` : `

          <div class="group" style="padding:9px 12px;">
            <div style="font-size:11px; color:#94a3b8; line-height:1.6;">
              Les capteurs se placent <strong style="color:#06b6d4;">automatiquement</strong> dans la bonne section selon la catégorie choisie. Pas de position manuelle !
            </div>
          </div>

          ${(p.sensors||[]).length === 0 ? `
            <div style="text-align:center; padding:24px; color:#475569;">
              <div style="font-size:32px; margin-bottom:8px;">📭</div>
              <div style="font-size:12px;">Aucun capteur configuré.<br>Cliquez sur + pour en ajouter.</div>
            </div>
          ` : ''}

          ${(p.sensors||[]).map((s, i) => {
            const cat = CAT[s.cat||'forme'];
            const isOpen = this._expandedSensor === i;
            return `
              <div class="s-card" style="border-color:${s.col||cat.color};">
                <div class="s-hdr" id="s-tgl-${i}">
                  <div class="s-hdr-l">
                    <span style="color:${s.col||cat.color}; font-size:14px;">●</span>
                    <span>${s.name || 'Capteur '+(i+1)}</span>
                    <span class="badge" style="background:${cat.color}22; color:${cat.color};">${cat.label.replace(/^.\s/,'')}</span>
                  </div>
                  <div style="display:flex; gap:6px; align-items:center;">
                    <button class="del-btn del-s" data-idx="${i}">✕ Supprimer</button>
                    <span style="color:#64748b; font-size:12px;">${isOpen?'▲':'▼'}</span>
                  </div>
                </div>
                ${isOpen ? `
                  <div class="s-body">
                    <div class="row2">
                      <div><label>Nom affiché</label><input type="text" data-idx="${i}" data-f="name" value="${s.name||''}"></div>
                      <div><label>Unité (bpm, %, kg…)</label><input type="text" data-idx="${i}" data-f="unit" value="${s.unit||''}"></div>
                    </div>
                    <div style="margin-top:8px;">
                      <label>Entité Home Assistant</label>
                      <input type="text" data-idx="${i}" data-f="entity" value="${s.entity||''}" placeholder="sensor.mon_capteur">
                    </div>
                    <div class="row2">
                      <div><label>Icône (mdi:…)</label><input type="text" data-idx="${i}" data-f="icon" value="${s.icon||'mdi:heart'}"></div>
                      <div><label>Couleur</label><input type="color" data-idx="${i}" data-f="col" value="${s.col||cat.color}"></div>
                    </div>
                    <div style="margin-top:8px;">
                      <label>Section où apparaît ce capteur</label>
                      <select data-idx="${i}" data-f="cat">
                        ${Object.entries(CAT).map(([k,v]) => `
                          <option value="${k}" ${(s.cat||'forme')===k?'selected':''}>${v.label}</option>
                        `).join('')}
                      </select>
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}

          <button class="add-btn" id="add-s">+ Ajouter un capteur</button>
        `}
      </div>
    `;

    this._attach();
  }

  _attach() {
    const idx = this._config.current_person_idx || 0;

    this._config.people.forEach((_, i) => {
      const el = this.querySelector(`#sel-${i}`);
      if (el) el.onclick = () => { this._config.current_person_idx = i; this._expandedSensor = null; this._fire(); };
    });

    const addP = this.querySelector('#add-p');
    if (addP) addP.onclick = () => {
      this._config.people.push({ name: 'Nouveau', sensors: [], start: 80, ideal: 75, image: '' });
      this._config.current_person_idx = this._config.people.length - 1;
      this._fire();
    };

    const delP = this.querySelector('#del-p');
    if (delP) delP.onclick = () => {
      if (this._config.people.length > 1) {
        this._config.people.splice(idx, 1);
        this._config.current_person_idx = 0;
        this._fire();
      }
    };

    this.querySelector('#t-profil').onclick = () => { this._tab = 'profil'; this.render(); };
    this.querySelector('#t-capteurs').onclick = () => { this._tab = 'capteurs'; this.render(); };

    this.querySelectorAll('input, select').forEach(el => {
      el.oninput = el.onchange = (e) => {
        const p = this._p;
        const v = e.target.value;
        if (el.dataset.idx !== undefined) {
          p.sensors[parseInt(el.dataset.idx)][el.dataset.f] = v;
        } else {
          p[el.dataset.f] = v;
        }
        // Aperçu avatar en direct lors de la saisie de l'URL
        if (el.dataset.f === 'image') {
          const av = this.querySelector('#av-prev');
          if (av) av.innerHTML = v ? `<img src="${v}" alt="" style="width:100%;height:100%;object-fit:cover;">` : (p.name||'?')[0].toUpperCase();
        }
        this._fire();
      };
    });

    const addS = this.querySelector('#add-s');
    if (addS) addS.onclick = () => {
      const p = this._p;
      if (!p.sensors) p.sensors = [];
      p.sensors.push({ name: 'Nouveau capteur', entity: '', cat: 'forme', icon: 'mdi:heart', col: '#06b6d4', unit: '' });
      this._expandedSensor = p.sensors.length - 1;
      this._fire();
    };

    this.querySelectorAll('.del-s').forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        this._p.sensors.splice(parseInt(b.dataset.idx), 1);
        this._expandedSensor = null;
        this._fire();
      };
    });

    (this._p.sensors || []).forEach((_, i) => {
      const tgl = this.querySelector(`#s-tgl-${i}`);
      if (tgl) tgl.onclick = (e) => {
        if (e.target.classList.contains('del-s') || e.target.classList.contains('del-btn')) return;
        this._expandedSensor = this._expandedSensor === i ? null : i;
        this.render();
      };
    });
  }

  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
    this.render();
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'health-dashboard-card',
  name: 'Health Dashboard V6.1',
  description: '500px fixe | Avatar photo cliquable | Capteurs auto-positionnés'
});
