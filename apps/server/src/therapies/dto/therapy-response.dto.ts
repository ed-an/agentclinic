export type TherapyResponseSource = Readonly<{
  id: string;
  name: string;
  summary: string;
  description: string;
}>;

export class TherapyResponseDto {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly description: string;

  constructor(therapy: TherapyResponseSource) {
    this.id = therapy.id;
    this.name = therapy.name;
    this.summary = therapy.summary;
    this.description = therapy.description;
  }
}

type AssociatedAilmentSource = Readonly<{
  id: string;
  name: string;
}>;

export class AssociatedAilmentResponseDto {
  readonly id: string;
  readonly name: string;

  constructor(ailment: AssociatedAilmentSource) {
    this.id = ailment.id;
    this.name = ailment.name;
  }
}

export class TherapyDetailResponseDto extends TherapyResponseDto {
  readonly ailments: AssociatedAilmentResponseDto[];

  constructor(
    therapy: TherapyResponseSource &
      Readonly<{ ailments: AssociatedAilmentSource[] }>,
  ) {
    super(therapy);
    this.ailments = therapy.ailments.map(
      (ailment) => new AssociatedAilmentResponseDto(ailment),
    );
  }
}
