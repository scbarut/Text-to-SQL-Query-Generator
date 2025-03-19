# Text to SQL Converter

A modern web application that converts natural language queries into SQL and executes them against a database. Built with React, FastAPI, and SQLAlchemy, powered by AI for natural language processing.

![Text to SQL Converter](https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200)

## Features

- 🤖 Natural Language to SQL conversion
- ⚡ Real-time query execution
- 📊 Employee database management
- 🎯 Modern, responsive UI


## Tech Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Tailwind CSS
  - Lucide Icons

- **Backend**:
  - FastAPI
  - SQLAlchemy
  - SQLite
  - Hugging Face AI Models

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Git
- Hugging Face API Key (Get it from [Hugging Face](https://huggingface.co/settings/tokens))


## Configure Hugging Face API Key

You need to set up your Hugging Face API key for the natural language processing functionality to work:

1. Get your API key from [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create a `.env` file in the `api` directory:
```bash
cd api
echo "HF_TOKEN=your_api_key_here" > .env
```
Replace `your_api_key_here` with your actual Hugging Face API key.

## Running the Application

You'll need to run the frontend and backend servers in separate terminals:

### Terminal 1 - Backend Server
```bash
cd api
python -m uvicorn main:app --reload
```
The backend API will be available at `http://localhost:8000`

### Terminal 2 - Frontend Development Server
```bash
cd src
npm run dev
```
The frontend will be available at `http://localhost:5173`

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Enter your query in natural language in the text area
   - Example: "Show me all employees who are female"
   - Example: "List all employees sorted by their first name"
3. Click "Convert & Execute" to see the results

## Database Schema

The application uses an SQLite database with the following schema:

### Employees Table

| Column        | Type    | Description           |
|---------------|---------|----------------------|
| id            | INTEGER | Primary Key          |
| first_name    | VARCHAR | Employee first name  |
| last_name     | VARCHAR | Employee last name   |
| gender        | VARCHAR | Employee gender      |
| date_of_birth | VARCHAR | Date of birth        |
| email         | VARCHAR | Email address        |
| phone         | VARCHAR | Phone number         |

## Example Queries

Here are some example queries you can try:

- "Show all employees"
- "Set phone number to NULL for employees who have an invalid format"
- "List employees born after 1990"
- "Count the number of male and female employees"
- "Delete employees who have no email address"

## Development

The project structure is organized as follows:

```
.
├── api/                 # Backend directory
│   ├── main.py           # FastAPI application
│   ├── database.py       # Database configuration
│   ├── models.py         # SQLAlchemy models
│   └── requirements.txt  # Python dependencies
├── src/                # Frontend directory
│   ├── App.tsx          # Main React component
│   └── main.tsx         # React entry point
├── package.json         # Node.js dependencies
└── README.md           # Project documentation
```
NOTE: If you encounter an error related to Vite, run the following command: 
```bash
pip install npm 
npm install vite --save-dev
```
