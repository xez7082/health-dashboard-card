/**
 * HEALTH DASHBOARD CARD – V3.7.5
 * COMPACT 600px + ÉDITEUR VISUEL AVANCÉ
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
      card_height: 600,
      current_view: 'person1',
      person1: { name: "PATRICK", weight_entity: "", start: 100, ideal: 80, sensors: [] },
      person2: { name: "SANDRA", weight_entity: "", start: 70, ideal: 60, sensors: [] }
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

    if (p.sensors) {
      p.sensors.forEach((s, i) => {
        const elV = this.shadowRoot.getElementById(`s-${i}-v`);
        if (elV && s.entity && this._hass.states[s.entity]) {
          elV.textContent = this._hass.states[s.entity].state;
        }
      });
    }

    const stateW = this._hass.states[p.weight_entity];
    if (stateW) {
      const wv = this.shadowRoot.getElementById('weight-val');
      if (wv) wv.textContent = parseFloat(stateW.state).toFixed(1) + ' kg';
      
      const start = parseFloat(p.start) || 0;
      const actuel = parseFloat(stateW.state) || 0;
      const diff = (actuel - start).toFixed(1);
      const dEl = this.shadowRoot.getElementById('diff-val');
      if (dEl) {
        dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
        dEl.style.background = actuel <= (parseFloat(p.confort) || start) ? '#4caf50' : '#ff5252';
      }
    }
  }

  render() {
    if (!this._config) return;
    const p = this._config[this._config.current_view] || { sensors: [] };
    const cv = this._config.current_view;
    const getY = (cat) => { if (cat === 'sommeil') return 230; if (cat === 'sante') return 380; return 110; };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.15; z-index:1; }
        .sw-btns { position: absolute; top: 15px; left: 15px; display: flex; gap: 8px; z-index: 100; }
        .sw-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 15px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 11px; }
        .sw-btn.active { background: #38bdf8; color: #000; }
        .section-header { position: absolute; left: 20px; display: flex; align-items: center; gap: 8px; z-index: 5; width: 90%; }
        .section-header span { font-size: 9px; font-weight: 900; color: #38bdf8; text-transform: uppercase; }
        .box { position: absolute; background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
        .ico { color: #38bdf8; --mdc-icon-size: 20px; margin-bottom: 2px; }
        .lbl { font-size: 8px; opacity: 0.7; text-transform: uppercase; }
        .val { font-weight: 800; font-size: 13px; }
        .weight-area { position: absolute; bottom: 15px; left: 15px; right: 15px; height: 90px; z-index: 20; background: rgba(255,255,255,0.05); border-radius: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); }
        #weight-val { font-size: 22px; font-weight: 900; color: #38bdf8; }
        #diff-val { font-size: 10px; padding: 2px 8px; border-radius: 5px; margin-top: 5px; font-weight: bold; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="sw-btns">
            <button class="sw-btn ${cv === 'person1' ? 'active' : ''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv === 'person2' ? 'active' : ''}" id="btn-p2">SANDRA</button>
        </div>
        <div class="section-header" style="top: 70px;"><span>⚡ FORME</span></div>
        <div class="section-header" style="top: 195px;"><span>🌙 SOMMEIL</span></div>
        <div class="section-header" style="top: 345px;"><span>🏥 SANTÉ</span></div>
        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${getY(s.cat)}px; width:${s.w || 90}px; height:65px; transform: translate(-50%, -50%); border-color:${s.col || ''}">
            <ha-icon icon="${s.icon || 'mdi:heart'}" class="ico" style="color:${s.col || ''}"></ha-icon>
            <div class="lbl">${s.name}</div>
            <div class="val" id="s-${i}-v">--</div>
          </div>`).join('')}
        <div class="weight-area">
          <div id="weight-val">--</div>
          <div id="diff-val">--</div>
        </div>
      </div>
    `;
    this.shadowRoot.getElementById('btn-p1').onclick = () => this._setView('person1');
    this.shadowRoot.getElementById('btn-p2').onclick = () => this._setView('person2');
  }
}

/** ÉDITEUR VISUEL COMPLET **/
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'poids'; }
  setConfig(config) { this._config = config; this.render(); }
  render() {
    if (!this._config) return;
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .ed { padding: 12px; background: #1c1c1e; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 5px; margin-bottom: 10px; }
        .tab { flex: 1; padding: 8px; border: none; background: #3a3a3c; color: white; cursor: pointer; font-size: 10px; border-radius: 4px; }
        .tab.active { background: #38bdf8; color: black; }
        input, select { width: 100%; padding: 8px; margin: 5px 0 15px 0; background: #000; color: white; border: 1px solid #444; border-radius: 4px; box-sizing: border-box; }
        .sensor-item { background: #2c2c2e; padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #38bdf8; }
        button.add { width: 100%; background: #38bdf8; color: black; padding: 10px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
        button.del { background: #ff5252; border: none; color: white; padding: 5px; border-radius: 4px; cursor: pointer; }
      </style>
      <div class="ed">
        <div class="tabs">
          <button class="tab ${this._tab==='poids'?'active':''}" data-t="poids">⚖️ CONFIG</button>
          <button class="tab ${this._tab==='sensors'?'active':''}" data-t="sensors">📊 CAPTEURS</button>
        </div>
        ${this._tab === 'poids' ? `
          <label>Entité Poids</label><input type="text" data-f="weight_entity" value="${p.weight_entity}">
          <label>Poids Départ</label><input type="number" data-f="start" value="${p.start}">
          <label>Objectif</label><input type="number" data-f="ideal" value="${p.ideal}">
          <label>URL Image</label><input type="text" data-f="image" value="${p.image||''}">
        ` : `
          ${(p.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <div style="display:flex; justify-content:space-between"><strong>#${i+1} ${s.name}</strong> <button class="del" data-idx="${i}">X</button></div>
              <label>Nom</label><input type="text" data-idx="${i}" data-f="name" value="${s.name}">
              <label>Entité</label><input type="text" data-idx="${i}" data-f="entity" value="${s.entity}">
              <label>Catégorie</label>
              <select data-idx="${i}" data-f="cat">
                <option value="forme" ${s.cat==='forme'?'selected':''}>FORME</option>
                <option value="sommeil" ${s.cat==='sommeil'?'selected':''}>SOMMEIL</option>
                <option value="sante" ${s.cat==='sante'?'selected':''}>SANTÉ</option>
              </select>
              <label>Position X (%)</label><input type="number" data-idx="${i}" data-f="x" value="${s.x}">
            </div>
          `).join('')}
          <button class="add" id="add"> + AJOUTER CAPTEUR </button>
        `}
      </div>
    `;
    this._attach();
  }
  _attach() {
    this.querySelectorAll('.tab').forEach(b => b.onclick = () => { this._tab = b.dataset.t; this.render(); });
    this.querySelectorAll('input, select').forEach(el => el.onchange = (e) => {
      const p = this._config[this._config.current_view];
      if (el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = e.target.value;
      else p[el.dataset.f] = e.target.value;
      this._save();
    });
    if (this.querySelector('#add')) this.querySelector('#add').onclick = () => {
      this._config[this._config.current_view].sensors.push({ name: 'Nouveau', entity: '', cat: 'forme', x: 50, icon: 'mdi:heart' });
      this._save(); this.render();
    };
    this.querySelectorAll('.del').forEach(b => b.onclick = () => {
      this._config[this._config.current_view].sensors.splice(b.dataset.idx, 1);
      this._save(); this.render();
    });
  }
  _save() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard Smart V3.7.5",
  description: "Compact 600px avec Éditeur Visuel"
});
