# AI Document Chatbot

A production-oriented AI Document Chatbot that allows users to upload PDF/DOCX documents and ask questions about their content using Retrieval-Augmented Generation (RAG).

The application combines Django REST Framework, JWT authentication, Google Gemini, Sentence Transformers, FAISS, and React to provide document-grounded conversational AI.

---

## Features

### Authentication
- User registration
- JWT login
- Access and refresh tokens
- Automatic access-token refresh
- Logout with refresh-token blacklisting
- Protected APIs
- User-level data isolation

### Document Management
- Upload PDF documents
- Upload DOCX documents
- Multiple document uploads
- View uploaded documents
- Download documents
- Delete documents
- Automatic text extraction
- Document chunking
- Vector embeddings
- FAISS vector index generation

### AI Chat
- Chat with uploaded documents
- Create multiple chat sessions
- Continue previous conversations
- View chat history
- Start a new chat
- Follow-up questions using conversation history
- Document-specific retrieval
- Markdown-formatted AI responses

### RAG Pipeline
- Document text extraction
- Text chunking
- Sentence Transformer embeddings
- FAISS vector similarity search
- Relevant document chunk retrieval
- Context-aware prompt construction
- Google Gemini answer generation

### Frontend
- React + Vite
- Authentication UI
- Document management
- Chat session management
- Document selection
- Chat interface
- Markdown rendering
- JWT token refresh handling

### Deployment
- Dockerized Django backend
- PostgreSQL database
- Docker Compose development environment
- Environment-based configuration
- WhiteNoise static-file handling
- Production-ready configuration structure

---

## Technology Stack

### Backend

- Python
- Django
- Django REST Framework
- PostgreSQL
- JWT Authentication

### AI / RAG

- LangChain
- Google Gemini API
- Sentence Transformers
- FAISS
- Retrieval-Augmented Generation (RAG)

### Frontend

- React
- Vite
- JavaScript

### DevOps

- Docker
- Docker Compose
- Git
- GitHub

---

## System Architecture

```text
                         ┌─────────────────────┐
                         │      React UI       │
                         │   React + Vite      │
                         └──────────┬──────────┘
                                    │
                                    │ HTTP / JSON
                                    ▼
                         ┌─────────────────────┐
                         │     Django API      │
                         │        DRF          │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │ Authentication │  │   Documents    │  │  Chat Sessions │
        │     JWT        │  │   Management   │  │    & History   │
        └────────────────┘  └───────┬────────┘  └───────┬────────┘
                                    │                   │
                                    ▼                   │
                         ┌─────────────────────┐       │
                         │   RAG Pipeline      │◄──────┘
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
       │ Text         │      │ Sentence     │      │ FAISS        │
       │ Extraction   │─────►│ Transformers │─────►│ Vector Store │
       └──────────────┘      │ Embeddings   │      └──────┬───────┘
                             └──────────────┘             │
                                                         │
                                                         ▼
                                               Relevant document
                                                   chunks
                                                         │
                                                         ▼
                                               ┌────────────────┐
                                               │ Gemini LLM     │
                                               │ Answer         │
                                               └────────────────┘

                         ┌─────────────────────┐
                         │    PostgreSQL       │
                         │ Users, Documents,   │
                         │ Chunks, Chats       │
                         └─────────────────────┘

How RAG Works

The application follows this pipeline when a document is uploaded:

PDF / DOCX
    ↓
Text Extraction
    ↓
Text Chunking
    ↓
Sentence Transformer Embeddings
    ↓
FAISS Index
    ↓
Index stored for the document

When the user asks a question:

User Question
      ↓
Selected Document
      ↓
Create Question Embedding
      ↓
FAISS Similarity Search
      ↓
Relevant Document Chunks
      ↓
Conversation History + Retrieved Context
      ↓
RAG Prompt
      ↓
Google Gemini
      ↓
Answer
      ↓
Save Chat Message

The chatbot retrieves relevant information from the selected document before asking the language model to generate an answer.

This reduces reliance on the model's general knowledge and keeps the response grounded in the uploaded document.

Document-Level Retrieval

The current architecture intentionally uses document-specific chat.

A user can upload multiple documents, but each chat session is associated with one selected document.

For example:

User
 │
 ├── Document A
 │      └── Chat Session 1
 │
 ├── Document B
 │      └── Chat Session 2
 │
 └── Document C
        └── Chat Session 3

A question asked in Chat Session 1 retrieves chunks only from Document A.

This prevents unrelated uploaded documents from being included in the retrieval process.

Project Structure
ai-document-chatbot/
│
├── accounts/
│   ├── migrations/
│   ├── serializers.py
│   ├── urls.py
│   ├── views.py
│   └── models.py
│
├── ai/
│   ├── services/
│   │   ├── chunker.py
│   │   ├── document_extractor.py
│   │   ├── embeddings.py
│   │   ├── gemini.py
│   │   ├── prompt.py
│   │   ├── rag.py
│   │   ├── retriever.py
│   │   └── vector_store.py
│   └── ...
│
├── chats/
│   ├── serializers.py
│   ├── urls.py
│   ├── views.py
│   └── models.py
│
├── documents/
│   ├── serializers.py
│   ├── urls.py
│   ├── views.py
│   └── models.py
│
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── media/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── manage.py
├── requirements.txt
└── README.md
API Endpoints
Authentication
Method	Endpoint	Description
POST	/api/register/	Register a user
POST	/api/login/	Login and obtain JWT tokens
POST	/api/token/refresh/	Refresh access token
GET	/api/profile/	Get authenticated user profile
POST	/api/logout/	Logout and blacklist refresh token
Documents
Method	Endpoint	Description
GET	/api/documents/	List user's documents
POST	/api/documents/	Upload document(s)
GET	/api/documents/<id>/	Get document
DELETE	/api/documents/<id>/	Delete document
Chat
Method	Endpoint	Description
POST	/api/chats/sessions/	Create chat session
GET	/api/chats/sessions/	List chat sessions
GET	/api/chats/sessions/<id>/	Get chat session and history
POST	/api/chats/sessions/<id>/messages/	Ask a question
Security

The application uses several layers of backend protection:

JWT authentication
Protected API endpoints
User-based document ownership
User-based chat ownership
Document-specific retrieval
Refresh-token blacklisting on logout
Environment variables for secrets
CORS configuration
CSRF trusted-origin configuration
Production HTTPS configuration
Django security middleware

Users cannot access documents or chat sessions belonging to another user.

Running the Project Locally
1. Clone the repository
git clone https://github.com/ANURAG84KR/ai-document-chatbot.git
cd ai-document-chatbot
2. Create and activate a virtual environment
python -m venv env

Windows:

env\Scripts\activate
3. Install Python dependencies
pip install -r requirements.txt
4. Configure environment variables

Create a .env file in the project root.

Example:

DJANGO_SECRET_KEY=your-secret-key


DEBUG=True


ALLOWED_HOSTS=localhost,127.0.0.1


DB_NAME=your_database
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432


CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173


SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False

Add your Gemini API configuration according to the application's environment configuration.

Never commit .env to GitHub.

5. Run database migrations
python manage.py migrate
6. Start the Django backend
python manage.py runserver

The backend runs at:

http://localhost:8000
7. Start the React frontend

Open another terminal:

cd frontend
npm install
npm run dev

The frontend runs at:

http://localhost:5173
Running with Docker

The project includes Docker configuration for the Django backend and PostgreSQL.

Build and start the services:

docker compose up --build

The backend will be available at:

http://localhost:8000

Stop the services:

docker compose down

PostgreSQL data is stored in a Docker named volume so that database data can persist across container recreation.

Uploaded media is mounted through the project's media/ directory.

Environment Configuration

Sensitive configuration is kept outside the source code using environment variables.

Examples include:

Django secret key
Database credentials
Gemini API configuration
Allowed hosts
CORS origins
CSRF trusted origins
HTTPS security settings

For production deployment, these values should be configured through the deployment platform rather than committed to GitHub.

Current Architecture

The current version uses a normal request-response architecture:

React
  ↓
HTTP Request
  ↓
Django REST Framework
  ↓
RAG / Database Processing
  ↓
HTTP Response
  ↓
React

Real-time communication using WebSockets is intentionally not part of the current version.

Future Improvements

Planned improvements include:

Django Channels
WebSockets
Redis
Real-time AI responses
Streaming Gemini responses
Background document processing
Improved source citations
Production cloud deployment
Additional monitoring and observability
More advanced retrieval strategies
Multi-document retrieval
Learning Goals

This project was built to develop practical understanding of:

Django
Django REST Framework
REST APIs
JWT authentication
PostgreSQL
React
Docker
Embeddings
Vector databases
FAISS
LangChain
Google Gemini
Retrieval-Augmented Generation (RAG)
AI application architecture
Backend security
Production deployment

License

This project is currently intended as a portfolio and learning project.
