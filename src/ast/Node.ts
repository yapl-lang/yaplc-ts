import Token from '../token/Token';
import CodePosition from '../CodePosition';
import NodeVisitor from '../visitor/NodeVisitor';

export default abstract class Node {
	whitespaces: Token[] = [];
	begin: CodePosition;
	end: CodePosition;

	readonly abstract type: string = '';

	protected constructor(init?: any) {
		Object.assign(this, init);
	}

	public visit(visitor: NodeVisitor): void {
		visitor.visit(this);
	}

	public toJSON() {
		const result: { [s: string]: any; } = {};
		Object.keys(this).forEach(key => {
			const value = (<any>this)[key];
			if ((key === 'begin' || key === 'end') && value instanceof CodePosition) {
				result[key] = value.toString();
			} else if (key !== 'whitespaces') {
				result[key] = value;
			}
		});
		return result;
	}
}

export abstract class BaseNode<Self> extends Node {
	public constructor(init?: Partial<Self>) {
		super(init);
	}
}

