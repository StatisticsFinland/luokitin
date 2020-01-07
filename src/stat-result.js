import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-styles/paper-styles.js';
import '@polymer/paper-styles/element-styles/paper-material-styles.js';
import '@polymer/iron-list/iron-list.js';

class StatResult extends PolymerElement {

  static get properties() {
    return {
      _class: String,
      classes: Array,
      language: {
        type: String,
        value: "fi",
        notify: true,
        reflectToAttribute: true,
      },
      header: {
        type: String,
        value: "Valittu luokka",
        notify: true,
      },
      excludes: {
        type: String,
        value: "Tähän ei kuulu: ",
        notify: true,
      },
      includes: {
        type: String,
        value: "Tähän kuuluu: ",
        notify: true,
      },
      includesAlso: {
        type: String,
        value: "Tähän kuuluu myös: ",
        notify: true,
      },
      keywords: {
        type: String,
        value: "Hakusana: ",
        notify: true,
      },
      rulings: {
        type: String,
        value: "Luokituspäätökset: ",
        notify: true,
      },
      changes: {
        type: String,
        value: "Muutokset: ",
        notify: true,
      },
    }
  }

  connectedCallback() {
    super.connectedCallback()
    this.addEventListeners()
    this.setLanguage()
  }

  setLanguage() {
    if (this.language === "en") {
      this.header = "Chosen class"
      this.keywords = "Keyword: "
      this.includes = "Includes: "
      this.includesAlso = "Includes also: "
      this.excludes = "Excludes: "
      this.rulings = "Classification declarations: "
      this.changes = "Changes: "
    } else if (this.language === "sv") {
      this.header = "Valda klassen"
      this.keywords = "Nyckelord: "
      this.includes = "Innehåller: "
      this.includesAlso = "Innehåller också "
      this.excludes = "Innehåller inte: "
      this.rulings = "Klassificering förordningar: "
      this.changes = "Ändringar: "
    } else {
      this.header = "Valittu luokka"
      this.keywords = "Hakusana: "
      this.includes = "Tähän kuuluu: "
      this.includesAlso = "Tähän kuuluu myös: "
      this.excludes = "Tähän ei kuulu: "
      this.rulings = "Luokituspäätökset: "
      this.changes = "Muutokset: "
    }
  }

  addEventListeners() {
    window.addEventListener('stat-class', e => {
      this.classes = []
      this.shadowRoot.querySelector(".stat-result-body").style.visibility = "visible"
      this.addClasses(e)
      this.handleKeywords()
      this.handleLiElements()
    })
    window.addEventListener('stat-classification', e => {
      this.shadowRoot.querySelector(".stat-result-body").style.visibility = "hidden"
    })
  }

  // Adds classes received via event to "classes" array.
  addClasses(e) {
    if (e.detail === "ei avain luokka") {   // Hide stat-result, if receives this specific command in event detail.
      this.shadowRoot.querySelector(".stat-result-body").style.visibility = "hidden"
    } else if (e.detail.targetItems == null) {    // If the class does not have "targetItems" field, this means it is not a correspondence class. Therefore, only one class can be selected and shown.
      this.push("classes", e.detail)
      this.header = e.detail.code + " " + e.detail.name
      if (this.shadowRoot.querySelector('.stat-result-h3')) {
        this.shadowRoot.querySelector('.stat-result-h3').setAttribute('hidden', true)
        this.shadowRoot.querySelector('.stat-result-description').setAttribute('style', 'margin-top: 10px;')
      }
    } else {
      if (this.shadowRoot.querySelector('.stat-result-h3')) {
        this.shadowRoot.querySelector('.stat-result-h3').removeAttribute('hidden')
        this.shadowRoot.querySelector('.stat-result-description').setAttribute('style', 'margin-top: 0')
      }
      this.classes = e.detail.targetItems
      this.setHeaderLanguage()
    }
  }


  // If there are correspondence classes, change the header to indicate that the shown class is from different classification than is visible in stat-tree at the moment.
  setHeaderLanguage() {
    this.header = "Rakennusluokitus 2018"
    if (this.language === "en") {
      this.header = "Classification of Buildings 2018"
    } else if (this.language === "sv") {
      this.header = "Byggnadsklassificering 2018"
    }
    this.notifyPath('header')
  }

  // Add spaces between keywords, as they were lacking in Building Classification data at the time of the code.
  handleKeywords() {
    for (let i = 0; i < this.classes.length; i++) {
      for (let j = 1; j < this.classes[i].keywords.length; j++) {   // Don't add space to the "Keywords: " -header and the first keyword.
        this.classes[i].keywords[j] = ' ' + this.classes[i].keywords[j]
      }
    }
  }

  // Hide empty fields, such as "this includes", if there is no data.
  handleLiElements() {
    let elements = this.shadowRoot.querySelectorAll(".stat-result-textContent")
    elements.forEach(element => {
      element.parentNode.style.display = "none";
      if (element.innerText !== "" && element.innerText !== "," && element.innerText !== " ,") {
        element.parentNode.style.display = "block";
      }
    });
  }

  static get template() {
    return html`
      <style>   
      .stat-result-body {   
        @apply --shadow-elevation-2dp;                                              
        visibility: hidden;
        background-color: #0073b0; 
      }
  
      .stat-result-iron-list {
        @apply --shadow-elevation-2dp; 
        background-color: white;
        padding-left: 20px;   
        max-height:360px;                    
      }
  
      .stat-result-h1 {
        color: white;      
        @apply --paper-font-headline;
        padding-left: 20px;      
        font-weight: bold;  
        padding-top: 12px;   
        padding-bottom: 12px;
        margin: 0;
      }
  
      .stat-result-li {
        padding-bottom: 2.5px;
        padding: 5px;
        white-space: pre-wrap;
      }
  
      .stat-result-ul {
        padding-top: 0px;
        margin-top: 0px;
        padding-left:5px;    
        background-color: white;     
        list-style-type: none;
      }
  
      .stat-result-ul li:nth-child(n+2) {
        font-size: 0.9em;
        line-height: 0.95em;
      }
  
      .stat-result-description {
        line-height: 1.1em;
      }
  
      .keywordsHeader, .excludesHeader, .includesHeader, .includesAlsoHeader, .rulingsHeader, .changesHeader {
        font-weight:bold;
        font-size: 1em;
      }
  
      .stat-result-h3 {
        font-size: 1em;
        margin: 0;
        padding-top: 10px;
        padding-bottom: 2px;
      }
      </style>
      
      <div class="stat-result-body"> 
        <h1 class="stat-result-h1"> {{header}} </h1>
        <iron-list items="{{classes}}" class="stat-result-iron-list">
        <template class="stat-result-template">
          <div>
            <h3 class="stat-result-h3"><span class="classCode stat-result-classCode">{{item.code}}</span> <span class="className stat-result-className">{{item.name}}</span></h3>
            <ul class="stat-result-ul">
              <li class="stat-result-li description stat-result-description">{{item.note}}</li> 
              <li class="stat-result-li stat-result-includes"><span class="includesHeader">{{includes}}</span><span class="stat-result-textContent stat-result-includesContent">{{item.includes}}</span></li>
              <li class="stat-result-li stat-result-includesAlso"><span class="includesAlsoHeader">{{includesAlso}}</span><span class="stat-result-textContent stat-result-includesAlsoContent">{{item.includesAlso}}</span></li>
              <li class="stat-result-li stat-result-rulings"><span class="rulingsHeader">{{rulings}}</span><span class="stat-result-textContent stat-result-rulingsContent">{{item.rulings}}</span></li>
              <li class="stat-result-li stat-result-excludes"><span class="excludesHeader">{{excludes}}</span><span class="stat-result-textContent stat-result-excludesContent">{{item.excludes}}</span></li>
              <li class="stat-result-li stat-result-keywords"><span class="keywordsHeader">{{keywords}}</span><span class="stat-result-textContent stat-result-keywordsContent">{{item.keywords}}</span></li>
              <li class="stat-result-li stat-result-changes"><span class="changesHeader">{{changes}}</span><span class="stat-result-textContent stat-result-changesContent">{{item.changes}}</span></li>
            </ul>
          </div>
        </template>
      </iron-list>
      </div>
      `;
  }
}

window.customElements.define('stat-result', StatResult);