/**
 * HEALTH DASHBOARD CARD – V2.9.4
 * FULL VERSION : COULEURS, BORDURES, ROTATION & STABILITÉ
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
    
    const setV = (id, ent) => {
      const el = this.shadowRoot.getElementById(id);
      if(el && ent && this._hass.states[ent]) {
        const s = this._hass.states[ent];
        el.textContent = `${s.state}${s.attributes.unit_of_measurement || ''}`;
      }
    };
    
    setV('imc-v', p.imc_entity);
    setV('corp-v', p.corp_entity);
    if(p.sensors) p.sensors.forEach((s, i) => setV(`s-${i}`, s.entity));
  }

  render() {
    if (!this._config) return;
    const v = this._config.current_view;
    const p = this._config[v] || { imc_x:50, imc_y:20, corp_x:50, corp_y:40 };
    const hCard = this._config.card_height || 600;

    const getBoxStyle = (o, prefix) => {
      const isC = o[prefix + 'circle'];
      const w = o[prefix + 'w'] || 100;
      const h = isC ? w : (o[prefix + 'h'] || 70);
      const r = isC ? '50%' : (o[prefix + 'r'] || 8) + 'px';
      const bw = o[prefix + 'bw'] || 1;
      const bc = o[prefix + 'bc'] || '#ffffff';
      const rot = o[prefix + 'rot'] || 0;
      const x = o[prefix + 'x'] || 50;
      const y = o[prefix + 'y'] || 50;
      return `left:${x}%; top:${y}%; width:${w}px; height:${h}px; border-radius:${r}; border:${bw}px solid ${bc}; transform: translate(-50%, -50%) rotate(${rot}deg);`;
    };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${hCard}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.4; z-index:1; }
        .box { position: absolute; background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; box-sizing: border-box; overflow: hidden; }
        .val { font-weight: bold; font-size: 1.1em; }
        .lbl { font-size: 10px; opacity: 0.8; text-transform: uppercase; }
      </style>
      <div class="main">
        <div class="bg"></div>
        
        <div class="box" style="${getBoxStyle(p, 'imc_')}">
            <div class="lbl">${p.imc_name || 'IMC'}</div><div id="imc-v" class="val">--</div>
        </div>

        <div class="box" style="${getBoxStyle(p, 'corp_')}">
            <div class="lbl">${p.corp_name || 'CORPULENCE'}</div><div id="corp-v" class="val">--</div>
        </div>

        ${(p.sensors || []).map((s, i) => {
          const isC = s.circle;
          const w = s.w || 100;
          const h = isC ? w : (s.h || 70);
          const r = isC ? '50%' : (s.r || 8) + 'px';
          return `
            <div class="box" style="left:${s.x}%; top:${s.y}%; width:${w}px; height:${h}px; border-radius:${r}; border:${s.bw || 1}px solid ${s.bc || '#ffffff'}; transform: translate(-50%, -50%) rotate(${s.rot || 0}deg);">
              <div class="lbl">${s.name}</div><div id="s-${i}" class="val">--</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'sante'; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }

  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .ed { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
        .tab { flex: 1; padding: 10px; background: #333; cursor: pointer; text-align:center; border-radius: 4px; font-size: 11px; border:none; color:white; }
        .active { background: #38bdf8 !important; color: black !important; font-weight: bold; }
        .sec { background: #252525; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #111; color: white; border: 1px solid #444; border-radius: 4px; margin-bottom: 5px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        input[type="color"] { height: 35px; cursor: pointer; padding: 2px; }
        .del-btn { width: 100%; background: #ff5252; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px; }
        .add-btn { width: 100%; background: #38bdf8; color: black; border: none; padding: 12px; border-radius: 4px; cursor: pointer; font-weight: bold; }
      </style>
      <div class="ed">
        <div class="tabs">
            <button class="tab ${this._tab==='sante'?'active':''}" id="t-sante">SANTÉ</button>
            <button class="tab ${this._tab==='sensors'?'active':''}" id="t-sensors">SENSORS</button>
            <button class="tab ${this._tab==='design'?'active':''}" id="t-design">DESIGN</button>
        </div>

        <div id="form">
            ${this._tab === 'sante' ? this._boxUI(p, 'IMC', 'imc_') + this._boxUI(p, 'CORPULENCE', 'corp_') : ''}
            
            ${this._tab === 'sensors' ? `
                ${(p.sensors || []).map((s, i) => this._boxUI(s, `Sensor ${i+1}`, '', true, i)).join('')}
                <button class="add-btn" id="add-s">+ AJOUTER UN CAPTEUR</button>
            ` : ''}

            ${this._tab === 'design' ? `
                <div class="sec">
                    <label>Image de fond (URL)</label><input type="text" data-f="image" value="${p.image || ''}">
                    <label>Hauteur Carte (px)</label><input type="number" id="ch" value="${this._config.card_height || 600}">
                    <label>Changer de Personne</label>
                    <select id="ps" style="width:100%; padding:10px; background:#111; color:white; border-radius:4px;">
                        <option value="person1" ${v==='person1'?'selected':''}>Personne 1</option>
                        <option value="person2" ${v==='person2'?'selected':''}>Personne 2</option>
                    </select>
                </div>
            ` : ''}
        </div>
      </div>
    `;
    this._attach();
  }

  _boxUI(obj, label, pr, isS = false, idx = 0) {
    const f = (n) => isS ? n : pr + n;
    const d = isS ? `data-idx="${idx}"` : '';
    return `
      <div class="sec">
        <label>${label} - ENTITÉ (sensor.xxx)</label>
        <input type="text" ${d} data-f="${f('entity')}" value="${obj[f('entity')] || ''}">
        <div class="grid">
            <div><label>X %</label><input type="number" ${d} data-f="${f('x')}" value="${obj[f('x')] || 50}"></div>
            <div><label>Y %</label><input type="number" ${d} data-f="${f('y')}" value="${obj[f('y')] || 50}"></div>
            <div><label>Bord px</label><input type="number" ${d} data-f="${f('bw')}" value="${obj[f('bw')] || 1}"></div>
        </div>
        <div class="grid">
            <div><label>Largeur</label><input type="number" ${d} data-f="${f('w')}" value="${obj[f('w')] || 100}"></div>
            <div><label>Arrondi</label><input type="number" ${d} data-f="${f('r')}" value="${obj[f('r')] || 8}"></div>
            <div><label>Couleur</label><input type="color" ${d} data-f="${f('bc')}" value="${obj[f('bc')] || '#ffffff'}"></div>
        </div>
        <div class="grid">
            <div><label>Angle °</label><input type="number" ${d} data-f="${f('rot')}" value="${obj[f('rot')] || 0}"></div>
            <div style="grid-column: span 2; display:flex; align-items:center; gap:5px;">
                <input type="checkbox" style="width:auto; margin:0;" ${d} data-f="${f('circle')}" ${obj[f('circle')]?'checked':''}> <label style="margin:0;">CERCLE</label>
            </div>
        </div>
        ${isS ? `<button class="del-btn" data-del="${idx}">SUPPRIMER ❌</button>` : ''}
      </div>
    `;
  }

  _attach() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];

    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._tab = t.id.replace('t-',''); this.render(); });

    this.querySelectorAll('input, select').forEach(el => {
      el.onchange = () => {
        let val = el.type === 'checkbox' ? el.checked : el.value;
        if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = val;
        else if(el.id === 'ch') this._config.card_height = val;
        else if(el.id === 'ps') this._config.current_view = val;
        else p[el.dataset.f] = val;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
        this.render();
      };
    });

    this.querySelectorAll('[data-del]').forEach(btn => btn.onclick = () => {
        p.sensors.splice(btn.dataset.del, 1);
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
        this.render();
    });

    const add = this.querySelector('#add-s');
    if(add) add.onclick = () => {
        if(!p.sensors) p.sensors = [];
        p.sensors.push({name:'Nouveau', entity:'', x:50, y:50, w:100, h:70, bw:1, bc:'#ffffff', r:8, rot:0, circle:false});
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
        this.render();
    };
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
