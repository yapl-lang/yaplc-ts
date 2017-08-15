import CodePosition from '../CodePosition';
import NodeVisitor from '../visitor/NodeVisitor';

export default abstract class Node {
	begin: CodePosition | null = null;
	end: CodePosition | null = null;

	readonly abstract type: string = '';

	protected constructor(init?: any) {
		Object.assign(this, init);
	}

	public visit(visitor: NodeVisitor): void {
		(<(node: Node) => void>(<any>visitor)[`visit${this.constructor.name}`])(this);
	}

	public toJSON() {
		const result: { [s: string]: any; } = {};
		Object.keys(this).forEach(key => {
			const value = (<any>this)[key];
			if ((key === 'begin' || key === 'end') && value instanceof CodePosition) {
				result[key] = value.toString();
			} else {
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

