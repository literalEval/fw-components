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
import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Parser } from "./parser.js";
import { Cursor } from "./cursor.js";
import "./suggestion-menu.js";
let FormulaEditor = class FormulaEditor extends LitElement {
    constructor() {
        super();
        this.content = "";
        this.formattedContent = null;
        this.recommendations = null;
        this.errorStr = null;
        this.calculatedResult = null;
        // If this parseInput is called to add a recommendation, say by clicking,
        // browser removes focus from the input box. In that case, we have no way
        // of knowing where the cursor previously was, other than storing it somewhere.
        this.currentCursorPosition = null;
        this.variables = new Map([
            ["a", 2],
            ["b", 3],
            ["c", 4],
            ["mohit", 0],
            ["mohini", 0.2],
            ["ravi", 7],
            ["ravipandey", 8],
        ]);
        this.mathematicalExpressions = new Set(["+", "-", "*", "/"]);
        this.styles = `
    #wysiwyg-editor {
      display: inline-block;
      border: none;
      padding: 4px;
    }

    #wysiwyg-editor:focus {
      border: none;
    }

    .wysiwygInternals.error {
      text-decoration: underline;
      text-decoration-color: red;
    }

    .wysiwygInternals.bracket {
      color: #AA3731;
    }

    .wysiwygInternals.operator {
      font-weight: bold;
      color: #777777;
    }
  `;
        this._parser = new Parser(this.variables, this.mathematicalExpressions);
    }
    handleChange(event) {
        this.content = event.target.innerText;
        this.parseInput();
        console.log("handel change called");
        event.target.focus();
    }
    onClickRecommendation(recommendation) {
        // console.log(recommendation);
        let editor = document.getElementById("wysiwyg-editor");
        if (!editor)
            return;
        this.parseInput(recommendation);
        this.currentCursorPosition = null;
    }
    parseInput(addRecommendation = null) {
        // TODO: Research if cursor-detection can work with shadow-root somehow
        let editor = document.getElementById("wysiwyg-editor");
        if (!editor)
            return;
        this.currentCursorPosition = addRecommendation
            ? this.currentCursorPosition
            : Cursor.getCurrentCursorPosition(editor);
        const parseOutput = this._parser.parseInput(this.content, this.currentCursorPosition, addRecommendation);
        this.recommendations = parseOutput.recommendations;
        // console.log(this.recommendations);
        this.formattedContent = parseOutput.formattedContent;
        this.errorStr = parseOutput.errorStr;
        editor.innerHTML = parseOutput.formattedString;
        this.content = editor.innerText;
        if (addRecommendation) {
            this.recommendations = null;
            this.currentCursorPosition = parseOutput.newCursorPosition;
        }
        Cursor.setCurrentCursorPosition(this.currentCursorPosition, editor);
        editor === null || editor === void 0 ? void 0 : editor.focus();
        // this.calculatedResult = this._parser.calculate(this.content)!;
        this.requestUpdate();
    }
    requestCalculate() {
        var _a;
        this.calculatedResult = this._parser.calculate(this.content);
        this.content = (_a = this._parser.addParens(this.content)) !== null && _a !== void 0 ? _a : this.content;
        this.parseInput();
        this.requestUpdate();
    }
    // Disable shadow-root as it messes up cursor detection.
    createRenderRoot() {
        return this;
    }
    firstUpdated(_changedProperties) {
        // this.parseInput(null);
    }
    render() {
        return html `
      <style>
        ${this.styles}
      </style>
      <div
        contenteditable
        id="wysiwyg-editor"
        style="min-width: 200px; height: 30px; border: 0px solid black; outline: 1px solid black;"
        spellcheck="false"
        @input=${this.handleChange}
      ></div>
      ${this.recommendations
            ? html `<suggestion-menu
            .recommendations=${this.recommendations.join(",")}
            .onClickRecommendation=${(e) => this.onClickRecommendation(e)}
          ></suggestion-menu>`
            : html ``}
      <button @click=${this.requestCalculate}>Calculate</button>
      <p style="color: red;">${this.errorStr}</p>
      <p>${this.calculatedResult}</p>
    `;
    }
};
__decorate([
    state()
], FormulaEditor.prototype, "content", void 0);
__decorate([
    state()
], FormulaEditor.prototype, "formattedContent", void 0);
__decorate([
    state()
], FormulaEditor.prototype, "recommendations", void 0);
__decorate([
    state()
], FormulaEditor.prototype, "errorStr", void 0);
__decorate([
    state()
], FormulaEditor.prototype, "calculatedResult", void 0);
FormulaEditor = __decorate([
    customElement("formula-editor")
], FormulaEditor);
export { FormulaEditor };
//# sourceMappingURL=formula-editor.js.map
//# sourceMappingURL=formula-editor.js.map
//# sourceMappingURL=formula-editor.js.map