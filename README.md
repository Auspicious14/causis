# Shop Analyzer Backend

Production-quality NestJS backend for AI-powered retail shop analysis.

## Features

- ✅ Gemini 2.0 Flash integration
- ✅ Structured multimodal reasoning
- ✅ Clean modular architecture
- ✅ Input validation (file type, size)
- ✅ Comprehensive error handling
- ✅ Debug logging
- ✅ CORS enabled for frontend

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`:

```
GEMINI_API_KEY=your_actual_api_key_here
```

4. Start development server:

```bash
npm run start:dev
```

Server runs on `http://localhost:3000`

## API Endpoints

### POST /analysis/analyze

Upload and analyze a shop image.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `image` (file, max 10MB)

**Response:**

```json
{
  "understanding": {
    "title": "Shop type",
    "description": "Current state analysis",
    "strengths": ["strength 1", "strength 2"]
  },
  "hiddenIssues": [
    {
      "issue": "Issue name",
      "impact": "Business impact",
      "severity": "high"
    }
  ],
  "futureOutcome": {
    "withoutChanges": "Negative trajectory",
    "withChanges": "Positive potential"
  },
  "recommendations": [
    {
      "action": "Specific action",
      "why": "Reasoning with evidence",
      "priority": "high",
      "cost": "Cost estimate",
      "timeframe": "Implementation time"
    }
  ]
}
```

## Architecture

```
src/
├── modules/
│   ├── analysis/          # Business logic layer
│   │   ├── analysis.controller.ts
│   │   ├── analysis.service.ts
│   │   ├── analysis.module.ts
│   │   └── dto/
│   │       └── analysis-result.dto.ts
│   └── gemini/           # AI integration layer
│       ├── gemini.service.ts
│       ├── gemini.module.ts
│       └── prompts/
│           └── shop-analysis.prompt.ts
├── app.module.ts
└── main.ts
```

## Key Design Decisions

1. **Separation of Concerns**: Analysis module handles HTTP/validation, Gemini module handles AI
2. **Prompt as Constant**: System prompt isolated in dedicated file
3. **Flexible Parsing**: Handles various JSON formats from Gemini
4. **Graceful Degradation**: Fallback response if parsing fails
5. **Debug-Friendly**: Comprehensive logging at each stage

## Testing

```bash
# Using curl
curl -X POST http://localhost:3000/analysis/analyze \
  -F "image=@/path/to/shop.jpg"

# Using Postman
POST http://localhost:3000/analysis/analyze
Body: form-data
Key: image (file)
```

## Production Deployment

1. Build:

```bash
npm run build
```

2. Start:

```bash
npm run start:prod
```

3. Environment variables:

- `GEMINI_API_KEY`: Required
- `PORT`: Optional (default: 3000)

## Notes

- Max file size: 10MB
- Accepted formats: image/\*
- Response time: 2-5 seconds (depends on image size)
- Gemini model: gemini-2.0-flash-exp
