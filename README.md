# AI English Conversation Tutor

An AI-powered English learning web application that helps users practice English conversation with a local Large Language Model (LLM) running through Ollama.

The application provides:

* Natural English conversations
* Grammar correction and explanations
* Text-to-Speech (TTS) responses
* Persistent chat history
* XP and Level system
* Daily Streak tracking
* Weekly learning reports
* Gamified learning experience

---

## Features

### English Conversation Practice

Practice real-world English conversations with an AI tutor.

The AI can:

* Correct grammar mistakes
* Explain errors
* Suggest more natural expressions
* Continue the conversation naturally

### Local LLM with Ollama

The application runs entirely on a local LLM using Ollama.

Benefits:

* No API cost
* Better privacy
* Offline usage
* Low latency on supported hardware

Supported models:

* Llama 3
* Qwen 3
* Gemma 3
* Custom fine-tuned English Teacher models

---

### Text-to-Speech

AI responses can be spoken aloud using the browser Speech Synthesis API.

Features:

* Native browser voices
* Adjustable speaking rate
* Hands-free learning experience

---

### Persistent Memory

Chat history is automatically stored in localStorage.

Users can:

* Reload the page without losing conversations
* Continue previous learning sessions
* Preserve XP and progress

---

### Gamification

#### XP System

Users earn XP for each interaction.

Example:

* Send a message → +15 XP

#### Level System

Level increases automatically based on accumulated XP.

Example:

* Level 1 → 100 XP
* Level 2 → 200 XP
* Level 3 → 300 XP

#### Daily Streak

The application tracks consecutive days of learning.

Example:

* 7-day streak
* 30-day streak
* Longest streak

#### Level-Up Popup

Users receive a celebration popup whenever they reach a new level.

---

### Weekly Report

Weekly learning statistics include:

* Total messages
* Practice time
* Current streak
* Estimated vocabulary growth

Example:

* 42 messages
* 125 minutes practiced
* 7-day streak
* 18 new words learned

---

## Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS
* shadcn/ui

### AI

* Ollama
* Llama 3 / Qwen 3 / Gemma 3

### Browser APIs

* Speech Synthesis API
* Local Storage API

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd language-app
```

### Install Dependencies

```bash
npm install
```

### Start Frontend

```bash
npm run dev
```

---

## Install Ollama

Install Ollama from:

https://ollama.com

Verify installation:

```bash
ollama --version
```

---

## Download a Model

Example:

```bash
ollama pull llama3
```

or

```bash
ollama pull qwen3:4b
```

---

## Run Model

```bash
ollama run llama3
```

or

```bash
ollama run qwen3:4b
```

---

## Ollama API

The application communicates with Ollama through:

```text
http://localhost:11434/api/chat
```

Example request:

```json
{
  "model": "llama3",
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "stream": false
}
```

---

## Fine-Tuning (Optional)

The project supports custom English-teacher models fine-tuned in finetune_model/finetune_qưen3.py using:

* Unsloth
* QLoRA (4-bit)
* UltraChat 200k
* Lang-8
* JFLEG

Dataset: UltraChat

Training pipeline:

```text
Dataset
    ↓
QLoRA Fine-tuning
    ↓
LoRA Adapter
    ↓
Merged Model
    ↓
GGUF Q4_K_M
    ↓
Ollama
```

---

## License

This project is intended for educational and personal learning purposes.
