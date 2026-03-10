/**
 * HEALTH DASHBOARD CARD – V2.3.2
 * COMPLET : BORDURES + HAUTEUR LIBRE + ÉDITEUR TOTAL
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
    const stDiff = this._hass.states['sensor.difference_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const start = this._num(pData.start);
        const ideal = this._num(pData.ideal);
        const range = start - ideal;
        const label = this.shadowRoot.getElementById('pointer-label');
        if(label) label.innerHTML = `${actuel}kg <span style="font-size:0.85em; opacity:0.9;">(${stDiff ? stDiff.state : '0'})</span>`;
        const ptr = this.shadowRoot.getElementById('progression-pointer');
        if(ptr && range !== 0) ptr.style.left = `${Math.max(0, Math.min(100, ((start - actuel) / range) * 100))}%`;
        const markC = this.shadowRoot.getElementById('mark-comfort');
        if(markC && range !== 0) markC.style.left = `${((start - this._num(pData.comfort)) / range) * 100}%`;
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
        .box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; overflow: hidden; }
        ha-icon { --mdc-icon-size: 24px; color: ${accent}; }
        .rule-wrap { position: absolute; bottom: 55px; left: 5%; width: 90%; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; }
        .rule-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 4px; opacity: 0.7; }
        .ptr { position: absolute; top: -14px; width: 3px; height: 36px; background: white; transition: left 1s; z-index: 5; box-shadow: 0 0 10px white; }
        .bub { position: absolute; top: -45px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 5px 12px; border-radius: 8px; font-weight: 900; border: 2px solid ${accent}; white-space: nowrap; }
        .mark { position: absolute; top: 12px; transform: translateX(-50%); font-size: 10px; font-weight: bold; text-align: center; color: rgba(255,255,255,0.6); line-height: 1.2; }
        .mark-c { position: absolute; top: -4px; width: 12px; height: 12px; background: #fbbf24; border: 2px solid #0f172a; border-radius: 50%; transform: translateX(-50%); z-index: 4; }
      </style>

      <div class="main">
        <div class="bg"></div>
        <div class="nav">
            <button class="btn ${view==='person1'?'active':''}" onclick="this.getRootNode().host.switch('person1')">${this._config.person1.name}</button>
            <button class="btn ${view==='person2'?'active':''}" onclick="this.getRootNode().host.switch('person2')">${this._config.person2.name}</button>
        </div>

        <div class="box" style="left:${pData.imc_x}%; top:${pData.imc_y}%; width:${pData.imc_w}px; height:${pData.imc_circle ? pData.imc_w : pData.imc_h}px; border-radius:${pData.imc_circle ? '50%' : round + 'px'}; border: ${pData.imc_b_w || 0}px solid ${pData.imc_b_c || 'transparent'};">
            <ha-icon icon="${pData.imc_icon || 'mdi:scale-bathroom'}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${pData.imc_name}</div><div id="imc-val" style="font-weight:bold;">--</div>
        </div>

        <div class="box" style="left:${pData.corp_x}%; top:${pData.corp_y}%; width:${pData.corp_w}px; height:${pData.corp_circle ? pData.corp_w : pData.corp_h}px; border-radius:${pData.corp_circle ? '50%' : round + 'px'}; border: ${pData.corp_b_w || 0}px solid ${pData.corp_b_c || 'transparent'};">
            <ha-icon icon="${pData.corp_icon || 'mdi:human'}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${pData.corp_name}</div><div id="corp-val" style="font-weight:bold;">--</div>
        </div>

        ${(pData.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.circle ? s.w : (s.h || 70)}px; border-radius:${s.circle ? '50%' : round + 'px'}; border: ${s.b_w || 0}px solid ${s.b_c || 'transparent'};">
            <ha-icon icon="${s.icon}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${s.name}</div><div id="value-${i}" style="font-weight:bold;">--</div>
          </div>
        `).join('')}

        <div class="rule-wrap">
            <div class="rule-track">
                <div class="rule-fill"></div>
                <div id="progression-pointer" class="ptr"><div id="pointer-label" class="bub">--</div></div>
                <div class="mark" style="left: 0%;">DÉPART<br>${pData.start}kg</div>
                <div id="mark-comfort" class="mark" style="left: 50%; color:#fbbf24; width:100px;"><div class="mark-c"></div>CONFORT<br>${pData.comfort}kg</div>
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
  setConfig(config) { this._config = config; this.render(); }

  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <style>
        .ed { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 15px; }
        .tab { padding: 10px; cursor: pointer; background: #333; border: none; color: #888; flex: 1; font-size: 10px; font-weight: bold; }
        .tab.active { background: #38bdf8; color: black; }
        .sec { background: #252525; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 6px; background: #111; color: white; border: 1px solid #444; border-radius: 4px; margin-bottom: 5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .btn-add { width: 100%; padding: 10px; background: #4ade80; border: none; font-weight: bold; cursor: pointer; }
      </style>
      <div class="ed">
        <div class="tabs">
            <button class="tab ${this._tab==='poids'?'active':''}" id="t-poids">POIDS</button>
            <button class="tab ${this._tab==='health'?'active':''}" id="t-health">SANTÉ</button>
            <button class="tab ${this._tab==='sensors'?'active':''}" id="t-sensors">CAPTEURS</button>
            <button class="tab ${this._tab==='design'?'active':''}" id="t-design">CARTE</button>
        </div>

        ${this._tab === 'poids' ? `
            <div class="sec">
                <label>Nom</label><input type="text" id="p-name" value="${p.name}">
                <div class="grid">
                    <div><label>Départ</label><input type="number" id="p-start" value="${p.start}"></div>
                    <div><label>Confort</label><input type="number" id="p-comfort" value="${p.comfort}"></div>
                    <div><label>Idéal</label><input type="number" id="p-ideal" value="${p.ideal}"></div>
                </div>
            </div>
        ` : ''}

        ${this._tab === 'health' ? `
            <div class="sec">
                <label>IMC - Entité & Position %</label>
                <input type="text" id="imce" value="${p.imc_entity}">
                <div class="grid"><input type="number" id="imcx" value="${p.imc_x}"> <input type="number" id="imcy" value="${p.imc_y}"></div>
                <label>Taille & Bordure</label>
                <div class="grid"><input type="number" id="imcw" value="${p.imc_w}"> <input type="number" id="imch" value="${p.imc_h}"></div>
                <div class="grid"><input type="number" id="imcbw" value="${p.imc_b_w}"> <input type="text" id="imcbc" value="${p.imc_b_c}"></div>
                <div style="margin-top:10px;"><input type="checkbox" id="imcc" ${p.imc_circle?'checked':''}> <span style="font-size:10px;">ROND</span></div>
            </div>
            <div class="sec">
                <label>Corpulence - Entité & Position %</label>
                <input type="text" id="corpe" value="${p.corp_entity}">
                <div class="grid"><input type="number" id="corpx" value="${p.corp_x}"> <input type="number" id="corpy" value="${p.corp_y}"></div>
                <label>Taille & Bordure</label>
                <div class="grid"><input type="number" id="corpw" value="${p.corp_w}"> <input type="number" id="corph" value="${p.corp_h}"></div>
                <div class="grid"><input type="number" id="corpbw" value="${p.corp_b_w}"> <input type="text" id="corpbc" value="${p.corp_b_c}"></div>
                <div style="margin-top:10px;"><input type="checkbox" id="corpc" ${p.corp_circle?'checked':''}> <span style="font-size:10px;">ROND</span></div>
            </div>
        ` : ''}

        ${this._tab === 'sensors' ? `
            ${(p.sensors || []).map((s, i) => `
                <div class="sec">
                    <label>Capteur ${i+1}</label>
                    <input type="text" class="s-ent" data-idx="${i}" value="${s.entity}">
                    <div class="grid"><input type="number" class="s-x" data-idx="${i}" value="${s.x}"> <input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div>
                    <div class="grid"><input type="number" class="s-w" data-idx="${i}" value="${s.w}"> <input type="number" class="s-h" data-idx="${i}" value="${s.h || 70}"></div>
                    <div class="grid"><input type="number" class="s-bw" data-idx="${i}" value="${s.b_w || 0}"> <input type="text" class="s-bc" data-idx="${i}" value="${s.b_c || 'rgba(255,255,255,0.2)'}"></div>
                    <div style="margin-top:5px;"><input type="checkbox" class="s-c" data-idx="${i}" ${s.circle?'checked':''}> <span style="font-size:10px;">ROND</span></div>
                </div>
            `).join('')}
            <button class="btn-add" id="add-s">➕ AJOUTER UN CAPTEUR</button>
        ` : ''}

        ${this._tab === 'design' ? `
            <div class="sec">
                <label>Image URL</label><input type="text" id="img" value="${p.image}">
                <label>Hauteur Carte (px)</label><input type="number" id="ch" value="${this._config.card_height}">
                <label>Arrondi Coins (px)</label><input type="number" id="cr" value="${this._config.card_round}">
            </div>
        ` : ''}
      </div>
    `;

    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._tab = t.id.replace('t-',''); this.render(); });
    const fire = () => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));

    // Bindings Poids
    if(this._tab === 'poids') {
        this.querySelector('#p-name').oninput = (e) => { p.name = e.target.value; fire(); };
        this.querySelector('#p-start').oninput = (e) => { p.start = e.target.value; fire(); };
        this.querySelector('#p-comfort').oninput = (e) => { p.comfort = e.target.value; fire(); };
        this.querySelector('#p-ideal').oninput = (e) => { p.ideal = e.target.value; fire(); };
    }
    // Bindings Santé
    if(this._tab === 'health') {
        ['imc','corp'].forEach(pre => {
            this.querySelector(`#${pre}e`).oninput = (e) => { p[`${pre}_entity`] = e.target.value; fire(); };
            this.querySelector(`#${pre}x`).oninput = (e) => { p[`${pre}_x`] = e.target.value; fire(); };
            this.querySelector(`#${pre}y`).oninput = (e) => { p[`${pre}_y`] = e.target.value; fire(); };
            this.querySelector(`#${pre}w`).oninput = (e) => { p[`${pre}_w`] = e.target.value; fire(); };
            this.querySelector(`#${pre}h`).oninput = (e) => { p[`${pre}_h`] = e.target.value; fire(); };
            this.querySelector(`#${pre}bw`).oninput = (e) => { p[`${pre}_b_w`] = e.target.value; fire(); };
            this.querySelector(`#${pre}bc`).oninput = (e) => { p[`${pre}_b_c`] = e.target.value; fire(); };
            this.querySelector(`#${pre}c`).onchange = (e) => { p[`${pre}_circle`] = e.target.checked; fire(); this.render(); };
        });
    }
    // Bindings Sensors
    if(this._tab === 'sensors') {
        this.querySelectorAll('.s-ent').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].entity = e.target.value; fire(); });
        this.querySelectorAll('.s-x').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].x = e.target.value; fire(); });
        this.querySelectorAll('.s-y').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].y = e.target.value; fire(); });
        this.querySelectorAll('.s-w').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].w = e.target.value; fire(); });
        this.querySelectorAll('.s-h').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].h = e.target.value; fire(); });
        this.querySelectorAll('.s-bw').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].b_w = e.target.value; fire(); });
        this.querySelectorAll('.s-bc').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].b_c = e.target.value; fire(); });
        this.querySelectorAll('.s-c').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.idx].circle = e.target.checked; fire(); this.render(); });
        this.querySelector('#add-s').onclick = () => { if(!p.sensors) p.sensors = []; p.sensors.push({entity:"", name:"Nouveau", icon:"mdi:heart", x:50, y:50, w:100, h:70, b_w:1, b_c:"rgba(255,255,255,0.2)", circle:false}); fire(); this.render(); };
    }
    // Bindings Design
    if(this._tab === 'design') {
        this.querySelector('#img').oninput = (e) => { p.image = e.target.value; fire(); };
        this.querySelector('#ch').oninput = (e) => { this._config.card_height = e.target.value; fire(); };
        this.querySelector('#cr').oninput = (e) => { this._config.card_round = e.target.value; fire(); };
    }
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.3.2" });
