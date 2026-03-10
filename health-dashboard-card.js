/**
 * HEALTH DASHBOARD CARD – V2.8.0
 * INCLUS : IMC, CORPULENCE, SOMMEIL, PAS, RYTHME CARDIAQUE, RÈGLE DE POIDS, CAPTEURS LIBRES
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
        name: "Patrick", start: 85, ideal: 72, comfort: 78, step_goal: 10000, image: "",
        imc_entity: "", imc_x: 20, imc_y: 15, imc_size: 90,
        corp_entity: "", corp_x: 20, corp_y: 35, corp_w: 130, corp_h: 70,
        sleep_entity: "", sleep_x: 80, sleep_y: 35, sleep_w: 130, sleep_h: 70,
        heart_entity: "", heart_x: 80, heart_y: 15, heart_w: 130, heart_h: 70,
        sensors: []
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
    setV('heart-val', p.heart_entity);
    if (p.sensors) p.sensors.forEach((s, i) => setV(`value-extra-${i}`, s.entity));

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
      if(label) label.innerHTML = `${actuel}kg <small style="font-size:10px; opacity:0.7;">(${diffEnt ? diffEnt.state : '0'})</small>`;
      const ptr = this.shadowRoot.getElementById('progression-pointer');
      if(ptr) ptr.style.left = `${Math.max(0, Math.min(100, range !== 0 ? ((this._num(p.start) - actuel) / range) * 100 : 0))}%`;
    }
  }

  _renderBlock(x, y, w, h, icon, name, valId, isCircle, circleSize, fs, accent) {
    const fw = isCircle ? (circleSize || 90) : (w || 130);
    const fh = isCircle ? (circleSize || 90) : (h || 70);
    return `
      <div class="sensor-card" style="left:${x}%; top:${y}%; width:${fw}px; height:${fh}px; border-radius:${isCircle?'50%':(this._config.card_round||12)+'px'};">
        <ha-icon icon="${icon}"></ha-icon>
        <div class="label" style="font-size:${this._config.font_size_label}px;">${name}</div>
        <div id="${valId}" class="value" style="font-size:${fs || this._config.font_size_value}px;">--</div>
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
        .main-container { position: relative; width: 100%; height: ${this._config.card_height}px; background: #0f172a; border-radius: ${this._config.card_round}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center 50%; background-size: cover; opacity: 0.4; background-image: url('${p.image}'); }
        .topbar { position: absolute; left: 5%; top: 3%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-weight: bold; }
        .btn.active { background: ${accent} !important; color: black; border-color: ${accent}; }
        .sensor-card { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); border: ${this._config.border_width}px solid ${accent}; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; }
        .label { opacity: 0.7; text-transform: uppercase; margin-bottom: 2px; }
        .value { font-weight: 900; }
        ha-icon { --mdc-icon-size: ${this._config.icon_size}px; color: ${accent}; }
        .steps-gauge { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 100px; height: 100px; z-index: 50; display: flex; align-items: center; justify-content: center; }
        .steps-gauge svg { transform: rotate(-90deg); width: 80px; height: 80px; }
        .meter { fill: none; stroke: ${accent}; stroke-width: 4; stroke-linecap: round; transition: stroke-dasharray 1s; }
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 90%; }
        .rule-track { position: relative; width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; margin-top: 35px; }
        .rule-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 5px; }
        .prog-pointer { position: absolute; top: -12px; width: 4px; height: 34px; background: white; box-shadow: 0 0 10px white; transition: left 1s; }
        .pointer-bubble { position: absolute; top: -45px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 12px; border-radius: 10px; font-weight: 900; font-size: 13px; white-space: nowrap; }
        .mark { position: absolute; top: 18px; transform: translateX(-50%); font-size: 10px; font-weight: bold; text-align: center; }
      </style>
      <div class="main-container">
        <div class="topbar"><button id="bt1" class="btn ${view==='person1'?'active':''}">PATRICK</button><button id="bt2" class="btn ${view==='person2'?'active':''}">SANDRA</button></div>
        <div class="steps-gauge"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/><circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0, 125.6"/></svg><div style="position:absolute; text-align:center;"><span id="step-value" style="font-size:16px; font-weight:900;">0</span><br><small style="font-size:8px; opacity:0.7;">PAS</small></div></div>
        <div class="bg-img"></div>
        ${this._renderBlock(p.imc_x, p.imc_y, 0, 0, 'mdi:scale-bathroom', 'IMC', 'imc-val', true, p.imc_size, p.imc_fs, accent)}
        ${this._renderBlock(p.corp_x, p.corp_y, p.corp_w, p.corp_h, 'mdi:human-male', 'CORPULENCE', 'corp-val', false, 0, p.corp_fs, accent)}
        ${this._renderBlock(p.sleep_x, p.sleep_y, p.sleep_w, p.sleep_h, 'mdi:bed', 'SOMMEIL', 'sleep-val', false, 0, p.sleep_fs, accent)}
        ${this._renderBlock(p.heart_x, p.heart_y, p.heart_w, p.heart_h, 'mdi:heart-pulse', 'COEUR', 'heart-val', false, 0, p.heart_fs, accent)}
        ${(p.sensors || []).map((s, i) => this._renderBlock(s.x, s.y, s.w, s.h, s.icon, s.name, `value-extra-${i}`, s.is_circle, s.circle_size, s.font_size, accent)).join('')}
        <div class="rule-container">
          <div class="rule-track"><div class="rule-fill"></div><div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-bubble">--</div></div></div>
          <div class="mark" style="left:0%">${p.start}kg</div><div class="mark" style="left:50%">${p.comfort}kg</div><div class="mark" style="left:100%">${p.ideal}kg</div>
        </div>
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

// L'ÉDITEUR COMPLET (Onglets Design, Profil, Entités, Capteurs Extras)
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._activeTab = 'design'; }
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = config; this.render(); }
  render() {
    const p = this._config[this._config.current_view || 'person1'];
    this.innerHTML = `
      <style>
        .ed-box { padding: 15px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
        .tab { padding: 8px; cursor: pointer; background: #252525; border: none; color: #aaa; flex: 1; border-radius: 4px; font-size: 10px; }
        .tab.active { background: #38bdf8; color: black; font-weight: bold; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 10px; text-transform: uppercase; }
        input { width: 100%; padding: 6px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; margin-top: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .sub-sec { background: #111; padding: 10px; border-radius: 4px; margin-bottom: 12px; border-left: 3px solid #38bdf8; }
      </style>
      <div class="ed-box">
        <div class="tabs">
          ${['design','profile','entities','sensors'].map(t => `<button class="tab ${this._activeTab===t?'active':''}" id="tab-${t}">${t.toUpperCase()}</button>`).join('')}
        </div>
        ${this._activeTab === 'design' ? `
          <div class="grid">
            <div><label>Hauteur</label><input type="number" id="inp-ch" value="${this._config.card_height}"></div>
            <div><label>Arrondi</label><input type="number" id="inp-round" value="${this._config.card_round}"></div>
          </div>
          <div class="grid">
            <div><label>Police Nom</label><input type="number" id="inp-fsl" value="${this._config.font_size_label}"></div>
            <div><label>Police Val</label><input type="number" id="inp-fsv" value="${this._config.font_size_value}"></div>
          </div>
        ` : ''}
        ${this._activeTab === 'entities' ? `
          <div class="sub-sec"><label>Poids (Entité)</label><input type="text" id="inp-ew" value="${p.weight_entity||''}"></div>
          <div class="sub-sec"><label>IMC (Entité + X/Y)</label>
            <input type="text" id="inp-eimc" value="${p.imc_entity||''}">
            <div class="grid"><input type="number" id="inp-imcx" value="${p.imc_x}"> <input type="number" id="inp-imcy" value="${p.imc_y}"></div>
          </div>
          <div class="sub-sec"><label>Cœur (Entité + X/Y)</label>
            <input type="text" id="inp-eheart" value="${p.heart_entity||''}">
            <div class="grid"><input type="number" id="inp-heartx" value="${p.heart_x}"> <input type="number" id="inp-hearty" value="${p.heart_y}"></div>
          </div>
        ` : ''}
      </div>
    `;
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._activeTab = t.id.replace('tab-',''); this.render(); });
    const b = (id, f, root=false) => {
        const el = this.querySelector(id); if(!el) return;
        el.oninput = (e) => { this._config[root ? f : (this._config.current_view || 'person1')][f] = e.target.value; this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); };
    };
    b('#inp-ch','card_height',true); b('#inp-round','card_round',true); b('#inp-fsl','font_size_label',true); b('#inp-fsv','font_size_value',true);
    b('#inp-ew','weight_entity'); b('#inp-eimc','imc_entity'); b('#inp-imcx','imc_x'); b('#inp-imcy','imc_y');
    b('#inp-eheart','heart_entity'); b('#inp-heartx','heart_x'); b('#inp-hearty','heart_y');
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.8.0" });
