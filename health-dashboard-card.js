/**
 * HEALTH DASHBOARD CARD – V3.8.0
 * COMPACT 600px + BARRE DE PROGRESSION DÉTAILLÉE
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
    
    // Mise à jour des capteurs (Forme, Sommeil, Santé)
    p.sensors.forEach((s, i) => {
      const elV = this.shadowRoot.getElementById(`s-${i}-v`);
      if(elV && s.entity && this._hass.states[s.entity]) elV.textContent = this._hass.states[s.entity].state;
    });
    
    // Mise à jour de la BARRE DE POIDS DÉTAILLÉE
    const stateW = this._hass.states[p.weight_entity];
    if(stateW) {
      const actuel = parseFloat(stateW.state);
      const start = parseFloat(p.start) || actuel;
      const ideal = parseFloat(p.ideal) || actuel;
      
      this.shadowRoot.getElementById('weight-val').textContent = actuel.toFixed(1) + ' kg';
      
      // Calcul Perte Totale
      const diffTotale = (actuel - start).toFixed(1);
      const diffEl = this.shadowRoot.getElementById('diff-val');
      diffEl.textContent = (diffTotale > 0 ? '+' : '') + diffTotale + ' kg';
      diffEl.style.color = actuel <= (parseFloat(p.confort) || start) ? '#4caf50' : '#ff5252';

      // Calcul Reste à perdre pour l'objectif
      const reste = (actuel - ideal).toFixed(1);
      this.shadowRoot.getElementById('reste-val').textContent = reste + ' kg restants';

      // Calcul Pourcentage Barre
      // Si on perd du poids : (Départ - Actuel) / (Départ - Cible)
      const totalAPerdre = start - ideal;
      const dejaPerdu = start - actuel;
      let pct = totalAPerdre !== 0 ? (dejaPerdu / totalAPerdre) * 100 : 0;
      pct = Math.max(0, Math.min(100, pct)); // Borner entre 0 et 100
      this.shadowRoot.getElementById('prog-bar').style.width = pct + '%';
    }
  }

  render() {
    const p = this._config[this._config.current_view] || { sensors: [] };
    const cv = this._config.current_view;
    const getY = (cat) => (cat==='sommeil'?210:(cat==='sante'?340:90));

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 24px; overflow: hidden; font-family: 'Segoe UI', Roboto, sans-serif; color: white; border: 1px solid #334155; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.12; z-index:1; }
        .sw-btns { position: absolute; top: 15px; left: 15px; z-index: 100; display:flex; gap: 8px; }
        .sw-btn { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 7px 14px; border-radius: 10px; cursor: pointer; font-size: 11px; font-weight: bold; backdrop-filter: blur(10px); }
        .sw-btn.active { background: #38bdf8; color: #0f172a; border-color: #38bdf8; }
        
        .box { position: absolute; background: rgba(30, 41, 59, 0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(5px); }
        .lbl { font-size: 8px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; }
        .val { font-size: 13px; font-weight: 800; margin-top:2px; color: #38bdf8; }

        /* NOUVELLE ZONE DE POIDS AVANCÉE */
        .weight-card { position: absolute; bottom: 15px; left: 15px; right: 15px; height: 130px; background: rgba(15, 23, 42, 0.9); border-radius: 20px; border: 1px solid rgba(56, 189, 248, 0.2); padding: 15px; box-sizing: border-box; z-index: 20; display: flex; flex-direction: column; justify-content: space-between; }
        .w-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .w-main-val { font-size: 26px; font-weight: 900; letter-spacing: -1px; }
        .w-sub { font-size: 11px; font-weight: bold; text-align: right; }
        
        .prog-container { width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .prog-bar { height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8); width: 0%; transition: width 1.5s ease-out; }
        
        .w-footer { display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; opacity: 0.8; }
        .goal-label { color: #38bdf8; }
      </style>

      <div class="main">
        <div class="bg"></div>
        <div class="sw-btns">
            <button class="sw-btn ${cv==='person1'?'active':''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv==='person2'?'active':''}" id="btn-p2">SANDRA</button>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${getY(s.cat)}px; width:${s.w||85}px; height:60px; transform: translate(-50%, -50%);">
            <div class="lbl">${s.name}</div>
            <div class="val" id="s-${i}-v">--</div>
          </div>`).join('')}

        <div class="weight-card">
          <div class="w-header">
            <div>
              <div style="font-size: 9px; opacity: 0.5; font-weight: bold;">POIDS ACTUEL</div>
              <div class="w-main-val" id="weight-val">--</div>
            </div>
            <div class="w-sub">
              <div id="diff-val" style="font-size: 14px;">--</div>
              <div style="font-size: 9px; opacity: 0.5;">DEPUIS LE DÉBUT</div>
            </div>
          </div>

          <div>
            <div class="prog-container"><div id="prog-bar" class="prog-bar"></div></div>
            <div class="w-footer">
              <span>Départ: ${p.start}kg</span>
              <span id="reste-val" style="color: #818cf8;">--</span>
              <span class="goal-label">Objectif: ${p.ideal}kg</span>
            </div>
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

/** ÉDITEUR VISUEL **/
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'poids'; }
  setConfig(config) { this._config = config; this.render(); }
  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .ed { padding:12px; background:#1c1c1e; color:white; border-radius:10px; }
        .tabs { display:flex; gap:5px; margin-bottom:10px; }
        .tab { flex:1; padding:8px; background:#3a3a3c; color:white; border:none; border-radius:4px; cursor:pointer; font-size:10px; }
        .tab.active { background:#38bdf8; color:black; }
        input { width:100%; padding:8px; margin:5px 0 10px 0; background:#000; color:white; border:1px solid #444; border-radius:4px; }
        button.add { width:100%; background:#38bdf8; padding:10px; border:none; border-radius:5px; font-weight:bold; cursor:pointer; }
      </style>
      <div class="ed">
        <div class="tabs">
          <button class="tab ${this._tab==='poids'?'active':''}" data-t="poids">CONFIG POIDS</button>
          <button class="tab ${this._tab==='sensors'?'active':''}" data-t="sensors">CAPTEURS</button>
        </div>
        ${this._tab === 'poids' ? `
          <label>Entité Poids</label><input type="text" data-f="weight_entity" value="${p.weight_entity}">
          <label>Poids Départ</label><input type="number" data-f="start" value="${p.start}">
          <label>Objectif Idéal</label><input type="number" data-f="ideal" value="${p.ideal}">
          <label>URL Image</label><input type="text" data-f="image" value="${p.image||''}">
        ` : `
          <button class="add" id="add"> + AJOUTER CAPTEUR </button>
          <p style="font-size:10px; margin-top:10px;">Utilisez le YAML pour la gestion fine des capteurs.</p>
        `}
      </div>
    `;
    this.querySelectorAll('.tab').forEach(b => b.onclick = () => { this._tab = b.dataset.t; this.render(); });
    this.querySelectorAll('input').forEach(el => el.onchange = (e) => {
      this._config[this._config.current_view][el.dataset.f] = e.target.value;
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    });
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
