import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-styles/paper-styles.js';
import './style-element.js';

class TkLahdeluokitus extends PolymerElement {

    static get template() {
        return html`
            <style include="style-element">        
            </style>
            <div class="tk-lahdeluokitus-body">
                <div class="classificationButtons">
                    <paper-button toggles active raised on-click="click" id="rakennus_1_20180712">{{buttonContent.first}}</paper-button>
                    <paper-button toggles raised on-click="click" id="rakennus_1_19940101">{{buttonContent.second}}</paper-button>
                    <paper-button toggles raised on-click="click" id="toimiala_1_20080101">{{buttonContent.third}}</paper-button>
                </div>  
            </div>
        `;
    }

    static get properties() {
        return {
            classificationName: String,
            language: {
                type: String,
                value: "fi",
                notify: true,
                reflectToAttribute: true,
            },
            buttonContent: {
                type: Array,
                notify: true,
                value: { first: "Rakennusluokitus 2018", second: "Rakennusluokitusavain", third: "Toimialaluokitusavain" }
            },
        }
    }

    connectedCallback() {
        super.connectedCallback()
        this.setLanguage()
    }

    setLanguage() {
        if (this.language === "en") {
            this.buttonContent.first = "Classification of Buildings 2018"
            this.buttonContent.second = "Building classification conversion key"
            this.buttonContent.third = "Industrial classification conversion key"
        } else if (this.language === "sv") {
            this.buttonContent.first = "Byggnadsklassificering 2018"
            this.buttonContent.second = "Byggnadsklassificeringsnyckel"
            this.buttonContent.third = "Näringsgrensindelningsnyckel"
        }
        this.notifyPath('buttonContent.first')
        this.notifyPath('buttonContent.second')
        this.notifyPath('buttonContent.third')
    }

    click(e) {
        let correspondenceClasses = false   // A variable to be attached in the event details to indicate whether correspondence tables need to be loaded or not.
        if (e.target.id != "rakennus_1_20180712") {
            correspondenceClasses = true;
        }
        window.dispatchEvent(new CustomEvent('tk-luokitushaku-luokitus', {
            detail: { classificationId: e.target.id, correspondenceClasses: correspondenceClasses }
        }))
        let buttons = this.shadowRoot.querySelectorAll("paper-button")
        buttons.forEach(button => {
            if (button != e.target) {
                this.removeAttribute(button, "active")
            }
        });
    }

    // Might not work on IE and polyfills might not catch it.
    removeAttribute(obj, attr) {
        if (obj.hasAttribute(attr)) {
            obj.removeAttribute(attr)
        }
    }
}

window.customElements.define('tk-lahdeluokitus', TkLahdeluokitus);