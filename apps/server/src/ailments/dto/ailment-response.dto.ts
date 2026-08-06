type AilmentResponseSource = Readonly<{
  id: string;
  name: string;
  summary: string;
  description: string;
}>;

export class AilmentResponseDto {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly description: string;

  constructor(ailment: AilmentResponseSource) {
    this.id = ailment.id;
    this.name = ailment.name;
    this.summary = ailment.summary;
    this.description = ailment.description;
  }
}
