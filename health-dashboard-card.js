/**
 * HEALTH DASHBOARD CARD — V6.0
 * Design médical clinique | Auto-placement capteurs | Éditeur visuel clair
 */

const CATEGORY_CONFIG = {
  forme:    { label: '⚡ Forme & Activité',  color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   icon: 'mdi:lightning-bolt' },
  sommeil:  { label: '🌙 Sommeil',           color: '#818cf8', bg: 'rgba(129,140,248,0.08)', icon: 'mdi:moon-waning-crescent' },
  sante:    { label: '🩺 Santé',             color: '#10b981', bg: 'rgba(16,185,129,0.08)',  icon: 'mdi:heart-pulse' },
  nutrition:{ label: '🥗 Nutrition',         color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  icon: 'mdi:food-apple' },
};

const ECG_PATH = "M0,30 L30,30 L38,10 L46,50 L54,5 L62,55 L70,30 L100,30";

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  static getStubConfig() {
    return {
      current_person_idx: 0,
      people: [{
        name: 'Moi',
        weight_entity: '',
        start: 80, ideal: 75,
        image: '',
        sensors: []
      }]
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
      let pct = total ? Math.min(100, Math.max(0, (done / total) * 100)) : 0;
      if (cur > start && ideal < start) pct = 0;

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

  _groupSensorsByCategory(sensors) {
    const groups = {};
    (sensors || []).forEach((s, i) => {
      const cat = s.cat || 'forme';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ ...s, _idx: i });
    });
    return groups;
  }

  render() {
    if (!this._config) return;
    const idx = this._config.current_person_idx;
    const p = this._config.people[idx] || this._config.people[0];
    const groups = this._groupSensorsByCategory(p.sensors);
    const cats = Object.keys(CATEGORY_CONFIG).filter(k => groups[k] && groups[k].length > 0);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card {
          font-family: 'Roboto', 'Segoe UI', sans-serif;
          background: #0d1321;
          border-radius: 20px;
          overflow: hidden;
          color: #e2e8f0;
          border: 1px solid #1e2d3d;
          position: relative;
        }
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #06b6d4, #818cf8, #10b981);
          z-index: 10;
        }
        .hero {
          position: relative;
          padding: 18px 18px 14px;
          background: #111827;
          border-bottom: 1px solid #1e2d3d;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .hero-left { display: flex; align-items: center; gap: 12px; }
        .avatar {
          width: 48px; height: 48px;
          border-radius: 50%;
          overflow: hidden;
          background: #1e2d3d;
          border: 2px solid #06b6d4;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-initials { font-size: 18px; font-weight: 700; color: #06b6d4; }
        .name { font-size: 15px; font-weight: 700; color: #f1f5f9; letter-spacing: 0.5px; }
        .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; letter-spacing: 0.5px; text-transform: uppercase; }
        .ecg-container {
          flex: 1;
          height: 36px;
          position: relative;
          overflow: hidden;
          opacity: 0.5;
          min-width: 80px;
        }
        .ecg-svg { position: absolute; left: 0; top: 0; width: 200%; height: 100%; animation: ecg-scroll 2s linear infinite; }
        @keyframes ecg-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .switchers { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .sw-btn {
          background: #1e2d3d; border: 1px solid #2d4057;
          color: #94a3b8; padding: 6px 12px;
          border-radius: 20px; cursor: pointer;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
          transition: all 0.2s;
        }
        .sw-btn.active { background: #06b6d4; border-color: #06b6d4; color: #0d1321; }
        .body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .section {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid;
        }
        .section-header {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px;
          font-size: 11px; font-weight: 800;
          letter-spacing: 1px; text-transform: uppercase;
        }
        .section-header .dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        .sensor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 8px;
          padding: 10px 12px 12px;
        }
        .sensor-box {
          border-radius: 10px;
          padding: 10px 8px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 3px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          text-align: center;
          min-height: 72px;
        }
        .s-icon { --mdc-icon-size: 20px; }
        .s-name {
          font-size: 9px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          line-height: 1.2;
        }
        .s-val {
          font-size: 14px;
          font-weight: 800;
          font-family: 'Courier New', monospace;
          letter-spacing: -0.5px;
        }
        .weight-card {
          background: #111827;
          border-radius: 14px;
          padding: 14px 16px;
          border: 1px solid #1e3a5f;
        }
        .weight-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .weight-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .weight-val { font-size: 28px; font-weight: 900; color: #06b6d4; font-family: 'Courier New', monospace; line-height: 1; margin-top: 2px; }
        .weight-diff { text-align: right; }
        .diff-val { font-size: 16px; font-weight: 700; font-family: 'Courier New', monospace; }
        .prog-pct { font-size: 10px; color: #06b6d4; font-weight: 700; margin-top: 2px; }
        .prog-track { height: 6px; background: #1e2d3d; border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
        .prog-bar {
          height: 100%;
          background: linear-gradient(90deg, #06b6d4, #10b981);
          width: 0%;
          border-radius: 3px;
          transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .weight-footer { display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-weight: 600; }
        .cross-icon { font-size: 16px; line-height: 1; }
        .empty-state { text-align: center; padding: 20px; color: #475569; font-size: 12px; }
        .bg-image { position: absolute; inset: 0; z-index: 0; opacity: 0.06; background-size: cover; background-position: center; pointer-events: none; }
      </style>

      <div class="card">
        ${p.image ? `<div class="bg-image" style="background-image: url('${p.image}')"></div>` : ''}
        <div class="hero">
          <div class="hero-left">
            <div class="avatar">
              ${p.image
                ? `<img src="${p.image}" alt="${p.name}">`
                : `<span class="avatar-initials">${(p.name||'?')[0].toUpperCase()}</span>`
              }
            </div>
            <div>
              <div class="name">${p.name || 'Utilisateur'}</div>
              <div class="subtitle">Tableau de bord santé</div>
            </div>
          </div>
          <div class="ecg-container">
            <svg class="ecg-svg" viewBox="0 0 200 36" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="${ECG_PATH} L130,30 L138,10 L146,50 L154,5 L162,55 L170,30 L200,30" stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          ${this._config.people.length > 1 ? `
            <div class="switchers">
              ${this._config.people.map((person, i) => `
                <button class="sw-btn ${idx === i ? 'active' : ''}" id="btn-p-${i}">${(person.name||'P'+(i+1)).substring(0,8).toUpperCase()}</button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="body" style="position:relative; z-index:1;">
          ${cats.length === 0 ? `<div class="empty-state">Aucun capteur configuré.<br>Ajoutez des capteurs dans l'éditeur.</div>` : ''}

          ${cats.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            return `
              <div class="section" style="border-color: ${cfg.color}33; background: ${cfg.bg};">
                <div class="section-header" style="background: ${cfg.color}15; color: ${cfg.color};">
                  <span class="dot" style="background: ${cfg.color};"></span>
                  ${cfg.label}
                </div>
                <div class="sensor-grid">
                  ${groups[cat].map(s => `
                    <div class="sensor-box" style="border-color: ${s.col || cfg.color}33;">
                      <ha-icon class="s-icon" icon="${s.icon || 'mdi:heart'}" style="--mdc-icon-size:20px; color:${s.col || cfg.color};"></ha-icon>
                      <div class="s-name">${s.name || '—'}</div>
                      <div class="s-val" id="s-${s._idx}-v" style="color:${s.col || cfg.color};">--</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}

          <div class="weight-card">
            <div class="weight-header">
              <div>
                <div class="weight-label">⚖ Poids actuel</div>
                <div class="weight-val" id="weight-val">--</div>
              </div>
              <div class="weight-diff">
                <div class="diff-val" id="diff-val">--</div>
                <div class="prog-pct" id="prog-pct">0% atteint</div>
              </div>
            </div>
            <div class="prog-track"><div class="prog-bar" id="prog-bar"></div></div>
            <div class="weight-footer">
              <span>🏁 Départ : ${p.start} kg</span>
              <span id="reste-val">-- restants</span>
              <span>🎯 Objectif : ${p.ideal} kg</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this._config.people.forEach((_, i) => {
      const btn = this.shadowRoot.getElementById(`btn-p-${i}`);
      if (btn) btn.onclick = () => { this._config.current_person_idx = i; this._fire(); };
    });

    if (this._hass) this.update();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
    this.render();
  }
}


/** ================================================================
 *  ÉDITEUR — V6.0
 *  Interface claire, sections logiques, labels en français
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

    const tabStyle = (t) => `
      padding: 8px 14px; border-radius: 8px; cursor: pointer; border: none;
      font-size: 12px; font-weight: 700;
      background: ${this._tab === t ? '#06b6d4' : '#2a2a3e'};
      color: ${this._tab === t ? '#000' : '#94a3b8'};
    `;

    const inputStyle = `
      width: 100%; padding: 8px 10px;
      background: #1a1a2e; color: #e2e8f0;
      border: 1px solid #2d2d44; border-radius: 8px;
      font-size: 12px; outline: none;
    `;

    const labelStyle = `font-size: 11px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; display: block;`;
    const rowStyle = `display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;`;
    const groupStyle = `background: #12121f; border-radius: 10px; padding: 12px; margin-bottom: 10px; border: 1px solid #1e1e32;`;

    this.innerHTML = `
      <style>
        .ed { padding: 14px; background: #0d0d1a; color: #e2e8f0; font-family: 'Segoe UI', sans-serif; font-size: 13px; border-radius: 12px; }
        input, select { width: 100%; padding: 8px 10px; background: #1a1a2e; color: #e2e8f0; border: 1px solid #2d2d44; border-radius: 8px; font-size: 12px; outline: none; box-sizing: border-box; }
        input:focus, select:focus { border-color: #06b6d4; }
        input[type="color"] { height: 36px; padding: 2px 4px; cursor: pointer; }
        label { font-size: 11px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; display: block; }
        .section-title { font-size: 12px; font-weight: 800; color: #06b6d4; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .divider { height: 1px; background: #1e1e32; margin: 14px 0; }
        .group { background: #12121f; border-radius: 10px; padding: 12px; margin-bottom: 10px; border: 1px solid #1e1e32; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 10px; }
        .btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; }
        .person-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .p-tab { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1px solid #2d2d44; }
        .s-card { background: #12121f; border-radius: 10px; border-left: 3px solid; margin-bottom: 8px; overflow: hidden; }
        .s-header { padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
        .s-header-left { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; }
        .s-body { padding: 12px; border-top: 1px solid #1e1e32; }
        .del-btn { background: #7f1d1d; color: #fca5a5; padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-weight: 700; }
        .add-btn { width: 100%; padding: 10px; background: #0c4a6e; color: #38bdf8; border: 1px dashed #0369a1; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; }
        .cat-badge { font-size: 10px; padding: 2px 7px; border-radius: 10px; font-weight: 700; }
        .hint { font-size: 10px; color: #475569; margin-top: 4px; font-style: italic; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; margin-right: 4px; }
      </style>

      <div class="ed">

        <!-- Sélecteur de personne -->
        <div class="section-title">👤 Personnes</div>
        <div class="person-tabs">
          ${this._config.people.map((person, i) => `
            <div class="p-tab" id="sel-${i}"
              style="background:${idx===i?'#06b6d4':'#1a1a2e'}; color:${idx===i?'#000':'#94a3b8'}; border-color:${idx===i?'#06b6d4':'#2d2d44'};">
              ${idx===i?'✓ ':''}${person.name || 'Personne '+(i+1)}
            </div>
          `).join('')}
          <div class="p-tab" id="add-p" style="background:#0a2a1a; color:#10b981; border-color:#10b981;">+ Ajouter</div>
        </div>

        <!-- Onglets -->
        <div style="display:flex; gap:8px; margin-bottom:14px;">
          <button style="${tabStyle('profil')}" id="t-profil">👤 Profil & Poids</button>
          <button style="${tabStyle('capteurs')}" id="t-capteurs">📊 Capteurs (${(p.sensors||[]).length})</button>
        </div>

        ${this._tab === 'profil' ? `
          <!-- ONGLET PROFIL -->
          <div class="group">
            <div class="section-title">🪪 Identité</div>
            <label>Prénom / Nom affiché</label>
            <input type="text" data-f="name" value="${p.name||''}">
            <div style="margin-top:10px;">
              <label>Photo (URL d'image)</label>
              <input type="text" data-f="image" value="${p.image||''}" placeholder="https://...">
              <div class="hint">Apparaît en avatar et en fond de carte</div>
            </div>
          </div>

          <div class="group">
            <div class="section-title">⚖ Suivi du poids</div>
            <label>Entité Home Assistant (poids)</label>
            <input type="text" data-f="weight_entity" value="${p.weight_entity||''}" placeholder="sensor.mon_poids">
            <div class="hint">Ex: sensor.withings_weight, sensor.fitbit_weight</div>
            <div class="row2" style="margin-top:10px;">
              <div>
                <label>Poids de départ (kg)</label>
                <input type="number" data-f="start" value="${p.start||80}" step="0.1">
              </div>
              <div>
                <label>Objectif à atteindre (kg)</label>
                <input type="number" data-f="ideal" value="${p.ideal||75}" step="0.1">
              </div>
            </div>
            <div class="hint" style="margin-top:6px;">La barre de progression se calcule automatiquement</div>
          </div>

          <div style="margin-top: 6px;">
            ${this._config.people.length > 1 ? `<button class="btn" id="del-p" style="background:#7f1d1d; color:#fca5a5; width:100%;">🗑 Supprimer ce profil</button>` : ''}
          </div>

        ` : `
          <!-- ONGLET CAPTEURS -->
          <div class="group" style="margin-bottom:10px; padding:10px 12px;">
            <div style="font-size:11px; color:#94a3b8; line-height:1.5;">
              Les capteurs s'organisent <strong style="color:#06b6d4;">automatiquement</strong> par catégorie.
              Choisissez une catégorie et ils se placent seuls dans la bonne section.
            </div>
          </div>

          ${(p.sensors || []).length === 0 ? `
            <div style="text-align:center; padding:20px; color:#475569;">
              <div style="font-size:28px; margin-bottom:8px;">📭</div>
              <div>Aucun capteur. Cliquez sur + pour en ajouter un.</div>
            </div>
          ` : ''}

          ${(p.sensors || []).map((s, i) => {
            const cat = CATEGORY_CONFIG[s.cat || 'forme'];
            const isOpen = this._expandedSensor === i;
            return `
              <div class="s-card" style="border-color:${s.col||cat.color};">
                <div class="s-header" id="s-toggle-${i}">
                  <div class="s-header-left">
                    <span style="color:${s.col||cat.color}; font-size:16px;">●</span>
                    <span>${s.name || 'Capteur '+(i+1)}</span>
                    <span class="cat-badge" style="background:${cat.color}22; color:${cat.color};">${cat.label.replace(/^.\s/,'')}</span>
                  </div>
                  <div style="display:flex; gap:6px; align-items:center;">
                    <button class="del-btn del-s" data-idx="${i}">Supprimer</button>
                    <span style="color:#64748b; font-size:14px;">${isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                ${isOpen ? `
                  <div class="s-body">
                    <div class="row2">
                      <div>
                        <label>Nom affiché</label>
                        <input type="text" data-idx="${i}" data-f="name" value="${s.name||''}">
                      </div>
                      <div>
                        <label>Unité (ex: bpm, %)</label>
                        <input type="text" data-idx="${i}" data-f="unit" value="${s.unit||''}">
                      </div>
                    </div>
                    <div style="margin-top:10px;">
                      <label>Entité Home Assistant</label>
                      <input type="text" data-idx="${i}" data-f="entity" value="${s.entity||''}" placeholder="sensor.mon_capteur">
                    </div>
                    <div class="row2" style="margin-top:10px;">
                      <div>
                        <label>Icône MDI</label>
                        <input type="text" data-idx="${i}" data-f="icon" value="${s.icon||'mdi:heart'}" placeholder="mdi:heart">
                      </div>
                      <div>
                        <label>Couleur</label>
                        <input type="color" data-idx="${i}" data-f="col" value="${s.col||cat.color}">
                      </div>
                    </div>
                    <div style="margin-top:10px;">
                      <label>Section / Catégorie</label>
                      <select data-idx="${i}" data-f="cat">
                        ${Object.entries(CATEGORY_CONFIG).map(([k,v]) => `
                          <option value="${k}" ${(s.cat||'forme')===k?'selected':''}>${v.label}</option>
                        `).join('')}
                      </select>
                      <div class="hint">Détermine dans quelle section le capteur apparaît</div>
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}

          <button class="add-btn" id="add-s">+ Ajouter un nouveau capteur</button>
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
      this._config.people.push({ name: 'Nouveau', sensors: [], start: 80, ideal: 75 });
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
      el.onchange = (e) => {
        const p = this._p;
        const v = e.target.value;
        if (el.dataset.idx !== undefined) {
          p.sensors[parseInt(el.dataset.idx)][el.dataset.f] = v;
        } else {
          p[el.dataset.f] = v;
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
      const toggle = this.querySelector(`#s-toggle-${i}`);
      if (toggle) toggle.onclick = (e) => {
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
  name: 'Health Dashboard V6.0',
  description: 'Design médical | Capteurs auto-positionnés | Éditeur visuel'
});
