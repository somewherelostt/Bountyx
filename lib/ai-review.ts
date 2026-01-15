/**
 * AI Code Review Service
 * Uses Groq AI (primary) with Gemini as fallback
 * Groq is faster and has better free tier limits
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface AIReviewResult {
  score: number;
  feedback: string[];
  provider?: "groq" | "gemini";
  error?: string;
}

/**
 * Analyze code submission using Groq AI (primary)
 */
async function analyzeWithGroq(
  submissionContent: string,
  bountyTitle: string,
  bountyDescription: string
): Promise<AIReviewResult> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const prompt = `You are a BRUTAL code reviewer for a bounty platform called BountyX. 
Your style is Neo-Brutalist - direct, unfiltered, and raw.

BOUNTY CONTEXT:
Title: ${bountyTitle}
Description: ${bountyDescription}

SUBMISSION TO REVIEW:
${submissionContent}

TASK:
Analyze this code submission for:
1. SECURITY - Any vulnerabilities or unsafe patterns
2. EFFICIENCY - Performance and optimization
3. CLEANLINESS - Code quality, readability, best practices

Give it a score out of 100 and provide exactly 3 bullet points of "Brutal Feedback".
Be harsh but constructive. Use Neo-Brutalist language - direct and impactful.

RESPOND ONLY IN THIS JSON FORMAT:
{
  "score": <number 0-100>,
  "feedback": [
    "<brutal feedback point 1>",
    "<brutal feedback point 2>",
    "<brutal feedback point 3>"
  ]
}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile", // Fast and accurate
      messages: [
        {
          role: "system",
          content: "You are a brutal code reviewer. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Groq API error");
  }

  const data = await response.json();
  const text = data.choices[0].message.content;

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Groq response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    score: Math.max(0, Math.min(100, parsed.score)),
    feedback: parsed.feedback.slice(0, 3),
    provider: "groq",
  };
}

/**
 * Analyze code submission using Gemini (fallback)
 */
async function analyzeWithGemini(
  submissionContent: string,
  bountyTitle: string,
  bountyDescription: string
): Promise<AIReviewResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `You are a BRUTAL code reviewer for a bounty platform called BountyX. 
Your style is Neo-Brutalist - direct, unfiltered, and raw.

BOUNTY CONTEXT:
Title: ${bountyTitle}
Description: ${bountyDescription}

SUBMISSION TO REVIEW:
${submissionContent}

TASK:
Analyze this code submission for:
1. SECURITY - Any vulnerabilities or unsafe patterns
2. EFFICIENCY - Performance and optimization
3. CLEANLINESS - Code quality, readability, best practices

Give it a score out of 100 and provide exactly 3 bullet points of "Brutal Feedback".
Be harsh but constructive. Use Neo-Brutalist language - direct and impactful.

RESPOND ONLY IN THIS JSON FORMAT:
{
  "score": <number 0-100>,
  "feedback": [
    "<brutal feedback point 1>",
    "<brutal feedback point 2>",
    "<brutal feedback point 3>"
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Gemini response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    score: Math.max(0, Math.min(100, parsed.score)),
    feedback: parsed.feedback.slice(0, 3),
    provider: "gemini",
  };
}

/**
 * Analyze code submission with automatic fallback
 * Tries Groq first, falls back to Gemini if needed
 */
export async function analyzeSubmission(
  submissionContent: string,
  bountyTitle: string,
  bountyDescription: string
): Promise<AIReviewResult> {
  // Try Groq first (faster and better free tier)
  if (GROQ_API_KEY) {
    try {
      console.log("Attempting AI review with Groq...");
      const result = await analyzeWithGroq(
        submissionContent,
        bountyTitle,
        bountyDescription
      );
      console.log("✓ Groq AI review successful");
      return result;
    } catch (error) {
      console.warn("Groq AI failed, falling back to Gemini:", error);
    }
  }

  // Fallback to Gemini
  if (GEMINI_API_KEY) {
    try {
      console.log("Attempting AI review with Gemini...");
      const result = await analyzeWithGemini(
        submissionContent,
        bountyTitle,
        bountyDescription
      );
      console.log("✓ Gemini AI review successful");
      return result;
    } catch (error) {
      console.error("Gemini AI failed:", error);
      return {
        score: 0,
        feedback: ["AI review failed - manual review required"],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // No API keys configured
  return {
    score: 0,
    feedback: ["AI review not configured - manual review required"],
    error: "No AI API keys configured",
  };
}

/**
 * Trigger AI review asynchronously (fire and forget)
 * Updates the submission in the database without blocking
 */
export async function triggerAsyncAIReview(
  submissionId: string,
  bountyId: string,
  submissionContent: string,
  bountyTitle: string,
  bountyDescription: string
): Promise<void> {
  // Import supabaseAdmin here to avoid circular dependencies
  const { supabaseAdmin } = await import("@/lib/supabase");

  // Run asynchronously without awaiting
  (async () => {
    try {
      const result = await analyzeSubmission(
        submissionContent,
        bountyTitle,
        bountyDescription
      );

      // Update the submission with AI results
      await supabaseAdmin
        .from("submissions")
        .update({
          ai_score: result.score,
          ai_notes: result.feedback.join("\n• "),
        })
        .eq("id", submissionId);
      
      // LOG AUDIT TRAIL (Transparency)
      await supabaseAdmin
        .from("ai_reviews")
        .insert({
            submission_id: submissionId,
            bounty_id: bountyId,
            model_name: result.provider || "unknown",
            score: result.score,
            reasoning: result.feedback.join("\n"), 
            // We could store full raw response if analyzeSubmission returned it, 
            // but for now we verify what we have.
            //Ideally analyzeSubmission should return raw text too.
        });

      console.log(
        `AI Review completed for submission ${submissionId} using ${result.provider}:`,
        result
      );
    } catch (error) {
      console.error(`AI Review failed for submission ${submissionId}:`, error);
    }
  })();
}
