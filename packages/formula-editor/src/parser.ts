import Big from "big.js";

class Stack<Type> {
  private _inner: Type[] = [];

  push(item: Type): void {
    this._inner.push(item);
  }

  pop(): Type | undefined {
    return this._inner.pop();
  }

  top(): Type | undefined {
    return this._inner.at(-1);
  }

  empty(): boolean {
    return this._inner.length == 0;
  }

  print(): void {
    console.log(this._inner);
  }
}

class Queue<Type> {
  private _inner: { [key: number]: Type } = {};
  private _head: number = 0;
  private _tail: number = 0;

  enqueue(item: Type): void {
    this._inner[this._tail] = item;
    this._tail++;
  }

  dequeue(): Type | undefined {
    if (this._tail === this._head) return undefined;

    const element = this._inner[this._head];
    delete this._inner[this._head];
    this._head++;

    return element;
  }

  peek(): Type {
    return this._inner[this._head];
  }

  empty(): boolean {
    return this._head == this._tail;
  }

  print(): void {
    console.log(this._inner);
  }
}

export class Parser {
  constructor(
    variables: Map<string, number>,
    mathematicalExpressions: Set<string>
  ) {
    this.variables = variables;
    this.mathematicalExpressions = mathematicalExpressions;
  }

  variables: Map<string, number>;
  mathematicalExpressions: Set<string>;
  operatorPrecedence: { [key: string]: number } = {
    "/": 2,
    "*": 2,
    "+": 1,
    "-": 1,
  };
  mappedFormula: string = "";

  parseInput(formula: string): string | null {
    let tokens = formula.split(" ");

    for (let token of tokens) {
      let isVariable = this.variables.has(token);
      let isOperator = this.mathematicalExpressions.has(token);
      let isNumber = Number.parseFloat(token);
    }

    return null;
  }

  buildRPN(formula: string): Queue<string> | null {
    if (this.parseInput(formula)) {
      // return null;
    }

    let tokens = formula.split(/[\s,]+/);

    // Implementing the Shunting Yard Algorithm (EW Dijkstra)

    const operatorStack = new Stack<string>();
    const outputQueue = new Queue<string>();

    for (let token of tokens) {
      let mappedToken = this.variables.get(token)?.toString() ?? token;

      if (mappedToken == "(") {
        operatorStack.push("(");
      } else if (mappedToken == ")") {
        while (operatorStack.top() != "(") {
          outputQueue.enqueue(operatorStack.pop()!);
        }

        operatorStack.pop();
      } else if (this.mathematicalExpressions.has(mappedToken)) {
        while (
          this.mathematicalExpressions.has(operatorStack.top()!) &&
          this.operatorPrecedence[mappedToken] <=
            this.operatorPrecedence[operatorStack.top()!]
        ) {
          outputQueue.enqueue(operatorStack.pop()!);
        }

        operatorStack.push(mappedToken);
      } else if (!Number.isNaN(mappedToken) && mappedToken != "") {
        outputQueue.enqueue(mappedToken);
      }

      (() => {
        outputQueue?.print();
      })();
    }

    while (operatorStack.top()) {
      outputQueue.enqueue(operatorStack.pop()!);
    }

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
      .replace(/\^/g, "**")
      .split(/\s+/g)
      .filter((el: string) => !/\s+/.test(el) && el !== "");

    let operatorStack = new Stack<string | null>();
    let resultStack = new Stack<string>();

    lexedRPN.forEach((symbol) => {
      let stra, strb;

      if (!isNaN(parseFloat(symbol)) && isFinite(parseFloat(symbol))) {
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
          this.operatorPrecedence[opa] < this.operatorPrecedence[symbol] ||
          (this.operatorPrecedence[opa] === this.operatorPrecedence[symbol] &&
            ["/", "-"].includes(symbol))
        ) {
          console.log("the symbol is", symbol);
          stra = `(${a})`;
        } else {
          stra = `${a}`;
        }

        resultStack.push(`${strb} ${symbol} ${stra}`);
        operatorStack.push(symbol);
      } else throw `${symbol} is not a recognized symbol`;
    });

    return resultStack.pop()!;
    if (!resultStack.empty()) {
      return resultStack.pop()!;
    } else throw `${stringRPN} is not a correct RPN`;
  }

  calculate(formula: string): number | null {
    let rpn = this.buildRPN(formula);

    if (!rpn) {
      return null;
    }

    let calcStack = new Stack<Big>();

    while (!rpn.empty()) {
      if (!this.mathematicalExpressions.has(rpn.peek()!)) {
        calcStack.push(Big(Number.parseFloat(rpn.dequeue()!)));
      } else {
        let operator = rpn.dequeue();
        let numA = calcStack.pop()!;
        let numB = calcStack.pop()!;

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
    return Function(`return ${calcStack.top()?.toNumber()};`)();
  }
}
