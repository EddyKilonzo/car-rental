import { IsBoolean } from 'class-validator';

export class ApproveAgentDto {
  @IsBoolean()
  approved: boolean;
}
