export type Position = { offset: number };

export interface FunctionNode {
    type: 'Function';
    name: string;
    params: string[];
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

export interface ReturnNode {
    type: 'Return';
    start: { offset: number };
    end: { offset: number };
    expression?: ASTNode; // can be a raw token or future parsed expression
}

export type ASTNode =
    | FunctionNode
    | BlockNode
    | IfNode
    | WhileNode
    | ForNode
    | ReturnNode;

export type PushableNode = BlockNode | IfNode | WhileNode | ForNode;
