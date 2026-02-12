// HEALTH DASHBOARD CARD – VERSION 3.4 – PRÉVISUALISATION ET ÉDITEUR EN LIGNE

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this.currentPerson = "person1";
  }

  static getConfigElement() {
    return document.createElement("health-dashboard-card-editor");
  }

  static getStubConfig() {
    return {
      person1: { 
        name: "Homme", 
        gender: "male", 
        image: "/local/health-dashboard/male-silhouette.png", 
        sensors: [
          { entity: "sensor.time", name: "Heure", icon: "⏰", x: 70, y: 20, color: "#2196f3" }
        ] 
      },
      person2: { 
        name: "Femme", 
        gender: "female", 
        image: "/local/health-dashboard/female-silhouette.png", 
        sensors: [
          { entity: "sensor.date", name: "Date", icon: "📅", x: 70, y: 30, color: "#e91e63" }
        ] 
      },
    };
  }

  setConfig(config) {
    if (!config.person1 || !config.person2) {
      throw new Error("Configuration invalide : person1 et person2 requis");
    }
    if (!config.person1.sensors) config.person1.sensors = [];
    if (!config.person2.sensors) config.person2.sensors = [];
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  getCardSize() { return 7; }

  updateSensors() {
    if (!this._hass || !this._config) return;
    const person = this._config[this.currentPerson];
    if (!person || !person.sensors) return;

    person.sensors.forEach((s, i) => {
      const el = this.shadowRoot.querySelector(`#value-${i}`);
      if (!el) return;
      const state = this._hass.states[s.entity];
      if (state) {
        const unit = state.attributes.unit_of_measurement || "";
        el.textContent = `${state.state} ${unit}`.trim();
      } else el.textContent = "N/A";
    });
  }

  render() {
    if (!this._config) return;

    const person = this._config[this.currentPerson];
    const defaultImage = person.gender === "female" 
      ? "/local/health-dashboard/female-silhouette.png"
      : "/local/health-dashboard/male-silhouette.png";
    const imageUrl = person.image || defaultImage;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        .card { position: relative; width: 100%; height: 650px; border-radius: 20px; background: #333; overflow:hidden; }
        .bg { position:absolute; inset:0; background-image:url('${imageUrl}'); background-size:contain; background-position:center; background-repeat:no-repeat; opacity:0.4; pointer-events:none; }
        .topbar { position:absolute; top:16px; right:16px; display:flex; gap:12px; z-index:10; }
        .btn-person { border:none; padding:12px 24px; border-radius:25px; cursor:pointer; color:white; font-weight:bold; font-size:14px; }
        .male { background: #2196f3; }
        .female { background: #e91e63; }
        .active { outline: 3px solid white; outline-offset:2px; }
        .person-name { position:absolute; top:80px; left:50%; transform:translateX(-50%); font-size:32px; font-weight:bold; color:white; text-shadow:2px2px8px rgba(0,0,0,0.5); z-index:5; }

        .sensor { position:absolute; transform:translate(-50%, -50%); border-radius:12px; padding:12px 16px; box-shadow:0 4px 12px rgba(0,0,0,0.2); cursor:move; transition:all 0.3s ease; min-width:120px; text-align:center; z-index:8; }
        .sensor:hover { transform:translate(-50%, -50%) scale(1.05); box-shadow:0 6px 16px rgba(0,0,0,0.3); }
        .sensor-icon { font-size:28px; margin-bottom:4px; }
        .sensor-name { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
        .sensor-value { font-size:18px; font-weight:bold; color:white; margin-top:4px; }
      </style>

      <div class="card">
        <div class="bg"></div>
        <div class="topbar">
          <button id="p1" class="btn-person male ${this.currentPerson==="person1"?"active":""}">${this._config.person1.name}</button>
          <button id="p2" class="btn-person female ${this.currentPerson==="person2"?"active":""}">${this._config.person2.name}</button>
        </div>
        <div class="person-name">${person.name}</div>

        ${(person.sensors||[]).map((s,i)=>`
          <div class="sensor" id="sensor-${i}" 
               style="left:${s.x||50}%; top:${s.y||50}%; background:${s.color||'#2196f3'};"
               data-index="${i}">
            <div class="sensor-icon">${s.icon||"📊"}</div>
            <div class="sensor-name" style="color:${this.getContrastColor(s.color||'#2196f3')}">${s.name||s.entity}</div>
            <div class="sensor-value" id="value-${i}">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById("p1").onclick = ()=>{ this.currentPerson="person1"; this.render(); };
    this.shadowRoot.getElementById("p2").onclick = ()=>{ this.currentPerson="person2"; this.render(); };

    this.enableDrag();
    this.enableClickEdit();
    this.updateSensors();
  }

  getContrastColor(hexColor){
    const hex=hexColor.replace('#','');
    const r=parseInt(hex.substr(0,2),16);
    const g=parseInt(hex.substr(2,2),16);
    const b=parseInt(hex.substr(4,2),16);
    const brightness=(r*299+g*587+b*114)/1000;
    return brightness>155 ? '#333':'#FFF';
  }

  enableDrag(){
    const person=this._config[this.currentPerson];
    person.sensors?.forEach((s,i)=>{
      const el=this.shadowRoot.getElementById(`sensor-${i}`);
      if(!el) return;
      el.onmousedown=(e)=>{
        e.preventDefault();
        el.style.cursor='grabbing';
        const move=(ev)=>{
          const rect=this.shadowRoot.querySelector(".card").getBoundingClientRect();
          s.x=Math.max(5,Math.min(95,((ev.clientX-rect.left)/rect.width)*100));
          s.y=Math.max(5,Math.min(95,((ev.clientY-rect.top)/rect.height)*100));
          el.style.left=s.x+"%";
          el.style.top=s.y+"%";
        };
        const up=()=>{
          el.style.cursor='move';
          window.removeEventListener("mousemove",move);
          window.removeEventListener("mouseup",up);
          this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));
        };
        window.addEventListener("mousemove",move);
        window.addEventListener("mouseup",up);
      };
    });
  }

  enableClickEdit(){
    const person=this._config[this.currentPerson];
    person.sensors?.forEach((s,i)=>{
      const el=this.shadowRoot.getElementById(`sensor-${i}`);
      if(!el) return;
      el.onclick=(e)=>{
        e.stopPropagation();
        const newName=prompt("Nom affiché:",s.name||s.entity);
        if(newName!==null) s.name=newName;
        const newIcon=prompt("Icône (emoji):",s.icon||"📊");
        if(newIcon!==null) s.icon=newIcon;
        const newColor=prompt("Couleur (hex):",s.color||"#2196f3");
        if(newColor!==null) s.color=newColor;
        this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));
        this.render();
      };
    });
  }
}

// ---------------------------------------------------------------------------
// ÉDITEUR CLASSIQUE POUR HA
// ---------------------------------------------------------------------------
class HealthDashboardCardEditor extends HTMLElement {
  constructor(){
    super();
    this._config=null;
    this.currentTab="person1";
  }

  setConfig(config){
    this._config=config;
    this.render();
  }

  configChanged(){ 
    this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:true,composed:true}));
  }

  render(){
    if(!this._config) return;
    const person=this._config[this.currentTab];
    this.innerHTML=`
      <style>
        .editor{padding:16px;}
        .tabs{display:flex;gap:8px;margin-bottom:16px;}
        .tab-btn{padding:8px 16px;border:none;background:#f5f5f5;cursor:pointer;border-radius:6px;}
        .tab-btn.active{background:#667eea;color:white;}
        .field{margin-bottom:12px;}
        .field label{display:block;margin-bottom:4px;font-weight:500;}
        .field input,.field select{width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;}
        .sensor-list{margin-top:12px;}
        .sensor-item{background:white;border:1px solid #ddd;padding:12px;border-radius:6px;margin-bottom:8px;}
        .btn-remove{background:#ff5252;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;}
        .btn-add{width:100%;padding:8px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;margin-top:8px;}
      </style>
      <div class="editor">
        <div class="tabs">
          <button class="tab-btn ${this.currentTab==='person1'?'active':''}" data-tab="person1">👤 ${this._config.person1.name}</button>
          <button class="tab-btn ${this.currentTab==='person2'?'active':''}" data-tab="person2">👤 ${this._config.person2.name}</button>
        </div>

        <div class="field"><label>Prénom</label><input type="text" class="input-name" value="${person.name||''}"></div>
        <div class="field"><label>Genre</label>
          <select class="select-gender">
            <option value="male" ${person.gender==='male'?'selected':''}>Homme</option>
            <option value="female" ${person.gender==='female'?'selected':''}>Femme</option>
          </select>
        </div>
        <div class="field"><label>Image de fond</label><input type="text" class="input-image" value="${person.image||''}"></div>

        <div class="sensor-list">
          ${(person.sensors||[]).map((s,i)=>`
            <div class="sensor-item">
              <div>Capteur ${i+1}</div>
              <div class="field"><label>Nom</label><input type="text" class="sensor-name" data-index="${i}" value="${s.name||''}"></div>
              <div class="field"><label>Entité</label><input type="text" class="sensor-entity" data-index="${i}" value="${s.entity||''}"></div>
              <div class="field"><label>Icône</label><input type="text" class="sensor-icon" data-index="${i}" value="${s.icon||''}"></div>
              <div class="field"><label>Couleur</label><input type="color" class="sensor-color" data-index="${i}" value="${s.color||'#2196f3'}"></div>
              <div class="field-row"><input type="number" class="sensor-x" data-index="${i}" value="${s.x||50}"> X
                                            <input type="number" class="sensor-y" data-index="${i}" value="${s.y||50}"> Y
              </div>
              <button class="btn-remove" data-index="${i}">Supprimer</button>
            </div>
          `).join('')}
        </div>

        <button class="btn-add">➕ Ajouter un capteur</button>
      </div>
    `;

    this.attachListeners();
  }

  attachListeners(){
    this.querySelectorAll('.tab-btn').forEach(btn=>{
      btn.onclick=()=>{ this.currentTab=btn.dataset.tab; this.render(); };
    });

    const person=this._config[this.currentTab];

    this.querySelector(".input-name").oninput=e=>{ person.name=e.target.value; this.configChanged(); };
    this.querySelector(".select-gender").onchange=e=>{ person.gender=e.target.value; this.configChanged(); this.render(); };
    this.querySelector(".input-image").oninput=e=>{ person.image=e.target.value; this.configChanged(); this.render(); };

    this.querySelectorAll(".sensor-name").forEach(input=>{ input.oninput=e=>{ person.sensors[parseInt(e.target.dataset.index)].name=e.target.value; this.configChanged(); }; });
    this.querySelectorAll(".sensor-entity").forEach(input=>{ input.oninput=e=>{ person.sensors[parseInt(e.target.dataset.index)].entity=e.target.value; this.configChanged(); }; });
    this.querySelectorAll(".sensor-icon").forEach(input=>{ input.oninput=e=>{ person.sensors[parseInt(e.target.dataset.index)].icon=e.target.value; this.configChanged(); }; });
    this.querySelectorAll(".sensor-color").forEach(input=>{ input.oninput=e=>{ person.sensors[parseInt(e.target.dataset.index)].color=e.target.value; this.configChanged(); }; });
    this.querySelectorAll(".sensor-x").forEach(input=>{ input.oninput=e=>{ person.sensors[parseInt(e.target.dataset.index)].x=parseFloat(e.target.value); this.configChanged(); }; });
    this.querySelectorAll(".sensor-y").forEach(input=>{ input.oninput=e=>{ person.sensors[parseInt(e.target.dataset.index)].y=parseFloat(e.target.value); this.configChanged(); }; });

    this.querySelectorAll(".btn-remove").forEach(btn=>{
      btn.onclick=e=>{ person.sensors.splice(parseInt(btn.dataset.index),1); this.configChanged(); this.render(); };
    });

    this.querySelector(".btn-add").onclick=e=>{
      person.sensors.push({entity:"",name:"",icon:"📊",color:"#2196f3",x:50,y:50});
      this.configChanged();
      this.render();
    };
  }
}

// ---------------------------------------------------------------------------
// REGISTER CUSTOM ELEMENTS
// ---------------------------------------------------------------------------
customElements.define("health-dashboard-card", HealthDashboardCard);
customElements.define("health-dashboard-card-editor", HealthDashboardCardEditor);
window.customCards=window.customCards||[];
window.customCards.push({
  type:"health-dashboard-card",
  name:"Health Dashboard Card",
  description:"Carte de suivi santé avec prévisualisation et édition en ligne des capteurs",
  preview:true
});
console.info("%c HEALTH-DASHBOARD-CARD %c v3.4 ","color:white;background:#667eea;font-weight:bold;","color:#667eea;background:white;font-weight:bold;");
