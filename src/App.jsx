export default function EnglishConversationTeacherApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h1 className="text-4xl font-bold">AI English Conversation Teacher</h1>
            <p className="mt-2 text-blue-100 text-lg">
              Practice speaking English with a free LLM-powered tutor.
            </p>
          </div>

          <ConversationApp />
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Mic,
  Send,
  Volume2,
  Loader2,
  Languages,
  BookOpen,
  RotateCcw,
} from "lucide-react"

function ConversationApp() {
  // const [messages, setMessages] = useState([
  //   {
  //     role: "assistant",
  //     content:
  //       "Hello 👋 I am your AI English teacher. Let's practice conversation together! Tell me about your day.",
  //   },
  // ])

  const defaultMessage = [
    {
      role: "assistant",
      content:
        "Hello 👋 I am your AI English teacher. Let's practice conversation together!",
    },
  ]

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chat_history")

    return savedMessages
      ? JSON.parse(savedMessages)
      : defaultMessage
  })

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [xp, setXp] = useState(() => {
    return Number(localStorage.getItem("xp")) || 0
  })

  const [level, setLevel] = useState(() => {
    return Number(localStorage.getItem("level")) || 1
  })

  const [streak, setStreak] = useState(() => {
    return Number(localStorage.getItem("streak")) || 1
  })

  const [showLevelUp, setShowLevelUp] = useState(false)

  const [weeklyStats, setWeeklyStats] = useState(() => {
  const saved = localStorage.getItem("weekly_stats")

    return saved
      ? JSON.parse(saved)
      : {
          messages: 0,
          minutes: 0,
          wordsLearned: 0,
          weekStart: new Date().toDateString(),
        }
  })

  const [isListening, setIsListening] = useState(false)
  const [topic, setTopic] = useState("Daily Life")

  const recognitionRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

//   const systemPrompt = `
// You are a friendly English conversation teacher.

// Rules:
// - Keep responses conversational.
// - Correct grammar naturally.
// - Encourage the student.
// - Ask follow-up questions.
// - Use ${level} English level.
// - Current topic: ${topic}.
// - After each student response:
//   1. Give a short natural reply.
//   2. Correct mistakes briefly.
//   3. Ask a new question.
// `

  const systemPrompt = `
You are a professional English conversation teacher.

Goals:
- Help the student improve speaking fluency.
- Correct grammar naturally.
- Keep conversations engaging.
- Ask follow-up questions.
- Encourage the student.

Rules:
- Keep responses concise.
- Speak naturally like a real tutor.
- Correct only major mistakes.
- After correction, continue the conversation.
- Use simple English when needed.

Student level: ${level}
Conversation topic: ${topic}
`

  useEffect(() => {
      speechSynthesis.getVoices()

      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices()
      }
    }, [])


  useEffect(() => {
    localStorage.setItem("xp", xp)
    localStorage.setItem("level", level)
    localStorage.setItem("streak", streak)
  }, [xp, level, streak])

  useEffect(() => {
    localStorage.setItem(
      "weekly_stats",
      JSON.stringify(weeklyStats)
    )
  }, [weeklyStats])

  useEffect(() => {
    const now = new Date()

    const currentWeek = `${now.getFullYear()}-${Math.ceil(
      now.getDate() / 7
    )}-${now.getMonth()}`

    const savedWeek =
      localStorage.getItem("current_week")

    if (savedWeek !== currentWeek) {
      const resetStats = {
        messages: 0,
        minutes: 0,
        wordsLearned: 0,
        weekStart: new Date().toDateString(),
      }

      setWeeklyStats(resetStats)

      localStorage.setItem(
        "current_week",
        currentWeek
      )
    }
  }, [])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = {
      role: "user",
      content: input,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      const response = await fetch(
        "http://localhost:11434/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            model: "llama3",

            messages: [
              {
                role: "system",
                content: systemPrompt,
              },

              ...updatedMessages,
            ],

            stream: false,
          }),
        }
      )

      const data = await response.json()
      console.log(data)

      const aiReply =
        data.message.content ||
        "Sorry, I could not respond."
        
      const assistantMessage = {
        role: "assistant",
        content: aiReply,
      }

      setMessages((prev) => [...prev, assistantMessage])

      const earnedXP = 15

      const estimatedMinutes = 1

      const learnedWords =
        aiReply.split(" ").length > 30 ? 2 : 1

      setWeeklyStats((prev) => ({
        ...prev,

        messages: prev.messages + 1,

        minutes:
          prev.minutes + estimatedMinutes,

        wordsLearned:
          prev.wordsLearned + learnedWords,
      }))

      const newXP = xp + earnedXP

      const nextLevelXP = level * 100

      if (newXP >= nextLevelXP) {
        setLevel((prev) => prev + 1)

        setXp(newXP - nextLevelXP)

        setShowLevelUp(true)

        setTimeout(() => {
          setShowLevelUp(false)
        }, 3000)
      } else {
        setXp(newXP)
      }

      speak(aiReply)
    } catch (error) {
      console.error(error)

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "There was an error connecting to the AI model. Please check your API key.",
        },
      ])
    }

    setLoading(false)
  }

  // function speak(text) {
  //   const utterance = new SpeechSynthesisUtterance(text)
  //   utterance.lang = "en-US"
  //   utterance.rate = 1
  //   speechSynthesis.speak(utterance)
  // }

  function speak(text) {
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    const voices = speechSynthesis.getVoices()

    console.log(voices)

    // tìm voice tự nhiên hơn
    const preferredVoice =
      voices.find((v) =>
        v.name.includes("Google US English")
      ) ||
      voices.find((v) =>
        v.name.includes("Microsoft Aria")
      ) ||
      voices.find((v) =>
        v.name.includes("Samantha")
      ) ||
      voices[0]

    utterance.voice = preferredVoice

    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1

    speechSynthesis.speak(utterance)
  }

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in your browser")
      return
    }

    const recognition = new SpeechRecognition()

    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }


  function resetConversation() {
    const resetMessages = [
      {
        role: "assistant",
        content:
          "Conversation reset ✨ Let's start a new English speaking session.",
      },
    ]

    setMessages(resetMessages)

    localStorage.removeItem("chat_history")
  }

  return (
    <div className="grid lg:grid-cols-4 gap-4 p-4">
      <div className="lg:col-span-1 space-y-4">
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-4 space-y-4">
            <div className="mb-6">
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 border">
                <div className="font-bold text-lg mb-3">
                  📈 This Week
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>🗣 Messages</span>
                    <span className="font-semibold">
                      {weeklyStats.messages}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>⏱ Practice</span>
                    <span className="font-semibold">
                      {weeklyStats.minutes} min
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>🔥 Streak</span>
                    <span className="font-semibold">
                      {streak} days
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>📚 Words</span>
                    <span className="font-semibold">
                      {weeklyStats.wordsLearned}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-lg">
                  ⭐ Level {level}
                </div>

                <div className="text-orange-500 font-bold">
                  🔥 {streak}
                </div>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-500"
                  style={{
                    width: `${(xp / (level * 100)) * 100}%`,
                  }}
                />
              </div>

              <div className="text-sm text-slate-500 mt-1">
                {xp} / {level * 100} XP
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 font-semibold text-lg mb-2">
                <Languages className="w-5 h-5" />
                English Level
              </div>

              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full p-3 rounded-xl border"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div>
              <div className="flex items-center gap-2 font-semibold text-lg mb-2">
                <BookOpen className="w-5 h-5" />
                Topic
              </div>

              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 rounded-xl border"
              >
                <option>Daily Life</option>
                <option>Travel</option>
                <option>Job Interview</option>
                <option>Technology</option>
                <option>Business English</option>
                <option>Study Abroad</option>
              </select>
            </div>

            <Button
              onClick={resetConversation}
              className="w-full rounded-xl h-12"
              variant="secondary"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Conversation
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-4 space-y-3 text-sm text-slate-600">
            <h3 className="font-bold text-slate-800">Free LLM APIs</h3>

            <div>
              • OpenRouter Free Models
              <br />
              • Gemini Free Tier
              <br />
              • Groq Free Models
              <br />
              • HuggingFace Inference API
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card className="rounded-2xl border-0 shadow-lg h-[75vh] flex flex-col overflow-hidden">
          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 min-h-0"
            >
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 whitespace-pre-wrap ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {message.content}

                      {message.role === "assistant" && (
                        <button
                          onClick={() => speak(message.content)}
                          className="mt-3 flex items-center gap-1 text-sm opacity-70 hover:opacity-100"
                        >
                          <Volume2 className="w-4 h-4" />
                          Listen
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl p-4 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI teacher is thinking...
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t p-4 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Speak or type your English message..."
                className="h-12 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage()
                  }
                }}
              />

              <Button
                onClick={startListening}
                variant={isListening ? "destructive" : "secondary"}
                className="h-12 w-12 rounded-xl"
              >
                <Mic className={`w-5 h-5 ${isListening ? "animate-pulse" : ""}`} />
              </Button>

              <Button
                onClick={sendMessage}
                disabled={loading}
                className="h-12 px-6 rounded-xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {showLevelUp && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-3xl shadow-2xl px-12 py-8 animate-bounce border-4 border-yellow-400">
            <div className="text-5xl text-center mb-4">
              🎉
            </div>

            <div className="text-3xl font-bold text-center">
              LEVEL UP!
            </div>

            <div className="text-xl text-center mt-2 text-slate-600">
              You reached Level {level + 1}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/*
====================================================
SETUP GUIDE
====================================================

1. Create project
-----------------
npx create-vite@latest english-teacher-app --template react

2. Install dependencies
-----------------------
npm install
npm install lucide-react framer-motion

3. Install shadcn/ui
--------------------
npx shadcn@latest init

Add components:
npx shadcn@latest add button card input scroll-area

4. Replace App.jsx
------------------
Copy this file into App.jsx

5. Start app
-------------
npm run dev

====================================================
FREE LLM OPTIONS
====================================================

OPTION 1 — OpenRouter (Recommended)
-----------------------------------
https://openrouter.ai

Free models:
- llama 3
- mistral
- qwen
- deepseek

====================================================
OPTION 2 — Gemini API
====================================================

Replace fetch() with:

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: input }],
        },
      ],
    }),
  }
)

====================================================
FEATURE IDEAS
====================================================

- Pronunciation scoring
- IELTS speaking simulator
- Roleplay mode
- Grammar score dashboard
- Vocabulary difficulty analysis
- AI avatar teacher
- Video call mode
- Real-time subtitles
- Daily speaking streak
- Multi-language explanation support

*/
