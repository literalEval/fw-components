import Big from "big.js/big.mjs";
import { Expectation, Queue, Stack } from "./helpers.js";
import { Recommender } from "./recommendor.js";
export class Parser {
  constructor(variables, mathematicalExpressions) {
    this.operatorPrecedence = {
      "^": 3,
      "/": 2,
      "*": 2,
      "+": 1,
      "-": 1,
    };
    this.mappedFormula = "";
    this.variables = variables;
    this.mathematicalExpressions = mathematicalExpressions;
    this._recommender = new Recommender(this.variables);
  }

  parseInput(formula, prevCurPos = null, recommendation = null) {
    let tokens = formula.split(/([-+(),*/:?\s])/g);
    let formattedString = ``;
    let expectation = Expectation.VARIABLE;
    let bracketCount = 0;
    let currentPosition = 0;
    let parseOutput = {
      recommendations: null,
      formattedContent: null,
      formattedString: null,
      newCursorPosition:
        prevCurPos !== null && prevCurPos !== void 0 ? prevCurPos : -1,
      errorStr: null,
    };
    console.log(tokens);
    tokens.forEach((token) => {
      let isNumber =
        this.variables.has(token) || !Number.isNaN(Number.parseFloat(token));
      let isOperator = this.mathematicalExpressions.has(token);
      let isSpace = token.trim() == "";
      let isBracket = token == "(" || token == ")";

      if (isSpace) {
        formattedString = `${formattedString}${token}`;
        currentPosition += token.length;
        return;
      }

      if (
        currentPosition <= prevCurPos &&
        currentPosition + token.length + 1 >= prevCurPos &&
        !parseOutput.recommendations
      ) {
        // If a recommendation was provided, replace the correspoding
        // word with it and move the cursor forward, accordingly.
        if (recommendation) {
          parseOutput.newCursorPosition +=
            recommendation.length - token.length + 1;
          token = recommendation;
        }

        parseOutput.recommendations =
          this._recommender.getRecommendation(token);
        console.log(parseOutput.recommendations);
      } else {
        // parseOutput.recommendations = null;
      }

      let tokenClassName = "";

      if (token == "(") {
        bracketCount++;
        tokenClassName += " bracket";
      } else if (token == ")") {
        bracketCount--;
        tokenClassName += " bracket";
      } else if (isOperator) {
        tokenClassName += " operator";
      } else {
      }

      if (
        expectation == Expectation.UNDEF ||
        (expectation == Expectation.VARIABLE && !isNumber && !isBracket) ||
        (expectation == Expectation.OPERATOR && !isOperator) ||
        (!isNumber && !isOperator)
      ) {
        tokenClassName += " error";
      }

      if (!parseOutput.errorStr) {
        if (bracketCount < 0) {
          parseOutput.errorStr = `Unexpected ')' at pos: ${currentPosition}`;
          expectation = Expectation.UNDEF;
        } else if (
          expectation == Expectation.VARIABLE &&
          !isNumber &&
          !isBracket
        ) {
          parseOutput.errorStr = `Expected variable/number at pos: ${currentPosition}`;
          expectation = Expectation.UNDEF;
        } else if (
          expectation == Expectation.OPERATOR &&
          !isOperator &&
          token != ")"
        ) {
          parseOutput.errorStr = `Expected mathematical operator at pos: ${currentPosition}`;
          expectation = Expectation.UNDEF;
        } else if (!isNumber && !isOperator && !isBracket) {
          parseOutput.errorStr = `Unknown word at pos: ${currentPosition}`;
          expectation = Expectation.UNDEF;
        }
      }

      if (expectation != Expectation.UNDEF) {
        if (token == "(" || isOperator) {
          console.log("operator encountered ", token, expectation);
          expectation = Expectation.VARIABLE;
        } else if (token == ")" || isNumber) {
          expectation = Expectation.OPERATOR;
        }
      }

      formattedString = `${formattedString}<span class="wysiwygInternals ${tokenClassName}">${token}</span>${
        recommendation ? " " : ""
      }`; // if (isNumber) {
      //   expectation = Expectation.OPERATOR;
      // } else if (isOperator) {
      //   expectation = Expectation.VARIABLE;
      // } else if (isSpace) {
      // } else {
      //   expectation = Expectation.UNDEF;
      // }

      currentPosition += token.length;
      console.log(token, expectation);
    });
    const parser = new DOMParser();
    const doc = parser.parseFromString(formattedString, "text/html");
    parseOutput.formattedContent = doc.querySelector("body");
    parseOutput.formattedString = formattedString;
    return parseOutput;
  }

  buildRPN(formula) {
    if (this.parseInput(formula).errorStr) {
      return null;
    }

    let tokens = formula
      .split(/([-+(),*/:?\s])/g)
      .filter((el) => !/\s+/.test(el) && el !== ""); // Implementing the Shunting Yard Algorithm (EW Dijkstra)

    const operatorStack = new Stack();
    const outputQueue = new Queue();

    for (let token of tokens) {
      if (token == "(") {
        operatorStack.push("(");
      } else if (token == ")") {
        while (operatorStack.top() != "(") {
          outputQueue.enqueue(operatorStack.pop());
        }

        operatorStack.pop();
      } else if (this.mathematicalExpressions.has(token)) {
        while (
          this.mathematicalExpressions.has(operatorStack.top()) &&
          this.operatorPrecedence[token] <=
            this.operatorPrecedence[operatorStack.top()]
        ) {
          outputQueue.enqueue(operatorStack.pop());
        }

        operatorStack.push(token);
      } else if (!Number.isNaN(token) && token != "") {
        outputQueue.enqueue(token);
      }
    }

    while (operatorStack.top()) {
      outputQueue.enqueue(operatorStack.pop());
    }

    (() => {
      // outputQueue?.print();
    })();

    return outputQueue;
  }

  addParens(formula) {
    const rpn = this.buildRPN(formula);

    if (!rpn) {
      return null;
    }

    let stringRPN = "";

    while (!rpn.empty()) {
      stringRPN += rpn.dequeue() + " ";
    }

    let lexedRPN = stringRPN // .replace(/\^/g, "**")
      .split(/\s+/g)
      .filter((el) => !/\s+/.test(el) && el !== "");
    let operatorStack = new Stack();
    let resultStack = new Stack();
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
          operatorStack.pop(),
          operatorStack.pop(),
        ];

        if (
          this.operatorPrecedence[opb] <= this.operatorPrecedence[symbol] ||
          (this.operatorPrecedence[opb] === this.operatorPrecedence[symbol] &&
            ["/", "-"].includes(symbol))
        ) {
          strb = `(${b})`;
        } else {
          strb = `${b}`;
        }

        if (
          this.operatorPrecedence[opa] <= this.operatorPrecedence[symbol] ||
          (this.operatorPrecedence[opa] === this.operatorPrecedence[symbol] &&
            ["/", "-"].includes(symbol))
        ) {
          stra = `(${a})`;
        } else {
          stra = `${a}`;
        }

        resultStack.push(`${strb} ${symbol} ${stra}`);
        operatorStack.push(symbol);
      } else throw `${symbol} is not a recognized symbol`;
    });

    if (!resultStack.empty()) {
      return resultStack.pop();
    } else throw `${stringRPN} is not a correct RPN`;
  }

  calculate(formula) {
    var _a, _b, _c;

    let rpn = this.buildRPN(formula);

    if (!rpn) {
      return undefined;
    }

    let calcStack = new Stack();

    while (!rpn.empty()) {
      const frontItem = rpn.dequeue();

      if (!this.mathematicalExpressions.has(frontItem)) {
        calcStack.push(
          Big(
            Number.parseFloat(
              (_b =
                (_a = this.variables.get(frontItem)) === null || _a === void 0
                  ? void 0
                  : _a.toString()) !== null && _b !== void 0
                ? _b
                : frontItem
            )
          )
        );
      } else {
        let operator = frontItem;
        let numB = calcStack.pop();
        let numA = calcStack.pop();

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

    return (_c = calcStack.top()) === null || _c === void 0
      ? void 0
      : _c.toNumber();
  }
} //# sourceMappingURL=parser.js.map
