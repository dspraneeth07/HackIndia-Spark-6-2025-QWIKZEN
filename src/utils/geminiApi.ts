// This file contains API functions to interact with Google's Gemini API

const API_KEY = "AIzaSyDRuULswOC1iFSJr83VqRaeP1g8p0Vn4Lc";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

/**
 * Ensure text is limited to exactly 4 lines or fewer
 */
const limitToFourLines = (text: string): string => {
  const lines = text.split('\n');
  if (lines.length <= 4) return text;
  return lines.slice(0, 4).join('\n');
};

/**
 * Get skill suggestions based on job title
 */
export const getAISkillSuggestions = async (jobTitle: string): Promise<{ professional: string; technical: string; soft: string }> => {
  const prompt = `
    You're a professional resume writer. Generate skills for a ${jobTitle} resume.
    I need three types of skills:
    1. Professional skills - skills related to job management and domain expertise
    2. Technical skills - specific tools, technologies, and platforms
    3. Soft skills - interpersonal and character traits
    
    Return only the skills as a JSON object with three properties: professional, technical, and soft.
    Each property should be a comma-separated list of 5-8 relevant skills.
    DO NOT include any additional text, explanations or formatting.
  `;

  try {
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
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON from the response
    try {
      // The response might contain markdown code blocks, so we need to extract just the JSON
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const skills = JSON.parse(jsonMatch[0]);
        return {
          professional: skills.professional || "Project Management, Time Management, Documentation, Business Analysis, Strategic Planning",
          technical: skills.technical || "HTML, CSS, JavaScript, React, TypeScript, Git, REST APIs, GraphQL",
          soft: skills.soft || "Communication, Teamwork, Problem Solving, Adaptability, Time Management, Leadership"
        };
      }
    } catch (parseError) {
      console.error("Error parsing skills JSON:", parseError);
    }
    
    // Fallback values in case the parsing fails
    return {
      professional: "Project Management, Time Management, Documentation, Business Analysis, Strategic Planning",
      technical: "HTML, CSS, JavaScript, React, TypeScript, Git, REST APIs, GraphQL",
      soft: "Communication, Teamwork, Problem Solving, Adaptability, Time Management, Leadership"
    };
  } catch (error) {
    console.error("Error getting AI skill suggestions:", error);
    throw error;
  }
};

/**
 * Get career objective suggestion
 */
export const getAIObjectiveSuggestion = async (jobTitle: string, firstName: string, lastName: string): Promise<string> => {
  const name = firstName && lastName ? `${firstName} ${lastName}` : "a professional";
  
  const prompt = `
    You're a professional resume writer. Generate a compelling career objective for ${name}'s resume.
    The objective is for a ${jobTitle} position.
    
    Write a concise, professional paragraph that:
    1. Mentions years of experience (use 5+ if no context given)
    2. Highlights key skills and strengths
    3. States career goals and value proposition
    
    IMPORTANT: Keep the response to EXACTLY 4 lines MAXIMUM when viewed on a resume.
    Be direct and concise. Avoid unnecessary adjectives and filler phrases.
    DO NOT use bullet points.
    DO NOT include a title or any formatting.
    Return only the career objective text.
  `;

  try {
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
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text.trim();
    
    // Return the text directly, or a fallback if it's empty (now shorter and limited to 4 lines)
    return limitToFourLines(textResponse) || `Results-driven ${jobTitle} with 5+ years of experience delivering innovative solutions. Skilled in problem-solving and collaboration, consistently exceeding targets while adapting to evolving requirements. Seeking to leverage my expertise in a challenging role that offers growth opportunities.`;
  } catch (error) {
    console.error("Error getting AI objective suggestion:", error);
    throw error;
  }
};

/**
 * Get project description suggestion
 */
export const getAIProjectDescription = async (projectTitle: string, technologies?: string): Promise<string> => {
  const tech = technologies ? `using technologies like ${technologies}` : "";
  
  const prompt = `
    You're a professional resume writer. Generate a concise project description for a resume project titled "${projectTitle}" ${tech}.
    
    Write a description that:
    1. Explains the purpose and functionality of the project
    2. Briefly highlights implementation approach or key technologies
    3. Mentions one quantifiable outcome or impact (user metrics, performance improvements, etc.)
    
    IMPORTANT: Keep the response to EXACTLY 4 lines MAXIMUM when viewed on a resume.
    DO NOT exceed 4 lines under any circumstances.
    DO NOT use bullet points.
    DO NOT include a title or any formatting.
    Return only the project description text.
  `;

  try {
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
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text.trim();
    
    // Return the text directly, or a fallback if it's empty (limited to 4 lines)
    return limitToFourLines(textResponse) || `Developed ${projectTitle}, a solution that improved efficiency by 30%. Implemented best practices while overcoming technical challenges to deliver a high-quality product ahead of schedule.`;
  } catch (error) {
    console.error("Error getting AI project description:", error);
    throw error;
  }
};

/**
 * Get work experience description suggestion
 */
export const getAIExperienceDescription = async (jobTitle: string, companyName?: string): Promise<string> => {
  const company = companyName ? `at ${companyName}` : "";
  
  const prompt = `
    You're a professional resume writer. Generate a concise work experience description for a ${jobTitle} position ${company}.
    
    Write a description that:
    1. Describes key responsibilities relevant to the position
    2. Mentions specific technologies or methodologies used (if applicable)
    3. Highlights one measurable achievement or impact
    
    IMPORTANT: Keep the response to EXACTLY 4 lines MAXIMUM when viewed on a resume.
    DO NOT exceed 4 lines under any circumstances.
    DO NOT use bullet points.
    DO NOT include a title or any formatting.
    Return only the work experience description text.
  `;

  try {
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
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text.trim();
    
    // Return the text directly, or a fallback if it's empty (limited to 4 lines)
    return limitToFourLines(textResponse) || `Led cross-functional teams and implemented innovative solutions as a ${jobTitle} ${company}, improving overall efficiency by 30%. Utilized industry best practices and cutting-edge technologies to solve complex problems, while consistently delivering projects on time and under budget.`;
  } catch (error) {
    console.error("Error getting AI experience description:", error);
    throw error;
  }
};

/**
 * Get an AI-generated email draft to send to companies
 */
export const getAIEmailDraft = async (
  resumeData: any, 
  companyName: string, 
  jobTitle: string
): Promise<{ subject: string; body: string }> => {
  const { personalInfo, skills, experience, education, projects, objective } = resumeData;
  const fullName = `${personalInfo?.firstName || ""} ${personalInfo?.lastName || ""}`.trim();
  
  // Extract key details from resume to help AI generate a better email
  const experienceDetails = experience && experience.length > 0 
    ? experience.map((exp: any) => 
        `${exp.jobTitle} at ${exp.companyName} (${exp.startDate} - ${exp.endDate || "Present"}): ${exp.description || ""}`)
    : ["No experience provided"];
  
  const educationDetails = education && education.length > 0
    ? education.map((edu: any) => 
        `${edu.degree} from ${edu.school} (${edu.graduationDate})`)
    : ["No education details provided"];
  
  const skillDetails = [
    skills?.technical ? `Technical skills: ${skills.technical}` : "",
    skills?.professional ? `Professional skills: ${skills.professional}` : "",
    skills?.soft ? `Soft skills: ${skills.soft}` : ""
  ].filter(Boolean).join("; ");
  
  const projectDetails = projects && projects.length > 0
    ? projects.map((proj: any) => 
        `${proj.title}${proj.technologies ? ` (${proj.technologies})` : ""}: ${proj.description || ""}`)
    : ["No project details provided"];

  const prompt = `
    You're a professional resume writer. Generate an email to apply for a job.
    
    The person applying is ${fullName} for a ${jobTitle} position at ${companyName}.
    
    Here's their complete resume information:
    
    Objective: ${objective || "Not provided"}
    
    Experience:
    ${experienceDetails.join("\n")}
    
    Education:
    ${educationDetails.join("\n")}
    
    Skills:
    ${skillDetails || "No skills provided"}
    
    Projects:
    ${projectDetails.join("\n")}
    
    Contact Information:
    Email: ${personalInfo?.email || "Not provided"}
    Phone: ${personalInfo?.phone || "Not provided"}
    Location: ${personalInfo?.location || "Not provided"}
    
    Generate:
    1. An email subject line that is professional and specific to the position.
    2. A professional email body that:
       - Opens with a formal greeting to the hiring team
       - States the position they're applying for
       - Briefly highlights their most relevant qualifications based on the resume
       - References their attached resume
       - Closes with a thank you and request for an interview
       - Includes their name and contact info in the signature
    
    Return the response in JSON format with two properties: subject and body.
    The body should be properly formatted with line breaks.
    DO NOT include any additional text, explanations or formatting.
  `;

  try {
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
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON from the response
    try {
      // The response might contain markdown code blocks, so we need to extract just the JSON
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const emailData = JSON.parse(jsonMatch[0]);
        return {
          subject: emailData.subject || `Application for ${jobTitle} position at ${companyName}`,
          body: emailData.body || `Dear ${companyName} Hiring Team,

I hope this email finds you well. I am ${fullName}, and I'm writing to express my interest in the ${jobTitle} position at ${companyName}. I believe my background and skills make me a strong candidate for this role.

${objective || "I am passionate about delivering high-quality work and contributing to team success."} My experience includes ${experienceDetails[0]?.split(':')[0] || "relevant professional work"}, which has equipped me with the necessary skills for this position.

I have attached my resume for your review, which provides more details about my qualifications and experience. I would welcome the opportunity to discuss how my background, skills, and qualifications would be a good match for this position.

Thank you for considering my application. I look forward to the possibility of working with the team at ${companyName}.

Best regards,
${fullName}
${personalInfo?.phone || ""}
${personalInfo?.email || ""}`
        };
      }
    } catch (parseError) {
      console.error("Error parsing email JSON:", parseError);
    }
    
    // Fallback values in case the parsing fails
    return {
      subject: `Application for ${jobTitle} position at ${companyName}`,
      body: `Dear ${companyName} Hiring Team,

I hope this email finds you well. I am ${fullName}, and I'm writing to express my interest in the ${jobTitle} position at ${companyName}. I believe my background and skills make me a strong candidate for this role.

${objective || "I am passionate about delivering high-quality work and contributing to team success."} My experience includes ${experienceDetails[0]?.split(':')[0] || "relevant professional work"}, which has equipped me with the necessary skills for this position.

I have attached my resume for your review, which provides more details about my qualifications and experience. I would welcome the opportunity to discuss how my background, skills, and qualifications would be a good match for this position.

Thank you for considering my application. I look forward to the possibility of working with the team at ${companyName}.

Best regards,
${fullName}
${personalInfo?.phone || ""}
${personalInfo?.email || ""}`
    };
  } catch (error) {
    console.error("Error getting AI email draft:", error);
    throw error;
  }
};
