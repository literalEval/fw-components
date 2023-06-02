export declare class Recommender {
    private _trie;
    constructor(variables: Map<string, number>);
    insert(word: string, position?: number, node?: TrieNode | undefined): void;
    getRecommendation(word: string): string[] | null;
    _traverseAndGet(recommendations: string[], node: TrieNode, word: string, position: number, currentStr?: string): void;
}
declare class TrieNode {
    constructor();
    private _children;
    get children(): Map<string, TrieNode>;
    insertAll(): void;
    getChild(char: string): TrieNode | undefined;
    addChild(char: string): void;
}
export {};
