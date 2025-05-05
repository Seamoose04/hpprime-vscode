export type Position = { offset: number };

export interface FunctionNode {
    type: 'Function';
    name: string;
    start: Position;
    end: Position | null;
    body: BlockNode;
}

export interface BlockNode {
    type: 'Block';
    start: Position;
    end: Position | null;
    children: ASTNode[];
}

export interface IfNode {
    type: 'If';
    start: Position;
    end: Position | null;
    thenBlock: BlockNode;
    elseBlock?: BlockNode;
}

export interface WhileNode {
    type: 'While';
    start: Position;
    end: Position | null;
    children: ASTNode[];
}

export interface ForNode {
    type: 'For';
    start: Position;
    end: Position | null;
    children: ASTNode[];
}

export type ASTNode =
    | FunctionNode
    | BlockNode
    | IfNode
    | WhileNode
    | ForNode;

export type PushableNode = BlockNode | IfNode | WhileNode | ForNode;
