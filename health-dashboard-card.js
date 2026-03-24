/**
 * HEALTH DASHBOARD CARD – V3.2.1
 * RESTAURATION COMPLÈTE : RÉGLAGES SENSORS, TITRES ET BORDURES
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

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view];
    
    const setV = (idV, idU, ent) => {
      const elV = this.shadowRoot.getElementById(idV);
      const elU = this.shadowRoot.getElementById(idU);
      if(elV && elU && ent && this._hass.states[ent]) {
        const s = this._hass.states[ent];
        elV.textContent = s.state;
        elU.textContent = s.attributes.unit_of_measurement || '';
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
        const diff = (actuel - start).toFixed(1);
        const pct = Math.max(0, Math.min(100, ((start - actuel) / (start - ideal)) * 100));
        
        this.shadowRoot.getElementById('ptr').style.left = pct + '%';
        this.shadowRoot.getElementById('ptr-v').textContent = actuel + ' kg';
        const dEl = this.shadowRoot.getElementById('diff');
        dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
        dEl.style.color = diff < 0 ? '#4caf50' : (diff > 0 ? '#f44336' : '#fff');
    }
  }

  render() {
    if (!this._config) return;
    const p = this._config[this._config.current_view] || {};
    
    const getStyle = (o, pr) => {
      const isC = o[pr+'circle'];
      const w = o[pr+'w']||100;
      return `left:${o[pr+'x']||50}%; top:${o[pr+'y']||50}%; width:${w}px; height:${isC?w:(o[pr+'h']||80)}px; border-radius:${isC?'50%':(o[pr+'r']||8)+'px'}; border:${o[pr+'bw']||1}px solid ${o[pr+'bc']||'#fff'}; transform: translate(-50%, -50%) rotate(${o[pr+'rot']||0}deg); font-size:${o[pr+'ts']||1.6}em;`;
    };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.25; z-index:1; }
        .box { position: absolute; background: rgba(15, 23, 42, 0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; box-sizing: border-box; padding: 5px; }
        .ico { --mdc-icon-size: 20px; opacity: 0.6; }
        .lbl { font-size: 10px; opacity: 0.7; font-weight: bold; text-transform: uppercase; }
        .val { font-weight: bold; line-height: 1.1; }
        .uni { font-size: 0.5em; opacity: 0.6; display: block; }
        .weight-track { position: absolute; left: 10%; width: 80%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; top: ${p.bar_y || 88}%; z-index:20; }
        .ptr { position: absolute; top: -8px; width: 2px; height: 20px; background: #fff; transition: left 1s; }
        .bub { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: ${p.bar_c || '#38bdf8'}; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .diff { position: absolute; top: 22px; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: bold; }
        .mkr { position: absolute; top: 10px; transform: translateX(-50%); font-size: 9px; opacity: 0.6; text-align: center; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="box" style="${getStyle(p, 'imc_')}">${p.imc_icon?`<ha-icon icon="${p.imc_icon}" class="ico"></ha-icon>`:''}<div class="lbl">${p.imc_name||'IMC'}</div><div class="val"><span id="imc-v">--</span><span id="imc-u" class="uni"></span></div></div>
        <div class="box" style="${getStyle(p, 'corp_')}">${p.corp_icon?`<ha-icon icon="${p.corp_icon}" class="ico"></ha-icon>`:''}<div class="lbl">${p.corp_name||'CORP'}</div><div class="val"><span id="corp-v">--</span><span id="corp-u" class="uni"></span></div></div>
        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.circle?s.w:s.h}px; border-radius:${s.circle?'50%':(s.r||8)+'px'}; border:${s.bw||1}px solid ${s.bc||'#fff'}; transform: translate(-50%, -50%) rotate(${s.rot||0}deg); font-size:${s.ts||1.6}em;">
            ${s.icon?`<ha-icon icon="${s.icon}" class="ico"></ha-icon>`:''}<div class="lbl">${s.name}</div><div class="val"><span id="s-${i}-v">--</span><span id="s-${i}-u" class="uni"></span></div>
          </div>`).join('')}
        <div class="weight-track">
            <div class="mkr" style="left:0">Départ<br>${p.start||'-'}</div>
            <div class="mkr" style="left:50%">Confort<br>${p.confort||'-'}</div>
            <div class="mkr" style="left:100%">Idéal<br>${p.ideal||'-'}</div>
            <div id="ptr" class="ptr"><div id="ptr-v" class="bub">--</div><div id="diff" class="diff">--</div></div>
        </div>
      </div>
    `;
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
        .ed { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
        .tab { flex: 1; padding: 10px; background: #333; cursor: pointer; text-align:center; border-radius: 4px; font-size: 11px; border:none; color:white; font-weight:bold; }
        .active { background: #38bdf8 !important; color: black !important; }
        .sec { background: #252525; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #111; color: white; border: 1px solid #444; border-radius: 4px; box-sizing: border-box; margin-bottom: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
      </style>
      <div class="ed">
        <div class="tabs">
            ${['poids', 'sante', 'sensors', 'design'].map(t => `<button class="tab ${this._tab===t?'active':''}" data-t="${t}">${t.toUpperCase()}</button>`).join('')}
        </div>
        ${this._tab === 'poids' ? `
            <div class="sec">
                <label>Entité Poids</label><input type="text" data-f="weight_entity" value="${p.weight_entity||''}">
                <div class="grid">
                    <div><label>Départ</label><input type="number" data-f="start" value="${p.start}"></div>
                    <div><label>Confort</label><input type="number" data-f="confort" value="${p.confort}"></div>
                    <div><label>Idéal</label><input type="number" data-f="ideal" value="${p.ideal}"></div>
                </div>
                <div class="grid">
                    <div><label>Pos Y %</label><input type="number" data-f="bar_y" value="${p.bar_y||88}"></div>
                    <div><label>Couleur</label><input type="color" data-f="bar_c" value="${p.bar_c||'#38bdf8'}"></div>
                </div>
            </div>` : ''}
        ${this._tab === 'sante' ? this._boxUI(p, 'IMC', 'imc_') + this._boxUI(p, 'CORPULENCE', 'corp_') : ''}
        ${this._tab === 'sensors' ? (p.sensors || []).map((s, i) => this._boxUI(s, `Sensor ${i+1}`, '', true, i)).join('') + '<button class="tab active" style="width:100%" id="add-s">+ AJOUTER SENSOR</button>' : ''}
        ${this._tab === 'design' ? `<div class="sec"><label>Fond (URL)</label><input type="text" data-f="image" value="${p.image||''}">
            <label>Hauteur Carte</label><input type="number" id="ch" value="${this._config.card_height||600}">
            <select id="ps" style="width:100%; padding:10px; background:#111; color:white; margin-top:10px;"><option value="person1" ${v==='person1'?'selected':''}>Patrick</option><option value="person2" ${v==='person2'?'selected':''}>Sandra</option></select></div>` : ''}
      </div>
    `;
    this._attach();
  }

  _boxUI(obj, label, pr, isS = false, idx = 0) {
    const f = (n) => isS ? n : pr + n;
    const d = isS ? `data-idx="${idx}"` : '';
    return `<div class="sec">
        <label>${label} - NOM & ENTITÉ</label>
        <input type="text" ${d} data-f="${f('name')}" value="${obj[f('name')]||''}" placeholder="Nom">
        <div class="grid" style="grid-template-columns: 2fr 1fr;">
            <input type="text" ${d} data-f="${f('entity')}" value="${obj[f('entity')]||''}" placeholder="sensor.xxx">
            <input type="text" ${d} data-f="${f('icon')}" value="${obj[f('icon')]||''}" placeholder="mdi:fire">
        </div>
        <div class="grid">
            <div><label>X %</label><input type="number" ${d} data-f="${f('x')}" value="${obj[f('x')]||50}"></div>
            <div><label>Y %</label><input type="number" ${d} data-f="${f('y')}" value="${obj[f('y')]||50}"></div>
            <div><label>Texte</label><input type="number" step="0.1" ${d} data-f="${f('ts')}" value="${obj[f('ts')]||1.6}"></div>
        </div>
        <div class="grid">
            <div><label>W / H</label><input type="number" ${d} data-f="${f('w')}" value="${obj[f('w')]||100}"><input type="number" ${d} data-f="${f('h')}" value="${obj[f('h')]||80}"></div>
            <div><label>Bord / R</label><input type="number" ${d} data-f="${f('bw')}" value="${obj[f('bw')]||1}"><input type="number" ${d} data-f="${f('r')}" value="${obj[f('r')]||8}"></div>
            <div><label>Couleur</label><input type="color" ${d} data-f="${f('bc')}" value="${obj[f('bc')]||'#ffffff'}"></div>
        </div>
        ${isS?`<button style="width:100%;background:#ff5252;border:none;color:white;padding:5px;margin-top:5px;cursor:pointer;" class="del-s" data-idx="${idx}">SUPPRIMER</button>`:''}
    </div>`;
  }

  _attach() {
    this.querySelectorAll('.tab').forEach(btn => btn.onclick = () => { if(btn.dataset.t){ this._tab = btn.dataset.t; this.render(); } });
    this.querySelectorAll('input, select').forEach(el => el.onchange = () => {
        const p = this._config[this._config.current_view];
        const val = el.type === 'checkbox' ? el.checked : el.value;
        if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = val;
        else if(el.id === 'ch') this._config.card_height = val;
        else if(el.id === 'ps') this._config.current_view = val;
        else p[el.dataset.f] = val;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    });
    const add = this.querySelector('#add-s'); if(add) add.onclick = () => { const p = this._config[this._config.current_view]; if(!p.sensors) p.sensors = []; p.sensors.push({name:'Nouveau', x:50, y:50, w:100, h:80, bc:'#ffffff', ts:1.6}); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); };
    this.querySelectorAll('.del-s').forEach(btn => btn.onclick = () => { this._config[this._config.current_view].sensors.splice(btn.dataset.idx, 1); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); });
  }
}
customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
