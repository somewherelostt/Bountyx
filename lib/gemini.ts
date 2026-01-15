import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AIReviewResult {
  score: number;
  feedback: string[];
  error?: string;
}

/**
 * Analyze a code submission using Google Gemini 2.0 Flash
 * Returns a score out of 100 and 3 bullet points of "Brutal Feedback"
 */
export async function analyzeSubmission(
  submissionContent: string,
  bountyTitle: string,
  bountyDescription: string
): Promise<AIReviewResult> {
  try {
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

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      score: Math.max(0, Math.min(100, parsed.score)),
      feedback: parsed.feedback.slice(0, 3),
    };
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return {
      score: 0,
      feedback: ["AI review failed - manual review required"],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Trigger AI review asynchronously (fire and forget)
 * Updates the submission in the database without blocking
 */
export async function triggerAsyncAIReview(
  submissionId: string,
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

      console.log(
        `AI Review completed for submission ${submissionId}:`,
        result
      );
    } catch (error) {
      console.error(`AI Review failed for submission ${submissionId}:`, error);
    }
  })();
}
