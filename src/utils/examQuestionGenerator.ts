
import { Question } from "@/types/certification";

// Gemini API configuration
const API_KEY = "AIzaSyDRuULswOC1iFSJr83VqRaeP1g8p0Vn4Lc"; // Using the same API key as in geminiApi.ts
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

/**
 * Generate a set of multiple-choice questions for a certification exam
 */
export const generateExamQuestions = async (
  examTitle: string,
  topicList: string[] = [],
  numberOfQuestions: number = 15
): Promise<Question[]> => {
  console.log(`Generating ${numberOfQuestions} questions for ${examTitle}...`);

  const topics = topicList.length > 0 ? 
    `on the following topics: ${topicList.join(", ")}` : 
    "covering various relevant topics";

  const prompt = `
    You are a certification exam question creator for "${examTitle}".
    Create ${numberOfQuestions} multiple-choice questions ${topics}.
    
    For each question:
    1. Create a clear, concise question
    2. Provide exactly 4 answer options (A, B, C, D)
    3. Indicate the correct answer
    
    Return ONLY a JSON array where each question has these properties:
    - "text": the question text
    - "options": array of 4 possible answers
    - "correctAnswer": the correct answer text (must match exactly one of the options)
    
    The questions should test professional knowledge and critical thinking, not just definitions.
    Include questions of varied difficulty levels.
    Do not include any explanations or additional text outside the JSON structure.
  `;

  try {
    console.log("Sending request to Gemini API...");
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API error:", errorData);
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON from the response
    try {
      const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        console.log(`Generated ${questions.length} questions successfully`);
        
        // Validate the questions
        const validatedQuestions = questions.map((q: any) => ({
          text: q.text,
          options: q.options && Array.isArray(q.options) && q.options.length === 4 
            ? q.options 
            : ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: q.correctAnswer && q.options?.includes(q.correctAnswer) 
            ? q.correctAnswer 
            : q.options?.[0] || "Option A"
        }));
        
        return validatedQuestions;
      }
    } catch (parseError) {
      console.error("Error parsing questions JSON:", parseError);
    }
    
    // Fallback to mock questions if parsing fails
    return generateMockQuestions(examTitle, numberOfQuestions);
  } catch (error) {
    console.error("Error getting exam questions from API:", error);
    return generateMockQuestions(examTitle, numberOfQuestions);
  }
};

/**
 * Generate mock questions as a fallback
 */
const generateMockQuestions = (examTitle: string, count: number): Question[] => {
  console.log("Generating mock questions as fallback");
  const questions: Question[] = [];
  
  // Create generic mock questions based on exam title
  for (let i = 1; i <= count; i++) {
    const questionNumber = i;
    questions.push({
      text: `Question ${questionNumber}: What is the most important aspect of ${examTitle}?`,
      options: [
        `Strategic planning and implementation`,
        `Technical knowledge and expertise`,
        `Communication and stakeholder management`,
        `Continuous learning and adaptation`
      ],
      correctAnswer: `Continuous learning and adaptation`
    });
  }
  
  return questions;
};
