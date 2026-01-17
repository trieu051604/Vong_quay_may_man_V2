
export interface Participant {
  id: string | number;
  name: string;
  team: string;
  eligible: boolean | string;
}

export interface Result {
  time: string;
  prizeId: string;
  prizeName: string;
  participantId: string;
  name: string;
  team: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SPINNING = 'SPINNING',
  CELEBRATING = 'CELEBRATING',
  ERROR = 'ERROR'
}
