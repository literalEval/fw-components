import Big from "big.js";
import { Cursor } from "./cursor.js";
import { Expectation, Queue, Stack } from "./helpers.js";
import { Recommender } from "./recommendor.js";

export interface ParseOutput {
  recommendations: string[] | null;
  formattedContent: HTMLBodyElement | null;
  formattedString: string | null;
  newCursorPosition: number;
  error: string | null;
}

export class Parser {
  constructor(
    variables: Map<string, number>,
    mathematicalExpressions: Set<string>
  ) {
    this.variables = variables;
    this.mathematicalExpressions = mathematicalExpressions;
    this._recommender = new Recommender(this.variables);
  }

  private _recommender: Recommender;

  variables: Map<string, number>;
  mathematicalExpressions: Set<string>;
  operatorPrecedence: { [key: string]: number } = {
    "^": 3,
    "/": 2,
    "*": 2,
    "+": 1,
    "-": 1,
  };
  mappedFormula: string = "";

  parseInput(
    formula: string,
    prevCurPos: number | null = null,
    recommendation: string | null = null
  ): ParseOutput {
    let tokens = formula.split(/([-+(),*/:?\s])/g);
    let formattedString = ``;
    let expectation = Expectation.VARIABLE;
    let currentPosition = 0;
    let parseOutput: ParseOutput = {
      recommendations: null,
      formattedContent: null,
      formattedString: null,
      newCursorPosition: prevCurPos ?? -1,
      error: null,
    };

    tokens.forEach((token, index, arr) => {
      console.log(currentPosition);
      console.log(prevCurPos);
      console.log(token.length);
      if (
        currentPosition <= prevCurPos! &&
        currentPosition + token.length + 1 >= prevCurPos!
      ) {
        if (recommendation) {
          parseOutput.newCursorPosition += recommendation.length - token.length;
          token = recommendation;
        }

        parseOutput.recommendations =
          this._recommender.getRecommendation(token);
      } else {
        parseOutput.recommendations = null;
      }

      let isVariable: boolean = this.variables.has(token);
      let isOperator = this.mathematicalExpressions.has(token);
      let isNumber = Number.parseFloat(token);

      if (token == " ") {
        formattedString = `${formattedString} `;
      } else if (token == "(" || token == ")") {
        formattedString = `${formattedString}<span class="wysiwygInternals bracket">${token}</span>`;
      } else if (
        (expectation == Expectation.VARIABLE && !isVariable) ||
        (expectation == Expectation.OPERATOR && !isOperator) ||
        (expectation == Expectation.VARIABLE && isOperator) ||
        (!isNumber && !isVariable && !isOperator)
      ) {
        formattedString = `${formattedString}<u class="wysiwygInternals">${token}</u>`;
      } else if (isOperator) {
        formattedString = `${formattedString}<b class="wysiwygInternals operator">${token}</b>`;
        expectation = Expectation.VARIABLE;
      } else {
        formattedString = `${formattedString}${token}${
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

      currentPosition += token.length;
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(formattedString, "text/html");

    parseOutput.formattedContent = doc.querySelector("body")!;
    parseOutput.formattedString = formattedString;

    return parseOutput;
  }

  buildRPN(formula: string): Queue<string> | null {
    if (this.parseInput(formula).error) {
      return null;
    }

    let tokens = formula
      .split(/([-+(),*/:?\s])/g)
      .filter((el: string) => !/\s+/.test(el) && el !== "");

    // Implementing the Shunting Yard Algorithm (EW Dijkstra)

    const operatorStack = new Stack<string>();
    const outputQueue = new Queue<string>();

    for (let token of tokens) {
      if (token == "(") {
        operatorStack.push("(");
      } else if (token == ")") {
        while (operatorStack.top() != "(") {
          outputQueue.enqueue(operatorStack.pop()!);
        }

        operatorStack.pop();
      } else if (this.mathematicalExpressions.has(token)) {
        while (
          this.mathematicalExpressions.has(operatorStack.top()!) &&
          this.operatorPrecedence[token] <=
            this.operatorPrecedence[operatorStack.top()!]
        ) {
          outputQueue.enqueue(operatorStack.pop()!);
        }

        operatorStack.push(token);
      } else if (!Number.isNaN(token) && token != "") {
        outputQueue.enqueue(token);
      }
    }

    while (operatorStack.top()) {
      outputQueue.enqueue(operatorStack.pop()!);
    }

    (() => {
      outputQueue?.print();
    })();

    return outputQueue;
  }

  addParens(formula: string): string | null {
    const rpn = this.buildRPN(formula);

    if (!rpn) {
      return null;
    }

    let stringRPN = "";

    while (!rpn.empty()) {
      stringRPN += rpn.dequeue() + " ";
    }

    let lexedRPN = stringRPN
      // .replace(/\^/g, "**")
      .split(/\s+/g)
      .filter((el: string) => !/\s+/.test(el) && el !== "");

    let operatorStack = new Stack<string | null>();
    let resultStack = new Stack<string>();

    lexedRPN.forEach((symbol) => {
      let stra, strb;

      if (
        this.variables.has(symbol) ||
        (!isNaN(parseFloat(symbol)) && isFinite(parseFloat(symbol)))
      ) {
        resultStack.push(symbol);
        operatorStack.push(null);
      } else if (Object.keys(this.operatorPrecedence).includes(symbol)) {
        let [a, b, opa, opb] = [
          resultStack.pop(),
          resultStack.pop(),
          operatorStack.pop()!,
          operatorStack.pop()!,
        ];

        if (this.operatorPrecedence[opb] <= this.operatorPrecedence[symbol]) {
          strb = `(${b})`;
        } else {
          strb = `${b}`;
        }

        if (
          this.operatorPrecedence[opa] > this.operatorPrecedence[symbol] ||
          (this.operatorPrecedence[opa] === this.operatorPrecedence[symbol] &&
            ["/", "-"].includes(symbol))
        ) {
          console.log("the symbol is", symbol);
          stra = `(${a})`;
        } else {
          stra = `${a}`;
        }

        resultStack.push(`${strb}${symbol}${stra}`);
        operatorStack.push(symbol);
      } else throw `${symbol} is not a recognized symbol`;
    });

    if (!resultStack.empty()) {
      return resultStack.pop()!;
    } else throw `${stringRPN} is not a correct RPN`;
  }

  calculate(formula: string): number | undefined {
    let rpn = this.buildRPN(formula);

    if (!rpn) {
      return undefined;
    }

    let calcStack = new Stack<Big>();

    while (!rpn.empty()) {
      const frontItem = rpn.dequeue()!;

      if (!this.mathematicalExpressions.has(frontItem)) {
        let val = this.variables.get(frontItem)?.toString() ?? frontItem;
        calcStack.push(Big(Number.parseFloat(val)));
      } else {
        let operator = frontItem;
        let numB = calcStack.pop()!;
        let numA = calcStack.pop()!;

        switch (operator) {
          case "+":
            calcStack.push(Big(numA).add(Big(numB)));
            break;
          case "-":
            calcStack.push(Big(numA).sub(Big(numB)));
            break;
          case "*":
            calcStack.push(Big(numA).mul(Big(numB)));
            break;
          case "/":
            calcStack.push(Big(numA).div(Big(numB)));
        }
      }
    }

    console.log("amogus is: ", Function(`return ${calcStack.top()};`)());
    return calcStack.top()?.toNumber();
  }
}
