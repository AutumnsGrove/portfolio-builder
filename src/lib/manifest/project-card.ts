/**
 * ProjectCard: Universal intermediate format for portfolio projects.
 *
 * This is the canonical representation of a project, stored in the database
 * and referenced by project-card blocks. In v1, cards are created via
 * conversational extraction with the Guide Agent.
 */

export type ProjectStatus = "active" | "archived" | "wip";
export type ProjectSource = "manual" | "conversation";

export interface ProjectCard {
  id: string; // UUID
  title: string;
  description: string; // What it does and why it matters
  stack: string[]; // Tech stack tags (e.g., ["Svelte", "Cloudflare Workers", "D1"])
  status: ProjectStatus;
  links: {
    repo?: string; // GitHub/GitLab URL
    live?: string; // Live demo/production URL
    docs?: string; // Documentation URL
    [key: string]: string | undefined; // Extensible for custom link types
  };
  media: string[]; // R2 URIs for images/videos
  tags: string[]; // Categories, keywords (e.g., ["web", "ai", "open-source"])
  date_range?: string; // Free-form: "2024-01 to present", "Summer 2023", etc.
  highlights?: string[]; // Key achievements, metrics (e.g., "Built for 1000+ users")
  source: ProjectSource; // How this card was created
}
