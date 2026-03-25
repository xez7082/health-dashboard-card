/**
 * HEALTH DASHBOARD CARD – V3.5.4
 * FULL EDITION: CATEGORIES + AUTO-SAVE + STYLE
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() {
    return document.createElement('health-dashboard-card-editor');
  }

  static getStubConfig() {
    return {
      card_height: 850,
      current_view: 'person1',
      person1: { 
        name: "PATRICK", 
        weight_entity: "", 
        start: 95, 
        ideal: 75, 
        confort: 82,
        image: "", 
        sensors: [] 
      },
      person2: { name: "SANDRA", weight_entity: "", start: 70, ideal: 60, confort: 65, image: "", sensors: [] }
    };
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.update();
  }

  _setView(view) {
    this._config.current_view = view;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    this.render();
  }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view];
    if (!p) return;

    // Mise à jour des sensors dynamiques
    if (p.sensors) {
      p.sensors.forEach((s, i) => {
        const elV = this.shadowRoot.getElementById(`s-${i}-v`);
        if (elV && s.entity && this._hass.states[s.entity]) {
          const state = this._hass.states[s.entity];
          const val = parseFloat(state.state);
          elV.textContent = isNaN(val) ? state.state : val.toFixed(1);
        }
      });
    }

    // Mise à jour du poids et de la barre
    const stateW = this._hass.states[p.weight_entity];
    if (stateW && p.start && p.ideal) {
      const actuel = parseFloat(stateW.state);
      const start = parseFloat(p.start);
      const ideal = parseFloat(p.ideal);
      const pct = Math.max(0, Math.min(100, ((start - actuel) / (start - ideal)) * 100));
      
      const ptr = this.shadowRoot.getElementById('ptr');
      if (ptr) ptr.style.left = pct + '%';
      
      const wv = this.shadowRoot.getElementById('weight-val');
      if (wv) wv.textContent = actuel.toFixed(1) + ' kg';
      
      const diff = (actuel - start).toFixed(1);
      const dEl = this.shadowRoot.getElementById('diff-val');
      if (dEl) {
        dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
        dEl.style.background = actuel <= (p.confort || p.ideal) ? '#4caf50' : '#ff5252';
      }
    }
  }

  render() {
    const p = this._config[this._config.current_view] || { sensors: [] };
    const cv = this._config.current_view;
    const getY = (cat) => { 
      if (cat === 'sommeil') return 350; 
      if (cat === 'sante') return 540; 
      return 160; 
    };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 850}px; background: #0f172a; border-radius: 28px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.2; z-index:1; }
        .sw-btns { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 100; }
        .sw-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; backdrop-filter: blur(10px); }
        .sw-btn.active { background: #38bdf8; color: #000; border-color: #38bdf8; }
        .section-header { position: absolute; left: 25px; display: flex; align-items: center; gap: 10px; z-index: 5; width: 85%; }
        .section-header span { font-size: 11px; font-weight: 900; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; }
        .section-line { height: 1px; flex-grow: 1; background: linear-gradient(90deg, #38bdf8, transparent); }
        .box { position: absolute; background: rgba(15, 23, 42, 0.75); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); transition: 0.3s; }
        .ico { color: #38bdf8; margin-bottom: 4px; --mdc-icon-size: 26px; }
        .lbl { font-size: 0.65em; opacity: 0.6; font-weight: bold; text-transform: uppercase; }
        .val { font-weight: 800; }
        .weight-area { position: absolute; bottom: 30px; left: 5%; width: 90%; z-index: 20; background: rgba(255,255,255,0.05); padding: 25px; border-radius: 24px; box-sizing: border-box; border: 1px solid rgba(255,255,255,0.1); }
        .weight-track { position: relative; width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; margin-top: 45px; }
        .ptr { position: absolute; top: -12px; width: 6px; height: 34px; background: #fff; border-radius: 3px; transition: 1s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 15px rgba(255,255,255,0.5); }
        .bub { position: absolute; top: -80px; left: 50%; transform: translateX(-50%); background: #38bdf8; color: #000; padding: 10px 18px; border-radius: 15px; font-weight: 900; min-width: 100px; text-align: center; }
        #diff-val { display: block; font-size: 10px; border-radius: 5px; padding: 2px 5px; color: #fff; margin-top: 4px; }
        .mkr { position: absolute; top: 25px; transform: translateX(-50%); font-size: 9px; opacity: 0.5; font-weight: bold; text-align: center; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="sw-btns">
            <button class="sw-btn ${cv === 'person1' ? 'active' : ''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv === 'person2' ? 'active' : ''}" id="btn-p2">SANDRA</button>
        </div>
        <div class="section-header" style="top: 100px;"><span>⚡ FORME</span><div class="section-line"></div></div>
        <div class="section-header" style="top: 290px;"><span>🌙 SOMMEIL</span><div class="section-line"></div></div>
        <div class="section-header" style="top: 480px;"><span>🏥 SANTÉ</span><div class="section-line"></div></div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${getY(s.cat)}px; width:${s.w || 110}px; height:85px; transform: translate(-50%, -50%); border-color:${s.col || 'rgba(255,255,255,0.1)'}">
            <ha-icon icon="${s.icon || 'mdi:heart'}" class="ico" style="color:${s.col || '#38bdf8'}"></ha-icon>
            <div class="lbl">${s.name}</div>
            <div style="color:${s.col || '#fff'}; font-size:${s.fs || 1.3}em;"><span id="s-${i}-v" class="val">--</span></div>
          </div>`).join('')}

        <div class="weight-area">
          <div class="weight-track">
            <div class="mkr" style="left:0">START<br>${p.start}</div>
            <div class="mkr" style="left:50%">CONFORT<br>${p.confort || ''}</div>
            <div class="mkr" style="left:100%">GOAL<br>${p.ideal}</div>
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
  constructor() {
    super();
    this._tab = 'poids';
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  render() {
    if (!this._config) return;
    const v = this._config.current_view || 'person1';
    const p = this._config[v];

    this.innerHTML = `
      <style>
        .ed-container { padding: 15px; font-family: sans-serif; background: #1c1c1e; color: white; border-radius: 10px; }
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; flex-wrap: wrap; }
        .tab { flex: 1; padding: 8px; border: none; border-radius: 5px; background: #3a3a3c; color: #999; cursor: pointer; font-size: 11px; font-weight: bold; }
        .tab.active { background: #38bdf8; color: black; }
        .item { background: #2c2c2e; padding: 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #444; }
        label { display: block; font-size: 10px; color: #38bdf8; margin-bottom: 5px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #000; border: 1px solid #444; color: white; border-radius: 5px; margin-bottom: 10px; box-sizing: border-box; }
        .row { display: flex; gap: 10px; }
        .btn-add { width: 100%; padding: 10px; background: #38bdf8; color: black; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
        .btn-del { width: 100%; padding: 5px; background: #ff5252; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 10px; }
      </style>
      <div class="ed-container">
        <div class="tabs">
          <button class="tab ${this._tab==='poids'?'active':''}" data-t="poids">⚖️ CONFIG</button>
          <button class="tab ${this._tab==='forme'?'active':''}" data-t="forme">⚡ FORME</button>
          <button class="tab ${this._tab==='sommeil'?'active':''}" data-t="sommeil">🌙 SOMMEIL</button>
          <button class="tab ${this._tab==='sante'?'active':''}" data-t="sante">🏥 SANTÉ</button>
        </div>

        ${this._tab === 'poids' ? `
          <div class="item">
            <label>Capteur Poids (Entité)</label>
            <input type="text" data-f="weight_entity" value="${p.weight_entity||''}">
            <div class="row">
              <div><label>Départ</label><input type="number" step="0.1" data-f="start" value="${p.start}"></div>
              <div><label>Confort</label><input type="number" step="0.1" data-f="confort" value="${p.confort}"></div>
              <div><label>Idéal</label><input type="number" step="0.1" data-f="ideal" value="${p.ideal}"></div>
            </div>
            <label>Image de fond (URL)</label>
            <input type="text" data-f="image" value="${p.image||''}">
            <label>Hauteur Carte (px)</label>
            <input type="number" id="card-h" value="${this._config.card_height || 850}">
          </div>
        ` : `
          ${(p.sensors || []).filter(s => s.cat === this._tab).map((s) => {
            const gi = p.sensors.indexOf(s);
            return `
              <div class="item">
                <div class="row">
                  <div style="flex:2"><label>Nom</label><input type="text" data-idx="${gi}" data-f="name" value="${s.name}"></div>
                  <div style="flex:1"><label>Icône</label><input type="text" data-idx="${gi}" data-f="icon" value="${s.icon}"></div>
                </div>
                <label>Entité</label><input type="text" data-idx="${gi}" data-f="entity" value="${s.entity}">
                <div class="row">
                  <div><label>X (%)</label><input type="number" data-idx="${gi}" data-f="x" value="${s.x}"></div>
                  <div><label>Taille</label><input type="number" step="0.1" data-idx="${gi}" data-f="fs" value="${s.fs || 1.3}"></div>
                  <div><label>Couleur</label><input type="color" data-idx="${gi}" data-f="col" value="${s.col || '#38bdf8'}"></div>
                </div>
                <button class="btn-del" data-idx="${gi}">Supprimer</button>
              </div>`;
          }).join('')}
          <button class="btn-add" id="add-sensor">+ Ajouter à ${this._tab}</button>
        `}
      </div>
    `;
    this._attach();
  }

  _attach() {
    this.querySelectorAll('.tab').forEach(b => b.onclick = () => { this._tab = b.dataset.t; this.render(); });
    
    this.querySelectorAll('input').forEach(input => {
      input.onchange = (e) => {
        const p = this._config[this._config.current_view];
        if (input.dataset.idx !== undefined) {
          p.sensors[input.dataset.idx][input.dataset.f] = e.target.value;
        } else if (input.id === 'card-h') {
          this._config.card_height = e.target.value;
        } else {
          p[input.dataset.f] = e.target.value;
        }
        this._save();
      };
    });

    const addBtn = this.querySelector('#add-sensor');
    if (addBtn) addBtn.onclick = () => {
      const p = this._config[this._config.current_view];
      if (!p.sensors) p.sensors = [];
      p.sensors.push({ name: 'Nouveau', entity: '', icon: 'mdi:heart', cat: this._tab, x: 50, col: '#38bdf8', fs: 1.3, w: 110 });
      this._save();
      this.render();
    };

    this.querySelectorAll('.btn-del').forEach(b => b.onclick = () => {
      this._config[this._config.current_view].sensors.splice(b.dataset.idx, 1);
      this._save();
      this.render();
    });
  }

  _save() {
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard Smart V3.5.4",
  description: "Dashboard Santé complet avec sections intelligentes"
});
