/**
 * HEALTH DASHBOARD CARD – V3.9.0
 * COMPACT 600px + BARRE PROG + ÉDITEUR VISUEL COMPLET
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }
  
  setConfig(config) { 
    this._config = JSON.parse(JSON.stringify(config)); 
    if(!this._config.current_view) this._config.current_view = 'person1';
    this.render(); 
  }
  
  set hass(hass) { this._hass = hass; this.update(); }

  update() {
    if(!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view];
    if(!p) return;
    
    if(p.sensors) {
      p.sensors.forEach((s, i) => {
        const elV = this.shadowRoot.getElementById(`s-${i}-v`);
        if(elV && s.entity && this._hass.states[s.entity]) {
          elV.textContent = this._hass.states[s.entity].state;
        }
      });
    }
    
    const stateW = this._hass.states[p.weight_entity];
    if(stateW) {
      const actuel = parseFloat(stateW.state);
      const start = parseFloat(p.start) || actuel;
      const ideal = parseFloat(p.ideal) || actuel;
      
      this.shadowRoot.getElementById('weight-val').textContent = actuel.toFixed(1) + ' kg';
      
      const diffTotale = (actuel - start).toFixed(1);
      const diffEl = this.shadowRoot.getElementById('diff-val');
      diffEl.textContent = (diffTotale > 0 ? '+' : '') + diffTotale + ' kg';
      diffEl.style.color = actuel <= (parseFloat(p.confort) || start) ? '#4caf50' : '#ff5252';

      const reste = Math.abs(actuel - ideal).toFixed(1);
      this.shadowRoot.getElementById('reste-val').textContent = reste + ' kg restants';

      const totalAPerdre = Math.abs(start - ideal);
      const dejaPerdu = Math.abs(start - actuel);
      let pct = totalAPerdre !== 0 ? (dejaPerdu / totalAPerdre) * 100 : 0;
      this.shadowRoot.getElementById('prog-bar').style.width = Math.max(0, Math.min(100, pct)) + '%';
    }
  }

  render() {
    const p = this._config[this._config.current_view] || { sensors: [] };
    const cv = this._config.current_view;
    const getY = (cat) => (cat==='sommeil'?210:(cat==='sante'?340:90));

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 24px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.12; z-index:1; }
        .sw-btns { position: absolute; top: 15px; left: 15px; z-index: 100; display:flex; gap: 8px; }
        .sw-btn { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 7px 14px; border-radius: 10px; cursor: pointer; font-size: 11px; font-weight: bold; backdrop-filter: blur(10px); }
        .sw-btn.active { background: #38bdf8; color: #0f172a; border-color: #38bdf8; }
        
        .box { position: absolute; background: rgba(30, 41, 59, 0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(5px); }
        .ico { color: #38bdf8; --mdc-icon-size: 20px; margin-bottom: 2px; }
        .lbl { font-size: 8px; opacity: 0.6; text-transform: uppercase; text-align: center; padding: 0 4px; }
        .val { font-size: 13px; font-weight: 800; margin-top:2px; color: #fff; }

        .weight-card { position: absolute; bottom: 15px; left: 15px; right: 15px; height: 130px; background: rgba(15, 23, 42, 0.95); border-radius: 20px; border: 1px solid rgba(56, 189, 248, 0.2); padding: 15px; box-sizing: border-box; z-index: 20; display: flex; flex-direction: column; justify-content: space-between; }
        .w-header { display: flex; justify-content: space-between; }
        .w-main-val { font-size: 26px; font-weight: 900; color: #38bdf8; }
        .prog-container { width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .prog-bar { height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8); width: 0%; transition: width 1s; }
        .w-footer { display: flex; justify-content: space-between; font-size: 10px; opacity: 0.8; font-weight: bold; }
      </style>

      <div class="main">
        <div class="bg"></div>
        <div class="sw-btns">
            <button class="sw-btn ${cv==='person1'?'active':''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv==='person2'?'active':''}" id="btn-p2">SANDRA</button>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${getY(s.cat)}px; width:${s.w||85}px; height:60px; transform: translate(-50%, -50%); border-color:${s.col||'rgba(255,255,255,0.08)'}">
            <ha-icon icon="${s.icon||'mdi:heart'}" class="ico" style="color:${s.col||'#38bdf8'}"></ha-icon>
            <div class="lbl">${s.name}</div>
            <div class="val" id="s-${i}-v">--</div>
          </div>`).join('')}

        <div class="weight-card">
          <div class="w-header">
            <div><div style="font-size: 9px; opacity: 0.5;">ACTUEL</div><div class="w-main-val" id="weight-val">--</div></div>
            <div style="text-align:right;"><div id="diff-val" style="font-size: 16px; font-weight:900;">--</div><div style="font-size: 9px; opacity: 0.5;">PROGRESSION</div></div>
          </div>
          <div>
            <div class="prog-container"><div id="prog-bar" class="prog-bar"></div></div>
            <div class="w-footer"><span>Départ: ${p.start}kg</span><span id="reste-val" style="color:#818cf8">--</span><span>But: ${p.ideal}kg</span></div>
          </div>
        </div>
      </div>
    `;
    this.shadowRoot.getElementById('btn-p1').onclick = () => this._saveView('person1');
    this.shadowRoot.getElementById('btn-p2').onclick = () => this._saveView('person2');
  }

  _saveView(v) {
    this._config.current_view = v;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    this.render();
  }
}

/** ÉDITEUR VISUEL AVANCÉ **/
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'config'; }
  setConfig(config) { this._config = config; this.render(); }
  
  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .ed-container { padding: 15px; background: #1c1c1e; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 8px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; border: none; background: #2c2c2e; color: #aaa; cursor: pointer; border-radius: 8px; font-weight: bold; }
        .tab.active { background: #38bdf8; color: #000; }
        .field { margin-bottom: 12px; }
        label { display: block; font-size: 11px; margin-bottom: 4px; opacity: 0.7; }
        input, select { width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #444; border-radius: 6px; box-sizing: border-box; }
        .sensor-card { background: #2c2c2e; padding: 12px; border-radius: 10px; margin-bottom: 10px; position: relative; border-left: 4px solid #38bdf8; }
        .btn-add { width: 100%; padding: 12px; background: #38bdf8; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        .btn-del { position: absolute; top: 10px; right: 10px; background: #ff5252; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; }
      </style>
      <div class="ed-container">
        <div class="tabs">
          <button class="tab ${this._tab==='config'?'active':''}" data-t="config">⚙️ GENERAL</button>
          <button class="tab ${this._tab==='sensors'?'active':''}" data-t="sensors">📊 CAPTEURS</button>
        </div>

        ${this._tab === 'config' ? `
          <div class="field"><label>Nom de la personne</label><input type="text" data-f="name" value="${p.name}"></div>
          <div class="field"><label>Entité Poids Principale</label><input type="text" data-f="weight_entity" value="${p.weight_entity}"></div>
          <div class="field"><label>Poids de départ (kg)</label><input type="number" data-f="start" value="${p.start}"></div>
          <div class="field"><label>Objectif idéal (kg)</label><input type="number" data-f="ideal" value="${p.ideal}"></div>
          <div class="field"><label>Image de fond (URL)</label><input type="text" data-f="image" value="${p.image||''}"></div>
        ` : `
          ${(p.sensors || []).map((s, i) => `
            <div class="sensor-card">
              <button class="btn-del" data-idx="${i}">X</button>
              <div class="field"><label>Nom</label><input type="text" data-idx="${i}" data-f="name" value="${s.name}"></div>
              <div class="field"><label>Entité</label><input type="text" data-idx="${i}" data-f="entity" value="${s.entity}"></div>
              <div style="display:flex; gap:10px">
                <div class="field" style="flex:1"><label>Catégorie</label>
                  <select data-idx="${i}" data-f="cat">
                    <option value="forme" ${s.cat==='forme'?'selected':''}>FORME</option>
                    <option value="sommeil" ${s.cat==='sommeil'?'selected':''}>SOMMEIL</option>
                    <option value="sante" ${s.cat==='sante'?'selected':''}>SANTÉ</option>
                  </select>
                </div>
                <div class="field" style="flex:1"><label>Position X (%)</label><input type="number" data-idx="${i}" data-f="x" value="${s.x}"></div>
              </div>
              <div style="display:flex; gap:10px">
                <div class="field" style="flex:1"><label>Icône</label><input type="text" data-idx="${i}" data-f="icon" value="${s.icon||''}"></div>
                <div class="field" style="flex:1"><label>Couleur (HEX)</label><input type="text" data-idx="${i}" data-f="col" value="${s.col||''}"></div>
              </div>
            </div>
          `).join('')}
          <button class="btn-add" id="add-s"> + AJOUTER UN CAPTEUR </button>
        `}
      </div>
    `;
    this._attach();
  }

  _attach() {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._tab = t.dataset.t; this.render(); });
    this.querySelectorAll('input, select').forEach(el => el.onchange = (e) => {
      const p = this._config[this._config.current_view];
      if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = e.target.value;
      else p[el.dataset.f] = e.target.value;
      this._fire();
    });
    const addBtn = this.querySelector('#add-s');
    if(addBtn) addBtn.onclick = () => {
      this._config[this._config.current_view].sensors.push({name:'Nouveau', entity:'', cat:'forme', x:50, icon:'mdi:heart'});
      this._fire(); this.render();
    };
    this.querySelectorAll('.btn-del').forEach(b => b.onclick = () => {
      this._config[this._config.current_view].sensors.splice(b.dataset.idx, 1);
      this._fire(); this.render();
    });
  }

  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard Smart V3.9.0",
  description: "Compact 600px avec Barre de Progression et Éditeur Complet"
});
