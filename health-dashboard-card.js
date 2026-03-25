/**
 * HEALTH DASHBOARD CARD – V3.4.5
 * INTEGRATION DIRECTE WITHINGS & STRUCTURE THEMATIQUE
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    
    // Initialisation automatique avec tes capteurs Withings si vide
    if (!this._config.person1) {
      this._config.person1 = {
        name: "PATRICK",
        weight_entity: "sensor.withings_poids_patrick",
        imc_entity: "sensor.withings_poids_patrick", // A remplacer par ton sensor IMC si existant
        corp_entity: "sensor.withings_fat_mass",
        start: 95, confort: 85, ideal: 78,
        image: "/local/patrick.jpg",
        sensors: [
          { name: "Pas", entity: "sensor.withings_steps_today", icon: "mdi:walk", x: 25, y: 160, w: 110, h: 80 },
          { name: "Distance", entity: "sensor.withings_distance_travelled_today", icon: "mdi:map-marker-distance", x: 50, y: 160, w: 110, h: 80 },
          { name: "Objectif", entity: "sensor.withings_weight_goal", icon: "mdi:bullseye-arrow", x: 75, y: 160, w: 110, h: 80 },
          { name: "Score Sommeil", entity: "sensor.withings_sleep_score", icon: "mdi:sleep", x: 25, y: 350, w: 110, h: 80 },
          { name: "S. Profond", entity: "sensor.withings_rem_sleep", icon: "mdi:bed-clock", x: 50, y: 350, w: 110, h: 80 },
          { name: "S. Léger", entity: "sensor.withings_sleep_score", icon: "mdi:power-sleep", x: 75, y: 350, w: 110, h: 80 },
          { name: "Graisse Mass", entity: "sensor.withings_fat_mass", icon: "mdi:tape-measure", x: 25, y: 540, w: 110, h: 80 },
          { name: "Viscérale", entity: "sensor.withings_visceral_fat_index", icon: "mdi:human-fat", x: 75, y: 540, w: 110, h: 80 }
        ]
      };
    }
    this.render();
  }

  set hass(hass) { this._hass = hass; this.update(); }

  _setView(view) {
    this._config.current_view = view;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    this.render();
  }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view];
    if(!p) return;
    
    const setV = (idV, idU, ent) => {
      const elV = this.shadowRoot.getElementById(idV);
      const elU = this.shadowRoot.getElementById(idU);
      if(elV && elU && ent && this._hass.states[ent]) {
        const s = this._hass.states[ent];
        const val = parseFloat(s.state);
        elV.textContent = isNaN(val) ? s.state : val.toFixed(2);
        elU.textContent = " " + (s.attributes.unit_of_measurement || '');
      }
    };
    
    setV('imc-v', 'imc-u', p.imc_entity);
    setV('corp-v', 'corp-u', p.corp_entity);
    if(p.sensors) p.sensors.forEach((s, i) => setV(`s-${i}-v`, `s-${i}-u`, s.entity));

    const stateW = this._hass.states[p.weight_entity];
    if (stateW && p.start && p.ideal) {
        const actuel = parseFloat(stateW.state);
        const start = parseFloat(p.start);
        const ideal = parseFloat(p.ideal);
        const diff = (actuel - start).toFixed(2);
        const pct = Math.max(0, Math.min(100, ((start - actuel) / (start - ideal)) * 100));
        
        const ptr = this.shadowRoot.getElementById('ptr');
        if(ptr) ptr.style.left = pct + '%';
        const wv = this.shadowRoot.getElementById('weight-val');
        if(wv) wv.textContent = actuel.toFixed(2) + ' kg';
        const dEl = this.shadowRoot.getElementById('diff-val');
        if(dEl) {
          dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
          dEl.style.background = diff < 0 ? '#4caf50' : (diff > 0 ? '#ff5252' : 'rgba(255,255,255,0.2)');
        }
    }
  }

  render() {
    if (!this._config) return;
    const p = this._config[this._config.current_view] || {};
    const cv = this._config.current_view;
    const getBoxStyle = (s) => `left:${s.x}%; top:${s.y}%; width:${s.w||110}px; height:${s.h||80}px; border-radius:15px; border:1px solid ${s.bc||'rgba(255,255,255,0.1)'}; transform: translate(-50%, -50%);`;

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 750}px; background: #0f172a; border-radius: 24px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.15; z-index:1; }
        .sw-btns { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 100; }
        .sw-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px 20px; border-radius: 14px; font-size: 11px; font-weight: 800; cursor: pointer; backdrop-filter: blur(15px); }
        .sw-btn.active { background: #38bdf8; color: #000; }
        .section-header { position: absolute; left: 25px; display: flex; align-items: center; gap: 10px; z-index: 5; width: 85%; }
        .section-header span { font-size: 11px; font-weight: 900; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; white-space: nowrap; }
        .section-line { height: 1px; flex-grow: 1; background: linear-gradient(90deg, #38bdf8, transparent); }
        .box { position: absolute; background: rgba(30, 41, 59, 0.7); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(10px); text-align: center; box-sizing: border-box; padding: 10px; transition: 0.3s; }
        .box:hover { border-color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
        .ico { --mdc-icon-size: 28px; color: #38bdf8; margin-bottom: 5px; }
        .lbl { font-size: 0.7em; opacity: 0.5; font-weight: bold; margin-bottom: 4px; }
        .val { font-size: 1.4em; font-weight: 800; }
        .uni { font-size: 0.8em; opacity: 0.4; margin-left: 2px; }
        .weight-area { position: absolute; bottom: 30px; left: 5%; width: 90%; z-index: 20; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 20px; box-sizing: border-box; }
        .weight-track { position: relative; width: 100%; height: 12px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 50px; }
        .ptr { position: absolute; top: -10px; width: 6px; height: 32px; background: #fff; border-radius: 3px; transition: left 1s; box-shadow: 0 0 10px #fff; }
        .bub { position: absolute; top: -85px; left: 50%; transform: translateX(-50%); background: #38bdf8; color: #000; padding: 10px 18px; border-radius: 15px; font-weight: 900; text-align: center; min-width: 100px; }
        #diff-val { display: block; font-size: 11px; border-radius: 5px; padding: 2px 8px; color: #fff; margin-top: 4px; }
        .mkr { position: absolute; top: 20px; transform: translateX(-50%); font-size: 9px; opacity: 0.4; font-weight: bold; text-align: center; }
      </style>

      <div class="main">
        <div class="bg"></div>
        <div class="sw-btns">
            <button class="sw-btn ${cv==='person1'?'active':''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv==='person2'?'active':''}" id="btn-p2">SANDRA</button>
        </div>

        <div class="section-header" style="top: 90px;"><span>⚡ ÉTAT DE FORME</span><div class="section-line"></div></div>
        <div class="section-header" style="top: 280px;"><span>🌙 SOMMEIL</span><div class="section-line"></div></div>
        <div class="section-header" style="top: 470px;"><span>🏥 SANTÉ</span><div class="section-line"></div></div>

        <div class="box" style="left:30%; top:540px; width:120px; height:90px; border-radius:18px; transform: translate(-50%, -50%);">
          <ha-icon icon="mdi:human-measure" class="ico"></ha-icon>
          <div class="lbl">IMC</div>
          <div class="val-wrap"><span id="imc-v" class="val">--</span><span id="imc-u" class="uni"></span></div>
        </div>
        <div class="box" style="left:70%; top:540px; width:120px; height:90px; border-radius:18px; transform: translate(-50%, -50%);">
          <ha-icon icon="mdi:body-proportions" class="ico"></ha-icon>
          <div class="lbl">CORP.</div>
          <div class="val-wrap"><span id="corp-v" class="val">--</span><span id="corp-u" class="uni"></span></div>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="${getBoxStyle(s)}">
            ${s.icon ? `<ha-icon icon="${s.icon}" class="ico"></ha-icon>` : ''}
            <div class="lbl">${s.name}</div>
            <div class="val-wrap"><span id="s-${i}-v" class="val">--</span><span id="s-${i}-u" class="uni"></span></div>
          </div>`).join('')}

        <div class="weight-area">
            <div class="weight-track">
                <div class="mkr" style="left:0">START<br>${p.start||'-'}</div>
                <div class="mkr" style="left:50%">CONFORT<br>${p.confort||'-'}</div>
                <div class="mkr" style="left:100%">GOAL<br>${p.ideal||'-'}</div>
                <div id="ptr" class="ptr"><div class="bub"><span id="weight-val">--</span><span id="diff-val">--</span></div></div>
            </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('btn-p1').onclick = () => this._setView('person1');
    this.shadowRoot.getElementById('btn-p2').onclick = () => this._setView('person2');
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'poids'; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v] || {};
    this.innerHTML = `
      <style>
        .ed { padding: 15px; background: #111; color: #eee; border-radius: 8px; font-family: sans-serif; }
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; background: #222; border-radius: 5px; border:none; color:#aaa; cursor:pointer; font-size: 10px; font-weight: bold; }
        .active { background: #38bdf8 !important; color: #000 !important; }
        .sec { background: #1a1a1a; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #333; }
        label { color: #38bdf8; font-size: 10px; display: block; margin-top: 10px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #000; color: #fff; border: 1px solid #333; border-radius: 5px; margin-top: 5px; }
      </style>
      <div class="ed">
        <div class="tabs">
            <button class="tab ${this._tab==='poids'?'active':''}" data-t="poids">POIDS</button>
            <button class="tab ${this._tab==='sante'?'active':''}" data-t="sante">SANTÉ</button>
            <button class="tab ${this._tab==='sensors'?'active':''}" data-t="sensors">SENSORS</button>
            <button class="tab ${this._tab==='design'?'active':''}" data-t="design">DESIGN</button>
        </div>
        ${this._tab === 'poids' ? `
            <div class="sec">
                <label>Capteur Poids Principal</label><input type="text" data-f="weight_entity" value="${p.weight_entity||''}">
                <label>Poids (Départ / Confort / Idéal)</label>
                <div style="display:flex; gap:5px;"><input type="number" step="0.1" data-f="start" value="${p.start}"><input type="number" step="0.1" data-f="confort" value="${p.confort}"><input type="number" step="0.1" data-f="ideal" value="${p.ideal}"></div>
            </div>` : ''}
        ${this._tab === 'sante' ? `
            <div class="sec">
                <label>Capteur IMC</label><input type="text" data-f="imc_entity" value="${p.imc_entity||''}">
                <label>Capteur Corpulence (Graisse)</label><input type="text" data-f="corp_entity" value="${p.corp_entity||''}">
            </div>` : ''}
        ${this._tab === 'sensors' ? (p.sensors || []).map((s, i) => `
            <div class="sec">
                <label>Capteur ${i+1} : ${s.name}</label>
                <input type="text" data-idx="${i}" data-f="name" value="${s.name}" placeholder="Nom">
                <input type="text" data-idx="${i}" data-f="entity" value="${s.entity}" placeholder="sensor.xxx">
                <input type="text" data-idx="${i}" data-f="icon" value="${s.icon||''}" placeholder="mdi:icon">
                <div style="display:flex; gap:5px;"><label>X %</label><input type="number" data-idx="${i}" data-f="x" value="${s.x}"><label>Y %</label><input type="number" data-idx="${i}" data-f="y" value="${s.y}"></div>
                <button class="del-s" data-idx="${i}" style="width:100%; background:#ff5252; color:white; border:none; padding:5px; margin-top:10px; border-radius:4px;">Supprimer</button>
            </div>`).join('') + '<button class="tab active" style="width:100%" id="add-s">+ AJOUTER CAPTEUR</button>' : ''}
        ${this._tab === 'design' ? `<div class="sec"><label>Image Fond (URL)</label><input type="text" data-f="image" value="${p.image||''}">
            <label>Hauteur Totale</label><input type="number" id="ch" value="${this._config.card_height||750}"></div>` : ''}
      </div>
    `;
    this._attach();
  }
  _attach() {
    this.querySelectorAll('.tab').forEach(btn => btn.onclick = () => { this._tab = btn.dataset.t; this.render(); });
    this.querySelectorAll('input').forEach(el => el.onchange = () => {
        const p = this._config[this._config.current_view];
        if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = el.value;
        else if(el.id === 'ch') this._config.card_height = el.value;
        else p[el.dataset.f] = el.value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    });
    const add = this.querySelector('#add-s'); if(add) add.onclick = () => { 
        const p = this._config[this._config.current_view]; if(!p.sensors) p.sensors = []; 
        p.sensors.push({name:'Nouveau', x:50, y:150, w:110, h:80}); 
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); 
    };
    this.querySelectorAll('.del-s').forEach(btn => btn.onclick = () => { 
        this._config[this._config.current_view].sensors.splice(btn.dataset.idx, 1); 
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); 
    });
  }
}

// Enregistrement
if (!customElements.get('health-dashboard-card')) {
    customElements.define('health-dashboard-card', HealthDashboardCard);
}
if (!customElements.get('health-dashboard-card-editor')) {
    customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
}

// Déclaration pour le menu
window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard Pro",
  description: "Carte Withings complète avec sections Forme, Sommeil et Poids.",
  preview: true
});
