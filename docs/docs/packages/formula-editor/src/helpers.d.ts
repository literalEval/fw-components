export class Stack {
    _inner: any[];
    push(item: any): void;
    pop(): any;
    top(): any;
    empty(): boolean;
    print(): void;
}
export class Queue {
    _inner: {};
    _head: number;
    _tail: number;
    enqueue(item: any): void;
    dequeue(): any;
    peek(): any;
    empty(): boolean;
    print(): void;
}
export const Expectation: any;
