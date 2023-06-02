var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
let SuggestionMenu = class SuggestionMenu extends LitElement {
    constructor() {
        super(...arguments);
        this.recommendations = "";
        this.onClickRecommendation = (recommendation) => {
            // console.log(e);
        };
    }
    handleKeydown(event, recommendation) {
        if (event.code == "Enter") {
            event.preventDefault();
            event.stopPropagation();
            this.onClickRecommendation(recommendation);
        }
    }
    render() {
        return html `
      <ul class="wysiwyg-suggestion-menu">
        ${this.recommendations.split(",").map((recommendation) => {
            return html `<li
            tabindex="0"
            @click=${(e) => this.onClickRecommendation(recommendation)}
            @keydown=${(e) => this.handleKeydown(e, recommendation)}
          >
            ${recommendation}
          </li>`;
        })}
      </ul>
    `;
    }
};
SuggestionMenu.styles = css `
    ul {
      border: 1px solid grey;
      box-sizing: border-box;
      width: fit-content;
      list-style-type: none;
      padding: 4px 0px;
      margin: 2px;
    }

    li {
      /* width: fit-content; */
      /* box-size: fit-content; */
      margin: 0px;
      padding: 2px 6px;
    }

    li:focus-visible {
      outline: 1px solid red;
    }
  `;
__decorate([
    property()
], SuggestionMenu.prototype, "recommendations", void 0);
__decorate([
    property()
], SuggestionMenu.prototype, "onClickRecommendation", void 0);
SuggestionMenu = __decorate([
    customElement("suggestion-menu")
], SuggestionMenu);
export { SuggestionMenu };
//# sourceMappingURL=suggestion-menu.js.map
//# sourceMappingURL=suggestion-menu.js.map
//# sourceMappingURL=suggestion-menu.js.map