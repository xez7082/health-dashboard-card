/**
 * HEALTH DASHBOARD CARD – V82.0 (VERSION FINALE PREMIUM)
 * - Double profil (Patrick/Sandra)
 * - Graphiques de tendances dynamiques (Sparklines)
 * - Réglette de poids colorée
 * - Éditeur visuel 100% autonome
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = this._ensureConfig(config);
    this.render();
  }

  _ensureConfig(config) {
    const conf = JSON.parse(JSON.stringify(config || {}));
    const base = { name: "Nouveau", sensors: [], start: 0, goal: 0, ideal: 0, image: "" };
    if (!conf.person1) conf.person1 = { ...base, name: "Patrick" };
    if (!conf.person2) conf.person2 = { ...base, name: "Sandra" };
    if (!conf.current_view) conf.current_view = 'person1';
    if (!conf.card_height) conf.card_height = 600;
    return conf;
  }

  set hass(hass) {
    this._hass = hass;
    this.updateData();
  }

  async updateData() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    // 1. Mise à jour de la réglette de poids
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
      const actuel = parseFloat(stPoids.state) || 0;
      const start = parseFloat(pData.start) || 0;
      const ideal = parseFloat(pData.ideal) || 0;
      const range = start - ideal;
      const pct = range !== 0 ? ((start - actuel) / range) * 100 : 0;
      
      const pointer = this.shadowRoot.getElementById('progression-pointer');
      if (pointer) pointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
      const label = this.shadowRoot.getElementById('pointer-label');
      if (label) label.textContent = `${actuel} kg`;
    }

    // 2. Mise à jour des capteurs et des graphiques
    if (pData.sensors) {
      pData.sensors.forEach(async (s, i) => {
        const stateObj = this._hass.states[s.entity];
        const vEl = this.shadowRoot.getElementById(`value-${i}`);
        if (stateObj && vEl) {
          vEl.textContent = `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`;
          this._renderSparkline(s.entity, i, view === 'person1' ? '#38bdf8' : '#f43f5e');
        }
      });
    }
  }

  async _renderSparkline(entity, i, color) {
    try {
      const hist = await this._hass.callApi('GET', `history/period/${new Date(Date.now()-86400000).toISOString()}?filter_entity_id=${entity}`);
      if (!hist || !hist[0] || hist[0].length < 2) return;
      const points = hist[0].map(e => parseFloat(e.state)).filter(v => !isNaN(v));
      if (points.length < 2) return;
      
      const min = Math.min(...points);
      const max = Math.max(...points);
      const range = max - min || 1;
      const coords = points.map((p, idx) => `${(idx / (points.length - 1)) * 100},${30 - ((p - min) / range) * 30}`).join(' ');
      
      const spark = this.shadowRoot.getElementById(`spark-${i}`);
      if (spark) {
        spark.innerHTML = `<svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
          <polyline fill="none" stroke="${color}" stroke-width="2" opacity="0.5" points="${coords}" />
        </svg>`;
      }
    } catch (e) {}
  }

  render() {
    const view = this._config.current_view;
    const pData = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height}px; background: #0f172a; border-radius: 20px; overflow: hidden; color: white; font-family: 'Segoe UI', Roboto, sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${pData.image}') center/cover; opacity: 0.35; transition: background 0.5s; z-index: 1; }
        .topbar { position: absolute; top: 25px; left: 25px; display: flex; gap: 15px; z-index: 10; }
        .btn { padding: 12px 24px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-weight: bold; backdrop-filter: blur(10px); transition: 0.3s; }
        .btn.active { background: ${accent}; border-color: ${accent}; box-shadow: 0 0 20px ${accent}66; }
        .rule-container { position: absolute; bottom: 50px; left: 10%; width: 80%; height: 12px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 6px; z-index: 5; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .pointer { position: absolute; top: -15px; width: 4px; height: 42px; background: white; transition: left 1.5s cubic-bezier(0.18, 0.89, 0.32, 1.28); border-radius: 2px; }
        .label { position: absolute; top: -35px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 10px; border-radius: 6px; font-size: 14px; font-weight: 900; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.5); }
        .sensor-box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 15px; backdrop-filter: blur(10px); text-align: center; min-width: 110px; z-index: 5; }
        .sparkline { position: absolute; bottom: 0; left: 0; width: 100%; height: 30px; pointer-events: none; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="topbar">
          <button id="b1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="b2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="rule-container">
          <div id="progression-pointer" class="pointer"><div id="pointer-label" class="label">-- kg</div></div>
        </div>
        ${(pData.sensors || []).map((s, i) => `
          <div class="sensor-box" style="left:${s.x}%; top:${s.y}%;">
            <div class="sparkline" id="spark-${i}"></div>
            <div style="font-size:11px; color:${accent}; font-weight:bold; margin-bottom:5px; text-transform: uppercase;">${s.name}</div>
            <div id="value-${i}" style="font-size:1.4em; font-weight:bold; letter-spacing:-1px;">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('b1').onclick = () => { this._config.current_view='person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('b2').onclick = () => { this._config.current_view='person2'; this._fire(); this.render(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config || {}));
    if (!this._config.person1) this._config.person1 = { name: "Patrick", sensors: [] };
    if (!this._config.person2) this._config.person2 = { name: "Sandra", sensors: [] };
    this.render();
  }

  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <style>
        .ed-wrap { font-family: sans-serif; color: #333; }
        .section { background: #f1f5f9; padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #e2e8f0; }
        .section-title { color: #0284c7; font-weight: bold; margin-bottom: 10px; display: block; text-transform: uppercase; font-size: 12px; }
        .field { margin-bottom: 10px; }
        label { font-size: 11px; color: #64748b; font-weight: bold; }
        input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-top: 4px; }
        .s-card { background: white; padding: 12px; border-radius: 8px; margin-top: 10px; border-left: 5px solid #0284c7; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .btn-add { width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
        .btn-del { position: absolute; top: 10px; right: 10px; background: #ef4444; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; }
      </style>
      <div class="ed-wrap">
        <div class="section">
          <span class="section-title">Paramètres Globaux</span>
          <div class="field"><label>Hauteur Carte (px)</label><input type="number" id="gl-h" value="${this._config.card_height || 600}"></div>
        </div>

        <div class="section">
          <span class="section-title">Profil : ${p.name}</span>
          <div class="field"><label>Nom</label><input type="text" id="p-n" value="${p.name}"></div>
          <div class="field"><label>URL Image de fond</label><input type="text" id="p-i" value="${p.image || ''}"></div>
          <div style="display:flex; gap:8px;">
            <div class="field"><label>Départ</label><input type="number" id="p-s" value="${p.start}"></div>
            <div class="field"><label>Objectif</label><input type="number" id="p-g" value="${p.goal}"></div>
            <div class="field"><label>Idéal</label><input type="number" id="p-id" value="${p.ideal}"></div>
          </div>
        </div>

        <div class="section">
          <span class="section-title">Capteurs Corporels</span>
          <div id="sensors">
            ${(p.sensors || []).map((s, idx) => `
              <div class="s-card">
                <button class="btn-del" data-idx="${idx}">X</button>
                <div class="field"><label>Titre</label><input type="text" class="sn" data-idx="${idx}" value="${s.name}"></div>
                <div class="field"><label>Entité</label><input type="text" class="se" data-idx="${idx}" value="${s.entity}"></div>
                <div style="display:flex; gap:8px;">
                   <div class="field"><label>X %</label><input type="number" class="sx" data-idx="${idx}" value="${s.x}"></div>
                   <div class="field"><label>Y %</label><input type="number" class="sy" data-idx="${idx}" value="${s.y}"></div>
                </div>
              </div>
            `).join('')}
          </div>
          <button id="add" class="btn-add" style="margin-top:10px;">➕ AJOUTER UN CAPTEUR</button>
        </div>
      </div>
    `;

    // Attachement des événements
    this.querySelector('#gl-h').onchange = (e) => { this._config.card_height = e.target.value; this._fire(); };
    this.querySelector('#p-n').onchange = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#p-i').onchange = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    this.querySelector('#p-s').onchange = (e) => { this._config[pKey].start = e.target.value; this._fire(); };
    this.querySelector('#p-g').onchange = (e) => { this._config[pKey].goal = e.target.value; this._fire(); };
    this.querySelector('#p-id').onchange = (e) => { this._config[pKey].ideal = e.target.value; this._fire(); };

    this.querySelectorAll('.sn').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.se').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.sx').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.sy').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].y = e.target.value; this._fire(); });

    this.querySelector('#add').onclick = () => {
      if(!this._config[pKey].sensors) this._config[pKey].sensors = [];
      this._config[pKey].sensors.push({ name: "Nouveau", entity: "", x: 50, y: 50 });
      this._fire(); this.render();
    };

    this.querySelectorAll('.btn-del').forEach(el => el.onclick = (e) => {
      this._config[pKey].sensors.splice(e.target.dataset.idx, 1);
      this._fire(); this.render();
    });
  }

  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V82.0" });
