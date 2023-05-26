import { html, css, LitElement, PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Cursor } from "./cursor.js";
import { Recommender } from "./recommendor.js";
import "./suggestion-menu.js";

enum Expectation {
  VARIABLE,
  OPERATOR,
  UNDEF,
}

@customElement("formula-editor")
export class FormulaEditor extends LitElement {
  private _recommender: Recommender;

  constructor() {
    super();

    this._recommender = new Recommender(this.variables);
  }

  @property()
  content: string = "";

  @property()
  formattedContent: Element | null = null;

  @property()
  recommendations: string[] | null = null;

  variables = new Set([
    "qib",
    "rii",
    "amog",
    "mohit",
    "mohini",
    "ravi",
    "ravi pandey",
  ]);
  mathematicalExpressions = new Set(["+", "-", "*", "/", "(", ")"]);

  styles = `
    #wysiwyg-editor {
      display: inline-block;
      border: none;
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
    this.parseInput();
    (event.target as HTMLDivElement).focus();
  }

  parseInput() {
    // TODO: Research if cursor-detection can work with shadow-root somehow
    //     let editor = this.shadowRoot.getElementById("wysiwyg-editor");
    let editor = document.getElementById("wysiwyg-editor");
    if (!editor) return;

    let prevCurPos = Cursor.getCurrentCursorPosition(editor);
    let hasSpace = this.content != "" ? this.content.slice(0) == " " : false;
    //     let words = this.content.split(/[\s,]+/);
    let words = this.content.split(" ");
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
        currentPosition <= prevCurPos &&
        currentPosition + word.length + 1 >= prevCurPos
      ) {
        this.recommendations = this._recommender.getRecommendation(word);
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
        formattedString = `${formattedString} <u class="wysiwygInternals">${word}</u>`;
      } else if (isOperator) {
        formattedString = `${formattedString} <b class="wysiwygInternals">${word}</b>`;
        expectation = Expectation.VARIABLE;
      } else {
        formattedString = `${formattedString} ${word}`;
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

    Cursor.setCurrentCursorPosition(prevCurPos, editor);
    editor?.focus();

    this.requestUpdate();
    return formattedString;
  }

  // Disable shadow-root as it messes up cursor detection.
  createRenderRoot() {
    return this;
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    this.parseInput();
  }

  render() {
    return html`
      <style>
        ${this.styles}
      </style>
      <div
        id="wysiwyg-editor"
        style="min-width: 200px; height: 30px; border: 2px solid black;"
        contenteditable
        spellcheck="false"
        @input=${this.handleChange}
      ></div>
      ${console.log(this.recommendations)}
      ${this.recommendations
        ? html`<suggestion-menu
            recommendations=${this.recommendations.join(",")}
          ></suggestion-menu>`
        : html``}
      <div class="editor-output">${this.formattedContent}</div>
    `;
  }
}
