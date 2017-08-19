import Node from '../ast/Node';
import {default as NodePrinter, NodePrinterTarget} from './NodePrinter';

export default abstract class NodePrettyPrinter extends NodePrinter {
	protected wasNl: boolean = true;
	protected needIndent: boolean = true;
	protected indentSize: number = 0;

	constructor(protected indent: string = '\t') {
		super();
	}

	public print(node: Node, target: NodePrinterTarget, startIndent: number = 0) {
		this.indentSize = startIndent;
		super.print(node, target);
	}

	protected onPrint(str: string) {
		if (str.length !== 0 && this.needIndent) {
			this.needIndent = false;
			super.a(this.indent.repeat(this.indentSize));
		}
		super.onPrint(str);
	}

	protected a(...data: any[]): this {
		if (data.length > 0 && this.wasNl) {
			this.wasNl = false;
			this.needIndent = true;
		}
		super.a(...data);
		return this;
	}

	protected nl(...data: any[]): this {
		this.a(...data, '\n');
		this.wasNl = true;
		return this;
	}

	protected ind(call: () => void): this {
		++this.indentSize;
		try {
			call();
		} finally {
			--this.indentSize;
		}
		return this;
	}

	protected reset(): void {
		this.indentSize = 0;
	}
}