type AgentResponseSource = Readonly<{
  id: string;
  name: string;
  model: string;
  summary: string;
}>;

export class AgentResponseDto {
  readonly id: string;
  readonly name: string;
  readonly model: string;
  readonly summary: string;

  constructor(agent: AgentResponseSource) {
    this.id = agent.id;
    this.name = agent.name;
    this.model = agent.model;
    this.summary = agent.summary;
  }
}
