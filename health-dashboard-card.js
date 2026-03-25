/**
 * HEALTH DASHBOARD CARD – V3.5.0
 * SMART CATEGORIES & ADVANCED STYLING
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) { this._hass = hass; this.update(); }

  _setView(view) {
    this._config.current_view = view;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    this.render();
  }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view];
    if(!p || !p.sensors) return;
    
    p.sensors.forEach((s, i) => {
      const elV = this.shadowRoot.getElementById(`s-${i}-v`);
      const elU = this.shadowRoot.getElementById(`s-${i}-u`);
      if(elV && this._hass.states[s.entity]) {
        const state = this._hass.states[s.entity];
        const val = parseFloat(state.state);
        elV.textContent = isNaN(val) ? state.state : val.toFixed(1);
        if(elU) elU.textContent = " " + (state.attributes.unit_of_measurement || '');
      }
    });

    const stateW = this._hass.states[p.weight_entity];
    if (stateW && p.start && p.ideal) {
        const actuel = parseFloat(stateW.state);
        const start = parseFloat(p.start);
        const ideal = parseFloat(p.ideal);
        const diff = (actuel - start).toFixed(2);
        const pct = Math.max(0, Math.min(100, ((start - actuel) / (start - ideal)) * 100));
        const ptr = this.shadowRoot.getElementById('ptr');
        if(ptr) ptr.style.left = pct + '%';
        const wv = this.shadowRoot.getElementById('weight-val');
        if(wv) wv.textContent = actuel.toFixed(1) + ' kg';
        const dEl = this.shadowRoot.getElementById('diff-val');
        if(dEl) {
          dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
          dEl.style.background = diff < 0 ? '#4caf50' : '#ff5252';
        }
    }
  }

  render() {
    if (!this._config) return;
    const p = this._config[this._config.current_view] || { sensors: [] };
    const cv = this._config.current_view;

    const getY = (cat) => {
        if(cat === 'forme') return 160;
        if(cat === 'sommeil') return 350;
        if(cat === 'sante') return 540;
        return 160;
    };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 850}px; background: #0f172a; border-radius: 28px; overflow: hidden; font-family: 'Segoe UI', system-ui, sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.2; z-index:1; }
        .sw-btns { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 100; }
        .sw-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px 22px; border-radius: 14px; font-size: 12px; font-weight: 900; cursor: pointer; backdrop-filter: blur(15px); transition: 0.3s; }
        .sw-btn.active { background: #38bdf8; color: #000; box-shadow: 0 0 20px rgba(56,189,248,0.4); }
        .section-header { position: absolute; left: 25px; display: flex; align-items: center; gap: 12px; z-index: 5; width: 85%; }
        .section-header span { font-size: 11px; font-weight: 900; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; }
        .section-line { height: 1px; flex-grow: 1; background: linear-gradient(90deg, #38bdf8, transparent); }
        .box { position: absolute; background: rgba(15, 23, 42, 0.7); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(12px); text-align: center; box-sizing: border-box; padding: 10px; border: 1px solid rgba(255,255,255,0.1); transition: 0.3s; border-radius: 20px; }
        .ico { --mdc-icon-size: 26px; margin-bottom: 4px; }
        .lbl { font-size: 0.7em; opacity: 0.6; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
        .val { font-weight: 800; line-height: 1; }
        .uni { font-size: 0.6em; opacity: 0.5; }
        .weight-area { position: absolute; bottom: 35px; left: 5%; width: 90%; z-index: 20; background: rgba(255,255,255,0.03); padding: 25px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .weight-track { position: relative; width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 50px; }
        .ptr { position: absolute; top: -10px; width: 6px; height: 30px; background: #fff; border-radius: 3px; transition: 1s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 15px #fff; }
        .bub { position: absolute; top: -85px; left: 50%; transform: translateX(-50%); background: #38bdf8; color: #000; padding: 12px 20px; border-radius: 18px; font-weight: 900; min-width: 110px; }
        #diff-val { display: block; font-size: 10px; border-radius: 6px; padding: 2px 8px; color: #fff; margin-top: 4px; }
        .mkr { position: absolute; top: 22px; transform: translateX(-50%); font-size: 9px; opacity: 0.5; font-weight: bold; text-align: center; }
      </style>

      <div class="main">
        <div class="bg"></div>
        <div class="sw-btns">
            <button class="sw-btn ${cv==='person1'?'active':''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv==='person2'?'active':''}" id="btn-p2">SANDRA</button>
        </div>

        <div class="section-header" style="top: 100px;"><span>⚡ ÉTAT DE FORME</span><div class="section-line"></div></div>
        <div class="section-header" style="top: 290px;"><span>🌙 SOMMEIL</span><div class="section-line"></div></div>
        <div class="section-header" style="top: 480px;"><span>🏥 SANTÉ</span><div class="section-line"></div></div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${getY(s.cat)}px; width:${s.w||110}px; height:85px; border-color:${s.col||'rgba(255,255,255,0.1)'}; transform: translate(-50%, -50%);">
            <ha-icon icon="${s.icon||'mdi:heart'}" class="ico" style="color:${s.col||'#38bdf8'}"></ha-icon>
            <div class="lbl">${s.name}</div>
            <div class="val-wrap" style="color:${s.col||'#fff'}; font-size:${s.fs||1.4}em;">
                <span id="s-${i}-v" class="val">--</span><span id="s-${i}-u" class="uni"></span>
            </div>
          </div>`).join('')}

        <div class="weight-area">
            <div class="weight-track">
                <div class="mkr" style="left:0">START<br>${p.start||'-'}</div>
                <div class="mkr" style="left:50%">CONFORT<br>${p.confort||'-'}</div>
                <div class="mkr" style="left:100%">GOAL<br>${p.ideal||'-'}</div>
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
  constructor() { super(); this._tab = 'poids'; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  
  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v] || { sensors: [] };
    this.innerHTML = `
      <style>
        .ed { padding: 15px; background: #111; color: #eee; font-family: sans-serif; }
        .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 15px; }
        .tab { padding: 10px; background: #222; border-radius: 6px; border:none; color:#aaa; cursor:pointer; font-size: 11px; font-weight: bold; }
        .active { background: #38bdf8 !important; color: #000 !important; }
        .sec { background: #1a1a1a; padding: 15px; border-radius: 12px; margin-bottom: 10px; border: 1px solid #333; }
        label { color: #38bdf8; font-size: 10px; display: block; margin-top: 12px; text-transform: uppercase; font-weight: 800; }
        input, select { width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #333; border-radius: 6px; margin-top: 5px; box-sizing: border-box; }
        .row { display: flex; gap: 8px; }
        .btn-add { width:100%; padding:12px; border-radius:8px; border:none; font-weight:bold; cursor:pointer; margin-top:10px; }
      </style>
      <div class="ed">
        <div class="tabs">
            <button class="tab ${this._tab==='poids'?'active':''}" data-t="poids">⚖️ POIDS / DESIGN</button>
            <button class="tab ${this._tab==='forme'?'active':''}" data-t="forme">⚡ FORME</button>
            <button class="tab ${this._tab==='sommeil'?'active':''}" data-t="sommeil">🌙 SOMMEIL</button>
            <button class="tab ${this._tab==='sante'?'active':''}" data-t="sante">🏥 SANTÉ</button>
        </div>

        ${this._tab === 'poids' ? `
            <div class="sec">
                <label>Capteur Poids</label><input type="text" data-f="weight_entity" value="${p.weight_entity||''}">
                <div class="row">
                    <div><label>Départ</label><input type="number" step="0.1" data-f="start" value="${p.start}"></div>
                    <div><label>Idéal</label><input type="number" step="0.1" data-f="ideal" value="${p.ideal}"></div>
                </div>
                <label>Image de fond (URL)</label><input type="text" data-f="image" value="${p.image||''}">
                <label>Hauteur Carte (px)</label><input type="number" id="ch" value="${this._config.card_height||850}">
            </div>` : ''}

        ${['forme', 'sommeil', 'sante'].includes(this._tab) ? `
            ${(p.sensors || []).filter(s => s.cat === this._tab).map((s, i) => {
                const globalIdx = p.sensors.indexOf(s);
                return `
                <div class="sec">
                    <label>Nom & Entité</label>
                    <div class="row"><input type="text" data-idx="${globalIdx}" data-f="name" value="${s.name}"><input type="text" data-idx="${globalIdx}" data-f="icon" value="${s.icon}"></div>
                    <input type="text" data-idx="${globalIdx}" data-f="entity" value="${s.entity}">
                    
                    <div class="row">
                        <div><label>Pos X (%)</label><input type="number" data-idx="${globalIdx}" data-f="x" value="${s.x}"></div>
                        <div><label>Couleur</label><input type="color" data-idx="${globalIdx}" data-f="col" value="${s.col||'#38bdf8'}"></div>
                    </div>
                    <div class="row">
                        <div><label>Taille Texte</label><input type="number" step="0.1" data-idx="${globalIdx}" data-f="fs" value="${s.fs||1.4}"></div>
                        <div><label>Largeur Cadre</label><input type="number" data-idx="${globalIdx}" data-f="w" value="${s.w||110}"></div>
                    </div>
                    <button class="del-s" data-idx="${globalIdx}" style="width:100%; background:#442222; color:#ff5252; border:1px solid #ff5252; padding:8px; margin-top:10px; border-radius:6px; cursor:pointer;">Supprimer</button>
                </div>`;
            }).join('')}
            <button class="btn-add active" id="add-s">+ AJOUTER À ${this._tab.toUpperCase()}</button>
        ` : ''}
      </div>
    `;
    this._attach();
  }

  _attach() {
    this.querySelectorAll('.tab').forEach(btn => btn.onclick = () => { this._tab = btn.dataset.t; this.render(); });
    this.querySelectorAll('input').forEach(el => el.onchange = () => {
        const p = this._config[this._config.current_view];
        if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = el.value;
        else if(el.id === 'ch') this._config.card_height = el.value;
        else p[el.dataset.f] = el.value;
        this._save();
    });
    const add = this.querySelector('#add-s'); 
    if(add) add.onclick = () => {
        const p = this._config[this._config.current_view];
        if(!p.sensors) p.sensors = [];
        p.sensors.push({ name: 'Nouveau', entity: '', icon: 'mdi:heart', cat: this._tab, x: 50, col: '#38bdf8', fs: 1.4, w: 110 });
        this._save(); this.render();
    };
    this.querySelectorAll('.del-s').forEach(btn => btn.onclick = () => {
        this._config[this._config.current_view].sensors.splice(btn.dataset.idx, 1);
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
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard Smart V3.5", description: "Catégories automatiques et style avancé." });
