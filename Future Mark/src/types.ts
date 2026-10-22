export type ToolType = 
  | 'select'
  | 'pen' 
  | 'highlighter' 
  | 'stamp' 
  | 'score' 
  | 'text' 
  | 'eraser';

export type StampType = 'check' | 'cross' | 'question' | 'half' | 'star';

export interface Point {
  x: number; // Normalized coordinate (0 to 1 relative to page width)
  y: number; // Normalized coordinate (0 to 1 relative to page height)
  pressure?: number;
}

export interface BaseAnnotation {
  id: string;
  page: number; // 1-indexed
  createdAt: number;
}

export interface StrokeAnnotation extends BaseAnnotation {
  type: 'pen' | 'highlighter';
  points: Point[];
  color: string;
  width: number; // Normalized stroke width
  opacity: number;
}

export interface StampAnnotation extends BaseAnnotation {
  type: 'stamp';
  stampType: StampType;
  x: number;
  y: number;
  scale: number;
  color: string;
}

export interface ScoreAnnotation extends BaseAnnotation {
  type: 'score';
  x: number;
  y: number;
  score: number;
  maxScore?: number;
  label?: string; // e.g. "+2" or "Q3: 4/5"
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number; // In normalized units or px
  color: string;
}

export type Annotation = 
  | StrokeAnnotation 
  | StampAnnotation 
  | ScoreAnnotation 
  | TextAnnotation;

export interface StudentPaper {
  id: string;
  name: string;
  fileBuffer: ArrayBuffer;
  pageCount: number;
  annotations: Annotation[];
  undoStack: Annotation[][];
  redoStack: Annotation[][];
  status: 'pending' | 'grading' | 'completed';
}

export interface CommentTemplate {
  id: string;
  title: string;
  text: string;
}
