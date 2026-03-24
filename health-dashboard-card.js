/**
 * HEALTH DASHBOARD CARD – V2.6.1
 * FIX : AFFICHAGE DU SÉLECTEUR D'ENTITÉS (ENTITY PICKER)
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }
  
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) { this._hass = hass; this.update(); }

  _num(v, d=0) { const n = parseFloat(v); return isNaN(n)?d:n; }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view];
    const suffix = this._config.current_view === 'person2' ? '_sandra' : '_patrick';

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

    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const range = this._num(p.start) - this._num(p.ideal);
        if(range !== 0) {
            const ptr = this.shadowRoot.getElementById('ptr');
            if(ptr) ptr.style.left = `${Math.max(0, Math.min(100, ((this._num(p.start) - actuel) / range) * 100))}%`;
            const mc = this.shadowRoot.getElementById('m-c');
            if(mc) mc.style.left = `${((this._num(p.start) - this._num(p.comfort)) / range) * 100}%`;
            const ptrl = this.shadowRoot.getElementById('ptr-l');
            if(ptrl) ptrl.textContent = actuel + 'kg';
        }
    }
  }

  render() {
    const v = this._config.current_view;
    const p = this._config[v];
    const r = this._config.card_round || 12;
    const accent = v === 'person1' ? '#38bdf8' : '#f43f5e';
    
    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${r}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.4; z-index:1; }
        .nav { position: absolute; left: 20px; top: 20px; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; }
        .btn.active { background: ${accent} !important; color: black; font-weight: bold; }
        .box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; border-style: solid; box-sizing: border-box; }
        .rule-wrap { position: absolute; bottom: 55px; left: 5%; width: 90%; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; }
        .rule-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 4px; opacity: 0.7; }
        .ptr { position: absolute; top: -14px; width: 3px; height: 36px; background: white; transition: left 1s; z-index: 50; }
        .bub { position: absolute; top: -45px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 5px 10px; border-radius: 8px; font-weight: bold; border: 2px solid ${accent}; }
        .mark { position: absolute; top: 12px; transform: translateX(-50%); font-size: 10px; color: rgba(255,255,255,0.6); text-align: center; }
        .mark-c { width: 12px; height: 12px; background: #fbbf24; border-radius: 50%; margin: -18px auto 5px auto; border: 2px solid #0f172a; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="nav">
            <button class="btn ${v==='person1'?'active':''}" onclick="this.getRootNode().host.switch('person1')">${this._config.person1.name}</button>
            <button class="btn ${v==='person2'?'active':''}" onclick="this.getRootNode().host.switch('person2')">${this._config.person2.name}</button>
        </div>
        
        <div class="box" style="left:${p.imc_x}%; top:${p.imc_y}%; width:${p.imc_w}px; height:${p.imc_h}px; border-radius:${p.imc_circle?'50%':r+'px'}; border-width:${p.imc_bw}px; border-color:${p.imc_bc};">
            <div style="font-size:10px; opacity:0.8;">${p.imc_name}</div><div id="imc-v" style="font-weight:bold;">--</div>
        </div>

        <div class="box" style="left:${p.corp_x}%; top:${p.corp_y}%; width:${p.corp_w}px; height:${p.corp_h}px; border-radius:${p.corp_circle?'50%':r+'px'}; border-width:${p.corp_bw}px; border-color:${p.corp_bc};">
            <div style="font-size:10px; opacity:0.8;">${p.corp_name}</div><div id="corp-v" style="font-weight:bold;">--</div>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.h}px; border-radius:${s.circle?'50%':r+'px'}; border-width:${s.bw}px; border-color:${s.bc};">
            <div style="font-size:10px; opacity:0.8;">${s.name}</div><div id="s-${i}" style="font-weight:bold;">--</div>
          </div>
        `).join('')}

        <div class="rule-wrap">
            <div class="rule-track"><div class="rule-fill"></div>
                <div id="ptr" class="ptr"><div id="ptr-l" class="bub">--</div></div>
                <div id="m-c" class="mark" style="color:#fbbf24;"><div class="mark-c"></div>CONFORT<br>${p.comfort}kg</div>
                <div class="mark" style="left: 0%;">DÉPART<br>${p.start}kg</div>
                <div class="mark" style="left: 100%;">IDÉAL<br>${p.ideal}kg</div>
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
  
  set hass(hass) { this._hass = hass; }

  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }

  render() {
    if(!this._hass) return;
    const v = this._config.current_view;
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .ed { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
        .tab { flex: 1; padding: 10px; border: none; border-radius: 4px; background: #333; color: #ccc; cursor: pointer; font-weight: bold; font-size: 11px; }
        .active { background: #38bdf8 !important; color: black !important; }
        .sec { background: #252525; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #111; color: white; border: 1px solid #444; border-radius: 4px; margin-bottom: 5px; box-sizing: border-box; }
        ha-entity-picker { width: 100%; --paper-input-container-input-color: white; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      </style>
      <div class="ed">
        <div class="tabs">
            <button class="tab ${this._tab==='poids'?'active':''}" id="t-poids">POIDS</button>
            <button class="tab ${this._tab==='sante'?'active':''}" id="t-sante">SANTÉ</button>
            <button class="tab ${this._tab==='sensors'?'active':''}" id="t-sensors">SENSORS</button>
            <button class="tab ${this._tab==='design'?'active':''}" id="t-design">DESIGN</button>
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
                    <label>IMC - Choisir l'Entité</label>
                    <ha-entity-picker .hass="${this._hass}" .value="${p.imc_entity}" data-f="imc_entity"></ha-entity-picker>
                    <label>Libellé</label><input type="text" data-f="imc_name" value="${p.imc_name}">
                    <div class="grid">
                        <div><label>X %</label><input type="number" data-f="imc_x" value="${p.imc_x}"></div>
                        <div><label>Y %</label><input type="number" data-f="imc_y" value="${p.imc_y}"></div>
                    </div>
                    <div class="grid">
                        <div><label>Largeur</label><input type="number" data-f="imc_w" value="${p.imc_w}"></div>
                        <div><label>Hauteur</label><input type="number" data-f="imc_h" value="${p.imc_h}"></div>
                    </div>
                    <div class="grid">
                        <div><label>Bordure (px)</label><input type="number" data-f="imc_bw" value="${p.imc_bw}"></div>
                        <div><label>Couleur Bord</label><input type="text" data-f="imc_bc" value="${p.imc_bc}"></div>
                    </div>
                    <label><input type="checkbox" data-f="imc_circle" ${p.imc_circle?'checked':''}> Cadre Rond</label>
                </div>
                <div class="sec">
                    <label>CORPULENCE - Choisir l'Entité</label>
                    <ha-entity-picker .hass="${this._hass}" .value="${p.corp_entity}" data-f="corp_entity"></ha-entity-picker>
                    <label>Libellé</label><input type="text" data-f="corp_name" value="${p.corp_name}">
                    <div class="grid">
                        <input type="number" data-f="corp_x" value="${p.corp_x}">
                        <input type="number" data-f="corp_y" value="${p.corp_y}">
                    </div>
                    <div class="grid">
                        <input type="number" data-f="corp_w" value="${p.corp_w}">
                        <input type="number" data-f="corp_h" value="${p.corp_h}">
                    </div>
                    <label><input type="checkbox" data-f="corp_circle" ${p.corp_circle?'checked':''}> Cadre Rond</label>
                </div>
            ` : ''}

            ${this._tab === 'sensors' ? `
                ${(p.sensors || []).map((s, i) => `
                    <div class="sec">
                        <label>Sensor ${i+1} - Choisir l'Entité</label>
                        <ha-entity-picker .hass="${this._hass}" .value="${s.entity}" data-idx="${i}" data-f="entity"></ha-entity-picker>
                        <label>Nom</label><input type="text" data-idx="${i}" data-f="name" value="${s.name}">
                        <div class="grid">
                            <div><label>X %</label><input type="number" data-idx="${i}" data-f="x" value="${s.x}"></div>
                            <div><label>Y %</label><input type="number" data-idx="${i}" data-f="y" value="${s.y}"></div>
                        </div>
                        <div class="grid">
                            <div><label>W</label><input type="number" data-idx="${i}" data-f="w" value="${s.w}"></div>
                            <div><label>H</label><input type="number" data-idx="${i}" data-f="h" value="${s.h}"></div>
                        </div>
                        <div class="grid">
                            <input type="number" data-idx="${i}" data-f="bw" value="${s.bw}">
                            <input type="text" data-idx="${i}" data-f="bc" value="${s.bc}">
                        </div>
                        <label><input type="checkbox" data-idx="${i}" data-f="circle" ${s.circle?'checked':''}> Rond</label>
                        <button style="color:#ff5252; background:none; border:1px solid #ff5252; padding:5px; margin-top:10px; cursor:pointer; width:100%; border-radius:4px;" onclick="this.getRootNode().host.delS(${i})">Supprimer ce capteur ❌</button>
                    </div>
                `).join('')}
                <button id="add-s" style="width:100%; padding:12px; background:#38bdf8; color:black; font-weight:bold; border:none; border-radius:4px; cursor:pointer; margin-top:10px;">+ AJOUTER UN CAPTEUR</button>
            ` : ''}

            ${this._tab === 'design' ? `
                <div class="sec">
                    <label>URL Image de fond</label><input type="text" data-f="image" value="${p.image}">
                    <label>Hauteur Carte (px)</label><input type="number" id="ch" value="${this._config.card_height}">
                    <label>Coins Arrondis (px)</label><input type="number" id="cr" value="${this._config.card_round}">
                    <label>Édition Personne</label>
                    <select id="ps" style="width:100%; padding:10px; background:#111; color:white; border:1px solid #444; border-radius:4px;">
                        <option value="person1" ${v==='person1'?'selected':''}>${this._config.person1.name}</option>
                        <option value="person2" ${v==='person2'?'selected':''}>${this._config.person2.name}</option>
                    </select>
                </div>
            ` : ''}
        </div>
      </div>
    `;
    this._attach();
  }

  _attach() {
    const p = this._config[this._config.current_view];
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._tab = t.id.replace('t-',''); this.render(); });
    
    this.querySelectorAll('input').forEach(el => {
        el.onchange = () => {
            let val = el.type === 'checkbox' ? el.checked : el.value;
            if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = val;
            else if(el.id === 'ch') this._config.card_height = val;
            else if(el.id === 'cr') this._config.card_round = val;
            else p[el.dataset.f] = val;
            this._fire();
        };
    });

    this.querySelectorAll('ha-entity-picker').forEach(pk => {
        pk.addEventListener('value-changed', (e) => {
            if(pk.dataset.idx !== undefined) p.sensors[pk.dataset.idx].entity = e.detail.value;
            else p[pk.dataset.f] = e.detail.value;
            this._fire();
        });
    });

    const sel = this.querySelector('#ps'); if(sel) sel.onchange = (e) => { this._config.current_view = e.target.value; this._fire(); this.render(); };
    const add = this.querySelector('#add-s'); if(add) add.onclick = () => { if(!p.sensors) p.sensors = []; p.sensors.push({name:'Nouveau', entity:'', x:50, y:50, w:100, h:70, bw:1, bc:'white', circle:false}); this._fire(); this.render(); };
  }
  delS(i) { this._config[this._config.current_view].sensors.splice(i,1); this._fire(); this.render(); }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.6.1" });
