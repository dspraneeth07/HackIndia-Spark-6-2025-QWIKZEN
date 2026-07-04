import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BrainCircuit, Loader2, MessageSquareText, BookText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface AIResumeAnalysisProps {
  resumeData: any;
}

interface Question {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const AIResumeAnalysis: React.FC<AIResumeAnalysisProps> = ({ resumeData }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState('analysis');

  const analyzeResume = async () => {
    if (!resumeData) {
      toast({
        title: "Error",
        description: "No resume data available to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setQuestions([]);
    
    try {
      const relevantResumeData = {
        personalInfo: resumeData.personalInfo,
        jobTitle: resumeData.personalInfo?.jobTitle,
        skills: resumeData.skills,
        experience: resumeData.experience?.map((exp: any) => ({
          jobTitle: exp.jobTitle,
          companyName: exp.companyName,
          description: exp.description
        })),
        education: resumeData.education?.map((edu: any) => ({
          degree: edu.degree,
          school: edu.school
        })),
        projects: resumeData.projects?.map((proj: any) => ({
          title: proj.title,
          technologies: proj.technologies,
          description: proj.description
        }))
      };
      
      const analysisResult = await getResumeAnalysisFromGemini(relevantResumeData);
      setAnalysis(analysisResult);
      
      const questionsResult = await getInterviewQuestionsFromGemini(relevantResumeData);
      setQuestions(questionsResult);
      
      toast({
        title: "Analysis Complete",
        description: "Your resume analysis and interview questions are ready",
      });
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze your resume at this time",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getResumeAnalysisFromGemini = async (resumeData: any): Promise<string> => {
    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
      
      if (!API_KEY) {
        throw new Error("Gemini API key is not configured");
      }
      
      const prompt = `
        You are a professional resume analyst and career coach. Analyze the following resume data and provide a professional assessment.
        
        Focus on:
        1. Overall strengths of the resume
        2. Areas for improvement
        3. How well the resume matches industry standards for the role
        4. Key skills that stand out
        5. Suggestions to make the resume more competitive
        
        Resume data:
        ${JSON.stringify(resumeData, null, 2)}
        
        Provide a comprehensive analysis in 3-5 paragraphs. Be specific, professional, and helpful.
      `;
      
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
      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error("Error getting resume analysis:", error);
      throw error;
    }
  };

  const getInterviewQuestionsFromGemini = async (resumeData: any): Promise<Question[]> => {
    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
      
      if (!API_KEY) {
        throw new Error("Gemini API key is not configured");
      }
      
      const prompt = `
        You are a hiring manager interviewing a candidate for a ${resumeData.personalInfo?.jobTitle || "professional"} position.
        Based on the following resume data, generate 8 interview questions with suggested answers:
        
        - 3 questions about technical skills relevant to their role
        - 2 questions about their past experience and achievements
        - 2 questions about behavioral situations or soft skills
        - 1 question about their career goals
        
        For each question, provide a detailed answer that the candidate could use to prepare for the interview.
        
        Resume data:
        ${JSON.stringify(resumeData, null, 2)}
        
        Return your response as a JSON array with this format:
        [
          {
            "id": "1",
            "question": "What experience do you have with...?",
            "answer": "In my role at X company, I...",
            "category": "technical" // can be "technical", "experience", "behavioral", or "career"
          }
        ]
        
        Make sure each answer is comprehensive (3-5 sentences) and specifically references information from the resume when appropriate.
      `;
      
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
      
      try {
        const jsonMatch = textResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Error parsing interview questions JSON:", parseError);
      }
      
      return [];
    } catch (error) {
      console.error("Error getting interview questions:", error);
      throw error;
    }
  };

  const getQuestionsByCategory = (category: string) => {
    return questions.filter(q => q.category === category);
  };

  return (
    <Card className="w-full border shadow-sm mt-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          AI Resume Analysis & Interview Prep
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!analysis && questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Let AI analyze your resume and generate personalized interview questions with suggested answers.
            </p>
            <Button 
              onClick={analyzeResume} 
              disabled={isAnalyzing}
              className="mx-auto"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Analyze My Resume
                </>
              )}
            </Button>
          </div>
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis">
                <BookText className="h-4 w-4 mr-2" />
                Resume Analysis
              </TabsTrigger>
              <TabsTrigger value="questions">
                <MessageSquareText className="h-4 w-4 mr-2" />
                Interview Q&A
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="mt-4">
              {isAnalyzing ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : analysis ? (
                <div className="prose max-w-none">
                  {analysis.split('\n\n').map((paragraph, idx) => {
                    const isHeading = paragraph.startsWith('**') && paragraph.endsWith(':**');
                    return (
                      <p 
                        key={idx} 
                        className={isHeading ? 'font-bold text-lg' : ''}
                      >
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No analysis available yet.</p>
              )}
            </TabsContent>
            
            <TabsContent value="questions" className="mt-4">
              {isAnalyzing ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : questions.length > 0 ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Technical Questions</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {getQuestionsByCategory('technical').map((q) => (
                        <AccordionItem key={q.id} value={q.id}>
                          <AccordionTrigger className="text-left">
                            {q.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-muted p-3 rounded-md">
                              {q.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Experience Questions</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {getQuestionsByCategory('experience').map((q) => (
                        <AccordionItem key={q.id} value={q.id}>
                          <AccordionTrigger className="text-left">
                            {q.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-muted p-3 rounded-md">
                              {q.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Behavioral Questions</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {getQuestionsByCategory('behavioral').map((q) => (
                        <AccordionItem key={q.id} value={q.id}>
                          <AccordionTrigger className="text-left">
                            {q.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-muted p-3 rounded-md">
                              {q.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Career Questions</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {getQuestionsByCategory('career').map((q) => (
                        <AccordionItem key={q.id} value={q.id}>
                          <AccordionTrigger className="text-left">
                            {q.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-muted p-3 rounded-md">
                              {q.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No interview questions available yet.</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default AIResumeAnalysis;
