/**
 * HEALTH DASHBOARD CARD – V2.8.5
 * RÉINTÉGRATION DU DESIGN COMPLET SUR BASE DE SAISIE STABLE
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  set hass(hass) { this._hass = hass; this.update(); }

  _num(v, d=0) { const n = parseFloat(v); return isNaN(n)?d:n; }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    const suffix = v === 'person2' ? '_sandra' : '_patrick';

    const setV = (id, ent) => {
      const el = this.shadowRoot.getElementById(id);
      if(el && ent && this._hass.states[ent]) {
        const s = this._hass.states[ent];
        el.textContent = `${s.state}${s.attributes.unit_of_measurement || ''}`;
      }
    };
    
    setV('imc-v', p.imc_entity);
    setV('corp-v', p.corp_entity);
    if(p.sensors) p.sensors.forEach((s, i) => setV(`s-${i}`, s.entity));

    // Barre de progression
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const range = this._num(p.start) - this._num(p.ideal);
        if(range !== 0) {
            this.shadowRoot.getElementById('ptr').style.left = `${Math.max(0, Math.min(100, ((this._num(p.start) - actuel) / range) * 100))}%`;
            this.shadowRoot.getElementById('ptr-l').textContent = actuel + 'kg';
        }
    }
  }

  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    const r = this._config.card_round || 12;
    const accent = v === 'person1' ? '#38bdf8' : '#f43f5e';
    
    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${r}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.4; z-index:1; }
        .box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; border-style: solid; box-sizing: border-box; }
        .rule-wrap { position: absolute; bottom: 55px; left: 5%; width: 90%; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; }
        .ptr { position: absolute; top: -14px; width: 3px; height: 36px; background: white; z-index: 50; }
        .bub { position: absolute; top: -45px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 5px 10px; border-radius: 8px; font-weight: bold; border: 2px solid ${accent}; white-space: nowrap; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="box" style="left:${p.imc_x}%; top:${p.imc_y}%; width:${p.imc_w}px; height:${p.imc_h}px; border-radius:${p.imc_circle?'50%':r+'px'}; border-width:${p.imc_bw}px; border-color:${p.imc_bc};">
            <div style="font-size:10px; opacity:0.8;">${p.imc_name}</div><div id="imc-v" style="font-weight:bold;">--</div>
        </div>
        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.h}px; border-radius:${s.circle?'50%':r+'px'}; border-width:${s.bw}px; border-color:${s.bc};">
            <div style="font-size:10px; opacity:0.8;">${s.name}</div><div id="s-${i}" style="font-weight:bold;">--</div>
          </div>
        `).join('')}
        <div class="rule-wrap">
            <div class="rule-track"><div id="ptr" class="ptr"><div id="ptr-l" class="bub">--</div></div></div>
        </div>
      </div>
    `;
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'poids'; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }

  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .ed { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
        .tab { flex: 1; padding: 10px; border: none; border-radius: 4px; background: #333; color: #ccc; cursor: pointer; font-weight: bold; font-size: 11px; text-align:center; }
        .active { background: #38bdf8 !important; color: black !important; }
        .sec { background: #252525; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #111; color: white; border: 1px solid #444; border-radius: 4px; margin-bottom: 5px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .del-btn { background: #ff5252; color: white; border: none; border-radius: 4px; padding: 8px; cursor: pointer; width: 100%; margin-top: 10px; font-weight:bold; }
      </style>
      <div class="ed">
        <div class="tabs">
            <div class="tab ${this._tab==='poids'?'active':''}" data-t="poids">POIDS</div>
            <div class="tab ${this._tab==='sante'?'active':''}" data-t="sante">SANTÉ</div>
            <div class="tab ${this._tab==='sensors'?'active':''}" data-t="sensors">SENSORS</div>
            <div class="tab ${this._tab==='design'?'active':''}" data-t="design">DESIGN</div>
        </div>

        <div id="form">
            ${this._tab === 'poids' ? `
                <div class="sec">
                    <label>Nom Affiché</label><input type="text" data-f="name" value="${p.name}">
                    <div class="grid">
                        <div><label>Départ</label><input type="number" data-f="start" value="${p.start}"></div>
                        <div><label>Idéal</label><input type="number" data-f="ideal" value="${p.ideal}"></div>
                    </div>
                    <label>Seuil de Confort (kg)</label><input type="number" data-f="comfort" value="${p.comfort}">
                </div>
            ` : ''}

            ${this._tab === 'sante' ? `
                <div class="sec">
                    <label>Entité IMC (ex: sensor.imc_patrick)</label>
                    <input type="text" data-f="imc_entity" value="${p.imc_entity || ''}">
                    <label>Libellé</label><input type="text" data-f="imc_name" value="${p.imc_name}">
                    <div class="grid">
                        <input type="number" data-f="imc_x" placeholder="X" value="${p.imc_x}">
                        <input type="number" data-f="imc_y" placeholder="Y" value="${p.imc_y}">
                    </div>
                    <div class="grid">
                        <input type="number" data-f="imc_w" placeholder="W" value="${p.imc_w}">
                        <input type="number" data-f="imc_h" placeholder="H" value="${p.imc_h}">
                    </div>
                    <div class="grid">
                        <input type="number" data-f="imc_bw" placeholder="Bordure" value="${p.imc_bw}">
                        <input type="text" data-f="imc_bc" placeholder="Couleur" value="${p.imc_bc}">
                    </div>
                    <label><input type="checkbox" data-f="imc_circle" ${p.imc_circle?'checked':''}> Cadre Rond</label>
                </div>
            ` : ''}

            ${this._tab === 'sensors' ? `
                ${(p.sensors || []).map((s, i) => `
                    <div class="sec">
                        <label>Entité Sensor (ex: sensor.vitesse_vent)</label>
                        <input type="text" data-idx="${i}" data-f="entity" value="${s.entity || ''}">
                        <label>Nom</label><input type="text" data-idx="${i}" data-f="name" value="${s.name}">
                        <div class="grid">
                            <input type="number" data-idx="${i}" data-f="x" value="${s.x}">
                            <input type="number" data-idx="${i}" data-f="y" value="${s.y}">
                        </div>
                        <div class="grid">
                            <input type="number" data-idx="${i}" data-f="w" value="${s.w}">
                            <input type="number" data-idx="${i}" data-f="h" value="${s.h}">
                        </div>
                        <div class="grid">
                            <input type="number" data-idx="${i}" data-f="bw" value="${s.bw}">
                            <input type="text" data-idx="${i}" data-f="bc" value="${s.bc}">
                        </div>
                        <label><input type="checkbox" data-idx="${i}" data-f="circle" ${s.circle?'checked':''}> Rond</label>
                        <button class="del-btn" data-del="${i}">SUPPRIMER ❌</button>
                    </div>
                `).join('')}
                <button id="add-s" style="width:100%; padding:12px; background:#38bdf8; color:black; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">+ AJOUTER UN CAPTEUR</button>
            ` : ''}

            ${this._tab === 'design' ? `
                <div class="sec">
                    <label>URL Image de fond</label><input type="text" data-f="image" value="${p.image}">
                    <label>Hauteur Carte (px)</label><input type="number" id="ch" value="${this._config.card_height}">
                    <label>Personne Active</label>
                    <select id="ps" style="width:100%; padding:10px; background:#111; color:white; border:1px solid #444; border-radius:4px;">
                        <option value="person1" ${v==='person1'?'selected':''}>Patrick</option>
                        <option value="person2" ${v==='person2'?'selected':''}>Sandra</option>
                    </select>
                </div>
            ` : ''}
        </div>
      </div>
    `;
    this._attach();
  }

  _attach() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._tab = t.dataset.t; this.render(); });
    
    this.querySelectorAll('input, select').forEach(el => {
        el.onchange = () => {
            let val = el.type === 'checkbox' ? el.checked : el.value;
            if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = val;
            else if(el.id === 'ch') this._config.card_height = val;
            else if(el.id === 'ps') this._config.current_view = val;
            else p[el.dataset.f] = val;
            this._fire();
            if(el.id === 'ps') this.render();
        };
    });

    this.querySelectorAll('[data-del]').forEach(btn => {
        btn.onclick = () => {
            p.sensors.splice(btn.dataset.del, 1);
            this._fire();
            this.render();
        };
    });

    const add = this.querySelector('#add-s');
    if(add) add.onclick = () => {
        if(!p.sensors) p.sensors = [];
        p.sensors.push({name:'Nouveau', entity:'', x:50, y:50, w:100, h:70, bw:1, bc:'white', circle:false});
        this._fire();
        this.render();
    };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
