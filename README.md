# AI Study Companion

AI Study Companion is a full-stack learning platform designed to act as a persistent, project-aware learning partner rather than a simple chatbot.

Users can organize learning into Spaces and Projects, upload study materials, ask grounded questions, practice through adaptive quizzes, evaluate their understanding, track concept mastery, and receive recommendations for what to learn next.

---

## Overview

AI Study Companion follows this learning loop:

```text
User
  ↓
Space
  ↓
Project
  ↓
Learning Materials
  ↓
Document Processing
  ↓
Search / Retrieval
  ↓
AI Tutor
  ↓
Grounded Answer + Citation
  ↓
Adaptive Quiz
  ↓
Assessment
  ↓
Concept Mastery
  ↓
Growth Analysis
  ↓
Analytics
  ↓
Recommendation
  ↓
Continue Learning

The system keeps learning context at the Project level so that Tutor interactions, assessments, mastery, activity, and recommendations remain connected to the learner's current goal and materials.

Key Features
Authentication
User registration and login
JWT-based authentication
Protected API routes
Project and Space ownership checks
User-level data isolation
Spaces and Projects

Learning is organized as:

User
 ├── Space
 │    ├── Project
 │    └── Project
 └── Space
      └── Project

Each Project maintains its own:

Learning materials
Searchable knowledge
Learning context
Quiz history
Assessment results
Concept mastery
Activity
Analytics
Recommendations
PDF Learning Materials

Users can upload PDF study materials.

The processing workflow is:

Upload
  ↓
Queued
  ↓
Processing
  ↓
Text Extraction
  ↓
Chunking
  ↓
Embeddings
  ↓
Vector Index
  ↓
Ready

The system tracks material processing states such as:

Queued
Processing
Ready
Failed
AI Tutor

The Tutor operates within the current Project and prioritizes information retrieved from the Project's learning materials.

Tutor responses are designed to:

Use relevant project evidence
Explain concepts clearly
Include source references
Avoid unsupported claims
Communicate when sufficient evidence is unavailable

Example citation:

Source: Learning Material — Page 14
Retrieval-Augmented Generation

The retrieval pipeline uses:

User Question
    ↓
Embedding
    ↓
Vector Search
    ↓
Relevant Project Chunks
    ↓
Context Construction
    ↓
LLM Response
    ↓
Source Citation

The system uses project-level retrieval so information from unrelated Projects is not mixed into the current learning context.

Adaptive Quiz

The Quiz system supports:

Multiple-choice questions
Open-ended questions
Difficulty levels
Concept tagging
Previous question history
Learner performance context
Answer evaluation
Feedback
Quiz completion tracking

Quiz performance is then used to update learning state.

Concept Mastery

Assessment results are used to estimate concept-level mastery.

The system tracks:

Mastery score
Concept evidence
Learning trends
Weak concepts
Improving concepts
Repeated mistakes
Growth Analysis

The Growth module helps identify:

Concepts that are improving
Concepts that need attention
Current mastery state
Learning progress
Recommendations

The recommendation workflow uses available learning context such as:

Current mastery
Weak areas
Quiz history
Repeated mistakes
Recent activity
Project progress

This helps determine the next useful learning action.

Analytics

Project analytics provide visibility into:

Overall mastery
Materials
Quiz attempts
Questions answered
Quiz performance
Concept trends
Recent activity

The system also maintains learning events for important actions such as:

Project creation
Material upload
Material processing
Tutor interactions
Quiz attempts
Answers
Assessment completion
Mastery updates
Recommendations
Admin Dashboard

The Admin Dashboard provides platform-level visibility into:

Users
Spaces
Projects
Materials
Learning activity
Quiz activity
Mastery
AI usage
AI evaluations
Redis / database health
Material processing states
AI Architecture

The application uses an OpenAI-compatible AI provider interface so that the product is not tightly coupled to a single model API.

Current AI configuration supports:

Provider: OpenAI-compatible interface
Model: Gemini

The AI layer records telemetry such as:

Provider
Model
Feature
Latency
Token usage
Success / failure
Error information

AI functionality is separated into application features such as:

Tutor
Quiz Generation
Assessment
Recommendations
Embeddings / Retrieval
AI Evaluation
Technology Stack
Frontend
React
Vite
React Router
Tailwind CSS
Lucide React
Axios
Backend
FastAPI
Python
SQLAlchemy
Pydantic
JWT Authentication
Database
PostgreSQL
Alembic
AI / Retrieval
Gemini
OpenAI-compatible API interface
LangChain
Hugging Face embeddings
FAISS
Sentence Transformers
Background Processing
Celery
Redis
Document Processing
PyPDF2
Recursive text chunking
Embeddings
Vector search
Deployment

The application is designed to be deployed using cloud-hosted frontend and backend services with managed PostgreSQL and Redis infrastructure.

Architecture
                    ┌──────────────────────┐
                    │     React / Vite     │
                    │       Frontend       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       FastAPI        │
                    │    API / Backend     │
                    └───────┬──────┬───────┘
                            │      │
                ┌───────────┘      └────────────┐
                ▼                               ▼
       ┌────────────────┐              ┌────────────────┐
       │   PostgreSQL   │              │     Redis      │
       │                │              │                │
       │ Users          │              │ Celery Broker  │
       │ Spaces         │              │                │
       │ Projects       │              └───────┬────────┘
       │ Materials      │                      │
       │ Quizzes        │                      ▼
       │ Mastery        │              ┌────────────────┐
       │ Analytics      │              │ Celery Worker  │
       │ AI Usage       │              │                │
       └────────────────┘              │ PDF Processing │
                                        │ Embeddings     │
                                        │ Indexing       │
                                        └───────┬────────┘
                                                │
                                                ▼
                                      ┌──────────────────┐
                                      │ FAISS / Knowledge│
                                      │     Retrieval    │
                                      └────────┬─────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │    AI Provider   │
                                      │      Gemini      │
                                      └──────────────────┘
Project Structure
ai-study-companion/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── workers/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── storage/
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── ...
│
└── README.md
Local Setup
1. Clone the repository
git clone https://github.com/<YOUR_USERNAME>/ai-study-companion.git
cd ai-study-companion
2. Start PostgreSQL and Redis

The project uses Docker Compose for local infrastructure.

docker compose up -d

Check running containers:

docker ps
3. Backend Setup

Move into the backend:

cd backend

Create a virtual environment:

python -m venv venv

Activate it on Windows:

.\venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt
4. Environment Variables

Create a local .env file inside backend/.

Example:

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_study_companion
REDIS_URL=redis://localhost:6379/0

AI_PROVIDER=openai-compatible
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AI_API_KEY=your_api_key_here
AI_MODEL=your_model_here

JWT_SECRET_KEY=your_secret_key_here

Never commit real secrets to GitHub.

5. Database Migration

Run:

python -m alembic upgrade head

Check the current migration:

python -m alembic current
6. Start FastAPI

From the backend directory:

uvicorn app.main:app --reload

Backend:

http://127.0.0.1:8000

Swagger documentation:

http://127.0.0.1:8000/docs
7. Start Celery Worker

Open another terminal:

cd C:\Users\bhanu\Desktop\ai-study-companion\backend

.\venv\Scripts\celery.exe -A app.workers.celery_app:celery_app worker --loglevel=INFO --pool=solo

The worker is responsible for asynchronous material processing.

8. Frontend Setup

Open another terminal:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

The frontend will normally be available at:

http://localhost:5173
API Documentation

Once the backend is running:

http://localhost:8000/docs

FastAPI provides interactive Swagger documentation for the available APIs.

Security

The application implements several security boundaries:

JWT authentication
Protected API routes
User ownership validation
Space-level authorization
Project-level authorization
Material ownership validation
Project-isolated retrieval
Admin-only endpoints
Environment-based secrets
Input validation
Controlled AI/application interactions

Learning material and user messages are treated as data rather than unrestricted application instructions.

Observability

The system records AI usage information including:

Provider
Model
Feature
Latency
Prompt Tokens
Completion Tokens
Total Tokens
Success / Failure
Error Type
Error Message

AI evaluations can also be used to inspect areas such as:

Tutor groundedness
Citation correctness
Unsupported-question handling
Retrieval relevance
Assessment quality
Recommendation quality
Testing Strategy
Backend
Authentication
Authorization
Project isolation
Validation
Core business logic
AI
Grounded responses
Unsupported questions
Tutor behavior
Structured outputs
Retrieval relevance
Learning
Quiz evaluation
Mastery updates
Adaptive question selection
Recommendations
Background Processing
Material processing
Queue execution
Failure handling
Retry behavior
Known Limitations

This is currently a prototype and has several areas that can be improved.

Document Storage

Uploaded files and local vector indexes currently use application storage. A production-scale version should move document storage and vector persistence to durable object storage or managed infrastructure.

Retrieval

Retrieval quality depends on document extraction, chunking, embeddings, and vector search quality. Poorly structured PDFs may produce weaker retrieval results.

AI Evaluation

The current evaluation framework provides application-level telemetry and evaluation records, but a larger production system would benefit from a more extensive automated regression dataset.

Scaling

The current architecture is intended for a prototype and can be improved with:

Dedicated Workers
      ↓
Durable Object Storage
      ↓
Managed Vector Database
      ↓
Caching
      ↓
Queue Monitoring
      ↓
Distributed Tracing
      ↓
Automated Testing
Future Improvements

Potential future work includes:

Streaming Tutor responses
Richer document understanding
Improved retrieval and reranking
Persistent Tutor conversations
Flashcards
Spaced repetition
Learning plans
Concept maps
Voice learning
Advanced analytics
Better recommendation workflows
Automated AI regression evaluation
Dedicated observability and tracing
Engineering Decisions
Why Project-level Context?

Learning information should remain scoped to the current Project so that unrelated Projects do not influence Tutor responses, assessments, or recommendations.

Why Retrieval-Augmented Generation?

The Tutor should prioritize evidence from the learner's materials instead of relying only on general model knowledge.

Why Celery + Redis?

Document processing can be time-consuming, so it is handled asynchronously rather than blocking the user's request.

Why PostgreSQL?

PostgreSQL provides relational consistency for users, Spaces, Projects, materials, assessments, mastery, events, and AI telemetry.

Why FAISS?

FAISS provides a lightweight vector-search layer suitable for a prototype while keeping retrieval under application control.

Core Learning Experience

The intended user journey is:

Create Account
      ↓
Create Space
      ↓
Create Project
      ↓
Upload Material
      ↓
Process Material
      ↓
Ask Tutor
      ↓
Receive Grounded Answer
      ↓
Take Quiz
      ↓
Evaluate Understanding
      ↓
Update Mastery
      ↓
Identify Weak Areas
      ↓
View Growth
      ↓
View Analytics
      ↓
Receive Recommendation
      ↓
Continue Learning
Challenge Submission

This repository contains:

Source Code
    ↓
Backend
    ↓
Frontend
    ↓
Database Migrations
    ↓
AI Integration
    ↓
Retrieval Pipeline
    ↓
Background Processing
    ↓
Analytics
    ↓
Admin Dashboard
    ↓
AI Observability
    ↓
Deployment Documentation

Additional submission materials can include:

Demo Video
Architecture Diagram
AI Usage Documentation
Development Prompts
Evaluation Methodology
Known Limitations
Future Improvements
License

This project was built as a candidate engineering project / prototype.

All rights reserved unless otherwise specified.


Now **one click on the code-block copy button** gets the whole thing, yaar.
