/**
 * HEALTH DASHBOARD CARD – V2.7.0
 * CONFIGURATION TOTALE : IMC, CORP, PAS, SOMMEIL, POIDS, DIFFÉRENCES
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  static getStubConfig() {
    return {
      type: "custom:health-dashboard-card",
      card_height: 600, card_round: 15, icon_size: 26,
      border_width: 2, border_color: "rgba(255,255,255,0.2)",
      font_size_label: 10, font_size_value: 14,
      person1: {
        name: "Patrick", start: 85, ideal: 72, comfort: 78, step_goal: 10000,
        image: "", sensors: [],
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 25, imc_y: 20, imc_w: 120, imc_h: 70, imc_circle: true, imc_size: 90, imc_fs: 16,
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 25, corp_y: 40, corp_w: 140, corp_h: 70, corp_circle: false, corp_size: 90, corp_fs: 14,
        sleep_entity: "", sleep_name: "Sommeil", sleep_icon: "mdi:bed", sleep_x: 75, sleep_y: 40, sleep_w: 140, sleep_h: 70, sleep_circle: false, sleep_size: 90, sleep_fs: 14,
        weight_diff_entity: ""
      },
      person2: { name: "Sandra", sensors: [] }
    };
  }

  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  set hass(hass) { this._hass = hass; this.updateSensors(); }
  _num(val, d = 0) { const n = parseFloat(val); return isNaN(n) ? d : n; }

  updateSensors() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view || 'person1';
    const p = this._config[view];

    const setV = (id, ent) => {
      const el = this.shadowRoot.getElementById(id);
      if (el && ent && this._hass.states[ent]) {
        const s = this._hass.states[ent];
        el.textContent = `${s.state}${s.attributes.unit_of_measurement || ''}`;
      }
    };

    setV('imc-val', p.imc_entity);
    setV('corp-val', p.corp_entity);
    setV('sleep-val', p.sleep_entity);
    if (p.sensors) p.sensors.forEach((s, i) => setV(`value-${i}`, s.entity));

    // Jauge Pas
    const stSteps = this._hass.states[p.step_entity];
    if (stSteps) {
      const val = this._num(stSteps.state);
      const goal = this._num(p.step_goal, 10000);
      const path = this.shadowRoot.getElementById('gauge-path');
      if(path) path.style.strokeDasharray = `${(Math.min(100, (val/goal)*100)*125.6)/100}, 125.6`;
      this.shadowRoot.getElementById('step-value').textContent = val;
    }

    // Règle Poids
    const stPoids = this._hass.states[p.weight_entity];
    if (stPoids) {
      const actuel = this._num(stPoids.state);
      const diffEnt = this._hass.states[p.weight_diff_entity];
      const range = this._num(p.start) - this._num(p.ideal);
      const label = this.shadowRoot.getElementById('pointer-label');
      if(label) label.innerHTML = `${actuel}kg <small>(${diffEnt ? diffEnt.state : '0'})</small>`;
      const ptr = this.shadowRoot.getElementById('progression-pointer');
      if(ptr) ptr.style.left = `${Math.max(0, Math.min(100, range !== 0 ? ((this._num(p.start) - actuel) / range) * 100 : 0))}%`;
    }
  }

  _renderBlock(x, y, w, h, icon, name, valId, isCircle, circleSize, fs, accent, round) {
    const fw = isCircle ? (circleSize || 80) : (w || 140);
    const fh = isCircle ? (circleSize || 80) : (h || 70);
    const fsl = this._config.font_size_label || 10;
    const fsv = (fs > 0) ? fs : (this._config.font_size_value || 14);
    return `
      <div class="sensor-card" style="left:${x}%; top:${y}%; width:${fw}px; height:${fh}px; border-radius:${isCircle?'50%':round+'px'};">
        <ha-icon icon="${icon}"></ha-icon>
        <div class="label" style="font-size:${fsl}px;">${name}</div>
        <div id="${valId}" class="value" style="font-size:${fsv}px;">--</div>
      </div>
    `;
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view || 'person1';
    const p = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${this._config.card_round || 15}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center 50%; background-size: cover; opacity: 0.4; background-image: url('${p.image}'); }
        .topbar { position: absolute; left: 5%; top: 3%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-weight: bold; }
        .btn.active { background: ${accent} !important; border-color: ${accent}; color: #000; }
        .sensor-card { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); border: ${this._config.border_width}px solid ${this._config.border_color || accent}; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; }
        .label { opacity: 0.8; text-transform: uppercase; margin: 2px 0; }
        .value { font-weight: 900; }
        ha-icon { --mdc-icon-size: ${this._config.icon_size}px; color: ${accent}; }
        .steps-gauge { position: absolute; top: 20px; right: 20px; width: 100px; height: 100px; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border-radius: 50%; }
        .steps-gauge svg { transform: rotate(-90deg); width: 80px; height: 80px; }
        .meter { fill: none; stroke: ${accent}; stroke-width: 4; stroke-linecap: round; transition: stroke-dasharray 1s; }
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 90%; z-index: 20; }
        .rule-track { position: relative; width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; margin-top: 30px; border: 1px solid rgba(255,255,255,0.1); }
        .rule-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 5px; }
        .prog-pointer { position: absolute; top: -10px; width: 4px; height: 32px; background: white; box-shadow: 0 0 10px white; transition: left 1s; }
        .pointer-bubble { position: absolute; top: -45px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 12px; border-radius: 10px; font-weight: 900; border: 2px solid ${accent}; font-size: 13px; white-space: nowrap; }
        .mark { position: absolute; top: 18px; transform: translateX(-50%); font-size: 10px; font-weight: bold; opacity: 0.9; text-align: center; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="steps-gauge">
          <svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/><circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0, 125.6"/></svg>
          <div style="position:absolute; text-align:center;"><span id="step-value" style="font-size:16px; font-weight:900;">0</span><br><small style="font-size:8px; opacity:0.7;">PAS</small></div>
        </div>
        <div class="bg-img"></div>
        ${this._renderBlock(p.imc_x, p.imc_y, p.imc_w, p.imc_h, p.imc_icon, p.imc_name, 'imc-val', p.imc_circle, p.imc_size, p.imc_fs, accent, this._config.card_round)}
        ${this._renderBlock(p.corp_x, p.corp_y, p.corp_w, p.corp_h, p.corp_icon, p.corp_name, 'corp-val', p.corp_circle, p.corp_size, p.corp_fs, accent, this._config.card_round)}
        ${this._renderBlock(p.sleep_x, p.sleep_y, p.sleep_w, p.sleep_h, p.sleep_icon, p.sleep_name, 'sleep-val', p.sleep_circle, p.sleep_size, p.sleep_fs, accent, this._config.card_round)}
        ${(p.sensors || []).map((s, i) => this._renderBlock(s.x, s.y, s.w, s.h, s.icon, s.name, `value-${i}`, s.is_circle, s.circle_size, s.font_size, accent, this._config.card_round)).join('')}
        <div class="rule-container">
          <div class="rule-track"><div class="rule-fill"></div><div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-bubble">--</div></div></div>
          <div class="mark" style="left:0%">DEPART<br>${p.start}kg</div>
          <div class="mark" style="left:50%; color:#fbbf24">CONFORT<br>${p.comfort}kg</div>
          <div class="mark" style="left:100%">IDEAL<br>${p.ideal}kg</div>
        </div>
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._activeTab = 'design'; }
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = config; this.render(); }

  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];
    this.innerHTML = `
      <style>
        .ed-box { padding: 15px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
        .tab { padding: 8px; cursor: pointer; background: #252525; border: none; color: #aaa; flex: 1; font-size: 10px; border-radius: 4px; }
        .tab.active { background: #38bdf8; color: black; font-weight: bold; }
        .section { background: #252525; padding: 12px; border-radius: 6px; border: 1px solid #444; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 10px; text-transform: uppercase; }
        input, select { width: 100%; padding: 6px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; margin-top: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sub-sec { background: #111; padding: 10px; border-radius: 4px; margin-bottom: 12px; border-left: 3px solid #38bdf8; }
      </style>
      <div class="ed-box">
        <div class="tabs">
          ${['design','profile','entities','sensors'].map(t => `<button class="tab ${this._activeTab===t?'active':''}" id="tab-${t}">${t.toUpperCase()}</button>`).join('')}
        </div>
        <div class="section">
          ${this._activeTab === 'design' ? `
            <div class="grid">
              <div><label>Hauteur Carte</label><input type="number" id="inp-ch" value="${this._config.card_height}"></div>
              <div><label>Arrondi Bords</label><input type="number" id="inp-round" value="${this._config.card_round}"></div>
            </div>
            <div class="grid">
              <div><label>Police Noms</label><input type="number" id="inp-fsl" value="${this._config.font_size_label}"></div>
              <div><label>Police Chiffres</label><input type="number" id="inp-fsv" value="${this._config.font_size_value}"></div>
            </div>
            <label>Taille Icônes</label><input type="number" id="inp-is" value="${this._config.icon_size}">
          ` : ''}

          ${this._activeTab === 'profile' ? `
            <label>Nom Profil</label><input type="text" id="inp-name" value="${p.name}">
            <div class="grid">
              <div><label>Poids Départ</label><input type="number" id="inp-start" value="${p.start}"></div>
              <div><label>Poids Idéal</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
            </div>
            <div class="grid">
              <div><label>Poids Confort</label><input type="number" id="inp-comfort" value="${p.comfort}"></div>
              <div><label>Objectif Pas</label><input type="number" id="inp-stepg" value="${p.step_goal}"></div>
            </div>
            <label>Image URL</label><input type="text" id="inp-img" value="${p.image}">
          ` : ''}

          ${this._activeTab === 'entities' ? `
            <div class="sub-sec">
              <label>Poids & Pas</label>
              <input type="text" id="inp-ent-w" placeholder="Entité Poids" value="${p.weight_entity || ''}">
              <input type="text" id="inp-ent-wd" placeholder="Entité Différence Poids" value="${p.weight_diff_entity || ''}">
              <input type="text" id="inp-ent-s" placeholder="Entité Pas" value="${p.step_entity || ''}">
            </div>
            <div class="sub-sec">
              <label>IMC Configuration</label>
              <input type="text" id="inp-imce" placeholder="Entité IMC" value="${p.imc_entity || ''}">
              <div class="grid">
                <div><label>X / Y %</label><div class="grid"><input type="number" id="inp-imcx" value="${p.imc_x}"> <input type="number" id="inp-imcy" value="${p.imc_y}"></div></div>
                <div><label>Taille / Police</label><div class="grid"><input type="number" id="inp-imcs" value="${p.imc_size}"> <input type="number" id="inp-imcf" value="${p.imc_fs}"></div></div>
              </div>
            </div>
            <div class="sub-sec">
              <label>Sommeil Configuration</label>
              <input type="text" id="inp-sleepe" placeholder="Entité Sommeil" value="${p.sleep_entity || ''}">
              <div class="grid">
                <div><label>X / Y %</label><div class="grid"><input type="number" id="inp-sleepx" value="${p.sleep_x}"> <input type="number" id="inp-sleepy" value="${p.sleep_y}"></div></div>
                <div><label>Taille / Police</label><div class="grid"><input type="number" id="inp-sleeps" value="${p.sleep_size}"> <input type="number" id="inp-sleepf" value="${p.sleep_fs}"></div></div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    this._attachEvents(pKey);
  }

  _attachEvents(pKey) {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._activeTab = t.id.replace('tab-',''); this.render(); });
    const b = (id, f, root=false) => {
      const el = this.querySelector(id); if(!el) return;
      el.oninput = (e) => { this._config[root?f:pKey][f] = e.target.value; this._fire(); };
    };
    if(this._activeTab === 'design') { b('#inp-ch','card_height',true); b('#inp-round','card_round',true); b('#inp-fsl','font_size_label',true); b('#inp-fsv','font_size_value',true); b('#inp-is','icon_size',true); }
    if(this._activeTab === 'profile') { b('#inp-name','name'); b('#inp-start','start'); b('#inp-ideal','ideal'); b('#inp-comfort','comfort'); b('#inp-stepg','step_goal'); b('#inp-img','image'); }
    if(this._activeTab === 'entities') {
      b('#inp-ent-w','weight_entity'); b('#inp-ent-wd','weight_diff_entity'); b('#inp-ent-s','step_entity');
      b('#inp-imce','imc_entity'); b('#inp-imcx','imc_x'); b('#inp-imcy','imc_y'); b('#inp-imcs','imc_size'); b('#inp-imcf','imc_fs');
      b('#inp-sleepe','sleep_entity'); b('#inp-sleepx','sleep_x'); b('#inp-sleepy','sleep_y'); b('#inp-sleeps','sleep_size'); b('#inp-sleepf','sleep_fs');
    }
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.7.0" });
