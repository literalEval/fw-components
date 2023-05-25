import { html, css, LitElement, PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Cursor } from "./cursor.js";

enum Expectation {
  VARIABLE,
  OPERATOR,
  UNDEF,
}

@customElement("formula-editor")
export class FormulaEditor extends LitElement {
  @property()
  content: string = "";

  @property()
  formattedContent: Element | null = null;

  variables: { [string: string]: boolean } = {
    qib: true,
    rii: true,
    amog: true,
    sussy: true,
  };

  mathematicalExpressions: { [string: string]: boolean } = {
    "+": true,
    "-": true,
    "*": true,
    "/": true,
    "(": true,
    ")": true,
  };

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
    let hasSpace = this.content != "" ? this.content.slice(0) == " " : false;
    //     let words = this.content.split(/[\s,]+/);
    let words = this.content.split(" ");
    let formattedString = ``;

    // Trying to build a custom "shadow-like"
    // formattedString += '<span id="wysiwygInternalHtml">';

    let expectation = Expectation.VARIABLE;

    words.forEach((word, index, arr) => {
      let isVariable: boolean = this.variables[word];
      let isOperator = this.mathematicalExpressions[word];
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
    });

    // formattedString += "</span>";
    formattedString += hasSpace ? " " : "";

    // TODO: Research if cursor-detection can work with shadow-root somehow
    //     let editor = this.shadowRoot.getElementById("wysiwyg-editor");
    let editor = document.getElementById("wysiwyg-editor");

    if (!editor) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(formattedString, "text/html");

    let prevCurPos = Cursor.getCurrentCursorPosition(editor);
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
      <div class="editor-output">${this.formattedContent}</div>
    `;
  }
}
