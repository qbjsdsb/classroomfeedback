const DRAFT_KEY = "draft_courseContent";

export async function saveDraft(text: string): Promise<void> {
  localStorage.setItem(DRAFT_KEY, text);
}
export async function loadDraft(): Promise<string> {
  return localStorage.getItem(DRAFT_KEY) ?? "";
}
export async function clearDraft(): Promise<void> {
  localStorage.removeItem(DRAFT_KEY);
}
