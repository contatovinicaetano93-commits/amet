export function isAvaAiEnabled(): boolean {
  if (process.env.AVA_AI_ENABLED === "0") return false;
  return Boolean(process.env.AVA_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
}

export function getAvaAiApiKey(): string | null {
  return process.env.AVA_OPENAI_API_KEY || process.env.OPENAI_API_KEY || null;
}

export function getAvaAiModel(): string {
  return process.env.AVA_AI_MODEL || "gpt-4.1-mini";
}
