/**
 * HEALTH DASHBOARD CARD – V4.5.0
 * SECTIONS ENCADRÉES | RÉGLAGES TOTAUX | SÉCURISÉ
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }
  
  setConfig(config) { 
    this._config = JSON.parse(JSON.stringify(config)); 
    if(!this._config.current_view) this._config.current_view = 'person1'; 
    if(!this._config.person1) this._config.person1 = { name: 'Patrick', sensors: [] };
    if(!this._config.person2) this._config.person2 = { name: 'Sandra', sensors: [] };
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
    const p = this._config[this._config.current_view];
    const cv = this._config.current_view;
    const sections = [
      { id: 'forme', label: '⚡ FORME', top: 65, height: 115 },
      { id: 'sommeil', label: '🌙 SOMMEIL', top: 195, height: 115 },
      { id: 'sante', label: '🏥 SANTÉ', top: 325, height: 135 }
    ];

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .sw-btns { position: absolute; top: 12px; left: 12px; z-index: 100; display: flex; gap: 8px; }
        .sw-btn { background: #1e293b; border: 1px solid #334155; color: white; padding: 7px 14px; border-radius: 10px; cursor: pointer; font-size: 11px; font-weight: bold; }
        .sw-btn.active { background: #38bdf8; color: #000; border-color: #38bdf8; }

        .sec-frame { position: absolute; left: 12px; right: 12px; border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 15px; z-index: 1; background: rgba(255,255,255,0.03); }
        .sec-label { position: absolute; top: -9px; left: 15px; background: #0f172a; padding: 0 8px; font-size: 10px; color: #38bdf8; font-weight: 900; }

        .box { position: absolute; background: rgba(30, 41, 59, 0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; border: 2px solid; backdrop-filter: blur(5px); z-index: 10; transform: translate(-50%, -50%); overflow: hidden; box-sizing: border-box; }
        .lbl { text-transform: uppercase; text-align: center; opacity: 0.8; line-height: 1; }
        .val { font-weight: 800; margin-top: 2px; }

        .weight-card { position: absolute; bottom: 12px; left: 12px; right: 12px; height: 120px; background: rgba(15, 23, 42, 0.95); border-radius: 18px; padding: 15px; border: 2px solid #38bdf8; z-index: 20; box-sizing: border-box; }
        .prog-container { height: 8px; background: #334155; border-radius: 4px; margin: 12px 0; overflow: hidden; }
        .prog-bar { height: 100%; background: #38bdf8; width: 0%; transition: width 1s; }
      </style>

      <div class="main">
        <div class="sw-btns">
            <button class="sw-btn ${cv==='person1'?'active':''}" id="btn-p1">${(this._config.person1.name || 'P1').toUpperCase()}</button>
            <button class="sw-btn ${cv==='person2'?'active':''}" id="btn-p2">${(this._config.person2.name || 'P2').toUpperCase()}</button>
        </div>

        ${sections.map(s => `
          <div class="sec-frame" style="top:${s.top}px; height:${s.height}px;">
            <div class="sec-label">${s.label}</div>
          </div>
        `).join('')}

        ${(p.sensors || []).map((s, i) => {
          const sec = sections.find(sec => sec.id === s.cat) || sections[0];
          const yPos = sec.top + (sec.height / 2) + (parseInt(s.y_off) || 0);
          return `
          <div class="box" style="left:${s.x}%; top:${yPos}px; width:${s.w || 85}px; height:${s.h || 55}px; border-color:${s.col || '#38bdf8'}">
            <ha-icon icon="${s.icon || 'mdi:heart'}" style="--mdc-icon-size:${s.fs_i || 18}px; color:${s.col || '#38bdf8'}"></ha-icon>
            <div class="lbl" style="font-size:${s.fs_l || 7}px;">${s.name}</div>
            <div class="val" id="s-${i}-v" style="font-size:${s.fs_v || 12}px;">--</div>
          </div>`;
        }).join('')}

        <div class="weight-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
             <div><div style="font-size: 9px; opacity: 0.6;">POIDS</div><div style="font-size: 24px; font-weight:900; color:#38bdf8;" id="weight-val">--</div></div>
             <div style="text-align:right;"><div id="diff-val" style="font-size:16px; font-weight:bold;">--</div><div style="font-size: 9px; opacity: 0.6;">PROGRESSION</div></div>
          </div>
          <div class="prog-container"><div id="prog-bar" class="prog-bar"></div></div>
          <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold;">
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

/** ÉDITEUR ULTRA-COMPLET V4.5.0 **/
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'config'; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  
  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .ed { padding: 15px; background: #1c1c1e; color: white; font-family: sans-serif; font-size: 12px; }
        .row { display: flex; gap: 8px; margin-top: 8px; }
        .s-card { background: #2c2c2e; padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #38bdf8; position: relative; }
        input, select { width: 100%; padding: 8px; background: #000; color: #fff; border: 1px solid #444; border-radius: 4px; box-sizing: border-box; }
        label { font-size: 10px; opacity: 0.6; display: block; margin-top: 5px; }
        button { padding: 10px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; }
      </style>
      <div class="ed">
        <div class="row" style="margin-bottom:15px;">
          <button id="sel-p1" style="flex:1; background:${v==='person1'?'#38bdf8':'#444'}">PATRICK</button>
          <button id="sel-p2" style="flex:1; background:${v==='person2'?'#38bdf8':'#444'}">SANDRA</button>
        </div>
        <div class="row">
          <button id="t-cfg" style="flex:1; background:${this._tab==='config'?'#38bdf8':'#444'}">⚙️ GÉNÉRAL</button>
          <button id="t-sns" style="flex:1; background:${this._tab==='sensors'?'#38bdf8':'#444'}">📊 CAPTEURS</button>
        </div>

        ${this._tab === 'config' ? `
          <label>Nom Affiché</label><input type="text" data-f="name" value="${p.name}">
          <label>Entité Poids</label><input type="text" data-f="weight_entity" value="${p.weight_entity}">
          <div class="row">
            <div style="flex:1"><label>Départ (kg)</label><input type="number" data-f="start" value="${p.start}"></div>
            <div style="flex:1"><label>Idéal (kg)</label><input type="number" data-f="ideal" value="${p.ideal}"></div>
          </div>
        ` : `
          ${(p.sensors || []).map((s, i) => `
            <div class="s-card">
              <div class="row">
                <div style="flex:2"><input type="text" data-idx="${i}" data-f="name" value="${s.name}" placeholder="Nom"></div>
                <div style="flex:1"><input type="color" data-idx="${i}" data-f="col" value="${s.col||'#38bdf8'}"></div>
                <button class="del" data-idx="${i}" style="background:red; color:white;">X</button>
              </div>
              <div class="row">
                <div style="flex:2"><label>Entité</label><input type="text" data-idx="${i}" data-f="entity" value="${s.entity}"></div>
                <div style="flex:1"><label>Icône</label><input type="text" data-idx="${i}" data-f="icon" value="${s.icon||'mdi:heart'}"></div>
              </div>
              <div class="row">
                 <div><label>X%</label><input type="number" data-idx="${i}" data-f="x" value="${s.x}"></div>
                 <div><label>Y-Adj</label><input type="number" data-idx="${i}" data-f="y_off" value="${s.y_off||0}"></div>
                 <div><label>Catégorie</label>
                   <select data-idx="${i}" data-f="cat">
                     <option value="forme" ${s.cat==='forme'?'selected':''}>FORME</option>
                     <option value="sommeil" ${s.cat==='sommeil'?'selected':''}>SOMMEIL</option>
                     <option value="sante" ${s.cat==='sante'?'selected':''}>SANTÉ</option>
                   </select>
                 </div>
              </div>
              <div class="row">
                <div><label>Largeur</label><input type="number" data-idx="${i}" data-f="w" value="${s.w||85}"></div>
                <div><label>Hauteur</label><input type="number" data-idx="${i}" data-f="h" value="${s.h||55}"></div>
                <div><label>P.Titre</label><input type="number" data-idx="${i}" data-f="fs_l" value="${s.fs_l||7}"></div>
                <div><label>P.Val</label><input type="number" data-idx="${i}" data-f="fs_v" value="${s.fs_v||12}"></div>
              </div>
            </div>
          `).join('')}
          <button id="add-s" style="width:100%; background:#38bdf8; color:black; margin-top:10px;">+ AJOUTER CAPTEUR</button>
        `}
      </div>
    `;
    this._attach();
  }

  _attach() {
    this.querySelector('#sel-p1').onclick = () => { this._config.current_view = 'person1'; this._fire(); };
    this.querySelector('#sel-p2').onclick = () => { this._config.current_view = 'person2'; this._fire(); };
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
      this._config[this._config.current_view].sensors.push({name:'Nouveau', entity:'', cat:'forme', x:50, w:85, h:55, col:'#38bdf8', icon:'mdi:heart'});
      this._fire();
    };
    this.querySelectorAll('.del').forEach(b => b.onclick = () => {
      this._config[this._config.current_view].sensors.splice(b.dataset.idx, 1);
      this._fire();
    });
  }
  _fire() { 
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); 
    this.render();
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard Smart V4.5.0",
  description: "Éditeur Intégral avec Sections Encadrées"
});
