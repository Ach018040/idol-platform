# Open-Generative-AI to idol-platform Creative Studio

## Reference Mapping

| Open-Generative-AI idea | idol-platform adaptation |
| --- | --- |
| Image Studio | Idol Image Generator / member key visual |
| Video Studio | MV Storyboard and Reels / Shorts planning |
| Lip Sync Studio | Future voice / lip sync workflow with strict authorization |
| Cinema Studio | Stage Visual Generator with camera and mood controls |
| Upload / generation history | Asset History Library |
| BYOK / Muapi provider | Future provider settings: Muapi, Replicate, Fal, OpenAI Images, self-hosted SD |
| Local storage history | MVP local asset history; Supabase schema added for generated assets |

## Safety Position

idol-platform does not adopt unrestricted generation. Creative Studio requires:

- Authorized materials only
- `AI generated` label for real-idol depictions
- No impersonated statements or fake endorsements
- No unauthorized deepfake, face-swap, voice clone, or lip sync
- No adultized, malicious, infringing, or misleading political/commercial content
- Prompt, provider, timestamp, and policy version retained

## MVP Routes

- `/creative-studio`
- `/creative-studio/templates`
- `/creative-studio/assets`
- `/creative-studio/workflows`
- `/creative-studio/settings`

## Data Model

`supabase/migrations/010_creative_studio.sql` defines:

- `idols`
- `creative_templates`
- `generated_assets`
- `creative_workflows`
- `prompt_runs`
