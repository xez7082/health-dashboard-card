/**
 * HEALTH DASHBOARD CARD – V2.7.0
 * STRUCTURE OFFICIELLE POUR FORCER L'ÉDITEUR VISUEL ET LE SÉLECTEUR D'ENTITÉS
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }
  static getStubConfig() { return { person1: { name: "Patrick", sensors: [] }, person2: { name: "Sandra", sensors: [] } }; }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.update();
  }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    
    const setV = (id, ent) => {
      const el = this.shadowRoot.getElementById(id);
      if(el && ent && this._hass.states[ent]) {
        el.textContent = this._hass.states[ent].state + (this._hass.states[ent].attributes.unit_of_measurement || '');
      }
    };
    setV('imc-v', p.imc_entity);
    setV('corp-v', p.corp_entity);
    if(p.sensors) p.sensors.forEach((s, i) => setV(`s-${i}`, s.entity));
  }

  render() {
    if (!this._config) return;
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    const r = this._config.card_round || 12;
    
    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${r}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.4; z-index:1; }
        .box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; border-style: solid; box-sizing: border-box; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="box" style="left:${p.imc_x}%; top:${p.imc_y}%; width:${p.imc_w}px; height:${p.imc_h}px; border-radius:${p.imc_circle?'50%':r+'px'}; border-width:${p.imc_bw}px; border-color:${p.imc_bc};">
            <div style="font-size:10px; opacity:0.8;">${p.imc_name || 'IMC'}</div><div id="imc-v" style="font-weight:bold;">--</div>
        </div>
        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.h}px; border-radius:${s.circle?'50%':r+'px'}; border-width:${s.bw}px; border-color:${s.bc};">
            <div style="font-size:10px; opacity:0.8;">${s.name}</div><div id="s-${i}" style="font-weight:bold;">--</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() {
    super();
    this._tab = 'poids';
  }

  set hass(hass) { this._hass = hass; }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  render() {
    if (!this._hass || !this._config) return;
    const v = this._config.current_view || 'person1';
    const p = this._config[v];

    this.innerHTML = `
      <style>
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; cursor: pointer; background: #333; color: #ccc; border: none; border-radius: 4px; font-weight: bold; }
        .tab.active { background: #38bdf8; color: black; }
        .sec { border: 1px solid #444; padding: 15px; border-radius: 8px; margin-bottom: 15px; background: #222; }
        .row { margin-bottom: 10px; }
        label { display: block; font-size: 12px; color: #38bdf8; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 10px; background: #111; color: white; border: 1px solid #555; border-radius: 4px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 5px; }
        .del { background: #ff5252; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 10px; }
        .add { background: #38bdf8; color: black; border: none; padding: 12px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; }
      </style>
      <div class="ed">
        <div class="tabs">
          <div class="tab ${this._tab==='poids'?'active':''}" data-tab="poids">POIDS</div>
          <div class="tab ${this._tab==='sensors'?'active':''}" data-tab="sensors">SENSORS</div>
          <div class="tab ${this._tab==='design'?'active':''}" data-tab="design">DESIGN</div>
        </div>

        ${this._tab === 'sensors' ? `
          <div class="sec">
            <button class="add" id="add-sensor">+ AJOUTER UN CAPTEUR</button>
            ${(p.sensors || []).map((s, i) => `
              <div class="sec" style="margin-top:15px; border-color: #555;">
                <label>ENTITÉ DU CAPTEUR</label>
                <ha-entity-picker .hass="${this._hass}" .value="${s.entity}" .index="${i}" data-f="entity"></ha-entity-picker>
                
                <label>NOM AFFICHÉ</label>
                <input type="text" value="${s.name}" data-idx="${i}" data-f="name">
                
                <div class="grid">
                  <div><label>POSITION X (%)</label><input type="number" value="${s.x}" data-idx="${i}" data-f="x"></div>
                  <div><label>POSITION Y (%)</label><input type="number" value="${s.y}" data-idx="${i}" data-f="y"></div>
                </div>
                <div class="grid">
                  <div><label>LARGEUR (W)</label><input type="number" value="${s.w}" data-idx="${i}" data-f="w"></div>
                  <div><label>HAUTEUR (H)</label><input type="number" value="${s.h}" data-idx="${i}" data-f="h"></div>
                </div>
                <label style="margin-top:10px;"><input type="checkbox" ${s.circle?'checked':''} data-idx="${i}" data-f="circle"> FORME RONDE</label>
                <button class="del" data-del="${i}">SUPPRIMER CE CAPTEUR ❌</button>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${this._tab === 'poids' ? `
           <div class="sec">
              <label>NOM DE LA PERSONNE</label><input type="text" data-f="name" value="${p.name}">
              <div class="grid">
                <div><label>DÉPART (kg)</label><input type="number" data-f="start" value="${p.start}"></div>
                <div><label>IDÉAL (kg)</label><input type="number" data-f="ideal" value="${p.ideal}"></div>
              </div>
           </div>
        ` : ''}
        
        ${this._tab === 'design' ? `
          <div class="sec">
            <label>URL IMAGE DE FOND</label><input type="text" data-f="image" value="${p.image}">
            <label>HAUTEUR CARTE (px)</label><input type="number" id="card_height" value="${this._config.card_height}">
            <label>CHANGER DE PERSONNE</label>
            <select id="switch-p">
              <option value="person1" ${v==='person1'?'selected':''}>Patrick</option>
              <option value="person2" ${v==='person2'?'selected':''}>Sandra</option>
            </select>
          </div>
        ` : ''}
      </div>
    `;

    this._setupEvents();
  }

  _setupEvents() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];

    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._tab = t.dataset.tab; this.render(); });

    this.querySelectorAll('ha-entity-picker').forEach(picker => {
      picker.addEventListener('value-changed', (e) => {
        const idx = picker.index;
        p.sensors[idx].entity = e.detail.value;
        this._fire();
      });
    });

    this.querySelectorAll('input').forEach(input => {
      input.onchange = () => {
        const val = input.type === 'checkbox' ? input.checked : input.value;
        if (input.dataset.idx !== undefined) p.sensors[input.dataset.idx][input.dataset.f] = val;
        else if (input.id === 'card_height') this._config.card_height = val;
        else p[input.dataset.f] = val;
        this._fire();
      };
    });

    const addBtn = this.querySelector('#add-sensor');
    if(addBtn) addBtn.onclick = () => {
      if(!p.sensors) p.sensors = [];
      p.sensors.push({name: "Nouveau", entity: "", x: 50, y: 50, w: 100, h: 80, bw: 1, bc: "white", circle: false});
      this._fire();
      this.render();
    };

    this.querySelectorAll('.del').forEach(btn => {
      btn.onclick = () => {
        p.sensors.splice(btn.dataset.del, 1);
        this._fire();
        this.render();
      };
    });

    const sw = this.querySelector('#switch-p');
    if(sw) sw.onchange = (e) => { this._config.current_view = e.target.value; this._fire(); this.render(); };
  }

  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.7.0" });
