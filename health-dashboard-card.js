/**
 * HEALTH DASHBOARD CARD – V5.0.0
 * DYNAMISME COMPLET : AJOUT/SUPPRESSION DE PERSONNES & CAPTEURS
 * PRÉCISION 2 DÉCIMALES | ÉDITEUR VISUEL FULL SUPPORT
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { 
    super(); 
    this.attachShadow({ mode: 'open' }); 
  }

  static getConfigElement() { 
    return document.createElement('health-dashboard-card-editor'); 
  }

  static getStubConfig() {
    return {
      current_person_idx: 0,
      people: [
        {
          name: 'Patrick',
          weight_entity: '',
          start: 80,
          ideal: 75,
          image: '',
          sensors: []
        }
      ]
    };
  }
  
  setConfig(config) { 
    this._config = JSON.parse(JSON.stringify(config)); 
    if (!this._config.people || this._config.people.length === 0) {
      this._config.people = [ { name: 'Utilisateur 1', sensors: [], start: 80, ideal: 70 } ];
    }
    if (this._config.current_person_idx === undefined) this._config.current_person_idx = 0;
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
    const p = this._config.people[this._config.current_person_idx];
    if(!p) return;
    
    // MAJ des capteurs
    if(p.sensors) {
      p.sensors.forEach((s, i) => {
        const elV = this.shadowRoot.getElementById(`s-${i}-v`);
        if(elV && s.entity && this._hass.states[s.entity]) {
          const valRaw = this._hass.states[s.entity].state;
          elV.textContent = this._formatVal(valRaw) + (s.unit || '');
        }
      });
    }

    // MAJ Poids et Barre
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
    const idx = this._config.current_person_idx;
    const p = this._config.people[idx] || this._config.people[0];
    
    const sections = [
      { id: 'forme', label: '⚡ FORME', top: 65, h: 115 },
      { id: 'sommeil', label: '🌙 SOMMEIL', top: 195, h: 115 },
      { id: 'sante', label: '🏥 SANTÉ', top: 325, h: 135 }
    ];

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg-img { position: absolute; inset:0; background: url('${p.image || ''}') center/cover; opacity: 0.18; z-index:0; pointer-events: none; }
        .sw-btns { position: absolute; top: 12px; left: 12px; z-index: 100; display: flex; gap: 8px; max-width: 90%; overflow-x: auto; padding-bottom: 5px; }
        .sw-btn { background: #1e293b; border: 1px solid #334155; color: white; padding: 7px 14px; border-radius: 10px; cursor: pointer; font-size: 11px; font-weight: bold; white-space: nowrap; }
        .sw-btn.active { background: #38bdf8; color: #000; border-color: #38bdf8; }
        .sec-frame { position: absolute; left: 12px; right: 12px; border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 15px; z-index: 1; background: rgba(255,255,255,0.03); }
        .sec-label { position: absolute; top: -9px; left: 15px; background: #0f172a; padding: 0 8px; font-size: 10px; color: #38bdf8; font-weight: 900; }
        .box { position: absolute; background: rgba(30, 41, 59, 0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; border: 2px solid; backdrop-filter: blur(5px); z-index: 10; transform: translate(-50%, -50%); overflow: hidden; box-sizing: border-box; }
        .lbl { text-transform: uppercase; text-align: center; opacity: 0.8; font-weight: 600; line-height: 1; }
        .val { font-weight: 800; margin-top: 2px; }
        .weight-card { position: absolute; bottom: 12px; left: 12px; right: 12px; height: 125px; background: rgba(15, 23, 42, 0.95); border-radius: 18px; padding: 15px; border: 2px solid #38bdf8; z-index: 20; box-sizing: border-box; }
        .prog-container { height: 8px; background: #334155; border-radius: 4px; margin: 10px 0; overflow: hidden; }
        .prog-bar { height: 100%; background: #38bdf8; width: 0%; transition: width 1s ease-in-out; }
      </style>

      <div class="main">
        <div class="bg-img"></div>
        <div class="sw-btns">
            ${this._config.people.map((person, i) => `
              <button class="sw-btn ${idx === i ? 'active' : ''}" data-idx="${i}">
                ${(person.name || 'P'+(i+1)).toUpperCase()}
              </button>
            `).join('')}
        </div>

        ${sections.map(s => `<div class="sec-frame" style="top:${s.top}px; height:${s.h}px;"><div class="sec-label">${s.label}</div></div>`).join('')}

        ${(p.sensors || []).map((s, i) => {
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

    this.shadowRoot.querySelectorAll('.sw-btn').forEach(btn => {
      btn.onclick = () => {
        this._config.current_person_idx = parseInt(btn.dataset.idx);
        this._fire();
      };
    });
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    this.render();
  }
}

/** ÉDITEUR V5.0.0 **/
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'people'; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  
  render() {
    if(!this._config) return;
    const idx = this._config.current_person_idx;
    const p = this._config.people[idx];

    this.innerHTML = `
      <style>
        .ed { padding: 15px; background: #1c1c1e; color: white; font-family: sans-serif; font-size: 12px; }
        .row { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
        .s-card { background: #2c2c2e; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #38bdf8; position: relative; }
        input, select { width: 100%; padding: 8px; background: #000; color: #fff; border: 1px solid #444; border-radius: 4px; box-sizing: border-box; }
        label { font-size: 10px; opacity: 0.6; display: block; margin-bottom: 3px; }
        .btn { padding: 10px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; text-align:center; background: #444; color: white; }
        .btn-active { background: #38bdf8; color: #000; }
        .del { background: #ff5252; color: white; padding: 4px 8px; font-size: 10px; border-radius: 4px; cursor: pointer; border:none; }
        .add-btn { background: #4caf50; width:100%; margin-top:10px; }
      </style>
      <div class="ed">
        <label>CHOISIR LE PROFIL À MODIFIER</label>
        <div class="row" style="flex-wrap: wrap;">
          ${this._config.people.map((person, i) => `
            <div class="btn ${idx === i ? 'btn-active' : ''}" id="sel-${i}" style="min-width:60px;">${person.name || 'P'+(i+1)}</div>
          `).join('')}
          <button class="btn add-btn" id="add-p" style="width:40px; height:35px; margin:0;">+</button>
        </div>

        <hr style="opacity:0.1; margin:15px 0;">

        <div class="row">
          <div id="t-pep" class="btn" style="flex:1; ${this._tab==='people'?'background:#38bdf8; color:#000;':''}">👤 PROFIL</div>
          <div id="t-sns" class="btn" style="flex:1; ${this._tab==='sensors'?'background:#38bdf8; color:#000;':''}">📊 CAPTEURS</div>
        </div>

        ${this._tab === 'people' ? `
          <div class="s-card" style="margin-top:15px;">
            <button class="del" id="del-p" style="position:absolute; top:10px; right:10px;">SUPPRIMER CE PROFIL</button>
            <label>Nom de la personne</label><input type="text" data-f="name" value="${p.name}">
            <label>Image de fond (URL)</label><input type="text" data-f="image" value="${p.image||''}">
            <label>Entité Poids</label><input type="text" data-f="weight_entity" value="${p.weight_entity||''}">
            <div class="row">
              <div><label>Départ (kg)</label><input type="number" data-f="start" value="${p.start}"></div>
              <div><label>Objectif (kg)</label><input type="number" data-f="ideal" value="${p.ideal}"></div>
            </div>
          </div>
        ` : `
          <div style="margin-top:15px;">
            ${(p.sensors || []).map((s, i) => `
              <div class="s-card">
                <button class="del del-s" data-idx="${i}" style="position:absolute; top:10px; right:10px;">X</button>
                <div class="row">
                  <div style="flex:2"><label>Nom</label><input type="text" data-idx="${i}" data-f="name" value="${s.name}"></div>
                  <div style="flex:1"><label>Unité</label><input type="text" data-idx="${i}" data-f="unit" value="${s.unit||''}"></div>
                </div>
                <label>Entité sensor</label><input type="text" data-idx="${i}" data-f="entity" value="${s.entity}">
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
                  <div><label>Y off</label><input type="number" data-idx="${i}" data-f="y_off" value="${s.y_off||0}"></div>
                  <div><label>W</label><input type="number" data-idx="${i}" data-f="w" value="${s.w||85}"></div>
                  <div><label>H</label><input type="number" data-idx="${i}" data-f="h" value="${s.h||55}"></div>
                </div>
              </div>
            `).join('')}
            <button class="btn add-btn" id="add-s">+ AJOUTER UN CAPTEUR</button>
          </div>
        `}
      </div>
    `;
    this._attach();
  }

  _attach() {
    // Switch de personne
    this._config.people.forEach((_, i) => {
      const el = this.querySelector(`#sel-${i}`);
      if(el) el.onclick = () => { this._config.current_person_idx = i; this.render(); };
    });

    // Onglets
    this.querySelector('#t-pep').onclick = () => { this._tab = 'people'; this.render(); };
    this.querySelector('#t-sns').onclick = () => { this._tab = 'sensors'; this.render(); };

    // Inputs
    this.querySelectorAll('input, select').forEach(el => {
      el.onchange = (e) => {
        const p = this._config.people[this._config.current_person_idx];
        if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = e.target.value;
        else p[el.dataset.f] = e.target.value;
        this._fire();
      };
    });

    // Ajouter Personne
    this.querySelector('#add-p').onclick = () => {
      this._config.people.push({ name: 'Nouveau', sensors: [], start: 80, ideal: 75 });
      this._config.current_person_idx = this._config.people.length - 1;
      this._fire();
    };

    // Supprimer Personne
    const delP = this.querySelector('#del-p');
    if(delP) delP.onclick = () => {
      if(this._config.people.length > 1) {
        this._config.people.splice(this._config.current_person_idx, 1);
        this._config.current_person_idx = 0;
        this._fire();
      } else { alert("Vous devez garder au moins un profil."); }
    };

    // Ajouter Capteur
    const addS = this.querySelector('#add-s');
    if(addS) addS.onclick = () => {
      const p = this._config.people[this._config.current_person_idx];
      if(!p.sensors) p.sensors = [];
      p.sensors.push({name:'Nouveau', entity:'', cat:'forme', x:50, y_off:0, w:85, h:55, col:'#38bdf8', unit:''});
      this._fire();
    };

    // Supprimer Capteur
    this.querySelectorAll('.del-s').forEach(b => {
      b.onclick = () => {
        this._config.people[this._config.current_person_idx].sensors.splice(b.dataset.idx, 1);
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
  name: "Health Dashboard Dynamic V5.0.0",
  description: "Ajout dynamique de personnes et de capteurs illimités."
});
