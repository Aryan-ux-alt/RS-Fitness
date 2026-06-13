import { z } from "zod";

// Validate AI chat request
const aiChatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.enum(["workout", "nutrition", "general"]).optional(),
});

// System prompt for fitness coach
const SYSTEM_PROMPT = `You are an expert fitness coach and nutritionist helping Indian gym enthusiasts. 
Your expertise includes:
- Traditional Indian exercises and equipment
- Indian diet and traditional foods
- Workout programming and progression
- Recovery and injury prevention
- Motivation and mental fitness

Always provide practical, actionable advice based on Indian context. Keep responses concise and friendly.
Support metrics: kg (weight), cm (height), minutes (time).`;

export const askFitnessCoach = async (req, res) => {
  let startTime = Date.now();
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error("[AI] OPENAI_API_KEY not found in environment");
      return res.status(500).json({ 
        message: "AI service not configured. Please add OPENAI_API_KEY to .env file" 
      });
    }

    // Validate request
    const { message, context } = aiChatSchema.parse(req.body);
    const userId = req.user?.id || "anonymous";

    console.log(`[AI] User ${userId} asking about ${context}: "${message.substring(0, 50)}..."`);

    console.log("[AI] Sending message to OpenAI ChatGPT API...");
    
    // Use OpenAI ChatGPT API
    const apiUrl = `https://api.openai.com/v1/chat/completions`;
    
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    };

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error("[AI] API Error:", errorData);
      throw new Error(errorData.error?.message || `API returned ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("[AI] Invalid response structure:", data);
      return res.status(500).json({ message: "Invalid response from AI model" });
    }

    const response = data.choices[0].message.content;
    
    if (!response) {
      console.error("[AI] Empty text from ChatGPT response");
      return res.status(500).json({ message: "AI model returned empty response" });
    }

    console.log(`[AI] Response generated (${response.length} chars) - Total time: ${Date.now() - startTime}ms`);

    // Return response with metadata
    return res.json({
      ok: true,
      response,
      model: "gpt-3.5-turbo",
      userId,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error(`[AI Error after ${Date.now() - startTime}ms]:`, error.message || error);
    
    if (error instanceof z.ZodError) {
      console.error("[AI] Validation error:", error.issues);
      return res.status(400).json({ message: "Invalid request", issues: error.issues });
    }
    
    return res.status(500).json({ 
      message: error.message || "Failed to get AI response",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Stream response for real-time chat (optional, for better UX)
export const askFitnessCoachStream = async (req, res) => {
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({ 
        message: "AI service not configured. Please add OPENAI_API_KEY to .env file" 
      });
    }

    const { message, context } = aiChatSchema.parse(req.body);

    let contextPrompt = SYSTEM_PROMPT;
    if (context === "workout") {
      contextPrompt += "\nFocus: The user is asking about workouts and exercise.";
    } else if (context === "nutrition") {
      contextPrompt += "\nFocus: The user is asking about nutrition and diet.";
    }

    // Enable streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const apiUrl = `https://api.openai.com/v1/chat/completions`;
    
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: contextPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    };

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      res.write(`data: ${JSON.stringify({ error: errorData.error?.message || "API Error" })}\n\n`);
      res.end();
      return;
    }

    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              res.write("data: [DONE]\n\n");
              res.end();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0].delta.content) {
                res.write(`data: ${JSON.stringify({ text: parsed.choices[0].delta.content })}\n\n`);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error("Stream Error:", error.message || error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request", issues: error.issues });
    }
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};
