import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-input/iron-input.js'
import '@polymer/polymer/lib/elements/dom-repeat.js'
import '../node_modules/whatwg-fetch/fetch.js'
import '@polymer/paper-styles/paper-styles.js';
import '@polymer/paper-styles/element-styles/paper-material-styles.js';
import '@polymer/paper-input/paper-input.js';

class TkLuokkahaku extends PolymerElement {

  static get properties() {
    return {
      resultSearchField: {
        type: String,
        notify: true,
      },
      results: {
        type: Array,
        notify: true,
      },
      correspondingClasses: {
        type: Array,
        notify: true,
      },
      classification: String,
      classificationName: String,
      isCorrespondenceClasses: Boolean,
      greatestLevel: String,
      language: {
        type: String,
        value: "fi",
        notify: true,
        reflectToAttribute: true,
      },
      placeHolderText: {
        type: String,
        notify: true,
        value: "Hae luokkaa sanahaulla tai koodilla",
      },
    }
  }

  connectedCallback() {
    super.connectedCallback()
    this.addEventListeners()
    if (this.classification) {    // If classification is given as a parameter, fetch data.
      this.fetchData()
    }
    this.setLanguage()
  }

  addEventListeners() {
    this.addEventListener('keyup', this.resultSearch.bind(this));
    window.addEventListener('tk-luokitushaku-luokitus', e => {
      this.resultSearchField = "";
      this.isCorrespondenceClasses = false
      if (e.detail.correspondenceClasses) {   // If event carries boolean true correspondenceClasses, set a variable to indicate that the classification contains correspondence classes. 
        this.isCorrespondenceClasses = e.detail.correspondenceClasses
      }
      this.classification = e.detail.classificationId
      this.shadowRoot.querySelector(".tk-luokkahaku-body").style.visibility = "visible"
      this.$.mainList.setAttribute("hidden", true)
      this.fetchData()
    })
    window.addEventListener('click', e => {   // For hiding the search results box, if clicked anywhere outside it.
      if (e.srcElement.tagName.toLowerCase() !== "tk-luokkahaku") {
        this.$.mainList.setAttribute("hidden", true)
      }
    })
  }

  setLanguage() {
    if (this.language === "en") {
      this.placeHolderText = "Search for a category with word search or code..."
    } else if (this.language === "sv") {
      this.placeHolderText = "Sök en klass med ordsökning eller kod..."
    }
    this.notifyPath('placeHolderText')
  }

  // Sends class with an event to be listened. Sends double event, to trigger tk-valinta component rendering correctly, as a temporary solution.
  _itemSelected(e) {
    let _selected = this.shadowRoot.querySelector(".tk-luokkahaku-template").itemForElement(e.target)
    this.resultSearchField = this.cutSearchField(_selected, this.resultSearchField)
    if (this.isCorrespondenceClasses) {
      if (this.correspondingClasses.indexOf(_selected) != -1) {
        window.dispatchEvent(new CustomEvent('tk-luokkahaku-luokka', {
          detail: _selected
        }))
        window.dispatchEvent(new CustomEvent('tk-luokkahaku-luokka', {
          detail: _selected
        }))
      }
    } else {
      window.dispatchEvent(new CustomEvent('tk-luokkahaku-luokka', {
        detail: _selected
      }))
      window.dispatchEvent(new CustomEvent('tk-luokkahaku-luokka', {
        detail: _selected
      }))
    }
    this.$.mainList.setAttribute("hidden", true)
  }

  // Cuts searchfield with a pre-determined value. Possibly not optimal solution.
  cutSearchField(_selected, string) {
    string = _selected.name
    if (string.length > 43) {
      string = string.slice(0, 43)
    }
    return string
  }

  isVisible(item) {
    return item.visible == true
  }

  isNumeric(num) {
    return !isNaN(num)
  }

  isString(string) {
    return typeof string === "string" || string instanceof String
  }

  resultSearch() {
    if (this.results != null) {
      let input = this.resultSearchField.toLowerCase()
      this.filterItems(input)
    }
  }

  // Focus filtering only to code, if input lenght < 2. After that, widen to other fields.
  filterItems(input) {
    let inputLength = input.length
    if (inputLength > 2) {
      for (let item of this.results) {
        item.visible = true
        if (item.name.toLowerCase().indexOf(input) === -1 && item.code.toLowerCase().slice(0, inputLength) !== input && !this.findKeyword(item, input) && !this.hasIncludes(item, input) && !this.hasIncludesAlso(item, input)) {
          item.visible = false
        }
      }
      this.toggleResults()
    } else {
      for (let item of this.results) {
        item.visible = true
        if (item.code.toLowerCase().slice(0, inputLength) !== input) {
          item.visible = false
        }
      }
      this.toggleResults()
    }
  }

  hasIncludes(item, input) {
    if (item.includes) {
      for (let i = 0; i < item.includes.length; i++) {
        if (item.includes[i].indexOf(input) >= 0) {
          return true;
        }
      }
    }
  }

  hasIncludesAlso(item, input) {
    if (item.includesAlso) {
      for (let i = 0; i < item.includesAlso.length; i++) {
        if (item.includesAlso[i].indexOf(input) >= 0) {
          return true;
        }
      }
    }
  }

  findKeyword(item, input) {
    let keywords = item.keywords
    if (item.targetItems) {
      for (const targetItem of item.targetItems) {
        keywords = keywords.concat(targetItem.keywords)
      }
    }
    const uniqueKeywords = [...new Set(keywords)]
    item.keywords = uniqueKeywords
    for (let i = 0; i < item.keywords.length; i++) {
      if (item.keywords[i].indexOf(input) >= 0) {
        return true;
      }
    }
  }

  toggleResults() {
    let visibleItems = this.results.filter(item => item.visible === true)
    if (this.resultSearchField === "" || this.results.length < 1 || visibleItems.length < 1) {
      this.$.mainList.setAttribute("hidden", true)
    } else {
      this.$.mainList.removeAttribute("hidden")
      this.shadowRoot.querySelector(".tk-luokkahaku-template").render();
    }
  }

  async fetchData() {
    this.results = []
    let url = "https://data.stat.fi/api/classifications/v2/classifications/" + this.classification + "/classificationItems?content=data&meta=max&lang=" + this.language
    await fetch(url)
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        if (json.length > 0) {
          this.results = []
          this.addToResults(json)
        } else {
          alert("Sovellus ei saanut dataa rajapinnasta. Kokeile päivittää sivu.")
        }
        if (this.isCorrespondenceClasses) {   // Continue to fetch and merge correspondence classes, if they are present.
          this.fetchCorrespondenceClasses()
        }
      })
  }

  fetchCorrespondenceClasses() {
    let url = "https://data.stat.fi/api/classifications/v1/correspondenceTables/" + this.classification + "%23rakennus_1_20180712/maps?content=data&meta=max&lang=" + this.language
    console.log(url)
    fetch(url)
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        this.mergeClasses(json)
      })
  }

  // Merges correspondence classes to present classes.
  mergeClasses(json) {
    this.correspondingClasses = []
    this.editTargetItems(json)
    this.results.forEach(item => {
      item.targetItems = []
      json.forEach(_class => {
        if (item.localId === _class.sourceItem.localId) {
          item.targetItems.push(_class.targetItem)
          // for (const targetItem of item.targetItems) {  // Add keywords to correspondence class.
          //   item.keywords = item.keywords.concat(targetItem.keywords)
          // }
          // console.log(item.keywords)
          this.push("correspondingClasses", item)
        }
      })
    })
    let x = this.correspondingClasses.filter((v, i) => this.correspondingClasses.indexOf(v) === i)
    this.results = x;
  }

  // Assigns data of correspondence classes to new data fields to allow access in HTML-template. There was a problem in reaching indexes of the original data e.g. explanatoryNotes[0].
  editTargetItems(json) {
    for (let item of json) {
      item.sourceItem.localId = item.sourceItem.localId.replace("/", "-")   // Changed to allow making localId an id of an html element. Run to problems when using "/".
      if (item.sourceItem.parentItemLocalId) {
        item.sourceItem.parentItemLocalId = item.sourceItem.parentItemLocalId.replace("/", "-")
      }
      item.targetItem.name = item.targetItem.classificationItemNames[0].name
      item.targetItem.keywords = item.targetItem.classificationIndexEntry[0].text
      if (item.targetItem.explanatoryNotes.length > 0) {
        item.targetItem.note = item.targetItem.explanatoryNotes[0].generalNote[item.targetItem.explanatoryNotes[0].generalNote.length - 1]
        if (item.targetItem.explanatoryNotes[0].includes) {
          item.targetItem.includes = item.targetItem.explanatoryNotes[0].includes[item.targetItem.explanatoryNotes[0].includes.length - 1]
        }
        if (item.targetItem.explanatoryNotes[0].includesAlso) {
          item.targetItem.includesAlso = item.targetItem.explanatoryNotes[0].includesAlso[item.targetItem.explanatoryNotes[0].includesAlso.length - 1]
        }
        if (item.targetItem.explanatoryNotes[0].excludes) {
          item.targetItem.excludes = item.targetItem.explanatoryNotes[0].excludes[item.targetItem.explanatoryNotes[0].excludes.length - 1]
        }
        if (item.targetItem.explanatoryNotes[0].rulings) {
          item.targetItem.rulings = item.targetItem.explanatoryNotes[0].rulings[item.targetItem.explanatoryNotes[0].rulings.length - 1]
        }
        if (item.targetItem.explanatoryNotes[0].changes) {
          item.targetItem.changes = item.targetItem.explanatoryNotes[0].changes[item.targetItem.explanatoryNotes[0].changes.length - 1]
        }
      } else {
        item.note = ""
      }
    }
  }

  // Same as above, but for normal classes (not correspondence classes).
  addToResults(json) {
    this.greatestLevel = 0
    this.classificationName = json[0].classification.classificationName[0].name
    for (let item of json) {
      if (this.greatestLevel < item.level) {
        this.greatestLevel = item.level
      }
      item.localId = item.localId.replace("/", "-")
      if (item.parentItemLocalId) {
        item.parentItemLocalId = item.parentItemLocalId.replace("/", "-")
      }
      item.visible = true;
      item.name = item.classificationItemNames[0].name
      item.keywords = item.classificationIndexEntry[0].text
      if (item.explanatoryNotes.length > 0) {
        item.note = item.explanatoryNotes[0].generalNote[item.explanatoryNotes[0].generalNote.length - 1] // Gets the updated note from index [1] if it exists, otherwise gets the original note from index [0].
        if (item.explanatoryNotes[0].includes) {
          item.includes = item.explanatoryNotes[0].includes[item.explanatoryNotes[0].includes.length - 1]
        }
        if (item.explanatoryNotes[0].includesAlso) {
          item.includesAlso = item.explanatoryNotes[0].includesAlso[item.explanatoryNotes[0].includesAlso.length - 1]
        }
        if (item.explanatoryNotes[0].excludes) {
          item.excludes = item.explanatoryNotes[0].excludes[item.explanatoryNotes[0].excludes.length - 1]
        }
        if (item.explanatoryNotes[0].rulings) {
          item.rulings = notes.rulings[notes.rulings.length - 1]
        }
        if (item.explanatoryNotes[0].changes) {
          item.changes = notes.changes[notes.changes.length - 1]
        }
      } else {
        item.note = ""
      }
      this.push("results", item)
    }
  }

  // Polyfills dont for some reason fix contains(), so we have to use old indexOf()
  hasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
  }

  static get template() {
    return html`
    <style>
      ::placeholder {
        font-size: 12pt;
        font-style: italic;
        color: grey;
        opacity: 1; /* Firefox */
      }
  
      :-ms-input-placeholder { /* Internet Explorer 10-11 */
       color: grey;
       font-style: italic;
       font-size: 12pt;     
      }
  
      ::-ms-input-placeholder { /* Microsoft Edge */
       color: grey;
       font-style: italic;
       font-size: 12pt;     
      }
  
      .tk-luokkahaku-body {
        visibility: visible;      
      }
  
      .tk-luokkahaku-ul {
        padding-left:5px;    
        background-color: white;     
        list-style-type: none;  
        position: absolute;
        @apply --shadow-elevation-8dp;     
        margin-top: 0px;
        max-height: 250px;
        overflow:auto;
        width: 50%;
        z-index: 1;
      }
  
      @media (max-width:960px) {
        .tk-luokkahaku-ul {
          width: 100%;
          max-height: 250px;
        }
      }

      .tk-luokkahaku-li:hover {
        background-color: #e0effa;
        cursor: pointer;      
      }
  
      .tk-luokkahaku-input {
        width: 100%;
        padding: 8px 16px;
        border: 1px solid #bcbcbc;
        border-radius: 2px;
        box-sizing: border-box;
        font-size: 1.2em;
        // background: url("suurennuslasi.png") no-repeat scroll 7px 7px; 
        background-position: right;         
        background-color: #f7f7f7;
        @apply --shadow-elevation-2dp;    
      }
  
      .tk-luokkahaku-input::-webkit-search-cancel-button {
        position:relative;
        right:20px;    
      }
  
      .tk-luokkahaku-input::-ms-clear{
        margin-right:20px  
      }
  
      .tk-luokkahaku-input:focus {
        border: 0.25px solid #e0effa;
        @apply --shadow-elevation-4dp;              
      }
  
      .tk-luokkahaku-iron-input {        /* When styling input, you may need to apply same styles to iron-input too. */
        width: 100%;
      }
    </style>

    <div class="tk tk-luokkahaku-body">
      <iron-input class="tk-luokkahaku-iron-input" bind-value="{{resultSearchField}}">
        <input class="tk-luokkahaku-input" id="resultSearch" type="search" is="iron-input" placeholder={{placeHolderText}}>
      </iron-input>
      <ul class="tk-luokkahaku-ul" id="mainList" hidden>
        <template class="tk-luokkahaku-template" is="dom-repeat" items="{{results}}" filter="isVisible" observe="visible item.visible">
          <li class="tk-luokkahaku-li" title="{{item.note}}" on-click="_itemSelected" id="{{item.localId}}" name="{{item.name}}"><span class="classCode tk-luokkahaku-classCode">{{item.code}}</span> <span class="className tk-luokkahaku-className">{{item.name}}</span></li>
        </template>
      </ul>
    </div>
    `;
  }

}

window.customElements.define('tk-luokkahaku', TkLuokkahaku);