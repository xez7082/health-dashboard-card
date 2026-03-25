/**
 * HEALTH DASHBOARD CARD – V4.4.0
 * SECTIONS ENCADRÉES + TAILLES INDIVIDUELLES
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
    if(!p || !p.sensors) return;
    
    p.sensors.forEach((s, i) => {
      const elV = this.shadowRoot.getElementById(`s-${i}-v`);
      if(elV && s.entity && this._hass.states[s.entity]) {
        elV.textContent = this._hass.states[s.entity].state;
      }
    });

    const stateW = this._hass.states[p.weight_entity];
    if(stateW) {
      const actuel = parseFloat(stateW.state);
      this.shadowRoot.getElementById('weight-val').textContent = actuel.toFixed(1) + ' kg';
      const start = parseFloat(p.start) || actuel;
      const ideal = parseFloat(p.ideal) || actuel;
      const pct = Math.abs(start - actuel) / Math.abs(start - ideal) * 100;
      this.shadowRoot.getElementById('prog-bar').style.width = Math.max(0, Math.min(100, pct)) + '%';
      this.shadowRoot.getElementById('reste-val').textContent = Math.abs(actuel - ideal).toFixed(1) + ' kg restants';
    }
  }

  render() {
    if(!this._config) return;
    const p = this._config[this._config.current_view] || { sensors: [] };
    const cv = this._config.current_view;
    
    // Positionnement des sections (Cadres de 2px)
    const sections = [
      { id: 'forme', label: '⚡ FORME', top: 60, height: 110 },
      { id: 'sommeil', label: '🌙 SOMMEIL', top: 180, height: 110 },
      { id: 'sante', label: '🏥 SANTÉ', top: 300, height: 130 }
    ];

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.12; z-index:0; }
        
        .sw-btns { position: absolute; top: 10px; left: 10px; z-index: 100; display: flex; gap: 5px; }
        .sw-btn { background: #1e293b; border: 1px solid #334155; color: white; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 10px; font-weight: bold; }
        .sw-btn.active { background: #38bdf8; color: #000; }

        /* CADRES DE SECTIONS */
        .sec-frame { position: absolute; left: 10px; right: 10px; border: 2px solid rgba(56, 189, 248, 0.3); border-radius: 15px; z-index: 1; background: rgba(255,255,255,0.02); }
        .sec-label { position: absolute; top: -8px; left: 15px; background: #0f172a; padding: 0 8px; font-size: 9px; color: #38bdf8; font-weight: 900; }

        /* BOITES CAPTEURS */
        .box { position: absolute; background: rgba(30, 41, 59, 0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px); z-index: 10; transform: translate(-50%, -50%); overflow: hidden; }
        .lbl { text-transform: uppercase; text-align: center; opacity: 0.7; line-height: 1; }
        .val { font-weight: 800; margin-top: 2px; }

        /* BAS DE CARTE */
        .weight-card { position: absolute; bottom: 10px; left: 10px; right: 10px; height: 120px; background: rgba(15, 23, 42, 0.9); border-radius: 15px; padding: 12px; border: 2px solid #38bdf8; z-index: 20; box-sizing: border-box; }
        .prog-container { height: 6px; background: #334155; border-radius: 3px; margin: 10px 0; overflow: hidden; }
        .prog-bar { height: 100%; background: #38bdf8; width: 0%; transition: width 1s; }
      </style>

      <div class="main">
        <div class="bg"></div>
        <div class="sw-btns">
            <button class="sw-btn ${cv==='person1'?'active':''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv==='person2'?'active':''}" id="btn-p2">SANDRA</button>
        </div>

        ${sections.map(s => `
          <div class="sec-frame" style="top:${s.top}px; height:${s.height}px;">
            <div class="sec-label">${s.label}</div>
          </div>
        `).join('')}

        ${(p.sensors || []).map((s, i) => {
          // Calcul de la position Y dans le cadre de sa section
          const sec = sections.find(sec => sec.id === s.cat) || sections[0];
          const yPos = sec.top + (sec.height / 2) + (parseInt(s.y_off) || 0);
          return `
          <div class="box" style="left:${s.x}%; top:${yPos}px; width:${s.w || 85}px; height:${s.h || 55}px; border-color:${s.col || ''}">
            <ha-icon icon="${s.icon || 'mdi:heart'}" style="--mdc-icon-size:${s.fs_i || 18}px; color:${s.col || '#38bdf8'}"></ha-icon>
            <div class="lbl" style="font-size:${s.fs_l || 7}px;">${s.name}</div>
            <div class="val" id="s-${i}-v" style="font-size:${s.fs_v || 12}px;">--</div>
          </div>`;
        }).join('')}

        <div class="weight-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
             <div><div style="font-size: 8px; opacity: 0.6;">POIDS</div><div style="font-size: 22px; font-weight:900; color:#38bdf8;" id="weight-val">--</div></div>
             <div style="text-align:right;"><div id="diff-val" style="font-size:14px; font-weight:bold;">--</div><div style="font-size: 8px; opacity: 0.6;">ÉVOLUTION</div></div>
          </div>
          <div class="prog-container"><div id="prog-bar" class="prog-bar"></div></div>
          <div style="display:flex; justify-content:space-between; font-size:9px; font-weight:bold;">
            <span>DÉPART: ${p.start}kg</span><span id="reste-val" style="color:#38bdf8;">--</span><span>BUT: ${p.ideal}kg</span>
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

/** ÉDITEUR V4.4.0 **/
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'config'; }
  setConfig(config) { this._config = config; this.render(); }
  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.innerHTML = `
      <div style="padding:15px; background:#1c1c1e; color:white; font-family:sans-serif; font-size:12px;">
        <div style="display:flex; gap:5px; margin-bottom:15px;">
          <button id="t-cfg" style="flex:1; background:${this._tab==='config'?'#38bdf8':'#444'}">⚙️ GÉNÉRAL</button>
          <button id="t-sns" style="flex:1; background:${this._tab==='sensors'?'#38bdf8':'#444'}">📊 CAPTEURS</button>
        </div>
        ${this._tab === 'config' ? `
          <label>Poids Départ</label><input style="width:100%; margin-bottom:10px;" type="number" data-f="start" value="${p.start}">
          <label>Objectif</label><input style="width:100%; margin-bottom:10px;" type="number" data-f="ideal" value="${p.ideal}">
          <label>Entité Poids</label><input style="width:100%;" type="text" data-f="weight_entity" value="${p.weight_entity}">
        ` : `
          ${(p.sensors || []).map((s, i) => `
            <div style="border:1px solid #444; padding:8px; margin-bottom:10px; border-radius:5px;">
              <div style="display:flex; justify-content:space-between;"><strong>${s.name}</strong><button class="del" data-idx="${i}" style="background:red; color:white; border:none; cursor:pointer;">X</button></div>
              <div style="display:flex; gap:5px; margin-top:5px;">
                <input type="text" data-idx="${i}" data-f="name" value="${s.name}" placeholder="Nom">
                <input type="color" data-idx="${i}" data-f="col" value="${s.col||'#38bdf8'}">
              </div>
              <div style="display:flex; gap:5px; margin-top:5px;">
                <div style="flex:1">L: <input type="number" data-idx="${i}" data-f="w" value="${s.w||85}"></div>
                <div style="flex:1">H: <input type="number" data-idx="${i}" data-f="h" value="${s.h||55}"></div>
                <div style="flex:1">X%: <input type="number" data-idx="${i}" data-f="x" value="${s.x}"></div>
              </div>
            </div>
          `).join('')}
          <button id="add-s" style="width:100%; padding:10px; background:#38bdf8;">+ AJOUTER CAPTEUR</button>
        `}
      </div>
    `;
    this._attach();
  }
  _attach() {
    this.querySelector('#t-cfg').onclick = () => { this._tab = 'config'; this.render(); };
    this.querySelector('#t-sns').onclick = () => { this._tab = 'sensors'; this.render(); };
    this.querySelectorAll('input, select').forEach(el => el.onchange = (e) => {
      const p = this._config[this._config.current_view];
      if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = e.target.value;
      else p[el.dataset.f] = e.target.value;
      this._fire();
    });
    const addBtn = this.querySelector('#add-s');
    if(addBtn) addBtn.onclick = () => {
      this._config[this._config.current_view].sensors.push({name:'Nouveau', entity:'', cat:'forme', x:50, w:85, h:55});
      this._fire(); this.render();
    };
    this.querySelectorAll('.del').forEach(b => b.onclick = () => {
      this._config[this._config.current_view].sensors.splice(b.dataset.idx, 1);
      this._fire(); this.render();
    });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
