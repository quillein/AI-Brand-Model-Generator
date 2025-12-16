export enum GenerationStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  scenario: string;
  timestamp: number;
  category: 'avatar' | 'product' | 'carousel';
}

export interface Scenario {
  id: string;
  title: string;
  promptFragment: string;
  colorFocus: string;
}

export type ColorPalette = {
  name: string;
  hex: string;
};

export type Scenery = {
  id: string;
  label: string;
  prompt: string;
};

export type StyleTheme = {
  id: string;
  label: string;
  prompt: string;
};