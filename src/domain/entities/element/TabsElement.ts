import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";
import { InvalidTabsError } from "../errors/InvalidTabsError";

export interface TabsElementProps extends ElementBaseProps {
  tabs: readonly string[];
  active: number;
}

function validateTabs(tabs: readonly string[], active: number): void {
  if (
    tabs.length < 1 ||
    !Number.isInteger(active) ||
    active < 0 ||
    active >= tabs.length
  ) {
    throw new InvalidTabsError(tabs, active);
  }
}

export class TabsElement extends Element {
  readonly kind = "tabs";
  public readonly tabs: readonly string[];
  public readonly active: number;

  private constructor(
    base: ElementBaseProps,
    tabs: readonly string[],
    active: number,
  ) {
    super(base);
    this.tabs = tabs;
    this.active = active;
  }

  static create(props: TabsElementProps): TabsElement {
    const { tabs, active, ...base } = props;
    validateTabs(tabs, active);
    return new TabsElement(base, tabs, active);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): TabsElement {
    return new TabsElement(
      { ...this.baseProps(), ...overrides },
      this.tabs,
      this.active,
    );
  }

  withTabs(tabs: readonly string[]): TabsElement {
    const clampedActive = Math.min(this.active, tabs.length - 1);
    validateTabs(tabs, clampedActive);
    return new TabsElement(this.baseProps(), tabs, clampedActive);
  }

  withActive(active: number): TabsElement {
    validateTabs(this.tabs, active);
    return new TabsElement(this.baseProps(), this.tabs, active);
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): TabsElement {
    const afterTabs =
      Array.isArray(patch.tabs) &&
      (patch.tabs as unknown[]).length >= 1 &&
      (patch.tabs as unknown[]).every((t) => typeof t === "string")
        ? this.withTabs(patch.tabs as string[])
        : this;
    if (!Number.isInteger(patch.active)) return afterTabs;
    try {
      return afterTabs.withActive(patch.active as number);
    } catch {
      return afterTabs;
    }
  }
}
