/**
 * HEALTH DASHBOARD CARD – V3.9.5 (COMPLET)
 * FIX: En-têtes (FORME, SANTÉ, SOMMEIL) + Boutons de choix réactivés
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }
  
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); if(!this._config.current_view) this._config.current_view = 'person1'; this.render(); }
  set hass(hass) { this._hass = hass; this.update(); }

  update() {
    if(!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view];
    if(!p) return;
    
    // MAJ valeurs capteurs
    if(p.sensors) {
      p.sensors.forEach((s, i) => {
        const elV = this.shadowRoot.getElementById(`s-${i}-v`);
        if(elV && s.entity && this._hass.states[s.entity]) elV.textContent = this._hass.states[s.entity].state;
      });
    }
    
    // MAJ Barre de poids
    const stateW = this._hass.states[p.weight_entity];
    if(stateW) {
      const actuel = parseFloat(stateW.state);
      const start = parseFloat(p.start) || actuel;
      const ideal = parseFloat(p.ideal) || actuel;
      this.shadowRoot.getElementById('weight-val').textContent = actuel.toFixed(1) + ' kg';
      const diff = (actuel - start).toFixed(1);
      const dEl = this.shadowRoot.getElementById('diff-val');
      dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
      dEl.style.color = actuel <= start ? '#4caf50' : '#ff5252';
      const pct = Math.max(0, Math.min(100, (Math.abs(start - actuel) / Math.abs(start - ideal)) * 100));
      this.shadowRoot.getElementById('prog-bar').style.width = pct + '%';
      this.shadowRoot.getElementById('reste-val').textContent = Math.abs(actuel - ideal).toFixed(1) + ' kg restants';
    }
  }

  render() {
    const p = this._config[this._config.current_view] || { sensors: [] };
    const cv = this._config.current_view;
    const getY = (cat) => (cat==='sommeil'?220:(cat==='sante'?360:100));

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 20px; overflow: hidden; color: white; }
        .sw-btns { position: absolute; top: 10px; left: 10px; z-index: 100; display:flex; gap: 5px; }
        .sw-btn { background: #1e293b; border: 1px solid #334155; color: white; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 10px; font-weight: bold; }
        .sw-btn.active { background: #38bdf8; color: #000; }
        
        .header { position: absolute; left: 15px; font-size: 8px; color: #38bdf8; font-weight: 900; letter-spacing: 1px; }
        
        .box { position: absolute; background: rgba(255,255,255,0.05); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
        .lbl { font-size: 7px; opacity: 0.6; text-transform: uppercase; }
        .val { font-size: 11px; font-weight: bold; margin-top:2px; }
        
        .weight-card { position: absolute; bottom: 10px; left: 10px; right: 10px; height: 110px; background: rgba(0,0,0,0.3); border-radius: 15px; padding: 10px; }
        .w-header { display: flex; justify-content: space-between; align-items: center; }
        .prog-container { height: 6px; background: #334155; border-radius: 3px; margin: 8px 0; overflow: hidden; }
        .prog-bar { height: 100%; background: #38bdf8; width: 0%; transition: width 1s; }
      </style>
      <div class="main">
        <div class="sw-btns">
            <button class="sw-btn ${cv==='person1'?'active':''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv==='person2'?'active':''}" id="btn-p2">SANDRA</button>
        </div>
        
        <div class="header" style="top: 70px;">⚡ FORME</div>
        <div class="header" style="top: 190px;">🌙 SOMMEIL</div>
        <div class="header" style="top: 330px;">🏥 SANTÉ</div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${getY(s.cat)}px; width:${s.w||75}px; height:45px; transform: translate(-50%, -50%); border-color:${s.col||'#334155'}">
            <div class="lbl">${s.name}</div><div class="val" id="s-${i}-v">--</div>
          </div>`).join('')}

        <div class="weight-card">
          <div class="w-header">
            <div style="font-size: 18px; font-weight:900;" id="weight-val">--</div>
            <div id="diff-val" style="font-size:12px; font-weight:bold;">--</div>
          </div>
          <div class="prog-container"><div id="prog-bar" class="prog-bar"></div></div>
          <div style="display:flex; justify-content:space-between; font-size:9px;">
            <span style="opacity:0.6;">DÉPART: ${p.start}kg</span>
            <span id="reste-val" style="color:#38bdf8;">--</span>
            <span style="opacity:0.6;">OBJ: ${p.ideal}kg</span>
          </div>
        </div>
      </div>
    `;
    this.shadowRoot.getElementById('btn-p1').onclick = () => this._saveView('person1');
    this.shadowRoot.getElementById('btn-p2').onclick = () => this._saveView('person2');
  }

  _saveView(v) { this._config.current_view = v; this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); }
}
// (L'éditeur reste identique à la version précédente)
