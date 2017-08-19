import Node from '../ast/Node';
import {default as NodeVisitor} from '../visitor/NodeVisitor';

export interface NodePrinterTarget {
	append(data: string): void;
}

export class NodePrinterMemoryTarget implements NodePrinterTarget {
	private buffer: string = '';
	private microBuffer: string = '';

	protected flush(data: string = ''): void {
		if (this.microBuffer.length > 0) {
			this.buffer += this.microBuffer;
			this.microBuffer = data;
		}
	}

	append(data: string): void {
		if (this.microBuffer.length + data.length >= 256) {
			this.flush(data);
		} else {
			this.microBuffer += data;
		}
	}

	get(): string {
		this.flush();
		return this.buffer;
	}
}

export class NodePrinterStdoutTarget implements NodePrinterTarget {
	append(data: string): void {
		process.stdout.write(data);
	}
}

export default abstract class NodePrinter extends NodeVisitor {
	protected target: NodePrinterTarget | null = null;

	public print(node: Node, target: NodePrinterTarget) {
		if (this.target !== null) {
			throw new Error('Printer is already printing');
		}
		this.reset();
		this.target = target;
		try {
			node.visit(this);
		} finally {
			this.target = null;
		}
	}

	protected onPrint(str: string) {
		(<NodePrinterTarget>this.target).append(str);
	}

	protected a(...data: any[]): this {
		if (this.target === null) {
			throw new Error('Printer is not printing');
		}
		for (const str of data) {
			if (str instanceof Node) {
				str.visit(this);
			} else if (str instanceof Array) {
				this.a(...str);
			} else {
				this.onPrint(typeof str === 'string' ? str : str === null ? '' : str.toString());
			}
		}
		return this;
	}

	protected reset(): void {
	}
}