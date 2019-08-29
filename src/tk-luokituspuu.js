import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-input/iron-input.js'
import '@polymer/polymer/lib/elements/dom-repeat.js'
import '../node_modules/whatwg-fetch/fetch.js'
import '@polymer/paper-styles/paper-styles.js';
import '@polymer/paper-styles/element-styles/paper-material-styles.js';
import './style-element.js';

class TkLuokituspuu extends PolymerElement {

  static get template() {
    return html`
      <style include="style-element">
      </style>
      <div class="tk tk-luokituspuu-body">
        <h1 class="tk-luokituspuu-h1">{{classificationName}}</h1> <a on-click="handleOpen" class="tk-luokituspuu-open">{{openAllText}}</a>
        <ul class="tk-luokituspuu-ul">
            <template class="tk-luokituspuu-template" is="dom-repeat" items="{{classes}}" filter="isVisible" observe="visible item.visible">
              <li class="tk-luokituspuu-li" on-click="open" id="{{item.localId}}" title="{{item.note}}" name="{{item.name}}"><span class="intendation tk-luokituspuu-intendation">{{item.intendation}}</span><span class="classCode tk-luokituspuu-classCode">{{item.code}}</span>      <span class="className tk-luokituspuu-className">{{item.name}}</span></li>
            </template>
        </ul>
      </div>
      `;
  }

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
      }
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
    if (item.tagName.toLowerCase() !== "li") {    // To trigger opening also when user clicks the <span> elements inside <li>.
      item = e.target.parentNode
    }
    this._itemSelected(item)
    if (this.openAllText !== "Sulje kaikki" && this.openAllText !== "Close all" && this.openAllText !== "Stäng alla") {   // Only open if "open everything" is not selected.
      this.classes.forEach(function (value, index) {
        if (item.id === value.localId || item.id === value.name) {
          for (let i = index; i < this.classes.length; i++) {
            if (this.classes[i].parentItemLocalId === value.localId) {    // If a class has the same parent as current class, open it.
              this.classes[i].visible = true
            }
          }
        }
      }.bind(this))
      this.render()
      this.renderListElements()
    }
  }

  // Sends class with an event to be listened. Sends double event, to trigger tk-valinta component rendering again as a temporary solution to "tähän ei kuulu" and others not rendering correctly.
  _itemSelected(targetItem) {
    let _selected = this.shadowRoot.querySelector(".tk-luokituspuu-template").itemForElement(targetItem)
    if (this.isCorrespondenceClasses) {
      if (this.correspondingClasses.indexOf(_selected) != -1) {
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

  fetchData() {
    this.classes = []
    let url = "https://data.stat.fi/api/classifications/v1/classifications/" + this.classification + "/classificationItems?content=data&meta=max&lang=" + this.language
    console.log("Haetaan luokituspuu osoitteesta: " + url)
    fetch(url)
      .then((response) => {
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
      })

  }

  fetchCorrespondenceClasses() {
    let url = "https://data.stat.fi/api/classifications/v1/correspondenceTables/" + this.classification + "%23rakennus_1_20180712/maps?content=data&meta=max&lang=" + this.language
    console.log("Haetaan vastinluokat osoitteesta: " + url)
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
      }
      if (item.explanatoryNotes.length > 0) {
        item.note = item.explanatoryNotes[0].generalNote[0]
        if (item.explanatoryNotes[0].excludes) {
          item.excludes = item.explanatoryNotes[0].excludes
        }
        if (item.explanatoryNotes[0].includes) {
          item.includes = item.explanatoryNotes[0].includes
        }
        if (item.explanatoryNotes[0].includesAlso) {
          item.includesAlso = item.explanatoryNotes[0].includesAlso
        }
      } else {
        item.note = this.noNote
      }
      this.push("classes", item)
    }
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
      this.scrollIntoView()
      this.render()
    })
  }

  scrollIntoView() {
    if (this.shadowRoot.querySelector(".selected") !== null) {
      this.shadowRoot.querySelector(".selected").scrollIntoView({
        behavior: "smooth",
      })
    }
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
        item.targetItem.note = item.targetItem.explanatoryNotes[0].generalNote[0]
        if (item.targetItem.explanatoryNotes[0].excludes) {
          item.targetItem.excludes = item.targetItem.explanatoryNotes[0].excludes
        }
        if (item.targetItem.explanatoryNotes[0].includes) {
          item.targetItem.includes = item.targetItem.explanatoryNotes[0].includes
        }
        if (item.targetItem.explanatoryNotes[0].includesAlso) {
          item.targetItem.includesAlso = item.targetItem.explanatoryNotes[0].includesAlso
        }
      } else {
        item.note = this.noNote
      }
    }
  }

  render() {
    this.shadowRoot.querySelector(".tk-luokituspuu-template").render()
  }
}

window.customElements.define('tk-luokituspuu', TkLuokituspuu);