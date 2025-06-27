export type Message = {
  id: string;
  text: string;
  isUser: boolean;
  thinking?: Thinking;
};

export type Mode = 'chat' | 'agent';

export type Thinking = {
  id: string;
  name: string;
  status: 'in-progress' | 'completed' | 'failed';
  output: string;
  timestamp: string;
  thought?: string;
  plan?: string;
  steps?: string[];
};