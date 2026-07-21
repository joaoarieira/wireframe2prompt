import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";
import { InvalidTableShapeError } from "../errors/InvalidTableShapeError";

export interface TableElementProps extends ElementBaseProps {
  columns: number;
  rows: number;
}

function validateShape(columns: number, rows: number): void {
  if (
    !Number.isInteger(columns) ||
    columns < 1 ||
    !Number.isInteger(rows) ||
    rows < 1
  ) {
    throw new InvalidTableShapeError(columns, rows);
  }
}

export class TableElement extends Element {
  readonly kind = "table";
  public readonly columns: number;
  public readonly rows: number;

  get hasBorder(): boolean {
    return true;
  }

  private constructor(base: ElementBaseProps, columns: number, rows: number) {
    super(base);
    this.columns = columns;
    this.rows = rows;
  }

  static create(props: TableElementProps): TableElement {
    const { columns, rows, ...base } = props;
    validateShape(columns, rows);
    return new TableElement(base, columns, rows);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): TableElement {
    return new TableElement(
      { ...this.baseProps(), ...overrides },
      this.columns,
      this.rows,
    );
  }

  withColumns(columns: number): TableElement {
    validateShape(columns, this.rows);
    return new TableElement(this.baseProps(), columns, this.rows);
  }

  withRows(rows: number): TableElement {
    validateShape(this.columns, rows);
    return new TableElement(this.baseProps(), this.columns, rows);
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): TableElement {
    const afterCols =
      Number.isInteger(patch.columns) && (patch.columns as number) >= 1
        ? this.withColumns(patch.columns as number)
        : this;
    return Number.isInteger(patch.rows) && (patch.rows as number) >= 1
      ? afterCols.withRows(patch.rows as number)
      : afterCols;
  }
}
