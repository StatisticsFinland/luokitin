import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-input/iron-input.js'
import '@polymer/polymer/lib/elements/dom-repeat.js'
import '../node_modules/whatwg-fetch/fetch.js'
import '@polymer/paper-styles/paper-styles.js';
import '@polymer/paper-styles/element-styles/paper-material-styles.js';

class TkLuokituspuu extends PolymerElement {

  static get properties() {
    return {
      classes: {
        type: Array,
        notify: true,
      },
      correspondingClasses: {
        type: Array,
        notify: true,
      },
      classification: String,
      classificationName: String,
      selectedClass: String,
      isCorrespondenceClasses: Boolean,
      language: {
        type: String,
        value: "fi",
        notify: true,
        reflectToAttribute: true,
      },
      openAllText: {
        type: String,
        value: "Avaa kaikki",
        notify: true,
      },
      noNote: {
        type: String,
        value: "Luokalla ei ole kuvausta."
      },
      level: Number,
    }
  }

  connectedCallback() {
    super.connectedCallback()
    this.addEventListeners()
    if (this.classification) {  // If user has specified the classification already.
      this.fetchData()
    }
    this.selectedClass = ""
    this.setLanguage()
  }

  setLanguage() {
    if (this.language === "en") {
      this.openAllText = "Open all"
      this.noNote = "The class has no description."
    } else if (this.language === "sv") {
      this.openAllText = "Öppna alla"
      this.noNote = "Klassen har ingen beskrivning."
    } else {
      this.openAllText = "Avaa kaikki"
    }
    this.notifyPath('openAllText')
  }

  // Handles the opening and closing of the tree items.
  open(e) {
    let item = e.target
    if (item.tagName.toLowerCase() !== "li") {  // To trigger opening also when user clicks the <span> elements inside <li>.
      item = e.target.parentNode
    }
    let _class = ""
    this._itemSelected(item)
    if (this.openAllText !== "Sulje kaikki" && this.openAllText !== "Close all" && this.openAllText !== "Stäng alla") { // Only open if "open everything" is not selected.
      this.classes.forEach(function (value, index) {
        if (item.id === value.localId || item.id === value.name) {
          _class = value
          for (let i = index; i < this.classes.length; i++) {
            if (this.classes[i].parentItemLocalId === value.localId) {  // If a class has the same parent ID as current class ID, hide/show.
              this.classes[i].visible ? this.classes[i].visible = false : this.classes[i].visible = true
            }
          }
        }
      }.bind(this))
      const visibleItems = this.classes.filter(c => c.visible === true)
      let level = 0
      for (let i = 0; i < visibleItems.length; i++) {
        if (visibleItems[i].level > 1) {
          if (visibleItems[i].level - visibleItems[i - 1].level > 1) {
            level = visibleItems[i].level // Need to hide all classes with this level or more, if parent class is clicked.
          }
        }
      }
      let mainParent = ""
      for (let i = this.classes.indexOf(_class); i < this.classes.length; i++) {
        if (this.classes[i].level >= level && level > 1) {
          this.classes[i].visible = false
          mainParent = this.classes[i].mainParent
        }
        if (mainParent && this.classes[i + 2].mainParent !== mainParent) {  // Brake the loop so that other main parent's child classes with level-variable are not hidden.
          break
        }
      }
      this.render()
      this.renderListElements()
    }
  }

  // Sends class with an event to be listened. Sends double event, to trigger tk-valinta component rendering again as a temporary solution to "tähän ei kuulu" and others not rendering correctly.
  _itemSelected(targetItem) {
    let _selected = this.shadowRoot.querySelector(".tk-luokituspuu-template").itemForElement(targetItem)
    if (this.isCorrespondenceClasses) {
      if (this.correspondingClasses && this.correspondingClasses.indexOf(_selected) != -1) {
        window.dispatchEvent(new CustomEvent('tk-luokkahaku-luokka', {
          detail: _selected
        }))
        window.dispatchEvent(new CustomEvent('tk-luokkahaku-luokka', {
          detail: _selected
        }))
      } else {
        window.dispatchEvent(new CustomEvent('tk-luokkahaku-luokka', {
          detail: "ei avain luokka"
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
  }

  async fetchData() {
    this.classes = []
    let url = "https://data.stat.fi/api/classifications/v2/classifications/" + this.classification + "/classificationItems?content=data&meta=max&lang=" + this.language
    await fetch(url)
      .then((response) => {
        this.shadowRoot.querySelector('.tk-luokituspuu-body').setAttribute('hidden', true);
        return response.json();
      })
      .then((json) => {
        if (this.isCorrespondenceClasses) {   // Continue to fetch and merge correspondence classes, if they are present.
          this.fetchCorrespondenceClasses()
        }
        return json
      })
      .then((json) => {
        this.renderData(json)
        this.shadowRoot.querySelector('.tk-luokituspuu-body').removeAttribute('hidden');
      })

  }

  fetchCorrespondenceClasses() {
    let url = "https://data.stat.fi/api/classifications/v2/correspondenceTables/" + this.classification + "%23rakennus_1_20180712/maps?content=data&meta=max&lang=" + this.language
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
    this.classes.forEach(item => {
      item.targetItems = []
      json.forEach(_class => {
        if (item.localId === _class.sourceItem.localId) {
          item.targetItems.push(_class.targetItem)
          this.push("correspondingClasses", item)
        }
      })
    })
  }

  renderListElements() {
    let listItems = this.shadowRoot.querySelectorAll("li")
    for (let item of listItems) {
      this.removeAllClasses(item)
      if (this.correspondingClasses != null) {
        for (let _class of this.correspondingClasses) {
          if (_class.localId === item.id) {
            item.classList.add("corresponding")
          }
        }
      }
      if (this.selectedClass !== "") {
        if (item.id === this.selectedClass.localId) {
          item.classList.add("selected")
        }
      }
    }
  }

  removeAllClasses(item) {
    if (this.hasClass(item, "selected")) {
      item.classList.remove("selected")
    }
    if (this.hasClass(item, "corresponding")) {
      item.classList.remove("corresponding")
    }
  }

  handleOpen(e) {
    let helper = true;
    if (e.target.text === "Avaa kaikki") {
      helper = true
      this.openAllText = "Sulje kaikki"
    } else if (e.target.text === "Open all") {
      helper = true
      this.openAllText = "Close all"
    } else if (e.target.text === "Öppna alla") {
      helper = true
      this.openAllText = "Stäng alla"
    } else {
      helper = false
      this.openAllText = "Avaa kaikki"
      if (this.language === "en") {
        this.openAllText = "Open all"
      }
      if (this.language === "sv") {
        this.openAllText = "Öppna alla"
      }
    }
    this.classes.forEach(_class => {
      if (_class.level > 1) {
        _class.visible = helper
      }
    })
    this.render()
    this.renderListElements()
  }

  returnToDefaultView() {
    this.classes.forEach(function (value) {
      if (value.level > 1) {
        value.visible = false
      }
    })
  }

  // Polyfills dont for some reason fix contains(), so we have to use old indexOf()
  hasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
  }

  isVisible(item) {
    return item.visible == true
  }

  // Assigns data to new data fields to allow access in HTML-template. There was a problem in reaching indexes of the original data e.g. explanatoryNotes[0].
  renderData(json) {
    this.classificationName = json[0].classification.classificationName[0].name
    let levelCalc = 0
    let level = 0
    let mainParent
    for (let item of json) {
      item.localId = item.localId.replace("/", "-")
      if (item.parentItemLocalId) {
        item.parentItemLocalId = item.parentItemLocalId.replace("/", "-")
      }
      item.visible = true
      item.name = item.classificationItemNames[0].name
      item.keywords = item.classificationIndexEntry[0].text
      if (item.level == 2) {
        item.visible = false
        item.intendation = "    "
      } else if (item.level == 3) {
        item.visible = false
        item.intendation = "        "
      } else if (item.level == 4) {
        item.visible = false
        item.intendation = "            "
      } else if (item.level == 5) {
        item.visible = false
        item.intendation = "                "
      } else if (item.level == 6) {
        item.visible = false
        item.intendation = "                    "
      } else if (item.level == 7) {
        item.visible = false
        item.intendation = "                        "
      } else if (item.level == 8) {
        item.visible = false
        item.intendation = "                            "
      }

      if (item.explanatoryNotes.length > 0) {
        const notes = item.explanatoryNotes[0]
        item.note = notes.generalNote[notes.generalNote.length - 1] // Take the last index of array. It contains the latest information.
        if (item.explanatoryNotes[0].includes) {
          item.includes = notes.includes[notes.includes.length - 1]
        }
        if (item.explanatoryNotes[0].includesAlso) {
          item.includesAlso = notes.includesAlso[notes.includesAlso.length - 1]
        }
        if (item.explanatoryNotes[0].excludes) {
          item.excludes = notes.excludes[notes.excludes.length - 1]
        }
        if (item.explanatoryNotes[0].rulings) {
          item.rulings = notes.rulings[notes.rulings.length - 1]
        }
        if (item.explanatoryNotes[0].changes) {
          item.changes = notes.changes[notes.changes.length - 1]
        }
      } else {
        item.note = this.noNote
      }
      level = item.level
      if (level > levelCalc) {
        levelCalc = item.level
      }
      if (level === 1) {
        mainParent = item
        item.mainParent = item
      } else {
        item.mainParent = mainParent
      }
      this.push("classes", item)
    }
    this.level = levelCalc
    window.dispatchEvent(new CustomEvent('tk-lataus-valmis', {
      detail: this.classification
    }))
  }

  addEventListeners() {
    // If classification is given by tk-luokitushaku element, set that classification and fetch data
    window.addEventListener('tk-luokitushaku-luokitus', e => {
      this.isCorrespondenceClasses = false
      if (e.detail.correspondenceClasses) {
        this.isCorrespondenceClasses = e.detail.correspondenceClasses
      }
      this.classification = e.detail.classificationId
      this.shadowRoot.querySelector(".tk-luokituspuu-body").style.visibility = "visible"
      this.setLanguage()
      this.fetchData()
    })
    // Opens classification tree at the spot of the received clss.
    window.addEventListener('tk-luokkahaku-luokka', e => {
      this.selectedClass = e.detail
      this.openTree(e)
      this.renderListElements()
      this.render()
    })
  }

  openTree(e) {
    let classLocalId = e.detail.localId
    this.classes.forEach(classy => {
      this.classes.forEach(_class => {
        if (_class.localId === classLocalId) {
          _class.visible = true
          for (let j = 0; j < this.classes.length; j++) {
            if (this.classes[j].parentItemLocalId === _class.parentItemLocalId) {   // If has the same parent and on the same level.
              this.classes[j].visible = true
              if (this.classes[j + 1] != null) {
                if (this.classes[j + 1].parentItemLocalId !== _class.parentItemLocalId) {   // If next item has different parent...
                  classLocalId = this.classes[j].parentItemLocalId    // ...set parent to be the new parent.
                }
              }
            }
          }
        }
      })
    })
    this.render()
  }

  // Assigns data of correspondence classes to new data fields to allow access in HTML-template. There was a problem in reaching indexes of the original data e.g. explanatoryNotes[0].
  editTargetItems(json) {
    for (let item of json) {
      item.sourceItem.localId = item.sourceItem.localId.replace("/", "-")
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
        item.note = this.noNote
      }
    }
  }

  static get template() {
    return html`
      <style>
      .selected {
        background-color: #e0effa;
        font-weight: bold;
      }

      .corresponding {
        font-weight: bold;
      }
  
      a {
        text-decoration: underline;
      }

      .tk-luokituspuu-body {
        visibility: visible;
        @apply(--shadow-elevation-2dp);
        background-color: #0073b0;
      }
  
      .tk-luokituspuu-header {
        display: flex;
        justify-content: space-between;
      }
  
      .tk-luokituspuu-open {
        color: white;
        margin-right: 0.5em;
      }
  
      .tk-luokituspuu-open:hover {
        cursor: pointer;      
      }
  
      .tk-luokituspuu-ul {
        padding-left:5px;    
        background-color: white;     
        list-style-type: none; 
        margin-top: 0;
        @apply(--shadow-elevation-2dp);       
      }
  
      .tk-luokituspuu-li {
        white-space: pre;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-bottom: 2.5px;
      }

      .tk-luokituspuu-li:hover {
        background-color: #e0effa;
        cursor: pointer;      
      }
  
      .tk-luokituspuu-h1 {
        color: white;      
        @apply --paper-font-headline;
        padding-left: 20px;      
        font-weight: bold; 
        padding-top: 12px;   
        padding-bottom: 12px;
        margin: 0;
        float: left;           
      }
      </style>

      <div class="tk tk-luokituspuu-body">
        <div class="tk-luokituspuu-header">
          <h1 class="tk-luokituspuu-h1">{{classificationName}}</h1> <a on-click="handleOpen" class="tk-luokituspuu-open">{{openAllText}}</a>
        </div>
        <ul class="tk-luokituspuu-ul">
            <template class="tk-luokituspuu-template" is="dom-repeat" items="{{classes}}" filter="isVisible" observe="visible item.visible">
              <li class="tk-luokituspuu-li" on-click="open" id="{{item.localId}}" title="{{item.name}}"><span class="intendation tk-luokituspuu-intendation">{{item.intendation}}</span><span class="classCode tk-luokituspuu-classCode">{{item.code}}</span>      <span class="className tk-luokituspuu-className">{{item.name}}</span></li>
            </template>
        </ul>
      </div>
      `;
  }

  render() {
    this.shadowRoot.querySelector(".tk-luokituspuu-template").render()
  }
}

window.customElements.define('tk-luokituspuu', TkLuokituspuu);