/**
 * HEALTH DASHBOARD CARD – V2.4.0
 * RÉINTÉGRATION COMPLÈTE DE TOUS LES RÉGLAGES INDIVIDUELS
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
      card_height: 600, card_round: 12, icon_size: 26,
      border_width: 1, border_color: "rgba(255,255,255,0.2)",
      font_size_label: 10, font_size_value: 14,
      person1: {
        name: "Patrick", start: 85, comfort: 78, ideal: 72, image: "", sensors: [],
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 20, imc_y: 20, imc_w: 160, imc_h: 69, imc_circle: false, imc_size: 80, imc_font_size: 0,
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 20, corp_y: 35, corp_w: 160, corp_h: 69, corp_circle: false, corp_size: 80, corp_font_size: 0
      },
      person2: {
        name: "Sandra", start: 70, comfort: 65, ideal: 60, image: "", sensors: [],
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 20, imc_y: 20, imc_w: 160, imc_h: 69, imc_circle: false, imc_size: 80, imc_font_size: 0,
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 20, corp_y: 35, corp_w: 160, corp_h: 69, corp_circle: false, corp_size: 80, corp_font_size: 0
      }
    };
  }

  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  set hass(hass) { this._hass = hass; this.updateSensors(); }
  _num(val, d = 0) { const n = parseFloat(val); return isNaN(n) ? d : n; }

  updateSensors() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view || 'person1';
    const pData = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    const setV = (id, ent) => {
        const el = this.shadowRoot.getElementById(id);
        if (el && ent && this._hass.states[ent]) {
            const s = this._hass.states[ent];
            el.textContent = `${s.state}${s.attributes.unit_of_measurement || ''}`;
        }
    };

    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const label = this.shadowRoot.getElementById('pointer-label');
        if(label) {
            const stDiff = this._hass.states['sensor.difference_poids' + suffix];
            label.innerHTML = `${actuel}kg <span style="font-size:0.8em; opacity:0.8;">(${stDiff ? stDiff.state : '0'})</span>`;
        }
        const ptr = this.shadowRoot.getElementById('progression-pointer');
        if(ptr) ptr.style.left = `${Math.max(0, Math.min(100, range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0))}%`;
    }

    setV('imc-val', pData.imc_entity);
    setV('corp-val', pData.corp_entity);
    if (pData.sensors) pData.sensors.forEach((s, i) => setV(`value-${i}`, s.entity));
  }

  _renderBlock(x, y, w, h, icon, name, valId, isCircle, circleSize, individualFontSize, accent, round) {
      const finalW = isCircle ? (circleSize || 80) : (w || 160);
      const finalH = isCircle ? (circleSize || 80) : (h || 69);
      const fsLabel = this._config.font_size_label || 10;
      const fsVal = (individualFontSize > 0) ? individualFontSize : (isCircle ? (finalH / 4) : (this._config.font_size_value || 14));
      
      return `
        <div class="sensor-card" style="left:${x}%; top:${y}%; width:${finalW}px; height:${finalH}px; border-radius:${isCircle ? '50%' : round + 'px'};">
            <ha-icon icon="${icon}"></ha-icon>
            <div class="label" style="font-size:${fsLabel}px; display:${isCircle ? 'none' : 'block'};">${name}</div>
            <div id="${valId}" class="value" style="font-size:${fsVal}px;">--</div>
        </div>
      `;
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view || 'person1';
    const pData = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';
    const round = this._config.card_round || 12;

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${round}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._config.img_offset || 50}%; background-size: cover; opacity: 0.4; background-image: url('${pData.image}'); }
        .topbar { position: absolute; left: 5%; top: 3%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-weight: bold; }
        .btn.active { background: ${accent} !important; border-color: ${accent}; }
        .sensor-card { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); border: ${this._config.border_width || 1}px solid ${this._config.border_color || 'rgba(255,255,255,0.2)'}; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); }
        .label { opacity: 0.8; margin-bottom: 2px; }
        .value { font-weight: 900; }
        ha-icon { --mdc-icon-size: ${this._config.icon_size || 26}px; color: ${accent}; }
        .rule-container { position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%); width: 90%; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; }
        .prog-pointer { position: absolute; top: -14px; width: 3px; height: 36px; background: white; box-shadow: 0 0 12px white; }
        .pointer-bubble { position: absolute; top: -42px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 10px; border-radius: 8px; font-weight: 900; border: 2px solid ${accent}; }
      </style>
      <div class="main-container">
        <div class="topbar"><button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button><button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button></div>
        <div class="bg-img"></div>
        ${this._renderBlock(pData.imc_x, pData.imc_y, pData.imc_w, pData.imc_h, pData.imc_icon, pData.imc_name, 'imc-val', pData.imc_circle, pData.imc_size, pData.imc_font_size, accent, round)}
        ${this._renderBlock(pData.corp_x, pData.corp_y, pData.corp_w, pData.corp_h, pData.corp_icon, pData.corp_name, 'corp-val', pData.corp_circle, pData.corp_size, pData.corp_font_size, accent, round)}
        ${(pData.sensors || []).map((s, i) => this._renderBlock(s.x, s.y, s.w, s.h, s.icon, s.name, `value-${i}`, s.is_circle, s.circle_size, s.font_size, accent, round)).join('')}
        <div class="rule-container"><div class="rule-track"><div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-bubble">--</div></div></div></div>
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
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <style>
        .ed-box { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
        .tab { padding: 10px; cursor: pointer; background: #252525; border: none; color: #888; flex: 1; font-size: 11px; }
        .tab.active { background: #38bdf8; color: black; font-weight: bold; }
        .section { background: #252525; padding: 15px; border: 1px solid #444; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; }
        input, select { width: 100%; padding: 6px; background: #333; color: white; border: 1px solid #555; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .sub-sec { background: #111; padding: 8px; border-radius: 4px; margin-bottom: 10px; border-left: 2px solid #38bdf8; }
      </style>
      <div class="ed-box">
        <div class="tabs">
            ${['profile','health','sensors','design'].map(t => `<button class="tab ${this._activeTab===t?'active':''}" id="tab-${t}">${t.toUpperCase()}</button>`).join('')}
        </div>
        <div class="section">
            ${this._activeTab === 'profile' ? `
                <label>Nom</label><input type="text" id="inp-name" value="${p.name}">
                <label>Image URL</label><input type="text" id="inp-img" value="${p.image}">
                <div class="grid">
                    <div><label>Départ (kg)</label><input type="number" id="inp-start" value="${p.start}"></div>
                    <div><label>Idéal (kg)</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
                </div>
            ` : ''}
            ${this._activeTab === 'health' ? `
                <div class="sub-sec">
                    <label>IMC - Entité</label><input type="text" id="inp-imce" value="${p.imc_entity || ''}">
                    <div class="grid">
                        <div><label>X %</label><input type="number" id="inp-imcx" value="${p.imc_x}"></div>
                        <div><label>Y %</label><input type="number" id="inp-imcy" value="${p.imc_y}"></div>
                    </div>
                    <div class="grid">
                        <div><label>Largeur</label><input type="number" id="inp-imcw" value="${p.imc_w}"></div>
                        <div><label>Hauteur</label><input type="number" id="inp-imch" value="${p.imc_h}"></div>
                    </div>
                    <div class="grid">
                        <div><label>Mode Rond</label><select id="inp-imcc"><option value="false" ${!p.imc_circle?'selected':''}>Non</option><option value="true" ${p.imc_circle?'selected':''}>Oui</option></select></div>
                        <div><label>Diamètre / Police</label><div class="grid"><input type="number" id="inp-imcs" value="${p.imc_size}"> <input type="number" id="inp-imcf" value="${p.imc_font_size}"></div></div>
                    </div>
                </div>
            ` : ''}
            ${this._activeTab === 'sensors' ? `
                <div id="sensors-container">
                ${(p.sensors || []).map((s, i) => `
                  <div class="sub-sec">
                    <label>Nom / Entité</label>
                    <div class="grid"><input type="text" class="s-name" data-idx="${i}" value="${s.name}"> <input type="text" class="s-ent" data-idx="${i}" value="${s.entity}"></div>
                    <div class="grid">
                        <div><label>Pos X / Y %</label><div class="grid"><input type="number" class="s-x" data-idx="${i}" value="${s.x}"> <input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div></div>
                        <div><label>Rond / Taille</label><div class="grid"><select class="s-circ" data-idx="${i}"><option value="false" ${!s.is_circle?'selected':''}>Non</option><option value="true" ${s.is_circle?'selected':''}>Oui</option></select> <input type="number" class="s-size" data-idx="${i}" value="${s.circle_size}"></div></div>
                    </div>
                    <label>Police (0=Auto)</label><input type="number" class="s-font" data-idx="${i}" value="${s.font_size || 0}">
                    <button class="del-btn" style="width:100%; background:#f87171; border:none; color:white; margin-top:5px; cursor:pointer;" data-idx="${i}">Supprimer</button>
                  </div>
                `).join('')}
                </div>
                <button style="width:100%; padding:10px; background:#4ade80; border:none; font-weight:bold;" id="add-s">➕ AJOUTER CAPTEUR</button>
            ` : ''}
            ${this._activeTab === 'design' ? `
                <div class="grid">
                    <div><label>Hauteur Carte</label><input type="number" id="inp-ch" value="${this._config.card_height || 600}"></div>
                    <div><label>Arrondi Bords</label><input type="number" id="inp-round" value="${this._config.card_round || 12}"></div>
                </div>
                <div class="grid">
                    <div><label>Bordure (px)</label><input type="number" id="inp-bw" value="${this._config.border_width || 1}"></div>
                    <div><label>Couleur Bord.</label><input type="text" id="inp-bc" value="${this._config.border_color || 'rgba(255,255,255,0.2)'}"></div>
                </div>
                <div class="grid">
                    <div><label>Police Labels</label><input type="number" id="inp-fsl" value="${this._config.font_size_label || 10}"></div>
                    <div><label>Police Valeurs</label><input type="number" id="inp-fsv" value="${this._config.font_size_value || 14}"></div>
                </div>
                <label>Taille Icônes</label><input type="number" id="inp-is" value="${this._config.icon_size || 26}">
            ` : ''}
        </div>
      </div>
    `;
    this._attachEvents(pKey);
  }

  _attachEvents(pKey) {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._activeTab = t.id.replace('tab-',''); this.render(); });
    const bind = (id, field, isRoot = false) => {
        const el = this.querySelector(id);
        if(!el) return;
        el.oninput = (e) => { 
            let val = e.target.value;
            if(e.target.tagName === 'SELECT') val = (val === 'true');
            if(isRoot) this._config[field] = val; else this._config[pKey][field] = val;
            this._fire(); 
        };
    };

    if(this._activeTab === 'profile') { bind('#inp-name', 'name'); bind('#inp-img', 'image'); bind('#inp-start', 'start'); bind('#inp-ideal', 'ideal'); }
    if(this._activeTab === 'health') { bind('#inp-imce', 'imc_entity'); bind('#inp-imcx', 'imc_x'); bind('#inp-imcy', 'imc_y'); bind('#inp-imcw', 'imc_w'); bind('#inp-imch', 'imc_h'); bind('#inp-imcc', 'imc_circle'); bind('#inp-imcs', 'imc_size'); bind('#inp-imcf', 'imc_font_size'); }
    if(this._activeTab === 'design') { bind('#inp-ch', 'card_height', true); bind('#inp-round', 'card_round', true); bind('#inp-bw', 'border_width', true); bind('#inp-bc', 'border_color', true); bind('#inp-fsl', 'font_size_label', true); bind('#inp-fsv', 'font_size_value', true); bind('#inp-is', 'icon_size', true); }
    if(this._activeTab === 'sensors') {
        this.querySelectorAll('.s-name').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
        this.querySelectorAll('.s-ent').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
        this.querySelectorAll('.s-x').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
        this.querySelectorAll('.s-y').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].y = e.target.value; this._fire(); });
        this.querySelectorAll('.s-size').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].circle_size = e.target.value; this._fire(); });
        this.querySelectorAll('.s-font').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].font_size = e.target.value; this._fire(); });
        this.querySelectorAll('.s-circ').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].is_circle = (e.target.value === 'true'); this._fire(); this.render(); });
        this.querySelectorAll('.del-btn').forEach(btn => btn.onclick = () => { this._config[pKey].sensors.splice(btn.dataset.idx, 1); this._fire(); this.render(); });
        this.querySelector('#add-s').onclick = () => { if(!this._config[pKey].sensors) this._config[pKey].sensors = []; this._config[pKey].sensors.push({name:"Nouveau", entity:"", x:50, y:50, w:160, h:69, icon:"mdi:heart", is_circle:false, circle_size:80, font_size:0}); this._fire(); this.render(); };
    }
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.4.0" });
