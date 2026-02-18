/**
 * HEALTH DASHBOARD CARD – V83.0 (TITAN EDITION)
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config || {}));
    const base = { name: "Patrick", sensors: [], start: 0, goal: 0, ideal: 0, height: 175, image: "" };
    if (!this._config.person1) this._config.person1 = { ...base };
    if (!this._config.person2) this._config.person2 = { ...base, name: "Sandra" };
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateData();
  }

  _getIMC(poids, taille) {
    if (!poids || !taille) return "--";
    const imc = (poids / ((taille / 100) * (taille / 100))).toFixed(1);
    return imc;
  }

  async updateData() {
    if (!this._hass || !this.shadowRoot) return;
    const view = this._config.current_view;
    const p = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';
    const stateObj = this._hass.states['sensor.withings_poids' + suffix];

    if (stateObj) {
        const actuel = parseFloat(stateObj.state);
        // Calcul IMC
        const imcEl = this.shadowRoot.getElementById('val-imc');
        if (imcEl) imcEl.textContent = this._getIMC(actuel, p.height);

        // Update Réglette
        const range = (p.start || 100) - (p.ideal || 70);
        const pct = range !== 0 ? ((p.start - actuel) / range) * 100 : 0;
        const pointer = this.shadowRoot.getElementById('progression-pointer');
        if (pointer) pointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        this.shadowRoot.getElementById('pointer-label').textContent = `${actuel} kg`;

        // Update Temps
        const timeEl = this.shadowRoot.getElementById('last-sync');
        if (timeEl) {
            const last = new Date(stateObj.last_changed);
            timeEl.textContent = `Mesuré il y a ${Math.floor((new Date() - last) / 3600000)}h`;
        }
    }

    // Update Sparklines
    (p.sensors || []).forEach((s, i) => {
        const sObj = this._hass.states[s.entity];
        if (sObj) {
            const vEl = this.shadowRoot.getElementById(`value-${i}`);
            if (vEl) vEl.textContent = `${sObj.state} ${sObj.attributes.unit_of_measurement || ''}`;
            this._renderSparkline(s.entity, i, view === 'person1' ? '#38bdf8' : '#f43f5e');
        }
    });
  }

  async _renderSparkline(entity, i, color) {
    try {
      const hist = await this._hass.callApi('GET', `history/period/${new Date(Date.now()-86400000).toISOString()}?filter_entity_id=${entity}`);
      if (!hist || !hist[0]) return;
      const points = hist[0].map(e => parseFloat(e.state)).filter(v => !isNaN(v));
      if (points.length < 2) return;
      const min = Math.min(...points); const max = Math.max(...points); const range = max - min || 1;
      const coords = points.map((p, idx) => `${(idx / (points.length - 1)) * 100},${30 - ((p - min) / range) * 30}`).join(' ');
      const spark = this.shadowRoot.getElementById(`spark-${i}`);
      if (spark) spark.innerHTML = `<svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="2" opacity="0.4" points="${coords}" /></svg>`;
    } catch (e) {}
  }

  render() {
    const view = this._config.current_view;
    const p = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 20px; color: white; overflow: hidden; font-family: sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${p.image}') center/cover; opacity: 0.3; }
        .topbar { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 10; }
        .btn { padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.4); color: white; cursor: pointer; font-weight: bold; }
        .btn.active { background: ${accent}; border-color: ${accent}; }
        .imc-badge { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 12px; text-align: center; backdrop-filter: blur(5px); z-index: 10; }
        .rule { position: absolute; bottom: 40px; left: 10%; width: 80%; height: 10px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 5px; }
        .pointer { position: absolute; top: -12px; width: 4px; height: 34px; background: white; transition: left 1s; border-radius: 2px; }
        .label { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 8px; border-radius: 5px; font-size: 12px; font-weight: 900; }
        .sensor { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); padding: 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); text-align: center; min-width: 100px; z-index: 5; }
        .sparkline { position: absolute; bottom: 0; left: 0; width: 100%; height: 25px; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="topbar">
          <button id="b1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="b2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="imc-badge">
          <div style="font-size: 10px; color: ${accent}; font-weight: bold;">IMC</div>
          <div id="val-imc" style="font-size: 1.5em; font-weight: bold;">--</div>
          <div id="last-sync" style="font-size: 8px; color: #94a3b8; margin-top: 4px;">--</div>
        </div>
        <div class="rule">
          <div id="progression-pointer" class="pointer"><div id="pointer-label" class="label">-- kg</div></div>
        </div>
        ${(p.sensors || []).map((s, i) => `
          <div class="sensor" style="left:${s.x}%; top:${s.y}%;">
            <div class="sparkline" id="spark-${i}"></div>
            <div style="font-size:10px; color:${accent}; font-weight:bold;">${s.name}</div>
            <div id="value-${i}" style="font-size:1.3em; font-weight:bold;">--</div>
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
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config || {})); this.render(); }
  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];
    this.innerHTML = `
      <div style="padding: 15px; font-family: sans-serif;">
        <h3 style="color:#03a9f4">Configuration Profil</h3>
        <label>Nom</label><input type="text" id="n" value="${p.name}" style="width:100%; margin-bottom:10px;">
        <label>Taille (cm)</label><input type="number" id="h" value="${p.height}" style="width:100%; margin-bottom:10px;">
        <label>Image URL</label><input type="text" id="img" value="${p.image}" style="width:100%; margin-bottom:10px;">
        <div style="display:flex; gap:10px;">
            <div><label>Départ</label><input type="number" id="s" value="${p.start}" style="width:100%;"></div>
            <div><label>Idéal</label><input type="number" id="id" value="${p.ideal}" style="width:100%;"></div>
        </div>
        <h4 style="margin-top:20px;">Capteurs</h4>
        <div id="sensors-list">
          ${(p.sensors || []).map((s, idx) => `
            <div style="background:#f4f4f4; padding:10px; margin-bottom:5px; border-radius:5px; position:relative;">
              <button class="del" data-idx="${idx}" style="position:absolute; right:5px; top:5px; color:red;">X</button>
              <input type="text" class="sn" data-idx="${idx}" value="${s.name}" placeholder="Nom" style="width:45%;">
              <input type="text" class="se" data-idx="${idx}" value="${s.entity}" placeholder="Entité" style="width:45%;">
            </div>
          `).join('')}
        </div>
        <button id="add" style="width:100%; padding:10px; background:#4caf50; color:white; border:none; border-radius:5px; margin-top:10px;">➕ Ajouter un capteur</button>
      </div>
    `;
    this.querySelector('#n').onchange = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#h').onchange = (e) => { this._config[pKey].height = e.target.value; this._fire(); };
    this.querySelector('#img').onchange = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    this.querySelector('#s').onchange = (e) => { this._config[pKey].start = e.target.value; this._fire(); };
    this.querySelector('#id').onchange = (e) => { this._config[pKey].ideal = e.target.value; this._fire(); };
    this.querySelector('#add').onclick = () => {
      if(!this._config[pKey].sensors) this._config[pKey].sensors = [];
      this._config[pKey].sensors.push({ name: "Nouveau", entity: "", x: 50, y: 50 });
      this._fire(); this.render();
    };
    this.querySelectorAll('.sn').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.se').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.del').forEach(el => el.onclick = (e) => { this._config[pKey].sensors.splice(e.target.dataset.idx, 1); this._fire(); this.render(); });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V83.0" });
