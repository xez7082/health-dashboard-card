/**
 * HEALTH DASHBOARD CARD – V4.9.1
 * FIX : ÉDITEUR VISUEL | 2 DÉCIMALES | SÉCURITÉ RENDU
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { 
    super(); 
    this.attachShadow({ mode: 'open' }); 
  }

  static getConfigElement() { 
    return document.createElement('health-dashboard-card-editor'); 
  }

  // Configuration par défaut pour l'aperçu dans l'éditeur
  static getStubConfig() {
    return {
      current_view: 'person1',
      person1: {
        name: 'Patrick',
        weight_entity: 'sensor.poids_patrick',
        start: 85.5,
        ideal: 78.0,
        image: '',
        sensors: [
          { name: 'Calories', entity: 'sensor.calories', cat: 'forme', x: 25, y_off: 0, w: 85, h: 55, icon: 'mdi:fire', col: '#f59e0b', unit: ' kcal' }
        ]
      },
      person2: { name: 'Sandra', sensors: [], start: 65, ideal: 60 }
    };
  }
  
  setConfig(config) { 
    this._config = JSON.parse(JSON.stringify(config)); 
    if(!this._config.current_view) this._config.current_view = 'person1';
    if(!this._config.person1) this._config.person1 = { name: 'P1', sensors: [], start: 80, ideal: 75 };
    if(!this._config.person2) this._config.person2 = { name: 'P2', sensors: [], start: 65, ideal: 60 };
    this.render(); 
  }
  
  set hass(hass) { 
    this._hass = hass; 
    this.update(); 
  }

  _formatVal(v) {
    const n = parseFloat(v);
    if (isNaN(n)) return v;
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  update() {
    if(!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view];
    if(!p) return;
    
    // MAJ des capteurs individuels
    if(p.sensors) {
      p.sensors.forEach((s, i) => {
        const elV = this.shadowRoot.getElementById(`s-${i}-v`);
        if(elV && s.entity && this._hass.states[s.entity]) {
          const valRaw = this._hass.states[s.entity].state;
          elV.textContent = this._formatVal(valRaw) + (s.unit || '');
        }
      });
    }

    // MAJ Poids et Barre de progression
    const stateW = this._hass.states[p.weight_entity];
    if(stateW) {
      const actuel = parseFloat(stateW.state);
      const start = parseFloat(p.start) || actuel;
      const ideal = parseFloat(p.ideal) || actuel;
      
      this.shadowRoot.getElementById('weight-val').textContent = actuel.toFixed(2) + ' kg';
      
      const diff = (actuel - start).toFixed(2);
      const dEl = this.shadowRoot.getElementById('diff-val');
      dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
      dEl.style.color = actuel <= start ? '#4caf50' : '#ff5252';

      const total = Math.abs(start - ideal);
      const fait = Math.abs(start - actuel);
      let pct = total !== 0 ? (fait / total) * 100 : 0;
      pct = Math.max(0, Math.min(100, pct));
      
      this.shadowRoot.getElementById('prog-bar').style.width = pct + '%';
      this.shadowRoot.getElementById('prog-pct').textContent = Math.round(pct) + '% atteint';
      this.shadowRoot.getElementById('reste-val').textContent = Math.abs(actuel - ideal).toFixed(2) + ' kg restants';
    }
  }

  render() {
    if (!this._config) return;
    const cv = this._config.current_view;
    const p = this._config[cv] || { name: 'Indéfini', sensors: [] };
    
    const sections = [
      { id: 'forme', label: '⚡ FORME', top: 65, h: 115 },
      { id: 'sommeil', label: '🌙 SOMMEIL', top: 195, h: 115 },
      { id: 'sante', label: '🏥 SANTÉ', top: 325, h: 135 }
    ];

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg-img { position: absolute; inset:0; background: url('${p.image || ''}') center/cover; opacity: 0.18; z-index:0; pointer-events: none; }
        .sw-btns { position: absolute; top: 12px; left: 12px; z-index: 100; display: flex; gap: 8px; }
        .sw-btn { background: #1e293b; border: 1px solid #334155; color: white; padding: 7px 14px; border-radius: 10px; cursor: pointer; font-size: 11px; font-weight: bold; transition: 0.3s; }
        .sw-btn:hover { background: #334155; }
        .sw-btn.active { background: #38bdf8; color: #000; border-color: #38bdf8; }
        .sec-frame { position: absolute; left: 12px; right: 12px; border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 15px; z-index: 1; background: rgba(255,255,255,0.03); }
        .sec-label { position: absolute; top: -9px; left: 15px; background: #0f172a; padding: 0 8px; font-size: 10px; color: #38bdf8; font-weight: 900; }
        .box { position: absolute; background: rgba(30, 41, 59, 0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; border: 2px solid; backdrop-filter: blur(5px); z-index: 10; transform: translate(-50%, -50%); overflow: hidden; box-sizing: border-box; transition: transform 0.2s; }
        .box:hover { transform: translate(-50%, -50%) scale(1.05); }
        .lbl { text-transform: uppercase; text-align: center; opacity: 0.8; font-weight: 600; line-height: 1; }
        .val { font-weight: 800; margin-top: 2px; }
        .weight-card { position: absolute; bottom: 12px; left: 12px; right: 12px; height: 125px; background: rgba(15, 23, 42, 0.95); border-radius: 18px; padding: 15px; border: 2px solid #38bdf8; z-index: 20; box-sizing: border-box; }
        .prog-container { height: 8px; background: #334155; border-radius: 4px; margin: 10px 0; overflow: hidden; }
        .prog-bar { height: 100%; background: #38bdf8; width: 0%; transition: width 1s ease-in-out; }
      </style>

      <div class="main">
        <div class="bg-img"></div>
        <div class="sw-btns">
            <button class="sw-btn ${cv==='person1'?'active':''}" id="btn-p1">${(this._config.person1.name || 'P1').toUpperCase()}</button>
            <button class="sw-btn ${cv==='person2'?'active':''}" id="btn-p2">${(this._config.person2.name || 'P2').toUpperCase()}</button>
        </div>

        ${sections.map(s => `<div class="sec-frame" style="top:${s.top}px; height:${s.h}px;"><div class="sec-label">${s.label}</div></div>`).join('')}

        ${(p.sensors || []).map((s, i) => {
          if(!s.name) return ''; // Évite les crashs si capteur mal défini
          const sec = sections.find(sec => sec.id === s.cat) || sections[0];
          const yPos = sec.top + (sec.h / 2) + (parseInt(s.y_off) || 0);
          return `
          <div class="box" style="left:${s.x}%; top:${yPos}px; width:${s.w || 85}px; height:${s.h || 55}px; border-color:${s.col || '#38bdf8'}">
            <ha-icon icon="${s.icon || 'mdi:heart'}" style="--mdc-icon-size:${s.fs_i || 18}px; color:${s.col || '#38bdf8'}"></ha-icon>
            <div class="lbl" style="font-size:${s.fs_l || 7}px;">${s.name}</div>
            <div class="val" id="s-${i}-v" style="font-size:${s.fs_v || 12}px;">--</div>
          </div>`;
        }).join('')}

        <div class="weight-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
             <div><div style="font-size: 8px; opacity: 0.6;">POIDS ACTUEL</div><div style="font-size: 24px; font-weight:900; color:#38bdf8;" id="weight-val">--</div></div>
             <div style="text-align:right;"><div id="diff-val" style="font-size:16px; font-weight:bold;">--</div><div id="prog-pct" style="font-size: 9px; color:#38bdf8; font-weight:bold;">0%</div></div>
          </div>
          <div class="prog-container"><div id="prog-bar" class="prog-bar"></div></div>
          <div style="display:flex; justify-content:space-between; font-size:9px; font-weight:bold; opacity:0.8;">
            <span>DÉPART: ${p.start}kg</span><span id="reste-val">--</span><span>BUT: ${p.ideal}kg</span>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('btn-p1').onclick = () => this._saveView('person1');
    this.shadowRoot.getElementById('btn-p2').onclick = () => this._saveView('person2');
  }

  _saveView(v) {
    this._config.current_view = v;
    this._fire();
  }
  
  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    this.render();
  }
}

/** ÉDITEUR V4.9.1 **/
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { 
    super(); 
    this._tab = 'config'; 
  }
  
  setConfig(config) { 
    this._config = JSON.parse(JSON.stringify(config)); 
    this.render(); 
  }
  
  render() {
    if(!this._config) return;
    const v = this._config.current_view || 'person1';
    const p = this._config[v] || { name: 'P1', sensors: [] };
    
    this.innerHTML = `
      <style>
        .ed { padding: 15px; background: #1c1c1e; color: white; font-family: sans-serif; font-size: 12px; }
        .row { display: flex; gap: 8px; margin-top: 10px; }
        .s-card { background: #2c2c2e; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #38bdf8; position: relative; }
        input, select { width: 100%; padding: 8px; background: #000; color: #fff; border: 1px solid #444; border-radius: 4px; box-sizing: border-box; }
        label { font-size: 10px; opacity: 0.6; display: block; margin-bottom: 3px; }
        .btn { padding: 10px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; text-align:center; }
        .del { position: absolute; top: 10px; right: 10px; background: #ff5252; color: white; padding: 4px 8px; font-size: 10px; border-radius: 4px; cursor: pointer; }
      </style>
      <div class="ed">
        <div class="row" style="margin-bottom:15px;">
          <div id="sel-p1" class="btn" style="flex:1; background:${v==='person1'?'#38bdf8':'#444'}">P1 (${(this._config.person1.name || 'PATRICK').toUpperCase()})</div>
          <div id="sel-p2" class="btn" style="flex:1; background:${v==='person2'?'#38bdf8':'#444'}">P2 (${(this._config.person2.name || 'SANDRA').toUpperCase()})</div>
        </div>
        <div class="row">
          <div id="t-cfg" class="btn" style="flex:1; background:${this._tab==='config'?'#38bdf8':'#444'}">⚙️ GÉNÉRAL</div>
          <div id="t-sns" class="btn" style="flex:1; background:${this._tab==='sensors'?'#38bdf8':'#444'}">📊 CAPTEURS</div>
        </div>

        ${this._tab === 'config' ? `
          <label>Nom Profil</label><input type="text" data-f="name" value="${p.name}">
          <label>URL Image de fond</label><input type="text" data-f="image" value="${p.image||''}">
          <label>Entité Poids</label><input type="text" data-f="weight_entity" value="${p.weight_entity || ''}">
          <div class="row">
            <div><label>Poids Départ</label><input type="number" data-f="start" value="${p.start}"></div>
            <div><label>Poids Idéal</label><input type="number" data-f="ideal" value="${p.ideal}"></div>
          </div>
        ` : `
          ${(p.sensors || []).map((s, i) => `
            <div class="s-card">
              <div class="del" data-idx="${i}">SUPPR.</div>
              <div class="row">
                <div style="flex:2"><label>Nom</label><input type="text" data-idx="${i}" data-f="name" value="${s.name}"></div>
                <div style="flex:1"><label>Unité</label><input type="text" data-idx="${i}" data-f="unit" value="${s.unit||''}"></div>
              </div>
              <label>Entité (sensor...)</label><input type="text" data-idx="${i}" data-f="entity" value="${s.entity}">
              <div class="row">
                <div><label>Icône</label><input type="text" data-idx="${i}" data-f="icon" value="${s.icon||'mdi:heart'}"></div>
                <div><label>Couleur</label><input type="color" data-idx="${i}" data-f="col" value="${s.col||'#38bdf8'}"></div>
                <div><label>Catégorie</label>
                  <select data-idx="${i}" data-f="cat">
                    <option value="forme" ${s.cat==='forme'?'selected':''}>FORME</option>
                    <option value="sommeil" ${s.cat==='sommeil'?'selected':''}>SOMMEIL</option>
                    <option value="sante" ${s.cat==='sante'?'selected':''}>SANTÉ</option>
                  </select>
                </div>
              </div>
              <div class="row">
                <div><label>X %</label><input type="number" data-idx="${i}" data-f="x" value="${s.x}"></div>
                <div><label>Ajust. Y</label><input type="number" data-idx="${i}" data-f="y_off" value="${s.y_off||0}"></div>
                <div><label>Largeur W</label><input type="number" data-idx="${i}" data-f="w" value="${s.w||85}"></div>
                <div><label>Hauteur H</label><input type="number" data-idx="${i}" data-f="h" value="${s.h||55}"></div>
              </div>
            </div>
          `).join('')}
          <div id="add-s" class="btn" style="width:100%; background:#38bdf8; margin-top:10px;">+ AJOUTER UN CAPTEUR</div>
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
    
    this.querySelectorAll('input, select').forEach(el => {
      el.onchange = (e) => {
        const p = this._config[this._config.current_view];
        if(el.dataset.idx !== undefined) {
          p.sensors[el.dataset.idx][el.dataset.f] = e.target.value;
        } else {
          p[el.dataset.f] = e.target.value;
        }
        this._fire();
      };
    });

    const addBtn = this.querySelector('#add-s');
    if(addBtn) addBtn.onclick = () => {
      const p = this._config[this._config.current_view];
      if(!p.sensors) p.sensors = [];
      p.sensors.push({name:'Nouveau', entity:'', cat:'forme', x:50, y_off:0, w:85, h:55, col:'#38bdf8', unit:''});
      this._fire();
    };

    this.querySelectorAll('.del').forEach(b => {
      b.onclick = () => {
        this._config[this._config.current_view].sensors.splice(b.dataset.idx, 1);
        this._fire();
      };
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
  name: "Health Dashboard Smart V4.9.1",
  description: "Suivi complet Santé/Sommeil/Forme avec 2 décimales."
});
