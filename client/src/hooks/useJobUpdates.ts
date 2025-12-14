import { useEffect } from "react";
import { getSocket } from "../lib/socket";

type JobProgressListener = (percentage: number, submissionId: string) => void;
type JobCompleteListener = (graderId: string, submissionId: string, status: string) => void;
type EmbeddingCompleteListener = (courseId: string, status: string) => void;

export function useJobUpdates(
  onGradingProgress?: JobProgressListener,
  onGradingComplete?: JobCompleteListener,
  onEmbeddingComplete?: EmbeddingCompleteListener
) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (onGradingProgress) {
      socket.on("grading:progress", ({ percentage, submission_id }: { percentage: number; submission_id: string }) => {
        onGradingProgress(percentage, submission_id);
      });
    }

    if (onGradingComplete) {
      socket.on("grading:complete", ({ grader_id, submission_id, status }: any) => {
        onGradingComplete(grader_id, submission_id, status);
      });
    }

    if (onEmbeddingComplete) {
      socket.on("embedding:complete", ({ course_id, status }: { course_id: string; status: string }) => {
        onEmbeddingComplete(course_id, status);
      });
    }

    return () => {
      if (onGradingProgress) socket.off("grading:progress");
      if (onGradingComplete) socket.off("grading:complete");
      if (onEmbeddingComplete) socket.off("embedding:complete");
    };
  }, [onGradingProgress, onGradingComplete, onEmbeddingComplete]);
}
