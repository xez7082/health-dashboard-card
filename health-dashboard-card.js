/**
 * HEALTH DASHBOARD CARD – V3.3.2
 * CORRECTION : 2 CHIFFRES APRÈS LA VIRGULE ET POSITIONNEMENT DU DIFFÉRENTIEL
 */

// ... (Le début de la classe HealthDashboardCard reste identique jusqu'à la méthode update)

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view];
    
    // ... (Logique setV identique)
    
    const stateW = this._hass.states[p.weight_entity];
    if (stateW && p.start && p.ideal) {
        const actuel = parseFloat(stateW.state);
        const start = parseFloat(p.start);
        const ideal = parseFloat(p.ideal);
        const diff = (actuel - start).toFixed(2); // Fixé à 2 chiffres
        const pct = Math.max(0, Math.min(100, ((start - actuel) / (start - ideal)) * 100));
        
        const ptr = this.shadowRoot.getElementById('ptr');
        ptr.style.left = pct + '%';
        
        // Affichage actuel (2 chiffres)
        this.shadowRoot.getElementById('ptr-v').textContent = actuel.toFixed(2) + ' kg';
        
        // Affichage différentiel (2 chiffres)
        const dEl = this.shadowRoot.getElementById('diff');
        dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
        dEl.style.color = diff < 0 ? '#4caf50' : (diff > 0 ? '#ff5252' : '#ffffff');
    }
  }

  render() {
    if (!this._config) return;
    const p = this._config[this._config.current_view] || {};
    
    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .box { position: absolute; background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(10px); text-align: center; border: 1px solid #fff; box-sizing: border-box; }
        
        /* Barre de poids lisible */
        .weight-track { position: absolute; left: 10%; width: 80%; height: 16px; background: rgba(255,255,255,0.1); border-radius: 8px; top: ${p.bar_y || 88}%; z-index:20; }
        .ptr { position: absolute; top: -10px; width: 6px; height: 36px; background: #fff; border-radius: 3px; transition: left 1s; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        
        /* Bulle avec Poids actuel et Différentiel séparés */
        .bub { position: absolute; top: -65px; left: 50%; transform: translateX(-50%); background: ${p.bar_c || '#38bdf8'}; color: #000; padding: 6px 12px; border-radius: 8px; font-weight: 900; font-size: 15px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.5); text-align: center; }
        .diff { font-size: 12px; font-weight: bold; color: #fff; display: block; margin-top: 2px; }
        
        .mkr { position: absolute; top: 22px; transform: translateX(-50%); font-size: 11px; font-weight: bold; opacity: 0.8; text-align: center; }
      </style>
      <div class="main">
        <div class="weight-track">
            <div class="mkr" style="left:0">DÉPART<br>${p.start||'-'}</div>
            <div class="mkr" style="left:50%">CONFORT<br>${p.confort||'-'}</div>
            <div class="mkr" style="left:100%">IDÉAL<br>${p.ideal||'-'}</div>
            
            <div id="ptr" class="ptr">
                <div id="ptr-v" class="bub">
                    <span id="weight-val">--</span>
                    <span id="diff" class="diff">--</span>
                </div>
            </div>
        </div>
      </div>
    `;
  }
}


    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: 'Roboto', sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.25; z-index:1; }
        .box { position: absolute; background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(10px); text-align: center; box-sizing: border-box; padding: 5px; }
        .ico { --mdc-icon-size: 24px; opacity: 0.7; margin-bottom: 4px; }
        .lbl { font-size: 0.7em; opacity: 0.6; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        .val-wrap { display: flex; align-items: baseline; gap: 6px; }
        .val { font-size: 1.6em; font-weight: 900; line-height: 1; }
        .uni { font-size: 0.8em; font-weight: 400; opacity: 0.8; }

        /* Barre de poids lisible */
        .weight-track { position: absolute; left: 10%; width: 80%; height: 14px; background: rgba(255,255,255,0.1); border-radius: 7px; top: ${p.bar_y || 88}%; z-index:20; border: 1px solid rgba(255,255,255,0.2); }
        .ptr { position: absolute; top: -5px; width: 4px; height: 24px; background: #fff; border-radius: 2px; transition: left 1s cubic-bezier(0.4, 0, 0.2, 1); shadow: 0 0 10px rgba(0,0,0,0.5); }
        .bub { position: absolute; top: -50px; left: 50%; transform: translateX(-50%); background: ${p.bar_c || '#38bdf8'}; color: #000; padding: 5px 12px; border-radius: 8px; font-weight: 900; font-size: 16px; white-space: nowrap; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
        .diff { position: absolute; top: -24px; left: 50%; transform: translateX(-50%); font-size: 13px; font-weight: bold; white-space: nowrap; }
        .mkr { position: absolute; top: 20px; transform: translateX(-50%); font-size: 11px; font-weight: bold; opacity: 0.8; text-align: center; line-height: 1.2; }
      </style>

      <div class="main">
        <div class="bg"></div>
        
        <div class="box" style="${getStyle(p, 'imc_')}">
            ${p.imc_icon?`<ha-icon icon="${p.imc_icon}" class="ico"></ha-icon>`:''}
            <div class="lbl">${p.imc_name||'IMC'}</div>
            <div class="val-wrap"><span id="imc-v" class="val">--</span><span id="imc-u" class="uni"></span></div>
        </div>

        <div class="box" style="${getStyle(p, 'corp_')}">
            ${p.corp_icon?`<ha-icon icon="${p.corp_icon}" class="ico"></ha-icon>`:''}
            <div class="lbl">${p.corp_name||'CORP'}</div>
            <div class="val-wrap"><span id="corp-v" class="val">--</span><span id="corp-u" class="uni"></span></div>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.circle?s.w:s.h}px; border-radius:${s.circle?'50%':(s.r||8)+'px'}; border:${s.bw||1}px solid ${s.bc||'#fff'}; transform: translate(-50%, -50%); font-size:${s.ts||1}rem;">
            ${s.icon?`<ha-icon icon="${s.icon}" class="ico"></ha-icon>`:''}
            <div class="lbl">${s.name}</div>
            <div class="val-wrap"><span id="s-${i}-v" class="val">--</span><span id="s-${i}-u" class="uni"></span></div>
          </div>`).join('')}

        <div class="weight-track">
            <div class="mkr" style="left:0; color:#aaa;">DÉPART<br>${p.start||'-'} kg</div>
            <div class="mkr" style="left:50%; color:#38bdf8;">CONFORT<br>${p.confort||'-'} kg</div>
            <div class="mkr" style="left:100%; color:#4caf50;">IDÉAL<br>${p.ideal||'-'} kg</div>
            <div id="ptr" class="ptr">
                <div id="ptr-v" class="bub">--</div>
                <div id="diff" class="diff">--</div>
            </div>
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
        input, select { width: 100%; padding: 8px; background: #111; color: white; border: 1px solid #444; border-radius: 4px; box-sizing: border-box; margin-bottom: 4px; }
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
                    <div><label>Départ</label><input type="number" step="0.1" data-f="start" value="${p.start}"></div>
                    <div><label>Confort</label><input type="number" step="0.1" data-f="confort" value="${p.confort}"></div>
                    <div><label>Idéal</label><input type="number" step="0.1" data-f="ideal" value="${p.ideal}"></div>
                </div>
                <div class="grid">
                    <div><label>Pos Y %</label><input type="number" data-f="bar_y" value="${p.bar_y||88}"></div>
                    <div><label>Couleur Bulle</label><input type="color" data-f="bar_c" value="${p.bar_c||'#38bdf8'}"></div>
                </div>
            </div>` : ''}
        ${this._tab === 'sante' ? this._boxUI(p, 'IMC', 'imc_') + this._boxUI(p, 'CORPULENCE', 'corp_') : ''}
        ${this._tab === 'sensors' ? (p.sensors || []).map((s, i) => this._boxUI(s, `Sensor ${i+1}`, '', true, i)).join('') + '<button class="tab active" style="width:100%" id="add-s">+ AJOUTER SENSOR</button>' : ''}
        ${this._tab === 'design' ? `
            <div class="sec">
                <label>Fond (URL)</label><input type="text" data-f="image" value="${p.image||''}">
                <label>Hauteur Carte</label><input type="number" id="ch" value="${this._config.card_height||600}">
                <label>Vue Active</label>
                <select id="ps"><option value="person1" ${v==='person1'?'selected':''}>Patrick</option><option value="person2" ${v==='person2'?'selected':''}>Sandra</option></select>
            </div>` : ''}
      </div>
    `;
    this._attach();
  }

  _boxUI(obj, label, pr, isS = false, idx = 0) {
    const f = (n) => isS ? n : pr + n;
    const d = isS ? `data-idx="${idx}"` : '';
    return `<div class="sec">
        <label>${label}</label>
        <input type="text" ${d} data-f="${f('name')}" value="${obj[f('name')]||''}" placeholder="Nom">
        <div class="grid" style="grid-template-columns: 2fr 1fr;">
            <input type="text" ${d} data-f="${f('entity')}" value="${obj[f('entity')]||''}" placeholder="sensor.xxx">
            <input type="text" ${d} data-f="${f('icon')}" value="${obj[f('icon')]||''}" placeholder="mdi:icon">
        </div>
        <div class="grid">
            <div><label>X %</label><input type="number" ${d} data-f="${f('x')}" value="${obj[f('x')]||50}"></div>
            <div><label>Y %</label><input type="number" ${d} data-f="${f('y')}" value="${obj[f('y')]||50}"></div>
            <div><label>Taille (rem)</label><input type="number" step="0.1" ${d} data-f="${f('ts')}" value="${obj[f('ts')]||1}"></div>
        </div>
        <div class="grid">
            <div><label>W / H</label><input type="number" ${d} data-f="${f('w')}" value="${obj[f('w')]||100}"><input type="number" ${d} data-f="${f('h')}" value="${obj[f('h')]||80}"></div>
            <div><label>Bord / R</label><input type="number" ${d} data-f="${f('bw')}" value="${obj[f('bw')]||1}"><input type="number" ${d} data-f="${f('r')}" value="${obj[f('r')]||8}"></div>
            <div><label>Couleur</label><input type="color" ${d} data-f="${f('bc')}" value="${obj[f('bc')]||'#ffffff'}"></div>
        </div>
        ${isS?`<button style="width:100%;background:#ff5252;border:none;color:white;padding:5px;margin-top:5px;cursor:pointer;border-radius:4px;" class="del-s" data-idx="${idx}">SUPPRIMER</button>`:''}
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
        if(el.id === 'ps') this.render();
    });
    const add = this.querySelector('#add-s'); if(add) add.onclick = () => { const p = this._config[this._config.current_view]; if(!p.sensors) p.sensors = []; p.sensors.push({name:'Nouveau', x:50, y:50, w:110, h:80, bc:'#ffffff', ts:1}); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); };
    this.querySelectorAll('.del-s').forEach(btn => btn.onclick = () => { this._config[this._config.current_view].sensors.splice(btn.dataset.idx, 1); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); });
  }
}
customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
