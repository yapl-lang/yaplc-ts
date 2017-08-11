export default abstract class Error {
	abstract readonly name: string;
	readonly message: string;

	public constructor(message: string) {
		this.message = message;
	}

	public toString(): string {
		return this.message;
	}
}