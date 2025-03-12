# Project Noteflow

## frontend - [backend](https://github.com/cse115a-noteflow/noteflow-server)

## About

NoteFlow is a collaborative, AI-assisted note-taking application that helps students write better notes. With NoteFlow, you can:

- Write your notes in an intuitive WYSIWYG editor
- Ask questions about your note using a RAG search algorithm
- Summarize your notes and generate study materials
- Collaborate with peers in real time

## How It's Made

Front-end: React/TypeScript/CSS

Back end: Flask/Python

## Sprint documents

[NoteFlow Documentation](https://docs.google.com/document/d/1apgeUhuhTmZuvbXjyUDMndzmLnjszHI40QN3zdb2y-k/edit?usp=drive_link)

[Release Plan](https://docs.google.com/document/d/1xNzNOO3OpgY8iJo6iz-oUPiOAAjG51xZuaQ-Exrfwbo/edit?usp=drive_link)

[Release Summary Document](https://docs.google.com/document/d/1OnINDLGwsQ0M9hNGFtjMiSMJ6xYOMk40kBS_vZS1EiU/edit?usp=drive_link)

[Team Working Agreement](https://docs.google.com/document/d/1EOXbsJgJxRtg2YFC0VrF5A-6bGKTx-ECzM2KSVpZMEE/edit?usp=drive_link)

[Test Plan and Report](https://docs.google.com/document/d/1PSVvdXDrIlas4TW9RhsyzyhePX0TngffWDdYccL0Nk4/edit?usp=drive_link)

### Sprint 1

[Plan](https://docs.google.com/document/d/1loa6fGXcIXrFTUA6KJPhRvdJtLQcSe0undwLCQbRndg/edit?usp=drive_link) - [Report](https://docs.google.com/document/d/19ui4pXgEIA7mrR7CTtZwEhv26s-boThUUkut15n4Jxw/edit?usp=drive_link)

### Sprint 2

[Plan](https://docs.google.com/document/d/1DD1B4E8OdTSMEvLbnMSIZuXRaTbERRHZDE9Jdue7fVc/edit?usp=drive_link) - [Report](https://docs.google.com/document/d/1Gr27ZHq9H1Lw3iL0xAL1Io4EMifuWmxcXPOXahLw2QA/edit?usp=drive_link)

### Sprint 3

[Plan](https://docs.google.com/document/d/1KPFvcpfqiuYOW33uDAr7t7_XV2Vd6W83a6QSP03xyjs/edit?usp=drive_link) - [Report](https://docs.google.com/document/d/1jS5K2zw4MlGIsYaV7gsyWzUj_v3b5P1RxPXaMYrJZls/edit?usp=drive_link)

### Sprint 4

[Plan](https://docs.google.com/document/d/1aluhp5dha3hJPlp6xVaU0jHhoBd_ctvoYrmzOgFxUk0/edit?usp=drive_link) - [Report](https://docs.google.com/document/d/1kSiaAFphQTQ3K202nGPYTwmL69niLzmDwR5JzMmlCAE/edit?usp=drive_link)

## Installation

For ease of development and deployment, NoteFlow is split into two responsitories: the frontend and the backend. To develop, you must clone both repositories and follow the setup guide below.

### Frontend Setup

1. Navigate to directory

```
cd noteflow
```

2. Install dependencies

```
npm install
```

3. Start the development server

```
npm run dev
```

### Backend Setup

1. Navigate to directory

```
cd noteflow-server
```

2.  Create a .env file in the directory such that

```
OPENAI_API_KEY='INSERT YOUR OPENAI API KEY HERE'
PINECONE_API_KEY='INSERT YOUR PINECONE API KEY HERE'
```

You can get and obtain your OpenAI API key [here](https://platform.openai.com/api-keys) and your Pinecone API key [here](https://docs.pinecone.io/guides/projects/manage-api-keys).

2. Run the backend server

```
python ./main.py
```
