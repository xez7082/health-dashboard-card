// HEALTH DASHBOARD CARD – V3 STABLE

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
          { entity: "sensor.time", name: "Heure", icon: "⏰", x: 50, y: 10, color: "#2196f3" }
        ] 
      },
      person2: { 
        name: "Femme", 
        gender: "female", 
        image: "/local/health-dashboard/female-silhouette.png", 
        sensors: [
          { entity: "sensor.date", name: "Date", icon: "📅", x: 50, y: 10, color: "#e91e63" }
        ] 
      },
    };
  }

  setConfig(config) {
    if (!config.person1 || !config.person2) {
      throw new Error("Configuration invalide : person1 et person2 requis");
    }
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  getCardSize() {
    return 7;
  }

  updateSensors() {
    if (!this._hass || !this._config) return;
    const person = this._config[this.currentPerson];
    person.sensors?.forEach((s, i) => {
      const el = this.shadowRoot.querySelector(`#value-${i}`);
      if (!el) return;
      const state = this._hass.states[s.entity];
      el.textContent = state ? `${state.state} ${state.attributes.unit_of_measurement || ""}`.trim() : "N/A";
    });
  }

  render() {
    if (!this._config) return;
    const person = this._config[this.currentPerson];
    const imageUrl = person.image || (person.gender === "female" 
      ? "/local/health-dashboard/female-silhouette.png" 
      : "/local/health-dashboard/male-silhouette.png");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .card { position: relative; width: 100%; height: 650px; border-radius: 20px; overflow: hidden; background: linear-gradient(135deg, #667eea, #764ba2); }
        .bg { position: absolute; inset: 0; background-image: url('${imageUrl}'); background-position: center center; background-size: contain; background-repeat: no-repeat; opacity: 0.4; pointer-events: none; }
        .topbar { position: absolute; top: 16px; right: 16px; display: flex; gap: 12px; z-index: 10; }
        .btn-person { border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; color: white; font-weight: bold; font-size: 14px; }
        .male { background: linear-gradient(135deg, #2196f3, #1976d2); }
        .female { background: linear-gradient(135deg, #e91e63, #c2185b); }
        .active { outline: 3px solid white; outline-offset: 2px; }
        .person-name { position: absolute; top: 80px; left: 50%; transform: translateX(-50%); font-size: 32px; font-weight: bold; color: white; text-shadow: 2px 2px 8px rgba(0,0,0,0.5); z-index: 5; }
        .sensor { position: absolute; transform: translate(-50%,-50%); background: white; border-radius: 12px; padding: 12px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); cursor: move; min-width: 120px; text-align: center; z-index: 8; }
        .sensor-icon { font-size: 28px; margin-bottom: 4px; }
        .sensor-name { font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333; }
        .sensor-value { font-size: 18px; font-weight: bold; margin-top: 4px; }
      </style>

      <div class="card">
        <div class="bg"></div>
        <div class="topbar">
          <button id="p1" class="btn-person male ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn-person female ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="person-name">${person.name}</div>
        ${(person.sensors||[]).map((s,i)=>`
          <div class="sensor" id="sensor-${i}" style="left:${s.x||50}%; top:${s.y||50}%; background:${s.color||'#2196f3'}">
            <div class="sensor-icon">${s.icon||"📊"}</div>
            <div class="sensor-name">${s.name||s.entity}</div>
            <div class="sensor-value" id="value-${i}">--</div>
          </div>
        `).join("")}
      </div>
    `;

    this.shadowRoot.getElementById("p1").onclick = () => { this.currentPerson="person1"; this.render(); };
    this.shadowRoot.getElementById("p2").onclick = () => { this.currentPerson="person2"; this.render(); };

    this.enableDrag();
    this.updateSensors();
  }

  enableDrag() {
    const person = this._config[this.currentPerson];
    person.sensors?.forEach((s,i)=>{
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      if(!el) return;
      el.onmousedown = (e)=>{
        e.preventDefault();
        const rect=this.shadowRoot.querySelector(".card").getBoundingClientRect();
        const move=(ev)=>{
          const x=((ev.clientX-rect.left)/rect.width)*100;
          const y=((ev.clientY-rect.top)/rect.height)*100;
          s.x=Math.max(5,Math.min(95,x));
          s.y=Math.max(5,Math.min(95,y));
          el.style.left=s.x+"%";
          el.style.top=s.y+"%";
        };
        const up=()=>{
          window.removeEventListener("mousemove",move);
          window.removeEventListener("mouseup",up);
          this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));
        };
        window.addEventListener("mousemove",move);
        window.addEventListener("mouseup",up);
      };
    });
  }
}

// ÉDITEUR SIMPLIFIÉ POUR HOME ASSISTANT
class HealthDashboardCardEditor extends HTMLElement {
  constructor(){ super(); this._config=null; this.currentTab="person1"; }
  setConfig(config){ this._config=config; this.render(); }
  set hass(hass){}
  configChanged(){ this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:true,composed:true})); }
  render(){
    if(!this._config) return;
    const person=this._config[this.currentTab];
    this.innerHTML=`
      <div style="font-family:sans-serif; padding:12px;">
        <div style="margin-bottom:8px;">
          <button data-tab="person1" style="margin-right:6px;${this.currentTab==='person1'?'font-weight:bold;':''}">Homme</button>
          <button data-tab="person2" style="${this.currentTab==='person2'?'font-weight:bold;':''}">Femme</button>
        </div>
        <div style="margin-bottom:6px;"><label>Nom:</label><input class="name" value="${person.name||''}"></div>
        <div style="margin-bottom:6px;"><label>Image:</label><input class="image" value="${person.image||''}" placeholder="/local/health-dashboard/silhouette.png"></div>
        <div><strong>Capteurs:</strong></div>
        ${(person.sensors||[]).map((s,i)=>`
          <div style="border:1px solid #ccc;padding:6px;margin:4px 0;">
            <label>Nom: <input class="sensor-name" data-index="${i}" value="${s.name||''}"></label><br>
            <label>Entité: <input class="sensor-entity" data-index="${i}" value="${s.entity||''}"></label><br>
            <label>Icône: <input class="sensor-icon" data-index="${i}" value="${s.icon||''}"></label><br>
            <label>X: <input class="sensor-x" type="number" data-index="${i}" value="${s.x||50}"></label>
            <label>Y: <input class="sensor-y" type="number" data-index="${i}" value="${s.y||50}"></label>
          </div>
        `).join("")}
        <button id="add">Ajouter capteur</button>
      </div>
    `;
    this.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{ this.currentTab=btn.dataset.tab; this.render(); });
    this.querySelector('.name')?.addEventListener('input',e=>{ person.name=e.target.value; this.configChanged(); });
    this.querySelector('.image')?.addEventListener('input',e=>{ person.image=e.target.value; this.configChanged(); });
    this.querySelectorAll('.sensor-name').forEach(input=>input.addEventListener('input',e=>{ person.sensors[parseInt(e.target.dataset.index)].name=e.target.value; this.configChanged(); }));
    this.querySelectorAll('.sensor-entity').forEach(input=>input.addEventListener('input',e=>{ person.sensors[parseInt(e.target.dataset.index)].entity=e.target.value; this.configChanged(); }));
    this.querySelectorAll('.sensor-icon').forEach(input=>input.addEventListener('input',e=>{ person.sensors[parseInt(e.target.dataset.index)].icon=e.target.value; this.configChanged(); }));
    this.querySelectorAll('.sensor-x').forEach(input=>input.addEventListener('input',e=>{ person.sensors[parseInt(e.target.dataset.index)].x=parseFloat(e.target.value); this.configChanged(); }));
    this.querySelectorAll('.sensor-y').forEach(input=>input.addEventListener('input',e=>{ person.sensors[parseInt(e.target.dataset.index)].y=parseFloat(e.target.value); this.configChanged(); }));
    this.querySelector('#add')?.addEventListener('click',()=>{ person.sensors.push({name:'',entity:'',icon:'📊',x:50,y:50,color:'#2196f3'}); this.configChanged(); this.render(); });
  }
}

customElements.define("health-dashboard-card",HealthDashboardCard);
customElements.define("health-dashboard-card-editor",HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({type:"health-dashboard-card",name:"Health Dashboard Card",description:"Carte de suivi de santé avec drag & drop et positionnement",preview:true});

console.info("%c HEALTH-DASHBOARD-CARD %c v3.1.1 Stable","color:white;background:#667eea;font-weight:bold;","color:#667eea;background:white;font-weight:bold;");
