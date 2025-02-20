
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, videoUrl } = await req.json();

    // Analyze response using GPT-4
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing interview responses. Analyze the following response for clarity, confidence, and content quality.'
          },
          {
            role: 'user',
            content: `Analyze this interview response transcript: ${transcript}`
          }
        ],
      }),
    });

    const analysisData = await response.json();
    const analysis = analysisData.choices[0].message.content;

    // Vision analysis for facial expressions
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing facial expressions and body language in interviews.'
          },
          {
            role: 'user',
            content: `Analyze the facial expressions and body language in this video: ${videoUrl}`
          }
        ],
      }),
    });

    const visionData = await visionResponse.json();
    const visionAnalysis = visionData.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        contentAnalysis: analysis,
        expressionAnalysis: visionAnalysis,
        confidenceScore: calculateConfidenceScore(analysis, visionAnalysis),
        clarityScore: calculateClarityScore(analysis),
        contentScore: calculateContentScore(analysis)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateConfidenceScore(analysis: string, visionAnalysis: string): number {
  // Simple scoring based on keyword analysis
  const confidenceKeywords = ['confident', 'strong', 'clear', 'decisive', 'assured'];
  const nervousnessKeywords = ['nervous', 'uncertain', 'hesitant', 'unsure', 'anxious'];
  
  let score = 0.5; // Start at neutral
  
  confidenceKeywords.forEach(keyword => {
    if (analysis.toLowerCase().includes(keyword) || visionAnalysis.toLowerCase().includes(keyword)) {
      score += 0.1;
    }
  });
  
  nervousnessKeywords.forEach(keyword => {
    if (analysis.toLowerCase().includes(keyword) || visionAnalysis.toLowerCase().includes(keyword)) {
      score -= 0.1;
    }
  });
  
  return Math.max(0, Math.min(1, score));
}

function calculateClarityScore(analysis: string): number {
  const clarityKeywords = ['clear', 'articulate', 'well-structured', 'organized', 'coherent'];
  const unclearKeywords = ['unclear', 'confusing', 'disorganized', 'rambling', 'incoherent'];
  
  let score = 0.5;
  
  clarityKeywords.forEach(keyword => {
    if (analysis.toLowerCase().includes(keyword)) {
      score += 0.1;
    }
  });
  
  unclearKeywords.forEach(keyword => {
    if (analysis.toLowerCase().includes(keyword)) {
      score -= 0.1;
    }
  });
  
  return Math.max(0, Math.min(1, score));
}

function calculateContentScore(analysis: string): number {
  const contentKeywords = ['relevant', 'comprehensive', 'detailed', 'accurate', 'knowledgeable'];
  const poorContentKeywords = ['irrelevant', 'superficial', 'incomplete', 'inaccurate', 'lacking'];
  
  let score = 0.5;
  
  contentKeywords.forEach(keyword => {
    if (analysis.toLowerCase().includes(keyword)) {
      score += 0.1;
    }
  });
  
  poorContentKeywords.forEach(keyword => {
    if (analysis.toLowerCase().includes(keyword)) {
      score -= 0.1;
    }
  });
  
  return Math.max(0, Math.min(1, score));
}
