/** Aligné sur `ai-model/schema/classification-output.schema.json`. */
export interface NutriflowClassificationResult {
  schemaVersion: string;
  sourceTextHash: string;
  categories: { label: string; score: number }[];
  filieres: { code: string; score: number; notes?: string }[];
  confidence: number;
  flags?: string[];
  modelVersion?: string;
}
