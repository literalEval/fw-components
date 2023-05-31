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
    "^": 3,
    "/": 2,
    "*": 2,
    "+": 1,
    "-": 1,
  };
  mappedFormula: string = "";

  parseInput(formula: string): string | null {
    let tokens = formula.split(/([-+(),*/:? ])/g);

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

    // let tokens = formula.split(/[\s,\(\)\+\-\*\/]+/);
    let tokens = formula
      .split(/([-+(),*/:? ])/g)
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

    // return resultStack.pop()!;
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
    return Function(`return ${calcStack.top()?.toNumber()};`)();
  }
}
