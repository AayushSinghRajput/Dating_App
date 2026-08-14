// Fixed bank of icebreaker prompts (Hinge-style). Users pick up to 3 and
// write a short answer; matches reply directly to a specific prompt instead
// of opening with a cold "hi" — see ProfileEdit, UserDetail, and
// ChatDetail's `prefill` param.
export const PROMPT_QUESTIONS: string[] = [
  "My ideal Saturday is...",
  "A non-negotiable for me is...",
  "The way to win me over is...",
  "I'm looking for...",
  "Two truths and a lie...",
  "My most controversial opinion is...",
  "I geek out on...",
  "A life goal of mine is...",
  "The best way to ask me out is...",
  "My love language is...",
  "I'll know it's time to delete this app when...",
  "Let's debate this topic...",
];

export const MAX_PROMPTS = 3;

export interface ProfilePrompt {
  question: string;
  answer: string;
}
