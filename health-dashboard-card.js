/**
 * HEALTH DASHBOARD CARD – V2.9.0
 * FIX : CERCLES PARFAITS, ROTATION ET ARRONDIS PERSONNALISÉS
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  set hass(hass) { this._hass = hass; this.update(); }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view || 'person1'];
    const setV = (id, ent) => {
      const el = this.shadowRoot.getElementById(id);
      if(el && ent && this._hass.states[ent]) el.textContent = this._hass.states[ent].state;
    };
    setV('imc-v', p.imc_entity);
    if(p.sensors) p.sensors.forEach((s, i) => setV(`s-${i}`, s.entity));
  }

  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    const rGlobal = this._config.card_round || 12;
    
    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${rGlobal}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.4; }
        .box { 
          position: absolute; transform-origin: center; 
          background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; 
          justify-content: center; align-items: center; z-index: 10; 
          backdrop-filter: blur(8px); text-align: center; border-style: solid; box-sizing: border-box;
        }
      </style>
      <div class="main">
        <div class="bg"></div>
        
        <div class="box" style="
          left:${p.imc_x}%; top:${p.imc_y}%; 
          width:${p.imc_w}px; height:${p.imc_circle ? p.imc_w : p.imc_h}px; 
          border-radius:${p.imc_circle ? '50%' : (p.imc_r || 0) + 'px'}; 
          border-width:${p.imc_bw}px; border-color:${p.imc_bc};
          transform: translate(-50%, -50%) rotate(${p.imc_rot || 0}deg);
        ">
            <div style="font-size:10px; opacity:0.8;">${p.imc_name}</div><div id="imc-v" style="font-weight:bold;">--</div>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="
            left:${s.x}%; top:${s.y}%; 
            width:${s.w}px; height:${s.circle ? s.w : s.h}px; 
            border-radius:${s.circle ? '50%' : (s.r || 0) + 'px'}; 
            border-width:${s.bw}px; border-color:${s.bc};
            transform: translate(-50%, -50%) rotate(${s.rot || 0}deg);
          ">
            <div style="font-size:10px; opacity:0.8;">${s.name}</div><div id="s-${i}" style="font-weight:bold;">--</div>
          </div>
        `).join('')}
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
        .tab { flex: 1; padding: 10px; background: #333; cursor: pointer; text-align:center; border-radius: 4px; font-size: 11px; }
        .active { background: #38bdf8 !important; color: black !important; font-weight: bold; }
        .sec { background: #252525; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #111; color: white; border: 1px solid #444; border-radius: 4px; margin-bottom: 5px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .check-group { display: flex; align-items: center; gap: 10px; margin: 10px 0; background: #333; padding: 5px; border-radius: 4px; }
      </style>
      <div class="ed">
        <div class="tabs">
            <div class="tab ${this._tab==='poids'?'active':''}" data-t="poids">POIDS</div>
            <div class="tab ${this._tab==='sante'?'active':''}" data-t="sante">SANTÉ</div>
            <div class="tab ${this._tab==='sensors'?'active':''}" data-t="sensors">SENSORS</div>
            <div class="tab ${this._tab==='design'?'active':''}" data-t="design">DESIGN</div>
        </div>

        <div id="form">
            ${this._tab === 'sante' ? this._boxEditor(p, 'IMC', 'imc') : ''}
            
            ${this._tab === 'sensors' ? `
                ${(p.sensors || []).map((s, i) => this._boxEditor(s, `Sensor ${i+1}`, i, true)).join('')}
                <button id="add-s" style="width:100%; padding:12px; background:#38bdf8; color:black; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">+ AJOUTER UN CAPTEUR</button>
            ` : ''}

            ${this._tab === 'poids' ? `<div class="sec"><label>Nom</label><input type="text" data-f="name" value="${p.name}"></div>` : ''}

            ${this._tab === 'design' ? `
                <div class="sec">
                    <label>URL Fond</label><input type="text" data-f="image" value="${p.image}">
                    <label>Hauteur Carte</label><input type="number" id="ch" value="${this._config.card_height}">
                </div>
            ` : ''}
        </div>
      </div>
    `;
    this._attach();
  }

  _boxEditor(obj, label, id, isSensor = false) {
    const prefix = isSensor ? `data-idx="${id}"` : '';
    return `
      <div class="sec">
        <label>${label} - ENTITÉ</label>
        <input type="text" ${prefix} data-f="${isSensor?'entity':'imc_entity'}" value="${isSensor ? obj.entity : obj.imc_entity}">
        <div class="grid">
            <div><label>X (%)</label><input type="number" ${prefix} data-f="${isSensor?'x':'imc_x'}" value="${isSensor?obj.x:obj.imc_x}"></div>
            <div><label>Y (%)</label><input type="number" ${prefix} data-f="${isSensor?'y':'imc_y'}" value="${isSensor?obj.y:obj.imc_y}"></div>
        </div>
        <div class="grid">
            <div><label>Largeur (W)</label><input type="number" ${prefix} data-f="${isSensor?'w':'imc_w'}" value="${isSensor?obj.w:obj.imc_w}"></div>
            <div><label>Hauteur (H)</label><input type="number" ${prefix} data-f="${isSensor?'h':'imc_h'}" value="${isSensor?obj.h:obj.imc_h}" ${obj.circle || obj.imc_circle ? 'disabled' : ''}></div>
        </div>
        <div class="grid">
            <div><label>Arrondi (px)</label><input type="number" ${prefix} data-f="${isSensor?'r':'imc_r'}" value="${isSensor?obj.r:obj.imc_r}"></div>
            <div><label>Inclinaison (°)</label><input type="number" ${prefix} data-f="${isSensor?'rot':'imc_rot'}" value="${isSensor?obj.rot:obj.imc_rot}"></div>
        </div>
        <div class="check-group">
            <input type="checkbox" style="width:auto;" ${prefix} data-f="${isSensor?'circle':'imc_circle'}" ${obj.circle || obj.imc_circle ? 'checked' : ''}> 
            <span>CERCLE PARFAIT (Force W = H)</span>
        </div>
        ${isSensor ? `<button class="del-btn" style="width:100%; background:#ff5252; border:none; color:white; padding:5px; border-radius:4px;" data-del="${id}">SUPPRIMER</button>` : ''}
      </div>
    `;
  }

  _attach() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._tab = t.dataset.t; this.render(); });
    
    this.querySelectorAll('input').forEach(el => {
        el.onchange = () => {
            let val = el.type === 'checkbox' ? el.checked : el.value;
            if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = val;
            else if(el.id === 'ch') this._config.card_height = val;
            else p[el.dataset.f] = val;
            this._fire();
            this.render(); // Pour rafraîchir l'état "disabled" du champ H
        };
    });

    this.querySelectorAll('[data-del]').forEach(btn => btn.onclick = () => { p.sensors.splice(btn.dataset.del, 1); this._fire(); this.render(); });
    const add = this.querySelector('#add-s');
    if(add) add.onclick = () => { 
        if(!p.sensors) p.sensors = []; 
        p.sensors.push({name:'Nouveau', entity:'', x:50, y:50, w:100, h:70, bw:1, bc:'white', r:8, rot:0, circle:false}); 
        this._fire(); this.render(); 
    };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
