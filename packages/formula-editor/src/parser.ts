import Big from "big.js";
import { Expectation, Queue, Stack } from "./helpers.js";
import { Recommender } from "./recommendor.js";

export interface ParseOutput {
  recommendations: string[] | null;
  formattedContent: HTMLBodyElement | null;
  formattedString: string | null;
  newCursorPosition: number;
  errorStr: string | null;
}

export class Parser {
  constructor(variables: Map<string, number>, minSuggestionLen: number) {
    this.variables = variables;

    this._recommender = new Recommender(this.variables, minSuggestionLen);
  }

  private _recommender: Recommender;

  variables: Map<string, number>;
  mathematicalOperators: Set<string> = new Set(["^", "+", "-", "*", "/"]);
  operatorPrecedence: { [key: string]: number } = {
    "^": 3,
    "/": 2,
    "*": 2,
    "+": 1,
    "-": 1,
  };

  parseInput(
    formula: string,
    prevCurPos: number | null = null,
    recommendation: string | null = null
  ): ParseOutput {
    let tokens = formula.split(/([-+(),*/:?\s])/g),
      parentheses = new Stack<number>(),
      formattedString = ``,
      expectation = Expectation.VARIABLE,
      bracketCount = 0,
      currentPosition = 0,
      previousToken = "",
      parseOutput: ParseOutput = {
        recommendations: null,
        formattedContent: null,
        formattedString: null,
        newCursorPosition: prevCurPos ?? -1,
        errorStr: null,
      };

    console.log(tokens);

    tokens.forEach((token) => {
      let isNumber =
          this.variables.has(token) ||
          (recommendation && this.variables.has(recommendation)) ||
          !Number.isNaN(Number(token)),
        isOperator = this.mathematicalOperators.has(token),
        isSpace = token.trim() == "",
        isBracket = token == "(" || token == ")",
        hasCursor = false;

      if (isSpace) {
        formattedString = `${formattedString}${token}`;
        currentPosition += token.length;
        return;
      }

      if (
        currentPosition <= prevCurPos! &&
        currentPosition + token.length >= prevCurPos! &&
        !parseOutput.recommendations
      ) {
        // If a recommendation was provided, replace the correspoding
        // word with it and move the cursor forward, accordingly.
        if (recommendation) {
          parseOutput.newCursorPosition = Math.min(
            parseOutput.newCursorPosition +
              recommendation.length -
              token.length,
            formula.length + recommendation.length - token.length
          );
          token = recommendation;
          recommendation = null;
          hasCursor = true;
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
        parentheses.push(currentPosition);
        tokenClassName += " bracket";
      } else if (token == ")") {
        parentheses.pop();
        bracketCount--;
        tokenClassName += " bracket";
      } else if (isOperator) {
        tokenClassName += " operator";
      } else {
      }

      if (
        expectation == Expectation.UNDEFINED ||
        (expectation == Expectation.VARIABLE &&
          !isNumber &&
          !isBracket &&
          !(
            (token == "-" || token == "+") &&
            this.mathematicalOperators.has(previousToken)
          )) ||
        (expectation == Expectation.OPERATOR && !isOperator) ||
        (token == ")" && previousToken == "(") ||
        !(isNumber || isOperator || isBracket) ||
        (isNumber &&
          previousToken == "/" &&
          (this.variables.get(token) == 0 || Number(token) == 0))
      ) {
        tokenClassName += " error";
      }

      if (!parseOutput.errorStr) {
        if (bracketCount < 0) {
          parseOutput.errorStr = `Unexpected ')' at pos: ${currentPosition}`;
          expectation = Expectation.UNDEFINED;
        } else if (
          expectation == Expectation.VARIABLE &&
          !isNumber &&
          !isBracket &&
          !(
            (token == "-" || token == "+") &&
            this.mathematicalOperators.has(previousToken)
          )
        ) {
          parseOutput.errorStr = `Expected variable/number at pos: ${currentPosition}`;
          expectation = Expectation.UNDEFINED;
        } else if (
          expectation == Expectation.OPERATOR &&
          !isOperator &&
          token != ")"
        ) {
          parseOutput.errorStr = `Expected mathematical operator at pos: ${currentPosition}`;
          expectation = Expectation.UNDEFINED;
        } else if (!(isNumber || isOperator || isBracket)) {
          parseOutput.errorStr = `Unknown word at pos: ${currentPosition}`;
          expectation = Expectation.UNDEFINED;
        } else if (
          isNumber &&
          previousToken == "/" &&
          (this.variables.get(token) == 0 || Number(token) == 0)
        ) {
          parseOutput.errorStr = `Division by zero at pos: ${currentPosition}`;
          expectation = Expectation.UNDEFINED;
        } else if (previousToken == "(" && token == ")") {
          parseOutput.errorStr = `isEmpty brackets at position ${currentPosition}`;
          expectation = Expectation.UNDEFINED;
        }
      }

      if (expectation != Expectation.UNDEFINED) {
        if (token == "(" || isOperator) {
          expectation = Expectation.VARIABLE;
        } else if (token == ")" || isNumber) {
          expectation = Expectation.OPERATOR;
        }
      }

      if (hasCursor) {
        formattedString = `${formattedString}${token}`;
      } else {
        formattedString = `${formattedString}<span class="wysiwygInternals ${tokenClassName}">${token}</span>`;
      }

      currentPosition += token.length;
      previousToken = token;
    });

    if (this.mathematicalOperators.has(previousToken)) {
      parseOutput.errorStr = "Unexpected ending of formula.";
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(formattedString, "text/html");

    parseOutput.formattedContent = doc.querySelector("body")!;
    parseOutput.formattedString = formattedString;

    if (!parentheses.isEmpty()) {
      parseOutput.errorStr = `Unclosed '(' at position: ${parentheses.top()}`;
    }

    return parseOutput;
  }

  buildRPN(formula: string): Queue<string> | null {
    if (this.parseInput(formula).errorStr) {
      return null;
    }

    const tokens = formula
      .split(/([-+(),*/:?\s])/g)
      .filter((el: string) => !/\s+/.test(el) && el !== "");

    // Handling the special case of unary `-` and `+`.

    let previousToken = "";
    let carriedToken: string | null = null;
    const parsedTokens: string[] = [];

    for (const token of tokens) {
      if (
        (token == "+" || token == "-") &&
        this.mathematicalOperators.has(previousToken)
      ) {
        carriedToken = token;
      } else if (carriedToken) {
        parsedTokens.push(carriedToken + token);
        carriedToken = null;
      } else {
        parsedTokens.push(token);
      }

      previousToken = token;
    }

    /**
     * Shunting Yard Algorithm (EW Dijkstra)
     */

    const operatorStack = new Stack<string>();
    const outputQueue = new Queue<string>();

    for (const token of parsedTokens) {
      if (token == "(") {
        operatorStack.push("(");
      } else if (token == ")") {
        while (operatorStack.top() != "(") {
          outputQueue.enqueue(operatorStack.pop()!);
        }

        operatorStack.pop();
      } else if (this.mathematicalOperators.has(token)) {
        while (
          this.mathematicalOperators.has(operatorStack.top()!) &&
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
      // outputQueue?.print();
    })();

    return outputQueue;
  }

  addParens(formula: string): string | null {
    const rpn = this.buildRPN(formula);

    if (!rpn) {
      return null;
    }

    const lexedRPN: string[] = [];

    while (!rpn.isEmpty()) {
      lexedRPN.push(rpn.dequeue()!);
    }

    let operatorStack = new Stack<string | null>();
    let resultStack = new Stack<string>();

    lexedRPN.forEach((symbol) => {
      let parsedLeftExpression: string, parsedRightExpression: string;

      if (
        this.variables.has(symbol) ||
        (!isNaN(parseFloat(symbol)) && isFinite(parseFloat(symbol)))
      ) {
        resultStack.push(symbol);
        operatorStack.push(null);
      } else if (Object.keys(this.operatorPrecedence).includes(symbol)) {
        let [rightExpression, leftExpression, operatorA, operatorB] = [
          resultStack.pop()!,
          resultStack.pop()!,
          operatorStack.pop()!,
          operatorStack.pop()!,
        ];

        if (
          this.operatorPrecedence[operatorB] <= this.operatorPrecedence[symbol] ||
          (this.operatorPrecedence[operatorB] === this.operatorPrecedence[symbol] &&
            ["/", "-"].includes(symbol))
        ) {
          parsedLeftExpression = `(${leftExpression})`;
        } else {
          parsedLeftExpression = leftExpression;
        }

        if (
          this.operatorPrecedence[operatorA] <= this.operatorPrecedence[symbol] ||
          (this.operatorPrecedence[operatorA] === this.operatorPrecedence[symbol] &&
            ["/", "-"].includes(symbol))
        ) {
          parsedRightExpression = `(${rightExpression})`;
        } else {
          parsedRightExpression = rightExpression;
        }

        resultStack.push(`${parsedLeftExpression} ${symbol} ${parsedRightExpression}`);
        operatorStack.push(symbol);
      } else throw `${symbol} is not a recognized symbol`;
    });

    if (!resultStack.isEmpty()) {
      return resultStack.pop()!;
    } else throw `${lexedRPN} is not a correct RPN`;
  }

  calculate(formula: string): number | undefined {
    let rpn = this.buildRPN(formula);

    if (!rpn) {
      return undefined;
    }

    let calcStack = new Stack<Big>();

    while (!rpn.isEmpty()) {
      const frontItem = rpn.dequeue()!;

      if (!this.mathematicalOperators.has(frontItem)) {
        calcStack.push(
          Big(
            Number.parseFloat(
              this.variables.get(frontItem)?.toString() ?? frontItem
            )
          )
        );
      } else {
        let operator = frontItem;
        let numB = calcStack.pop()!;
        let numA = calcStack.pop()!;

        try {
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
              break;

            // Big.js doesn't support exponentiating a Big to a Big, which
            // is obious due to performance overheads. Use this case with care.

            case "^":
              calcStack.push(Big(numA).pow(Big(numB).toNumber()));
          }
        } catch (err: unknown) {
          return undefined;
        }
      }
    }

    return calcStack.top()?.toNumber();
  }
}
