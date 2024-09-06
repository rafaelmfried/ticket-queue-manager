import { ArrayNotEmpty, IsArray, IsIn } from 'class-validator';

type JobState = 'waiting' | 'active' | 'completed' | 'failed'; // Exemplo de estados

type JobType =
  | JobState
  | 'paused'
  | 'repeat'
  | 'wait'
  | 'delayed'
  | 'prioritized'
  | 'waiting-children';

export enum JobStatusEnum {
  waiting = 'waiting',
  active = 'active',
  completed = 'completed',
  failed = 'failed',
  paused = 'paused',
  repeat = 'repeat',
  wait = 'wait',
  delayed = 'delayed',
  prioritized = 'prioritized',
  waitingChildren = 'waiting-children',
}

const allJobTypes: JobType[] = [
  'waiting',
  'active',
  'completed',
  'failed',
  'paused',
  'repeat',
  'wait',
  'delayed',
  'prioritized',
  'waiting-children',
];

export class JobStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(allJobTypes, { each: true })
  status: JobType[];
}
