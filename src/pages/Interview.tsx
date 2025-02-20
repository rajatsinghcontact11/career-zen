
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic, Video, StopCircle } from "lucide-react";

interface InterviewSession {
  id: string;
  role_id: string;
  status: 'pending' | 'completed' | 'in_progress';
  user_id: string;
}

interface Question {
  id: string;
  question: string;
  question_type: string;
}

const Interview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
    };

    const fetchSession = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setSession(data);

        // Update session status to in_progress
        const { error: updateError } = await supabase
          .from('interview_sessions')
          .update({ status: 'in_progress' })
          .eq('id', id);

        if (updateError) throw updateError;

        // Fetch first question
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('role_id', data.role_id)
          .limit(1)
          .single();

        if (questionError && questionError.code !== 'PGRST116') throw questionError;
        if (questionData) setCurrentQuestion(questionData);
      } catch (error: any) {
        toast.error("Failed to load interview session");
        navigate("/setup");
      }
    };

    checkAuth();
    fetchSession();
  }, [id, navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        chunksRef.current = [];

        // Upload the recording
        try {
          const fileName = `${session?.id}/${Date.now()}.webm`;
          const { error: uploadError } = await supabase.storage
            .from('interview-recordings')
            .upload(fileName, blob);

          if (uploadError) throw uploadError;

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('interview-recordings')
            .getPublicUrl(fileName);

          // Save the response
          const { error: responseError } = await supabase
            .from('responses')
            .insert({
              session_id: session?.id,
              question_id: currentQuestion?.id,
              video_url: publicUrl,
            });

          if (responseError) throw responseError;

          toast.success("Response recorded successfully!");
        } catch (error: any) {
          toast.error("Failed to save recording");
        }
      };

      recorder.start();
      setRecording(true);
    } catch (error: any) {
      toast.error("Failed to access camera/microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setRecording(false);

      // Stop all tracks
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  if (!session || !currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl pt-8">
        <Card>
          <CardHeader>
            <CardTitle>Interview Practice Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="text-lg font-medium mb-2">Question:</h3>
              <p className="text-lg">{currentQuestion.question}</p>
            </div>

            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full"
              />
            </div>

            <div className="flex justify-center gap-4">
              {!recording ? (
                <Button
                  onClick={startRecording}
                  className="gap-2"
                >
                  <Video className="w-4 h-4" />
                  <Mic className="w-4 h-4" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop Recording
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Interview;
