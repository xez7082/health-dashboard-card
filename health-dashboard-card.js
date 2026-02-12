// HEALTH DASHBOARD CARD – VERSION 3.6 WYSIWYG

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this._config = null;
    this._hass = null;
    this.currentPerson = "person1";
    this.activeSensorIndex = null;
  }

  static getConfigElement(){ return document.createElement("health-dashboard-card-editor"); }

  static getStubConfig(){
    return {
      person1:{name:"Homme",gender:"male",image:"/local/health-dashboard/male-silhouette.png",sensors:[
        {entity:"sensor.time",name:"Heure",icon:"⏰",x:50,y:10,color:"#2196f3"}
      ]},
      person2:{name:"Femme",gender:"female",image:"/local/health-dashboard/female-silhouette.png",sensors:[
        {entity:"sensor.date",name:"Date",icon:"📅",x:50,y:10,color:"#e91e63"}
      ]}
    };
  }

  setConfig(config){
    if(!config.person1||!config.person2) throw new Error("person1 et person2 requis");
    if(!config.person1.sensors) config.person1.sensors=[];
    if(!config.person2.sensors) config.person2.sensors=[];
    this._config=config;
    this.render();
  }

  set hass(hass){ this._hass=hass; this.updateSensors(); }

  getCardSize(){ return 7; }

  updateSensors(){
    if(!this._hass||!this._config) return;
    const person=this._config[this.currentPerson];
    person.sensors?.forEach((s,i)=>{
      const el=this.shadowRoot.querySelector(`#value-${i}`);
      el&&(el.textContent=this._hass.states[s.entity]?`${this._hass.states[s.entity].state} ${this._hass.states[s.entity].attributes.unit_of_measurement||""}`.trim():"N/A");
    });
  }

  render(){
    if(!this._config) return;
    const person=this._config[this.currentPerson];
    const defaultImage=person.gender==="female"?"/local/health-dashboard/female-silhouette.png":"/local/health-dashboard/male-silhouette.png";
    const imageUrl=person.image||defaultImage;

    this.shadowRoot.innerHTML=`
      <style>
        :host{display:block;}
        .card{position:relative;width:100%;height:650px;border-radius:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);overflow:hidden;}
        .bg{position:absolute;inset:0;background-image:url('${imageUrl}');background-position:center;background-size:contain;background-repeat:no-repeat;opacity:0.4;pointer-events:none;}
        .topbar{position:absolute;top:16px;right:16px;display:flex;gap:12px;z-index:10;}
        .btn-person{border:none;padding:12px 24px;border-radius:25px;cursor:pointer;color:white;font-weight:bold;font-size:14px;transition:all 0.3s ease;box-shadow:0 4px 6px rgba(0,0,0,0.1);}
        .btn-person:hover{transform:translateY(-2px);box-shadow:0 6px 12px rgba(0,0,0,0.2);}
        .male{background:linear-gradient(135deg,#2196f3,#1976d2);}
        .female{background:linear-gradient(135deg,#e91e63,#c2185b);}
        .active{outline:3px solid white;outline-offset:2px;}
        .person-name{position:absolute;top:80px;left:50%;transform:translateX(-50%);font-size:32px;font-weight:bold;color:rgba(255,255,255,0.95);text-shadow:2px 2px 8px rgba(0,0,0,0.5);z-index:5;}
        .sensor{position:absolute;transform:translate(-50%,-50%);background:white;border-radius:12px;padding:12px 16px;box-shadow:0 4px 12px rgba(0,0,0,0.2);cursor:move;min-width:120px;text-align:center;z-index:8;transition:all 0.2s ease;}
        .sensor:hover{transform:translate(-50%,-50%) scale(1.05);box-shadow:0 6px 16px rgba(0,0,0,0.3);}
        .sensor-icon{font-size:28px;margin-bottom:4px;}
        .sensor-name{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;}
        .sensor-value{font-size:18px;font-weight:bold;color:white;margin-top:4px;}
        .editor-panel{position:absolute;background:#fff;border:2px solid #667eea;padding:12px;border-radius:8px;z-index:20;min-width:200px;display:none;}
        .editor-panel input{width:100%;margin-bottom:6px;padding:4px;}
        .editor-panel label{font-size:11px;color:#333;}
        .editor-panel button{margin-top:4px;padding:4px;width:100%;border:none;background:#ff5252;color:white;border-radius:6px;cursor:pointer;}
      </style>

      <div class="card">
        <div class="bg"></div>
        <div class="topbar">
          <button id="p1" class="btn-person male ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn-person female ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="person-name">${person.name}</div>

        ${(person.sensors||[]).map((s,i)=>`
          <div class="sensor" id="sensor-${i}" style="left:${s.x||50}%;top:${s.y||50}%;background:${s.color||'#2196f3'};">
            <div class="sensor-icon">${s.icon||"📊"}</div>
            <div class="sensor-name">${s.name||s.entity}</div>
            <div class="sensor-value" id="value-${i}">--</div>
          </div>
        `).join('')}

        <div class="editor-panel" id="editor-panel">
          <label>Nom:</label><input type="text" id="edit-name"/>
          <label>Icône:</label><input type="text" id="edit-icon"/>
          <label>Couleur:</label><input type="color" id="edit-color"/>
          <label>X (%):</label><input type="number" id="edit-x" min="5" max="95"/>
          <label>Y (%):</label><input type="number" id="edit-y" min="5" max="95"/>
          <button id="btn-add">➕ Ajouter capteur</button>
          <button id="btn-remove">🗑️ Supprimer capteur</button>
          <button id="close-panel">Fermer</button>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById("p1").onclick=()=>{this.currentPerson="person1";this.render();}
    this.shadowRoot.getElementById("p2").onclick=()=>{this.currentPerson="person2";this.render();}

    this.enableDrag();
    this.enableEditorPanel();
    this.updateSensors();
  }

  enableDrag(){
    const person=this._config[this.currentPerson];
    person.sensors?.forEach((s,i)=>{
      const el=this.shadowRoot.getElementById(`sensor-${i}`);
      if(!el) return;
      el.onmousedown=(e)=>{
        e.preventDefault(); el.style.cursor='grabbing';
        const move=(ev)=>{
          const rect=this.shadowRoot.querySelector(".card").getBoundingClientRect();
          s.x=Math.max(5,Math.min(95,((ev.clientX-rect.left)/rect.width)*100));
          s.y=Math.max(5,Math.min(95,((ev.clientY-rect.top)/rect.height)*100));
          el.style.left=s.x+"%"; el.style.top=s.y+"%";
        };
        const up=()=>{
          el.style.cursor='move';
          window.removeEventListener("mousemove",move);
          window.removeEventListener("mouseup",up);
          this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));
          this.render();
        };
        window.addEventListener("mousemove",move);
        window.addEventListener("mouseup",up);
      };
      el.onclick=(ev)=>{ev.stopPropagation(); this.openEditorPanel(i,el);}
    });
    this.shadowRoot.querySelector(".card").onclick=()=>{this.closeEditorPanel();}
  }

  openEditorPanel(index,el){
    this.activeSensorIndex=index;
    const panel=this.shadowRoot.getElementById("editor-panel");
    const sensor=this._config[this.currentPerson].sensors[index];
    panel.style.display='block';
    const rect=el.getBoundingClientRect();
    const parentRect=this.shadowRoot.querySelector(".card").getBoundingClientRect();
    panel.style.left=(rect.left-parentRect.left+el.offsetWidth+8)+"px";
    panel.style.top=(rect.top-parentRect.top)+"px";
    panel.querySelector("#edit-name").value=sensor.name||"";
    panel.querySelector("#edit-icon").value=sensor.icon||"";
    panel.querySelector("#edit-color").value=sensor.color||"#2196f3";
    panel.querySelector("#edit-x").value=sensor.x||50;
    panel.querySelector("#edit-y").value=sensor.y||50;
  }

  closeEditorPanel(){this.shadowRoot.getElementById("editor-panel").style.display='none';this.activeSensorIndex=null;}

  enableEditorPanel(){
    const panel=this.shadowRoot.getElementById("editor-panel");
    panel.querySelector("#close-panel").onclick=()=>{this.closeEditorPanel();}
    panel.querySelector("#edit-name").oninput=(e)=>{if(this.activeSensorIndex===null)return;this._config[this.currentPerson].sensors[this.activeSensorIndex].name=e.target.value;this.render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));}
    panel.querySelector("#edit-icon").oninput=(e)=>{if(this.activeSensorIndex===null)return;this._config[this.currentPerson].sensors[this.activeSensorIndex].icon=e.target.value;this.render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));}
    panel.querySelector("#edit-color").oninput=(e)=>{if(this.activeSensorIndex===null)return;this._config[this.currentPerson].sensors[this.activeSensorIndex].color=e.target.value;this.render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));}
    panel.querySelector("#edit-x").oninput=(e)=>{if(this.activeSensorIndex===null)return;this._config[this.currentPerson].sensors[this.activeSensorIndex].x=parseFloat(e.target.value);this.render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));}
    panel.querySelector("#edit-y").oninput=(e)=>{if(this.activeSensorIndex===null)return;this._config[this.currentPerson].sensors[this.activeSensorIndex].y=parseFloat(e.target.value);this.render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));}

    panel.querySelector("#btn-add").onclick=()=>{
      this._config[this.currentPerson].sensors.push({entity:"",name:"",icon:"📊",color:"#2196f3",x:50,y:50});
      this.activeSensorIndex=this._config[this.currentPerson].sensors.length-1;
      this.render();
      this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));
    }

    panel.querySelector("#btn-remove").onclick=()=>{
      if(this.activeSensorIndex===null) return;
      this._config[this.currentPerson].sensors.splice(this.activeSensorIndex,1);
      this.activeSensorIndex=null;
      this.render();
      this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));
    }
  }
}

customElements.define("health-dashboard-card",HealthDashboardCard);
window.customCards=window.customCards||[];
window.customCards.push({type:"health-dashboard-card",name:"Health Dashboard Card",description:"Carte santé v3.6 WYSIWYG",preview:true});
console.info("%c HEALTH-DASHBOARD-CARD %c v3.6 WYSIWYG ","color:white;background:#667eea;font-weight:bold;","color:#667eea;background:white;font-weight:bold;");
