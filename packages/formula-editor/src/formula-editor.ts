import { html, css, LitElement, PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Cursor } from "./cursor.js";
import { Recommender } from "./recommendor.js";
import { Parser } from "./parser.js";
import "./suggestion-menu.js";

enum Expectation {
  VARIABLE,
  OPERATOR,
  UNDEF,
}

@customElement("formula-editor")
export class FormulaEditor extends LitElement {
  private _recommender: Recommender;
  private _parser: Parser;

  constructor() {
    super();

    this._recommender = new Recommender(this.variables);
    this._parser = new Parser(this.variables, this.mathematicalExpressions);
  }

  @property()
  content: string = "";

  @property()
  formattedContent: Element | null = null;

  @property()
  recommendations: string[] | null = null;

  @state()
  errorStr: string | null = null;

  @state()
  calculatedResult: number | null = null;

  // If this parseInput is called to add a recommendation, say by clicking,
  // browser removes focus from the input box. In that case, we have no way
  // of knowing where the cursor previously was, other than storing it somewhere.
  currentCursorPosition: number | null = null;

  variables = new Map([
    ["qib", 2],
    ["rii", 3],
    ["amog", 4],
    ["mohit", 0.1],
    ["mohini", 0.2],
    ["ravi", 7],
    ["ravipandey", 8],
  ]);
  mathematicalExpressions = new Set(["+", "-", "*", "/", "(", ")"]);

  styles = `
    #wysiwyg-editor {
      display: inline-block;
      border: none;
      padding: 4px;
    }

    #wysiwyg-editor:focus {
      border: none;
    }

    u.wysiwygInternals {
      text-decoration-color: red;
      text-decoration-style: wavy;
    }
  `;

  handleChange(event: InputEvent) {
    this.content = (event.target as HTMLDivElement).innerText;
    this.parseInput(null);
    (event.target as HTMLDivElement).focus();
  }

  onClickRecommendation(recommendation: string) {
    console.log(recommendation);

    let editor = document.getElementById("wysiwyg-editor");
    if (!editor) return;

    this.parseInput(recommendation);
    this.currentCursorPosition = null;
  }

  parseInput(recommendation: string | null = null) {
    // TODO: Research if cursor-detection can work with shadow-root somehow
    //     let editor = this.shadowRoot.getElementById("wysiwyg-editor");
    let editor = document.getElementById("wysiwyg-editor");
    if (!editor) return;

    let prevCurPos = recommendation
      ? this.currentCursorPosition
      : Cursor.getCurrentCursorPosition(editor);

    this.currentCursorPosition = prevCurPos;

    let hasSpace = this.content != "" ? this.content.slice(0) == " " : false;
    //     let words = this.content.split(/[\s,]+/);
    let words = this.content.split(/([-+(),*/:?\s])/g);
    let formattedString = ``;

    // Trying to build a custom "shadow-like"
    // formattedString += '<span id="wysiwygInternalHtml">';

    let expectation = Expectation.VARIABLE;
    let currentPosition = 0;

    words.forEach((word, index, arr) => {
      console.log(currentPosition);
      console.log(prevCurPos);
      console.log(word.length);
      if (
        currentPosition <= prevCurPos! &&
        currentPosition + word.length + 1 >= prevCurPos!
      ) {
        if (recommendation) {
          prevCurPos! += recommendation.length - word.length;
          word = recommendation;
        }

        this.recommendations = this._recommender.getRecommendation(word);
        // console.log("word has become ", word);
        // console.log(this.recommendations);
      } else {
        this.recommendations = null;
      }

      let isVariable: boolean = this.variables.has(word);
      let isOperator = this.mathematicalExpressions.has(word);
      let isNumber = Number.parseFloat(word);

      if (
        (expectation == Expectation.VARIABLE && !isVariable) ||
        (expectation == Expectation.OPERATOR && !isOperator) ||
        (expectation == Expectation.VARIABLE && isOperator)
      ) {
        formattedString = `${formattedString}<u class="wysiwygInternals">${word}</u>`;
      } else if (isOperator) {
        formattedString = `${formattedString}<b class="wysiwygInternals">${word}</b>`;
        expectation = Expectation.VARIABLE;
      } else if (word == " ") {
        formattedString = `${formattedString} `;
      } else {
        formattedString = `${formattedString}${word}${
          recommendation ? "&nbsp;" : ""
        }`;
        expectation = Expectation.OPERATOR;
      }

      if (isVariable || isNumber) {
        expectation = Expectation.OPERATOR;
      } else if (isOperator) {
        expectation = Expectation.VARIABLE;
      } else {
        expectation = Expectation.UNDEF;
      }

      currentPosition += word.length + 1;
    });

    // formattedString += "</span>";
    formattedString += hasSpace ? " " : "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(formattedString, "text/html");

    this.formattedContent = doc.querySelector("body");

    if (editor) {
      editor.innerHTML = formattedString;
    }

    Cursor.setCurrentCursorPosition(prevCurPos!, editor);
    editor?.focus();

    if (recommendation) {
      this.content = (editor as HTMLDivElement).innerText;
      this.recommendations = null;
    }

    this.calculatedResult = this._parser.calculate(this.content);

    this.requestUpdate();
    return formattedString;
  }

  requestCalculate() {
    this.calculatedResult = this._parser.calculate(this.content);
    this.content = this._parser.addParens(this.content) ?? this.content;
    this.parseInput();
    this.requestUpdate();
  }

  // Disable shadow-root as it messes up cursor detection.
  createRenderRoot() {
    return this;
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    this.parseInput(null);
  }

  render() {
    return html`
      <style>
        ${this.styles}
      </style>
      <div
        contenteditable
        id="wysiwyg-editor"
        style="min-width: 200px; height: 30px; border: 2px solid black;"
        spellcheck="false"
        @input=${this.handleChange}
      ></div>
      ${console.log(this.recommendations)}
      ${this.recommendations
        ? html`<suggestion-menu
            .recommendations=${this.recommendations.join(",")}
            .onClickRecommendation=${(e: any) => this.onClickRecommendation(e)}
          ></suggestion-menu>`
        : html``}
      <button @click=${this.requestCalculate}>Calculate</button>
      <p>${this.calculatedResult}</p>
    `;
  }
}

// <!-- <span>${this.calculatedOutput}</span> -->
// <!-- <div class="editor-output">${this.errorStr}</div> -->
