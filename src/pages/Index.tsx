
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Video, Mic, ChartBar, File, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const features = [
  {
    icon: MessageSquare,
    title: "AI-Based Questioning",
    description: "Intelligent questions tailored to your job role and skills"
  },
  {
    icon: Mic,
    title: "Speech Analysis",
    description: "Real-time evaluation of tone, confidence, and clarity"
  },
  {
    icon: Video,
    title: "Expression Analysis",
    description: "Assessment of facial expressions and eye contact"
  },
  {
    icon: ChartBar,
    title: "Instant Feedback",
    description: "Comprehensive analysis of your interview performance"
  },
  {
    icon: File,
    title: "Resume Evaluation",
    description: "AI-powered review of your application documents"
  },
  {
    icon: Globe,
    title: "Multilingual Support",
    description: "Practice interviews in multiple languages"
  }
];

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();
  }, []);

  const startInterview = () => {
    if (user) {
      navigate("/setup");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            AI Interview Practice
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Master your interview skills with our AI-powered platform. Get real-time feedback on your responses, body language, and communication style.
          </p>
          <Button
            onClick={startInterview}
            size="lg"
            className="mt-8 animate-fade-in"
          >
            {user ? "Start Practice Interview" : "Sign In to Start"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card 
              key={feature.title}
              className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
