export interface LayerProps {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

/**
 * Metadata for an organizational layer. Immutable: mutators return new
 * instances, like the rest of the domain.
 */
export class Layer {
  public readonly id: string;
  public readonly name: string;
  public readonly visible: boolean;
  public readonly locked: boolean;

  private constructor(props: LayerProps) {
    this.id = props.id;
    this.name = props.name;
    this.visible = props.visible;
    this.locked = props.locked;
  }

  static create(props: {
    id: string;
    name: string;
    visible?: boolean;
    locked?: boolean;
  }): Layer {
    return new Layer({
      id: props.id,
      name: props.name,
      visible: props.visible ?? true,
      locked: props.locked ?? false,
    });
  }

  private cloneWith(overrides: Partial<LayerProps>): Layer {
    return new Layer({
      id: this.id,
      name: this.name,
      visible: this.visible,
      locked: this.locked,
      ...overrides,
    });
  }

  rename(name: string): Layer {
    return this.cloneWith({ name });
  }

  setVisible(visible: boolean): Layer {
    return this.cloneWith({ visible });
  }

  setLocked(locked: boolean): Layer {
    return this.cloneWith({ locked });
  }

  equals(other: Layer): boolean {
    return (
      this.id === other.id &&
      this.name === other.name &&
      this.visible === other.visible &&
      this.locked === other.locked
    );
  }
}
