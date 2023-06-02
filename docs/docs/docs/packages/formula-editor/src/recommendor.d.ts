export class Recommender {
    constructor(variables: any);
    _trie: TrieNode;
    insert(word: any, position?: number, node?: undefined): void;
    getRecommendation(word: any): any[] | null;
    _traverseAndGet(recommendations: any, node: any, word: any, position: any, currentStr?: string): void;
}
declare class TrieNode {
    _children: Map<any, any>;
    get children(): Map<any, any>;
    insertAll(): void;
    getChild(char: any): any;
    addChild(char: any): void;
}
export {};
