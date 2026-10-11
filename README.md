# CareerForge 🚀
### AI-Powered Career Planning & Skill Development Platform

CareerForge is an AI-driven career planning and skill development platform designed to help students and early-career professionals achieve their career goals through personalized learning roadmaps, structured skill tracking, and practical assessments.

The platform aims to transform career goals into actionable learning plans with AI-generated topics, quizzes, and micro-projects.

## ✨ Key Features

- **Personalized Learning Roadmaps** — Generate structured learning paths based on career goals.
- **User Authentication** — Registration, email verification, and login.
- **Skill Tracking** — Track learning progress and completed topics.
- **Progress Dashboard** — Monitor skill completion, learning streaks, and upcoming milestones.
- **AI Integration** — Generate personalized learning content using large language models.
- **Quizzes & Assessments** — Support knowledge evaluation and practical skill development.
- **Micro-Projects** — Apply concepts through hands-on development tasks.
- **Responsive UI** — Access the platform across desktop and mobile devices.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| AI Integration | LLM APIs, OpenRouter, Gemini, Groq |
| Background Processing | Celery, Redis |
| Containerization | Docker, Docker Compose |
| Version Control | Git, GitHub |

*Technology availability may vary by project configuration and implementation status.*

## 📂 Project Structure

```text
sprint1/
├── Frontendd/
│   └── my-app/          # Frontend application
├── backend/             # Python backend and APIs
├── docker-compose.yml   # Container configuration
├── init_db.py           # Database initialization
├── setup_judge.sh       # Judge environment setup
├── JUDGE_SETUP_GUIDE.md # Judge setup documentation
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following tools before running the project:

- Node.js and npm
- Python 3.10 or a compatible project-supported version
- PostgreSQL
- Docker and Docker Compose (if using the containerized setup)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/farmansidd/sprint1.git
cd sprint1
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment.

**Windows:**

```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS/Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies if a `requirements.txt` file is present:

```bash
pip install -r requirements.txt
```

Configure the required environment variables in a local `.env` file, including database connection details and the API keys required by your enabled AI provider.

Start the backend using the application's configured FastAPI entry point. For example, if the entry point is `main.py` and the application object is named `app`:

```bash
uvicorn main:app --reload
```

### 3. Configure the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd Frontendd/my-app
npm install
npm run dev
```

Open the local development URL displayed by the frontend development server.

### 4. Run with Docker

If the Docker Compose configuration includes the required application services, you can start them with:

```bash
docker compose up --build
```

Follow the project configuration and setup guide for database initialization, environment variables, and any additional services.

## 🔐 Environment Variables

Configure sensitive values locally. Common variables may include:

```env
DATABASE_URL=your_postgresql_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key
```

Add other variables required by the application, such as authentication secrets or Redis connection settings.

**Security:** Never commit API keys, passwords, authentication secrets, or `.env` files to GitHub. Use `.gitignore` and provide a sanitized `.env.example` file for other developers.

## 🔄 Application Workflow

1. Register and verify your account.
2. Log in to the platform.
3. Enter your desired career goal.
4. Generate a personalized learning roadmap.
5. Explore topics, skills, and learning resources.
6. Mark topics as completed and track progress.
7. Practice through quizzes and micro-projects as those capabilities become available.

## 🎯 Project Objectives

- Make career planning more structured and accessible.
- Personalize learning paths using AI.
- Help learners track progress against career goals.
- Encourage practical learning through projects and assessments.
- Provide a foundation for future AI-assisted evaluation and career development features.

## 🚧 Future Enhancements

- AI-powered quiz and micro-project generation.
- Automated project evaluation and feedback.
- Real-time assessment results.
- Advanced learning analytics and milestones.
- Resume building and job discovery.
- Improved roadmap personalization based on learner performance.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Commit your changes with a descriptive message.
5. Open a pull request.

## 👨‍💻 Author

**Farman Siddique**

GitHub: [@farmansidd](https://github.com/farmansidd)

## 📄 License

A license has not yet been specified. Add a `LICENSE` file before distributing the project under an open-source license.

---

**CareerForge — Turn career goals into structured learning and measurable progress.**
