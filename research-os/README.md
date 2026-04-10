# Research OS Starter

A runnable starter that combines:

- Next.js 15 frontend
- FastAPI AI service
- Supabase schema + RLS
- Docker Compose local development

## Structure

```text
research-os/
├── frontend-next/
├── ai_scientist/
├── supabase/
├── .env.example
├── docker-compose.yml
└── Makefile
```

## Quick start

1. Copy env file:

```bash
cp research-os/.env.example research-os/.env
```

2. Start the AI service:

```bash
cd research-os/ai_scientist
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

3. Start the web app:

```bash
cd research-os/frontend-next
npm install
npm run dev
```

4. Open http://localhost:3000/research-studio

## Docker

```bash
cd research-os
docker compose up --build
```

## Notes

- `MOCK_MODE=true` lets you run the full flow without an API key.
- Set `MOCK_MODE=false` and provide `OPENAI_API_KEY` to use a real LLM.
- Supabase migration lives in `supabase/migrations/001_init.sql`.
