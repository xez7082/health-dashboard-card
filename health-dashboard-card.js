/**
 * HEALTH DASHBOARD CARD – V4.3.0
 * ULTIME : ÉDITEUR TOTAL (ICÔNES, COULEURS, TAILLES, POLICES, X/Y)
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
    
    // Mise à jour des valeurs des capteurs
    p.sensors.forEach((s, i) => {
      const elV = this.shadowRoot.getElementById(`s-${i}-v`);
      if(elV && s.entity && this._hass.states[s.entity]) {
        elV.textContent = this._hass.states[s.entity].state;
      }
    });

    // Mise à jour de la barre de poids
    const stateW = this._hass.states[p.weight_entity];
    if(stateW) {
      const actuel = parseFloat(stateW.state);
      const start = parseFloat(p.start) || actuel;
      const ideal = parseFloat(p.ideal) || actuel;
      
      this.shadowRoot.getElementById('weight-val').textContent = actuel.toFixed(1) + ' kg';
      
      const diff = (actuel - start).toFixed(1);
      const dEl = this.shadowRoot.getElementById('diff-val');
      if(dEl) {
        dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
        dEl.style.color = actuel <= start ? '#4caf50' : '#ff5252';
      }

      const totalAPerdre = Math.abs(start - ideal);
      const dejaPerdu = Math.abs(start - actuel);
      const pct = totalAPerdre !== 0 ? (dejaPerdu / totalAPerdre) * 100 : 0;
      this.shadowRoot.getElementById('prog-bar').style.width = Math.max(0, Math.min(100, pct)) + '%';
      this.shadowRoot.getElementById('reste-val').textContent = Math.abs(actuel - ideal).toFixed(1) + ' kg restants';
    }
  }

  render() {
    if(!this._config) return;
    const p = this._config[this._config.current_view] || { sensors: [] };
    const cv = this._config.current_view;
    const getBaseY = (cat) => (cat === 'sommeil' ? 225 : (cat === 'sante' ? 365 : 105));

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.15; z-index:1; }
        
        .sw-btns { position: absolute; top: 12px; left: 12px; z-index: 100; display: flex; gap: 8px; }
        .sw-btn { background: #1e293b; border: 1px solid #334155; color: white; padding: 7px 14px; border-radius: 10px; cursor: pointer; font-size: 11px; font-weight: bold; }
        .sw-btn.active { background: #38bdf8; color: #000; border-color: #38bdf8; }

        .header { position: absolute; left: 18px; font-size: 9px; color: #38bdf8; font-weight: 900; letter-spacing: 1.5px; z-index: 5; text-transform: uppercase; }
        
        .box { position: absolute; background: rgba(30, 41, 59, 0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; border: 2px solid; backdrop-filter: blur(5px); z-index: 10; transform: translate(-50%, -50%); overflow: hidden; box-sizing: border-box; }
        .box ha-icon { margin-bottom: 2px; }
        .lbl { text-transform: uppercase; text-align: center; opacity: 0.7; line-height: 1.1; }
        .val { font-weight: 800; margin-top: 2px; }
        
        .weight-card { position: absolute; bottom: 12px; left: 12px; right: 12px; height: 120px; background: rgba(15, 23, 42, 0.9); border-radius: 18px; padding: 15px; border: 1px solid rgba(56, 189, 248, 0.2); box-sizing: border-box; z-index: 20; }
        .prog-container { height: 7px; background: #334155; border-radius: 4px; margin: 12px 0; overflow: hidden; }
        .prog-bar { height: 100%; background: #38bdf8; width: 0%; transition: width 1s; }
      </style>

      <div class="main">
        <div class="bg"></div>
        <div class="sw-btns">
            <button class="sw-btn ${cv === 'person1' ? 'active' : ''}" id="btn-p1">${(this._config.person1?.name || 'PATRICK').toUpperCase()}</button>
            <button class="sw-btn ${cv === 'person2' ? 'active' : ''}" id="btn-p2">${(this._config.person2?.name || 'SANDRA').toUpperCase()}</button>
        </div>

        <div class="header" style="top: 75px;">⚡ FORME</div>
        <div class="header" style="top: 195px;">🌙 SOMMEIL</div>
        <div class="header" style="top: 335px;">🏥 SANTÉ</div>

        ${(p.sensors || []).map((s, i) => {
          const yPos = getBaseY(s.cat) + (parseInt(s.y_off) || 0);
          return `
          <div class="box" style="left:${s.x}%; top:${yPos}px; width:${s.w || 85}px; height:${s.h || 55}px; border-color:${s.col || '#334155'}">
            <ha-icon icon="${s.icon || 'mdi:heart'}" style="--mdc-icon-size:${s.fs_i || 18}px; color:${s.col || '#38bdf8'}"></ha-icon>
            <div class="lbl" style="font-size:${s.fs_l || 7}px;">${s.name}</div>
            <div class="val" id="s-${i}-v" style="font-size:${s.fs_v || 12}px;">--</div>
          </div>`;
        }).join('')}

        <div class="weight-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div><div style="font-size: 9px; opacity: 0.5;">ACTUEL</div><div style="font-size: 24px; font-weight:900; color:#38bdf8;" id="weight-val">--</div></div>
            <div style="text-align:right;"><div id="diff-val" style="font-size:16px; font-weight:bold;">--</div><div style="font-size: 9px; opacity: 0.5;">PROGRESSION</div></div>
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

/** ÉDITEUR VISUEL COMPLET V4.3.0 **/
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'config'; }
  setConfig(config) { this._config = config; this.render(); }

  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .ed { padding: 12px; background: #1c1c1e; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 8px; background: #2c2c2e; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; }
        .tab.active { background: #38bdf8; color: #000; }
        .s-card { background: #2c2c2e; padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #38bdf8; position: relative; }
        .row { display: flex; gap: 8px; margin-top: 5px; align-items: center; }
        input, select { width: 100%; padding: 7px; background: #000; color: #fff; border: 1px solid #444; border-radius: 4px; box-sizing: border-box; font-size: 11px; }
        label { font-size: 10px; opacity: 0.6; display: block; margin-top: 4px; }
        .btn-add { width: 100%; padding: 10px; background: #38bdf8; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin: 10px 0; }
        .btn-del { position: absolute; top: 10px; right: 10px; background: #ff5252; border: none; padding: 3px 8px; border-radius: 4px; color: white; cursor: pointer; }
      </style>
      <div class="ed">
        <div class="tabs">
          <button class="tab ${v==='person1'?'active':''}" id="sel-p1">PROFIL 1</button>
          <button class="tab ${v==='person2'?'active':''}" id="sel-p2">PROFIL 2</button>
        </div>
        <div class="tabs">
          <button class="tab ${this._tab==='config'?'active':''}" id="t-cfg">⚙️ GENERAL</button>
          <button class="tab ${this._tab==='sensors'?'active':''}" id="t-sns">📊 CAPTEURS</button>
        </div>

        ${this._tab === 'config' ? `
          <label>Prénom</label><input type="text" data-f="name" value="${p.name}">
          <label>Entité Poids</label><input type="text" data-f="weight_entity" value="${p.weight_entity}">
          <div class="row">
            <div style="flex:1"><label>Départ (kg)</label><input type="number" data-f="start" value="${p.start}"></div>
            <div style="flex:1"><label>Objectif (kg)</label><input type="number" data-f="ideal" value="${p.ideal}"></div>
          </div>
          <label>URL Image de fond</label><input type="text" data-f="image" value="${p.image||''}">
        ` : `
          ${(p.sensors || []).map((s, i) => `
            <div class="s-card">
              <button class="btn-del" data-idx="${i}">X</button>
              <div class="row">
                <div style="flex:2"><label>Nom</label><input type="text" data-idx="${i}" data-f="name" value="${s.name}"></div>
                <div style="flex:1"><label>Couleur Cadre</label><input type="color" data-idx="${i}" data-f="col" value="${s.col||'#38bdf8'}"></div>
              </div>
              <label>Entité</label><input type="text" data-idx="${i}" data-f="entity" value="${s.entity}">
              <div class="row">
                <div style="flex:1"><label>Icône</label><input type="text" data-idx="${i}" data-f="icon" value="${s.icon||'mdi:heart'}"></div>
                <div style="flex:1"><label>Catégorie</label>
                  <select data-idx="${i}" data-f="cat">
                    <option value="forme" ${s.cat==='forme'?'selected':''}>FORME</option>
                    <option value="sommeil" ${s.cat==='sommeil'?'selected':''}>SOMMEIL</option>
                    <option value="sante" ${s.cat==='sante'?'selected':''}>SANTÉ</option>
                  </select>
                </div>
              </div>
              <div class="row">
                <div style="flex:1"><label>X (%)</label><input type="number" data-idx="${i}" data-f="x" value="${s.x}"></div>
                <div style="flex:1"><label>Ajust. Y (px)</label><input type="number" data-idx="${i}" data-f="y_off" value="${s.y_off||0}"></div>
              </div>
              <div class="row">
                <div style="flex:1"><label>Largeur (px)</label><input type="number" data-idx="${i}" data-f="w" value="${s.w||85}"></div>
                <div style="flex:1"><label>Hauteur (px)</label><input type="number" data-idx="${i}" data-f="h" value="${s.h||55}"></div>
              </div>
              <div class="row">
                <div style="flex:1"><label>Taille Titre</label><input type="number" data-idx="${i}" data-f="fs_l" value="${s.fs_l||7}"></div>
                <div style="flex:1"><label>Taille Val.</label><input type="number" data-idx="${i}" data-f="fs_v" value="${s.fs_v||12}"></div>
                <div style="flex:1"><label>Taille Icône</label><input type="number" data-idx="${i}" data-f="fs_i" value="${s.fs_i||18}"></div>
              </div>
            </div>
          `).join('')}
          <button class="btn-add" id="add-s">+ AJOUTER UN CAPTEUR</button>
        `}
      </div>
    `;
    this._attach();
  }

  _attach() {
    this.querySelector('#sel-p1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#sel-p2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
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
      const p = this._config[this._config.current_view];
      if(!p.sensors) p.sensors = [];
      p.sensors.push({name:'Nouveau', entity:'', cat:'forme', x:50, w:85, h:55, col:'#38bdf8', icon:'mdi:heart'});
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
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard Smart V4.3.0", description: "Éditeur Total & Design Compact" });
