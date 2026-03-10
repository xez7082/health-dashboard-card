/**
 * HEALTH DASHBOARD CARD – V2.2.9
 * AJOUT : RÉGLAGE DE TAILLE INDIVIDUEL POUR LES FORMES RONDES
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
      card_height: 600,
      card_round: 12,
      icon_size: 26,
      person1: {
        name: "Patrick", start: 85, comfort: 78, ideal: 72, image: "", sensors: [], step_entity: "", step_goal: 10000, step_color: "#38bdf8",
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 20, imc_y: 20, imc_w: 160, imc_h: 69, imc_font: 14, imc_circle: false, imc_size: 80,
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 20, corp_y: 35, corp_w: 160, corp_h: 69, corp_font: 14, corp_circle: false, corp_size: 80
      },
      person2: {
        name: "Sandra", start: 70, comfort: 65, ideal: 60, image: "", sensors: [], step_entity: "", step_goal: 10000, step_color: "#f43f5e",
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 20, imc_y: 20, imc_w: 160, imc_h: 69, imc_font: 14, imc_circle: false, imc_size: 80,
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 20, corp_y: 35, corp_w: 160, corp_h: 69, corp_font: 14, corp_circle: false, corp_size: 80
      }
    };
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  _num(val, d = 0) { const n = parseFloat(val); return isNaN(n) ? d : n; }

  updateSensors() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view || 'person1';
    const pData = this._config[view];
    if (!pData) return;
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    const setV = (id, ent) => {
        const el = this.shadowRoot.getElementById(id);
        if (el && ent && this._hass.states[ent]) {
            const s = this._hass.states[ent];
            el.textContent = `${s.state}${s.attributes.unit_of_measurement || ''}`;
        }
    };

    // POIDS
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const label = this.shadowRoot.getElementById('pointer-label');
        if(label) {
            const stDiff = this._hass.states['sensor.difference_poids' + suffix];
            const diffVal = stDiff ? stDiff.state : "0";
            label.innerHTML = `${actuel}kg <span style="color:${parseFloat(diffVal) <= 0 ? '#4ade80' : '#f87171'}; margin-left:4px; font-size:0.8em;">(${parseFloat(diffVal) > 0 ? '+' : ''}${diffVal})</span>`;
        }
        const ptr = this.shadowRoot.getElementById('progression-pointer');
        if(ptr) ptr.style.left = `${Math.max(0, Math.min(100, range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0))}%`;
    }

    setV('imc-val', pData.imc_entity);
    setV('corp-val', pData.corp_entity);

    // PAS
    const stepEnt = pData.step_entity || 'sensor.withings_pas' + suffix;
    const stSteps = this._hass.states[stepEnt];
    if (stSteps) {
        const valSteps = this._num(stSteps.state);
        const goal = this._num(pData.step_goal, 10000);
        const path = this.shadowRoot.getElementById('gauge-path');
        if(path) path.style.strokeDasharray = `${(Math.min(100, (valSteps / goal) * 100) * 125.6) / 100}, 125.6`;
        const vP = this.shadowRoot.getElementById('step-value');
        if(vP) vP.textContent = valSteps;
    }

    if (pData.sensors) {
        pData.sensors.forEach((s, i) => setV(`value-${i}`, s.entity));
    }
  }

  _renderBlock(x, y, w, h, icon, name, valId, font, isCircle, circleSize, accent, round) {
      const finalW = isCircle ? (circleSize || 80) : w;
      const finalH = isCircle ? (circleSize || 80) : h;
      return `
        <div class="sensor-card" style="left:${x}%; top:${y}%; width:${finalW}px; height:${finalH}px; border-radius:${isCircle ? '50%' : round + 'px'};">
            <ha-icon icon="${icon}"></ha-icon>
            <div style="font-size:10px; opacity:0.8; display:${isCircle ? 'none' : 'block'};">${name}</div>
            <div id="${valId}" style="font-weight:900; font-size:${isCircle ? (finalH/4) : font}px;">--</div>
        </div>
      `;
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view || 'person1';
    const pData = this._config[view];
    if(!pData) return;
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';
    const round = this._config.card_round || 12;

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${round}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._config.img_offset || 50}%; background-size: cover; opacity: 0.4; z-index: 1; pointer-events: none; background-image: url('${pData.image}'); }
        .topbar { position: absolute; left: ${this._config.btn_x || 5}%; top: ${this._config.btn_y || 3}%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; font-weight: bold; }
        .btn.active { background: ${accent} !important; border-color: ${accent}; }
        .sensor-card { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 4px; backdrop-filter: blur(8px); overflow: hidden; }
        ha-icon { --mdc-icon-size: ${this._config.icon_size || 26}px; color: ${accent}; margin-bottom: 2px; }
        .rule-container { position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%); width: 90%; height: 80px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 40px; }
        .rule-fill { position: absolute; height: 100%; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 4px; width: 100%; opacity: 0.7; }
        .prog-pointer { position: absolute; top: -14px; width: 3px; height: 36px; background: white; transition: left 1s ease; box-shadow: 0 0 12px white; z-index: 5; }
        .pointer-bubble { position: absolute; top: -42px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 900; white-space: nowrap; border: 2px solid ${accent}; }
        .mark { position: absolute; top: 12px; transform: translateX(-50%); font-size: 10px; font-weight: bold; text-align: center; line-height: 1.2; }
        .mark-confort { position: absolute; top: -4px; width: 12px; height: 12px; background: #fbbf24; border: 2px solid #0f172a; border-radius: 50%; transform: translateX(-50%); z-index: 4; }
        .steps-gauge { position: absolute; top: 15px; right: 15px; width: 85px; height: 85px; z-index: 100; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .steps-data { position: absolute; text-align: center; }
        .steps-gauge svg { transform: rotate(-90deg); width: 74px; height: 74px; }
        .steps-gauge .meter { fill: none; stroke: ${pData.step_color || accent}; stroke-width: 4.5; stroke-linecap: round; }
      </style>
      <div class="main-container">
        <div class="topbar"><button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button><button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button></div>
        <div class="steps-gauge"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4.5"/><circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0, 125.6"/></svg><div class="steps-data"><span id="step-value" style="font-weight:900;">--</span></div></div>
        <div class="bg-img"></div>
        ${this._renderBlock(pData.imc_x, pData.imc_y, pData.imc_w, pData.imc_h, pData.imc_icon, pData.imc_name, 'imc-val', pData.imc_font, pData.imc_circle, pData.imc_size, accent, round)}
        ${this._renderBlock(pData.corp_x, pData.corp_y, pData.corp_w, pData.corp_h, pData.corp_icon, pData.corp_name, 'corp-val', pData.corp_font, pData.corp_circle, pData.corp_size, accent, round)}
        ${(pData.sensors || []).map((s, i) => this._renderBlock(s.x, s.y, this._config.b_width || 160, this._config.b_height || 69, s.icon, s.name, `value-${i}`, 14, s.is_circle, s.circle_size, accent, round)).join('')}
        <div class="rule-container">
            <div class="rule-track"><div class="rule-fill"></div><div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-bubble">--</div></div>
                <div class="mark" style="left: 0%;">DÉPART<br>${pData.start}kg</div>
                <div id="mark-comfort" class="mark" style="left: 50%; color:#fbbf24;"><div class="mark-confort"></div>CONFORT<br>${pData.comfort}kg</div>
                <div class="mark" style="left: 100%;">IDÉAL<br>${pData.ideal}kg</div>
            </div>
        </div>
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._activeTab = 'profile'; }
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = config; this.render(); }

  render() {
    if (!this._hass || !this._config) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <style>
        .ed-box { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid #444; }
        .tab { padding: 10px; cursor: pointer; background: #252525; border: none; color: #888; flex: 1; font-size: 11px; }
        .tab.active { background: #38bdf8; color: black; font-weight: bold; }
        .section { background: #252525; padding: 15px; border: 1px solid #444; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 10px; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sub-sec { background: #111; padding: 10px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #38bdf8; }
        .chk { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
        .chk input { width: auto; }
        .del-btn { width: 100%; margin-top: 10px; background: #f87171; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; }
      </style>
      <div class="ed-box">
        <div style="display:flex; gap:8px; margin-bottom:12px;">
            <button style="flex:1; padding:10px; background:${pKey==='person1'?'#38bdf8':'#444'};" id="t-p1">${this._config.person1.name}</button>
            <button style="flex:1; padding:10px; background:${pKey==='person2'?'#38bdf8':'#444'};" id="t-p2">${this._config.person2.name}</button>
        </div>
        <div class="tabs">
            ${['profile','health','sensors','design'].map(t => `<button class="tab ${this._activeTab===t?'active':''}" id="tab-${t}">${t.toUpperCase()}</button>`).join('')}
        </div>
        <div class="section">
            ${this._activeTab === 'profile' ? `
                <label>Nom</label><input type="text" id="inp-name" value="${p.name}">
                <label>Image URL</label><input type="text" id="inp-img" value="${p.image}">
                <div class="grid">
                    <div><label>Départ</label><input type="number" id="inp-start" value="${p.start}"></div>
                    <div><label>Idéal</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
                </div>
            ` : ''}
            ${this._activeTab === 'health' ? `
                <div class="sub-sec">
                    <label>IMC (Entité)</label><input type="text" id="inp-imce" value="${p.imc_entity || ''}">
                    <div class="grid">
                        <div class="chk"><input type="checkbox" id="chk-imcc" ${p.imc_circle?'checked':''}> <label style="margin:0">Rond</label></div>
                        <div><label>Taille (Rond)</label><input type="number" id="inp-imcs" value="${p.imc_size || 80}"></div>
                    </div>
                </div>
                <div class="sub-sec">
                    <label>Corpulence (Entité)</label><input type="text" id="inp-corpe" value="${p.corp_entity || ''}">
                    <div class="grid">
                        <div class="chk"><input type="checkbox" id="chk-corpc" ${p.corp_circle?'checked':''}> <label style="margin:0">Rond</label></div>
                        <div><label>Taille (Rond)</label><input type="number" id="inp-corps" value="${p.corp_size || 80}"></div>
                    </div>
                </div>
            ` : ''}
            ${this._activeTab === 'sensors' ? `
                <div id="sensors-container">
                ${(p.sensors || []).map((s, i) => `
                  <div class="sub-sec">
                    <label>${s.name || 'Capteur'}</label>
                    <input type="text" class="s-ent" data-idx="${i}" value="${s.entity}" placeholder="Entité">
                    <div class="grid">
                        <div class="chk"><input type="checkbox" class="s-circ" data-idx="${i}" ${s.is_circle?'checked':''}> <label style="margin:0">Rond</label></div>
                        <div><label>Taille (Rond)</label><input type="number" class="s-size" data-idx="${i}" value="${s.circle_size || 80}"></div>
                    </div>
                    <div class="grid"><div><label>X %</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div><div><label>Y %</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div></div>
                    <button class="del-btn" data-idx="${i}">Supprimer</button>
                  </div>
                `).join('')}
                </div>
                <button style="width:100%; padding:12px; background:#4ade80; border:none; font-weight:bold; cursor:pointer;" id="add-s">➕ AJOUTER</button>
            ` : ''}
            ${this._activeTab === 'design' ? `
                <div class="grid">
                    <div><label>Hauteur Carte</label><input type="number" id="inp-ch" value="${this._config.card_height || 600}"></div>
                    <div><label>Taille Icônes</label><input type="number" id="inp-is" value="${this._config.icon_size || 26}"></div>
                </div>
                <div class="grid">
                    <div><label>Arrondi (Rect)</label><input type="number" id="inp-round" value="${this._config.card_round || 12}"></div>
                    <div><label>Image Offset %</label><input type="number" id="inp-off" value="${this._config.img_offset || 50}"></div>
                </div>
            ` : ''}
        </div>
      </div>
    `;
    this._attachEvents(pKey);
  }

  _attachEvents(pKey) {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._activeTab = t.id.replace('tab-',''); this.render(); });
    this.querySelector('#t-p1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#t-p2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
    
    const bind = (id, field, isRoot = false, isCheck = false) => {
        const el = this.querySelector(id);
        if(el) el.oninput = (e) => { 
            const v = isCheck ? e.target.checked : e.target.value;
            if(isRoot) this._config[field] = v; else this._config[pKey][field] = v;
            this._fire(); 
            if(isCheck) this.render();
        };
    };

    if(this._activeTab === 'profile') { bind('#inp-name', 'name'); bind('#inp-img', 'image'); bind('#inp-start', 'start'); bind('#inp-ideal', 'ideal'); }
    if(this._activeTab === 'health') { 
        bind('#chk-imcc', 'imc_circle', false, true); bind('#inp-imcs', 'imc_size');
        bind('#chk-corpc', 'corp_circle', false, true); bind('#inp-corps', 'corp_size');
    }
    if(this._activeTab === 'design') { bind('#inp-ch', 'card_height', true); bind('#inp-is', 'icon_size', true); bind('#inp-round', 'card_round', true); bind('#inp-off', 'img_offset', true); }
    if(this._activeTab === 'sensors') {
        this.querySelectorAll('.s-ent').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
        this.querySelectorAll('.s-x').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
        this.querySelectorAll('.s-y').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].y = e.target.value; this._fire(); });
        this.querySelectorAll('.s-size').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].circle_size = e.target.value; this._fire(); });
        this.querySelectorAll('.s-circ').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].is_circle = e.target.checked; this._fire(); this.render(); });
        this.querySelectorAll('.del-btn').forEach(btn => btn.onclick = () => { this._config[pKey].sensors.splice(btn.dataset.idx, 1); this._fire(); this.render(); });
        this.querySelector('#add-s').onclick = () => { if(!this._config[pKey].sensors) this._config[pKey].sensors = []; this._config[pKey].sensors.push({name:"Nouveau", entity:"", x:50, y:50, icon:"mdi:heart", is_circle:true, circle_size:80}); this._fire(); this.render(); };
    }
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.2.9" });
