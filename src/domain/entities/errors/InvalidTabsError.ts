export class InvalidTabsError extends Error {
  constructor(tabs: readonly string[], active: number) {
    super(
      `Invalid tabs: tabs.length=${tabs.length}, active=${active}; tabs must be non-empty and active must be an integer in [0, tabs.length)`,
    );
    this.name = "InvalidTabsError";
    Object.setPrototypeOf(this, InvalidTabsError.prototype);
  }
}
