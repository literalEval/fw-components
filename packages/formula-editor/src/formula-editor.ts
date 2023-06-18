import { html, LitElement, PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { FormulaEditorStyles } from "./styles/formula-editor-styles.js";
import { TextButtonStyles } from "../../styles/src/button-styles.js";
import { Parser } from "./parser.js";
import { Cursor } from "./cursor.js";
import "./suggestion-menu.js";

@customElement("formula-editor")
export class FormulaEditor extends LitElement {
  private _parser: Parser;

  constructor() {
    super();

    this._parser = new Parser(this.variables, this.minSuggestionLen);
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    this._parser = new Parser(this.variables, this.minSuggestionLen);
  }

  /**
   * These `states` and `properties` can't be defined as `static get properties`,
   * because TS doesn't support that.
   * @see https://github.com/lit/lit-element/issues/414
   */

  @state()
  _content: string = "";

  @state()
  _formattedContent: Element | null = null;

  @state()
  _recommendations: string[] | null = null;

  @state()
  _errorStr: string | null = null;

  @state()
  _calculatedResult: number | undefined = undefined;

  /**
   * If `parseInput` is called to add a recommendation, say by clicking,
   * browser removes focus from the input box. In that case, we have no way
   * of knowing where the cursor previously was, other than storing it somewhere.
   */

  @state()
  currentCursorPosition: number | null = null;

  @state()
  currentCursorRect: DOMRect | undefined = undefined;

  @state()
  lastInputType: string = "undef";

  @property({
    type: Map<string, number>,
    converter: {
      fromAttribute: (value) => {
        if (value) {
          return new Map<string, number>(JSON.parse(value));
        }
      },
      toAttribute: (value: Map<string, number>) => {
        return JSON.stringify(Array.from(value.entries()));
      },
    },
  })
  variables = new Map();

  @property()
  minSuggestionLen: number = 2;

  handleChange(event: InputEvent) {
    event.preventDefault();

    this.lastInputType = event.inputType;
    this._content = (event.target as HTMLDivElement).innerText;
    this.parseInput();

    (event.target as HTMLDivElement).focus();
  }

  handleTab(event: KeyboardEvent) {
    if (event.code == "Tab" && this._recommendations?.length == 1) {
      event.preventDefault();
      this.parseInput(this._recommendations[0]);
    }
  }

  onClickRecommendation(recommendation: string) {
    let editor = document.getElementById("wysiwyg-editor");
    if (!editor) return;

    this.parseInput(recommendation);
    this.currentCursorPosition = null;
  }

  parseInput(recommendation: string | null = null) {
    let editor = document.getElementById("wysiwyg-editor");
    if (!editor) return;

    this.currentCursorPosition = recommendation
      ? this.currentCursorPosition
      : Cursor.getCaretPosition(editor);

    const parseOutput = this._parser.parseInput(
      this._content,
      this.currentCursorPosition,
      recommendation
    );

    this._recommendations = parseOutput.recommendations;
    this._formattedContent = parseOutput.formattedContent;
    this._errorStr = parseOutput.errorString;

    /**
     * Don't modify the text stream manually if the text is being composed,
     * unless the user manually chooses to do so by selecting a suggestion.
     * @see https://github.com/w3c/input-events/issues/86
     * @see https://github.com/w3c/input-events/pull/122
     * @see https://bugs.chromium.org/p/chromium/issues/detail?id=689541
     * */

    if (this.lastInputType != "insertCompositionText" || recommendation) {
      editor.innerHTML = parseOutput.formattedString!;
    }

    this._content = (editor as HTMLDivElement).innerText;

    if (recommendation) {
      this._recommendations = null;
      this.currentCursorPosition = parseOutput.newCursorPosition;
    }

    Cursor.setCaretPosition(this.currentCursorPosition!, editor);
    editor?.focus();

    this.currentCursorRect = Cursor.getCursorRect();
    this.requestUpdate();
  }

  requestCalculate() {
    if (this._parser.parseInput(this._content).errorString) {
      return;
    }

    const calculatedResult = this._parser.calculate(this._content);

    this._content = this._parser.addParentheses(this._content) ?? this._content;
    this.parseInput();

    this._calculatedResult = calculatedResult.result;
    this._errorStr = calculatedResult.errorString;

    this._recommendations = null;
    this.requestUpdate();
  }

  requestFormat() {
    this._content = this._parser.addParentheses(this._content) ?? this._content;
    this.parseInput();
    this._recommendations = null;
    this.requestUpdate();
  }

  // Disable shadow-root as it messes up cursor detection.
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        ${FormulaEditorStyles}
        ${TextButtonStyles}
      </style>
      <div
        contenteditable
        id="wysiwyg-editor"
        spellcheck="false"
        autocomplete="off"
        @input=${this.handleChange}
        @keydown=${this.handleTab}
      ></div>
      ${this._recommendations
        ? html` <suggestion-menu
            style="
              position: absolute; 
              left: ${this.currentCursorRect?.left + "px"}; 
              top: ${(this.currentCursorRect?.top ?? 0) +
            window.scrollY +
            "px"};
            "
            .recommendations=${this._recommendations}
            .onClickRecommendation=${(e: any) => this.onClickRecommendation(e)}
          ></suggestion-menu>`
        : html``}
      <div id="wysiwyg-err" class="${this._errorStr ?? "wysiwyg-no-err"}">
        ${this._errorStr ?? html`&nbsp;`}
      </div>
      <button class="primary-text-button" @click=${this.requestCalculate}>
        Calculate
      </button>
      <button class="primary-text-button" @click=${this.requestFormat}>
        Format
      </button>
      <p>${this._calculatedResult}</p>
    `;
  }
}
