import ErrorHandler from './ErrorHandler';
import Error from './Error';

export default class ArrayErrorHandler implements ErrorHandler {
	private errors: Error[] = [];

	public error(error: Error): void {
		this.errors.push(error);
	}

	public shift() : Error | null {
		return this.errors.shift() || null;
	}

	public flush(): Error[] {
		const errors = this.errors;
		this.errors = [];
		return errors;
	}
}