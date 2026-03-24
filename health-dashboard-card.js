/**
 * HEALTH DASHBOARD CARD – V2.4.3
 * FIX : RÉACTIVATION DES SÉLECTEURS D'ENTITÉS ET DES MODIFICATIONS DE TAILLE
 * STABILITÉ : MISE À JOUR AU CHANGEMENT DE CHAMP (FOCUS OUT)
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  _num(val, d = 0) { const n = parseFloat(val); return isNaN(n) ? d : n; }

  updateSensors() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    const setV = (id, ent) => {
        const el = this.shadowRoot.getElementById(id);
        if (el && ent && this._hass.states[ent]) {
            const s = this._hass.states[ent];
            el.textContent = `${s.state}${s.attributes.unit_of_measurement || ''}`;
        }
    };
    
    setV('imc-val', pData.imc_entity);
    setV('corp-val', pData.corp_entity);
    
    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const vE = this.shadowRoot.getElementById(`value-${i}`);
            if (vE && s.entity && this._hass.states[s.entity]) {
                const st = this._hass.states[s.entity];
                vE.textContent = `${st.state}${st.attributes.unit_of_measurement || ''}`;
            }
        });
    }
    
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const start = this._num(pData.start);
        const ideal = this._num(pData.ideal);
        const comfort = this._num(pData.comfort);
        const range = start - ideal;
        
        const ptr = this.shadowRoot.getElementById('progression-pointer');
        if(ptr && range !== 0) ptr.style.left = `${Math.max(0, Math.min(100, ((start - actuel) / range) * 100))}%`;
        
        const markC = this.shadowRoot.getElementById('mark-comfort');
        if(markC && range !== 0) markC.style.left = `${((start - comfort) / range) * 100}%`;

        const label = this.shadowRoot.getElementById('pointer-label');
        if(label) {
            const stDiff = this._hass.states['sensor.difference_poids' + suffix];
            label.innerHTML = `${actuel}kg <span style="font-size:0.85em; opacity:0.8;">(${stDiff ? stDiff.state : '0'})</span>`;
        }
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';
    const round = this._config.card_round || 12;

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${round}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${pData.image}') center/cover; opacity: 0.4; z-index:1; }
        .nav { position: absolute; left: 20px; top: 20px; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; }
        .btn.active { background: ${accent} !important; color: black; font-weight: bold; border-color: ${accent}; }
        .box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; border-radius: ${round}px; }
        ha-icon { --mdc-icon-size: 24px; color: ${accent}; }
        .rule-wrap { position: absolute; bottom: 55px; left: 5%; width: 90%; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; }
        .rule-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 4px; opacity: 0.7; }
        .ptr { position: absolute; top: -14px; width: 3px; height: 36px; background: white; transition: left 1s; z-index: 50; box-shadow: 0 0 10px white; }
        .bub { position: absolute; top: -45px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 5px 12px; border-radius: 8px; font-weight: 900; border: 2px solid ${accent}; white-space: nowrap; }
        .mark { position: absolute; top: 12px; transform: translateX(-50%); font-size: 10px; font-weight: bold; text-align: center; color: rgba(255,255,255,0.6); line-height: 1.2; }
        #mark-comfort { position: absolute; top: 0; transform: translateX(-50%); z-index: 100; }
        .mark-c { width: 14px; height: 14px; background: #fbbf24; border: 2px solid #0f172a; border-radius: 50%; margin: -3px auto 4px auto; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="nav">
            <button class="btn ${view==='person1'?'active':''}" onclick="this.getRootNode().host.switch('person1')">${this._config.person1.name}</button>
            <button class="btn ${view==='person2'?'active':''}" onclick="this.getRootNode().host.switch('person2')">${this._config.person2.name}</button>
        </div>
        
        <div class="box" style="left:${pData.imc_x}%; top:${pData.imc_y}%; width:${pData.imc_w}px; height:${pData.imc_circle ? pData.imc_w : (pData.imc_h || 70)}px; border-radius:${pData.imc_circle ? '50%' : round + 'px'}; border: ${pData.imc_b_w || 0}px solid ${pData.imc_b_c || 'transparent'};">
            <ha-icon icon="${pData.imc_icon || 'mdi:scale-bathroom'}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${pData.imc_name || 'IMC'}</div><div id="imc-val" style="font-weight:bold;">--</div>
        </div>

        <div class="box" style="left:${pData.corp_x}%; top:${pData.corp_y}%; width:${pData.corp_w}px; height:${pData.corp_circle ? pData.corp_w : (pData.corp_h || 70)}px; border-radius:${pData.corp_circle ? '50%' : round + 'px'}; border: ${pData.corp_b_w || 0}px solid ${pData.corp_b_c || 'transparent'};">
            <ha-icon icon="${pData.corp_icon || 'mdi:human'}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${pData.corp_name || 'Corpulence'}</div><div id="corp-val" style="font-weight:bold;">--</div>
        </div>

        ${(pData.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.circle ? s.w : (s.h || 70)}px; border-radius:${s.circle ? '50%' : round + 'px'}; border: ${s.b_w || 0}px solid ${s.b_c || 'transparent'};">
            <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${s.name || 'Capteur'}</div><div id="value-${i}" style="font-weight:bold;">--</div>
          </div>
        `).join('')}

        <div class="rule-wrap">
            <div class="rule-track">
                <div class="rule-fill"></div>
                <div id="progression-pointer" class="ptr"><div id="pointer-label" class="bub">--</div></div>
                <div id="mark-comfort" class="mark" style="color:#fbbf24;"><div class="mark-c"></div>CONFORT<br>${pData.comfort}kg</div>
                <div class="mark" style="left: 0%;">DÉPART<br>${pData.start}kg</div>
                <div class="mark" style="left: 100%;">IDÉAL<br>${pData.ideal}kg</div>
            </div>
        </div>
      </div>
    `;
  }
  switch(v) { this._config.current_view = v; this._fire(); this.render(); }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'poids'; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }

  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];
    this.innerHTML = `
      <style>
        .ed { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
        .tab { flex: 1; padding: 10px; border: none; border-radius: 4px; background: #333; color: #ccc; cursor: pointer; font-weight: bold; font-size: 11px; }
        .active { background: #38bdf8 !important; color: black !important; }
        .sec { background: #252525; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input, ha-entity-picker { width: 100%; margin-bottom: 5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      </style>
      <div class="ed">
        <div class="tabs">
            <button class="tab ${this._tab==='poids'?'active':''}" id="t-poids">POIDS</button>
            <button class="tab ${this._tab==='health'?'active':''}" id="t-health">SANTÉ</button>
            <button class="tab ${this._tab==='sensors'?'active':''}" id="t-sensors">CAPTEURS</button>
        </div>

        <div id="form">
            ${this._tab === 'poids' ? `
                <div class="sec">
                    <label>Départ (kg)</label><input type="number" data-f="start" value="${p.start}">
                    <label>Idéal (kg)</label><input type="number" data-f="ideal" value="${p.ideal}">
                    <label>Confort (kg)</label><input type="number" data-f="comfort" value="${p.comfort}">
                </div>
            ` : ''}

            ${this._tab === 'health' ? `
                <div class="sec">
                    <label>Entité IMC</label>
                    <ha-entity-picker .hass="${this._hass}" .value="${p.imc_entity}" data-f="imc_entity"></ha-entity-picker>
                    <div class="grid">
                        <div><label>X %</label><input type="number" data-f="imc_x" value="${p.imc_x}"></div>
                        <div><label>Y %</label><input type="number" data-f="imc_y" value="${p.imc_y}"></div>
                    </div>
                    <div class="grid">
                        <div><label>Larg (W)</label><input type="number" data-f="imc_w" value="${p.imc_w}"></div>
                        <div><label>Haut (H)</label><input type="number" data-f="imc_h" value="${p.imc_h || 70}"></div>
                    </div>
                </div>
                <div class="sec">
                    <label>Entité CORPULENCE</label>
                    <ha-entity-picker .hass="${this._hass}" .value="${p.corp_entity}" data-f="corp_entity"></ha-entity-picker>
                    <div class="grid">
                        <div><label>X %</label><input type="number" data-f="corp_x" value="${p.corp_x}"></div>
                        <div><label>Y %</label><input type="number" data-f="corp_y" value="${p.corp_y}"></div>
                    </div>
                    <div class="grid">
                        <div><label>Larg (W)</label><input type="number" data-f="corp_w" value="${p.corp_w}"></div>
                        <div><label>Haut (H)</label><input type="number" data-f="corp_h" value="${p.corp_h || 70}"></div>
                    </div>
                </div>
            ` : ''}

            ${this._tab === 'sensors' ? `
                ${(p.sensors || []).map((s, i) => `
                    <div class="sec">
                        <label>Entité Capteur ${i+1}</label>
                        <ha-entity-picker .hass="${this._hass}" .value="${s.entity}" data-idx="${i}" data-f="entity"></ha-entity-picker>
                        <div class="grid">
                            <input type="number" class="s-edit" data-idx="${i}" data-f="x" value="${s.x}">
                            <input type="number" class="s-edit" data-idx="${i}" data-f="y" value="${s.y}">
                        </div>
                        <div class="grid">
                            <input type="number" class="s-edit" data-idx="${i}" data-f="w" value="${s.w}">
                            <input type="number" class="s-edit" data-idx="${i}" data-f="h" value="${s.h || 70}">
                        </div>
                    </div>
                `).join('')}
                <button id="add-s" style="width:100%; padding:10px; background:#444; border:none; color:white; cursor:pointer;">+ Ajouter</button>
            ` : ''}
        </div>
      </div>
    `;

    this._setup(pKey);
  }

  _setup(pKey) {
    const p = this._config[pKey];
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._tab = t.id.replace('t-',''); this.render(); });

    // Inputs standards (nombre, texte)
    this.querySelectorAll('input').forEach(el => {
        el.onchange = (e) => {
            if(el.classList.contains('s-edit')) p.sensors[el.dataset.idx][el.dataset.f] = e.target.value;
            else p[el.dataset.f] = e.target.value;
            this._fire();
        };
    });

    // Sélecteurs d'entités (Home Assistant Native)
    this.querySelectorAll('ha-entity-picker').forEach(picker => {
        picker.addEventListener('value-changed', (e) => {
            const val = e.detail.value;
            if(picker.dataset.idx !== undefined) p.sensors[picker.dataset.idx].entity = val;
            else p[picker.dataset.f] = val;
            this._fire();
        });
    });

    const addBtn = this.querySelector('#add-s');
    if(addBtn) addBtn.onclick = () => {
        if(!p.sensors) p.sensors = [];
        p.sensors.push({name:"Nouveau", entity:"", x:50, y:50, w:100, h:70});
        this._fire();
        this.render();
    };
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.4.3" });
