class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  static getStubConfig() {
    return {
      type: "custom:health-dashboard-card",
      card_height: 600, card_round: 20,
      person1: { name: "Patrick", image: "", elements: [] },
      person2: { name: "Sandra", image: "", elements: [] }
    };
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    const p = this._config[this._config.current_view];
    if (!p || !this.shadowRoot) return;

    (p.elements || []).forEach((el, i) => {
      const dom = this.shadowRoot.getElementById(`val-${i}`);
      if (dom && this._hass.states[el.entity]) {
        const s = this._hass.states[el.entity];
        dom.textContent = `${s.state}${el.unit || s.attributes.unit_of_measurement || ''}`;
      }
    });

    // Gestion barre de poids si l'entité existe
    if (p.weight_ent && this._hass.states[p.weight_ent]) {
      const cur = parseFloat(this._hass.states[p.weight_ent].state);
      const pct = (p.start - p.ideal) !== 0 ? ((p.start - cur) / (p.start - p.ideal)) * 100 : 0;
      const ptr = this.shadowRoot.getElementById('ptr');
      if (ptr) ptr.style.left = `${Math.max(0, Math.min(100, pct))}%`;
      const lbl = this.shadowRoot.getElementById('ptr-lbl');
      if (lbl) lbl.textContent = cur + 'kg';
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const p = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .card { position: relative; width: 100%; height: ${this._config.card_height}px; background: #0f172a; border-radius: ${this._config.card_round}px; overflow: hidden; color: white; font-family: sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${p.image}') center/cover; opacity: 0.4; }
        .nav { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 10; }
        .btn { padding: 10px 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: white; cursor: pointer; }
        .btn.active { background: ${accent}; color: black; font-weight: bold; }
        
        .item { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.8); border: 2px solid ${accent}; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(10px); text-align: center; }
        .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; }
        .value { font-weight: 900; }
        ha-icon { margin-bottom: 2px; }

        .footer { position: absolute; bottom: 30px; left: 5%; width: 90%; display: ${p.weight_ent ? 'block' : 'none'}; }
        .track { position: relative; width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; }
        .grad { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 5px; }
        .ptr { position: absolute; top: -12px; width: 4px; height: 34px; background: white; transition: left 1s; }
        .bub { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 2px 10px; border-radius: 5px; font-weight: bold; font-size: 12px; border: 1px solid ${accent}; }
      </style>
      <div class="card">
        <div class="bg"></div>
        <div class="nav">
          <button class="btn ${view==='person1'?'active':''}" onclick="this.getRootNode().host.switch('person1')">${this._config.person1.name || 'P1'}</button>
          <button class="btn ${view==='person2'?'active':''}" onclick="this.getRootNode().host.switch('person2')">${this._config.person2.name || 'P2'}</button>
        </div>

        ${(p.elements || []).map((el, i) => `
          <div class="item" style="left:${el.x}%; top:${el.y}%; width:${el.w || 100}px; height:${el.h || 70}px; border-radius:${el.round || 10}px; border-color:${el.color || accent};">
            <ha-icon icon="${el.icon || 'mdi:circle'}" style="--mdc-icon-size: ${el.isize || 24}px; color:${el.color || accent};"></ha-icon>
            <div class="label" style="font-size:${el.fs_l || 10}px;">${el.name}</div>
            <div class="value" id="val-${i}" style="font-size:${el.fs_v || 16}px;">--</div>
          </div>
        `).join('')}

        <div class="footer">
          <div class="track"><div class="grad"></div><div id="ptr" class="ptr"><div id="bub" class="bub"><span id="ptr-lbl">--</span></div></div></div>
        </div>
      </div>
    `;
  }
  switch(v) { this._config.current_view = v; this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } })); this.render(); }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'global'; }
  setConfig(config) { this._config = config; this.render(); }
  render() {
    const view = this._config.current_view || 'person1';
    const p = this._config[view];
    this.innerHTML = `
      <style>
        .ed { background: #1a1a1a; color: white; padding: 15px; font-family: sans-serif; }
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; background: #333; border: none; color: #888; cursor: pointer; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .tab.active { background: #38bdf8; color: black; }
        .sec { background: #252525; padding: 12px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #444; }
        label { display: block; font-size: 10px; color: #38bdf8; font-weight: bold; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; background: #111; border: 1px solid #444; color: white; padding: 6px; border-radius: 4px; margin-top: 4px; }
        .el-card { background: #111; border-left: 3px solid #38bdf8; padding: 10px; margin-bottom: 10px; position: relative; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .del { color: #ff5252; font-size: 10px; cursor: pointer; margin-top: 5px; display: block; }
      </style>
      <div class="ed">
        <div class="tabs">
          <button class="tab ${this._tab==='global'?'active':''}" id="t-global">DESIGN</button>
          <button class="tab ${this._tab==='profile'?'active':''}" id="t-profile">PROFIL</button>
          <button class="tab ${this._tab==='sensors'?'active':''}" id="t-sensors">ÉLÉMENTS</button>
        </div>

        ${this._tab === 'global' ? `
          <div class="sec">
            <label>Hauteur Carte (px)</label><input type="number" id="h" value="${this._config.card_height}">
            <label>Arrondi Carte (px)</label><input type="number" id="round" value="${this._config.card_round}">
          </div>
        ` : ''}

        ${this._tab === 'profile' ? `
          <div class="sec">
            <label>Nom Profil</label><input type="text" id="name" value="${p.name}">
            <label>Image de fond</label><input type="text" id="img" value="${p.image}">
            <label>Entité Poids (Règle)</label><input type="text" id="we" value="${p.weight_ent}">
            <div class="grid">
              <div><label>Poids Départ</label><input type="number" id="ws" value="${p.start}"></div>
              <div><label>Poids Idéal</label><input type="number" id="wi" value="${p.ideal}"></div>
            </div>
          </div>
        ` : ''}

        ${this._tab === 'sensors' ? `
          <div id="sl">
            ${(p.elements || []).map((el, i) => `
              <div class="el-card">
                <div class="grid">
                  <div><label>Nom</label><input type="text" class="en" data-i="${i}" value="${el.name}"></div>
                  <div><label>Icône</label><input type="text" class="ei" data-i="${i}" value="${el.icon}"></div>
                </div>
                <label>Entité</label><input type="text" class="ee" data-i="${i}" value="${el.entity}">
                <div class="grid">
                  <div><label>X (%)</label><input type="number" class="ex" data-i="${i}" value="${el.x}"></div>
                  <div><label>Y (%)</label><input type="number" class="ey" data-i="${i}" value="${el.y}"></div>
                  <div><label>Largeur</label><input type="number" class="ew" data-i="${i}" value="${el.w}"></div>
                  <div><label>Hauteur</label><input type="number" class="eh" data-i="${i}" value="${el.h}"></div>
                </div>
                <span class="del" data-i="${i}">❌ Supprimer</span>
              </div>
            `).join('')}
          </div>
          <button id="add" style="width:100%; padding:10px; background:#4ade80; color:black; border:none; font-weight:bold; cursor:pointer;">➕ AJOUTER UN COMPOSANT</button>
        ` : ''}
      </div>
    `;

    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._tab = t.id.replace('t-',''); this.render(); });
    const save = () => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));

    if(this._tab === 'global') {
      this.querySelector('#h').onchange = (e) => { this._config.card_height = e.target.value; save(); };
      this.querySelector('#round').onchange = (e) => { this._config.card_round = e.target.value; save(); };
    }
    if(this._tab === 'profile') {
      this.querySelector('#name').onchange = (e) => { p.name = e.target.value; save(); };
      this.querySelector('#img').onchange = (e) => { p.image = e.target.value; save(); };
      this.querySelector('#we').onchange = (e) => { p.weight_ent = e.target.value; save(); };
      this.querySelector('#ws').onchange = (e) => { p.start = e.target.value; save(); };
      this.querySelector('#wi').onchange = (e) => { p.ideal = e.target.value; save(); };
    }
    if(this._tab === 'sensors') {
      this.querySelectorAll('.en').forEach(el => el.onchange = (e) => { p.elements[el.dataset.i].name = e.target.value; save(); });
      this.querySelectorAll('.ee').forEach(el => el.onchange = (e) => { p.elements[el.dataset.i].entity = e.target.value; save(); });
      this.querySelectorAll('.ei').forEach(el => el.onchange = (e) => { p.elements[el.dataset.i].icon = e.target.value; save(); });
      this.querySelectorAll('.ex').forEach(el => el.onchange = (e) => { p.elements[el.dataset.i].x = e.target.value; save(); });
      this.querySelectorAll('.ey').forEach(el => el.onchange = (e) => { p.elements[el.dataset.i].y = e.target.value; save(); });
      this.querySelectorAll('.ew').forEach(el => el.onchange = (e) => { p.elements[el.dataset.i].w = e.target.value; save(); });
      this.querySelectorAll('.eh').forEach(el => el.onchange = (e) => { p.elements[el.dataset.i].h = e.target.value; save(); });
      this.querySelectorAll('.del').forEach(el => el.onclick = () => { p.elements.splice(el.dataset.i, 1); save(); this.render(); });
      this.querySelector('#add').onclick = () => { if(!p.elements) p.elements = []; p.elements.push({name:"Nouveau", entity:"", x:50, y:50, w:100, h:70, icon:"mdi:heart"}); save(); this.render(); };
    }
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V6.0" });
