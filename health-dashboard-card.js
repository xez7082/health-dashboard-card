/**
 * HEALTH DASHBOARD CARD – V3.4.1
 * VERSION ULTIME : SECTIONS THÉMATIQUES, GLASSMORPHISM & FULL SENSORS
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
    
    const setV = (idV, idU, ent) => {
      const elV = this.shadowRoot.getElementById(idV);
      const elU = this.shadowRoot.getElementById(idU);
      if(elV && elU && ent && this._hass.states[ent]) {
        const s = this._hass.states[ent];
        const val = parseFloat(s.state);
        elV.textContent = isNaN(val) ? s.state : val.toFixed(2);
        elU.textContent = " " + (s.attributes.unit_of_measurement || '');
      }
    };
    
    setV('imc-v', 'imc-u', p.imc_entity);
    setV('corp-v', 'corp-u', p.corp_entity);
    if(p.sensors) p.sensors.forEach((s, i) => setV(`s-${i}-v`, `s-${i}-u`, s.entity));

    const stateW = this._hass.states[p.weight_entity];
    if (stateW && p.start && p.ideal) {
        const actuel = parseFloat(stateW.state);
        const start = parseFloat(p.start);
        const ideal = parseFloat(p.ideal);
        const diff = (actuel - start).toFixed(2);
        const pct = Math.max(0, Math.min(100, ((start - actuel) / (start - ideal)) * 100));
        
        const ptr = this.shadowRoot.getElementById('ptr');
        if(ptr) ptr.style.left = pct + '%';
        this.shadowRoot.getElementById('weight-val').textContent = actuel.toFixed(2) + ' kg';
        const dEl = this.shadowRoot.getElementById('diff-val');
        if(dEl) {
          dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
          dEl.style.background = diff < 0 ? '#4caf50' : (diff > 0 ? '#ff5252' : 'rgba(255,255,255,0.2)');
        }
    }
  }

  render() {
    if (!this._config) return;
    const p = this._config[this._config.current_view] || {};
    const cv = this._config.current_view;
    
    const getStyle = (obj, pr) => {
      const w = obj[pr+'w'] || 110;
      const h = obj[pr+'h'] || 80;
      return `left:${obj[pr+'x']||50}%; top:${obj[pr+'y']||50}%; width:${w}px; height:${h}px; border-radius:${obj[pr+'r']||12}px; border:${obj[pr+'bw']||1}px solid ${obj[pr+'bc']||'rgba(255,255,255,0.1)'}; transform: translate(-50%, -50%); font-size:${obj[pr+'ts']||1}rem;`;
    };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 650}px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: 'Segoe UI', system-ui, sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.25; z-index:1; }
        
        /* Navigation */
        .sw-btns { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 100; }
        .sw-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 18px; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; backdrop-filter: blur(12px); transition: 0.3s; letter-spacing: 1px; }
        .sw-btn.active { background: #38bdf8; color: #0f172a; border-color: #38bdf8; box-shadow: 0 0 20px rgba(56, 189, 248, 0.4); }

        /* Titres de Sections */
        .section-title { position: absolute; font-size: 10px; font-weight: 900; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; opacity: 0.9; z-index: 5; padding-left: 10px; border-left: 2px solid #38bdf8; }

        /* Boîtes de Sensors */
        .box { position: absolute; background: rgba(15, 23, 42, 0.8); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(10px); text-align: center; box-sizing: border-box; padding: 10px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .box:hover { transform: translate(-50%, -55%) scale(1.05); border-color: #38bdf8 !important; box-shadow: 0 10px 20px rgba(0,0,0,0.4); }
        
        .ico { --mdc-icon-size: 26px; color: #38bdf8; margin-bottom: 6px; }
        .lbl { font-size: 0.65em; opacity: 0.6; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
        .val-wrap { font-weight: 800; line-height: 1; display: flex; align-items: baseline; justify-content: center; width: 100%; }
        .val { font-size: 1.4em; color: #fff; }
        .uni { font-size: 0.8em; opacity: 0.4; margin-left: 3px; }

        /* Barre de Poids */
        .weight-area { position: absolute; bottom: 35px; left: 10%; width: 80%; z-index: 20; }
        .weight-track { position: relative; width: 100%; height: 14px; background: rgba(255,255,255,0.1); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); margin-top: 55px; }
        .ptr { position: absolute; top: -9px; width: 5px; height: 32px; background: #fff; border-radius: 3px; transition: left 1s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 0 15px rgba(255,255,255,0.5); }
        
        .bub { position: absolute; top: -85px; left: 50%; transform: translateX(-50%); background: ${p.bar_c || '#38bdf8'}; color: #000; padding: 10px 16px; border-radius: 14px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.6); min-width: 100px; }
        #weight-val { display: block; font-size: 15px; letter-spacing: -0.5px; }
        #diff-val { display: block; font-size: 11px; border-radius: 6px; padding: 2px 8px; color: #fff; margin-top: 4px; font-weight: 800; }
        
        .mkr { position: absolute; top: 22px; transform: translateX(-50%); font-size: 9px; font-weight: 800; opacity: 0.5; text-align: center; line-height: 1.3; width: 70px; }
      </style>

      <div class="main">
        <div class="bg"></div>

        <div class="sw-btns">
            <button class="sw-btn ${cv==='person1'?'active':''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv==='person2'?'active':''}" id="btn-p2">SANDRA</button>
        </div>

        <div class="section-title" style="top: 85px; left: 25px;">⚡ ÉTAT DE FORME</div>
        <div class="section-title" style="top: 290px; left: 25px;">🌙 QUALITÉ DU SOMMEIL</div>
        <div class="section-title" style="bottom: 145px; left: 25px;">⚖️ SUIVI DE POIDS</div>

        <div class="box" style="${getStyle(p, 'imc_')}">
          <ha-icon icon="${p.imc_icon || 'mdi:human-measure'}" class="ico"></ha-icon>
          <div class="lbl">${p.imc_name || 'IMC'}</div>
          <div class="val-wrap"><span id="imc-v" class="val">--</span><span id="imc-u" class="uni"></span></div>
        </div>

        <div class="box" style="${getStyle(p, 'corp_')}">
          <ha-icon icon="${p.corp_icon || 'mdi:body-proportions'}" class="ico"></ha-icon>
          <div class="lbl">${p.corp_name || 'CORP.'}</div>
          <div class="val-wrap"><span id="corp-v" class="val">--</span><span id="corp-u" class="uni"></span></div>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.h}px; border-radius:${s.r||12}px; border:${s.bw||1}px solid ${s.bc||'rgba(255,255,255,0.1)'}; transform: translate(-50%, -50%);">
            ${s.icon ? `<ha-icon icon="${s.icon}" class="ico"></ha-icon>` : ''}
            <div class="lbl">${s.name}</div>
            <div class="val-wrap"><span id="s-${i}-v" class="val">--</span><span id="s-${i}-u" class="uni"></span></div>
          </div>`).join('')}

        <div class="weight-area">
            <div class="weight-track">
                <div class="mkr" style="left:0">DÉPART<br>${p.start||'-'} kg</div>
                <div class="mkr" style="left:50%">CONFORT<br>${p.confort||'-'} kg</div>
                <div class="mkr" style="left:100%">IDÉAL<br>${p.ideal||'-'} kg</div>
                <div id="ptr" class="ptr">
                    <div class="bub">
                        <span id="weight-val">--</span>
                        <span id="diff-val">--</span>
                    </div>
                </div>
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
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .ed { padding: 15px; background: #1a1a1a; color: white; font-family: sans-serif; border-radius: 8px; }
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; background: #333; cursor: pointer; text-align:center; border-radius: 6px; font-size: 10px; border:none; color:white; font-weight:900; letter-spacing: 1px; }
        .active { background: #38bdf8 !important; color: #000 !important; }
        .sec { background: #252525; padding: 15px; border-radius: 10px; margin-bottom: 12px; border-left: 4px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 10px; text-transform: uppercase; }
        input, select { width: 100%; padding: 10px; background: #111; color: white; border: 1px solid #444; border-radius: 6px; box-sizing: border-box; margin-top: 5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
      </style>
      <div class="ed">
        <div class="tabs">
            ${['poids', 'sante', 'sensors', 'design'].map(t => `<button class="tab ${this._tab===t?'active':''}" data-t="${t}">${t.toUpperCase()}</button>`).join('')}
        </div>
        ${this._tab === 'poids' ? `
            <div class="sec">
                <label>Entité Poids</label><input type="text" data-f="weight_entity" value="${p.weight_entity||''}">
                <div class="grid">
                    <div><label>Départ</label><input type="number" step="0.01" data-f="start" value="${p.start}"></div>
                    <div><label>Confort</label><input type="number" step="0.01" data-f="confort" value="${p.confort}"></div>
                    <div><label>Idéal</label><input type="number" step="0.01" data-f="ideal" value="${p.ideal}"></div>
                </div>
                <div class="grid">
                    <div><label>Pos Y %</label><input type="number" data-f="bar_y" value="${p.bar_y||88}"></div>
                    <div><label>Couleur Bulle</label><input type="color" data-f="bar_c" value="${p.bar_c||'#38bdf8'}"></div>
                </div>
            </div>` : ''}
        ${this._tab === 'sante' ? this._boxUI(p, 'IMC', 'imc_') + this._boxUI(p, 'CORPULENCE', 'corp_') : ''}
        ${this._tab === 'sensors' ? (p.sensors || []).map((s, i) => this._boxUI(s, `Sensor ${i+1}`, '', true, i)).join('') + '<button class="tab active" style="width:100%; margin-top:10px;" id="add-s">+ AJOUTER SENSOR</button>' : ''}
        ${this._tab === 'design' ? `<div class="sec"><label>Image Fond (URL)</label><input type="text" data-f="image" value="${p.image||''}">
            <label>Hauteur Totale (px)</label><input type="number" id="ch" value="${this._config.card_height||650}">
            <label>Vue par défaut</label><select id="ps"><option value="person1" ${v==='person1'?'selected':''}>Patrick</option><option value="person2" ${v==='person2'?'selected':''}>Sandra</option></select></div>` : ''}
      </div>
    `;
    this._attach();
  }

  _boxUI(obj, label, pr, isS = false, idx = 0) {
    const f = (n) => isS ? n : pr + n;
    const d = isS ? `data-idx="${idx}"` : '';
    return `<div class="sec">
        <label>${label}</label>
        <div class="grid" style="grid-template-columns: 2fr 1fr;">
            <input type="text" ${d} data-f="${f('name')}" value="${obj[f('name')]||''}" placeholder="Nom">
            <input type="text" ${d} data-f="${f('icon')}" value="${obj[f('icon')]||''}" placeholder="mdi:icon">
        </div>
        <label>Entité</label><input type="text" ${d} data-f="${f('entity')}" value="${obj[f('entity')]||''}" placeholder="sensor.xxx">
        <div class="grid">
            <div><label>X %</label><input type="number" ${d} data-f="${f('x')}" value="${obj[f('x')]||50}"></div>
            <div><label>Y %</label><input type="number" ${d} data-f="${f('y')}" value="${obj[f('y')]||50}"></div>
            <div><label>W/H px</label><div style="display:flex;gap:2px"><input type="number" ${d} data-f="${f('w')}" value="${obj[f('w')]||110}"><input type="number" ${d} data-f="${f('h')}" value="${obj[f('h')]||80}"></div></div>
        </div>
        ${isS?`<button style="width:100%;background:#ff5252;border:none;color:white;padding:8px;margin-top:10px;cursor:pointer;border-radius:6px;font-weight:bold" class="del-s" data-idx="${idx}">SUPPRIMER</button>`:''}
    </div>`;
  }

  _attach() {
    this.querySelectorAll('.tab').forEach(btn => btn.onclick = () => { this._tab = btn.dataset.t; this.render(); });
    this.querySelectorAll('input, select').forEach(el => el.onchange = () => {
        const p = this._config[this._config.current_view];
        if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = el.value;
        else if(el.id === 'ch') this._config.card_height = el.value;
        else if(el.id === 'ps') this._config.current_view = el.value;
        else p[el.dataset.f] = el.value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    });
    const add = this.querySelector('#add-s'); if(add) add.onclick = () => { const p = this._config[this._config.current_view]; if(!p.sensors) p.sensors = []; p.sensors.push({name:'Nouveau', x:50, y:350, w:110, h:80, bc:'rgba(255,255,255,0.1)', ts:1}); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); };
    this.querySelectorAll('.del-s').forEach(btn => btn.onclick = () => { this._config[this._config.current_view].sensors.splice(btn.dataset.idx, 1); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); });
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
