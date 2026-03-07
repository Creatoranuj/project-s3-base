import { memo } from "react";
import { ThumbsUp, MessageCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonActionBarProps {
  likeCount: number;
  hasLiked: boolean;
  onLike: () => void;
  onDoubts: () => void;
  onComments?: () => void;
  likesLoading?: boolean;
}

const LessonActionBar = memo(({
  likeCount,
  hasLiked,
  onLike,
  onDoubts,
  onComments,
  likesLoading,
}: LessonActionBarProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border overflow-x-auto scrollbar-none">
      {/* Like Pill */}
      <button
        onClick={onLike}
        disabled={likesLoading}
        className={cn(
          "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
          hasLiked
            ? "bg-primary/10 border-primary text-primary"
            : "bg-secondary border-border text-foreground hover:bg-accent"
        )}
      >
        <ThumbsUp className={cn("h-4 w-4", hasLiked && "fill-primary")} />
        {likeCount > 0 ? `${likeCount} Likes` : "Like"}
      </button>

      {/* Comments Pill */}
      <button
        onClick={onComments}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-border bg-secondary text-foreground hover:bg-accent transition-all whitespace-nowrap"
      >
        <MessageCircle className="h-4 w-4" />
        Comments
      </button>

      {/* Doubts Pill */}
      <button
        onClick={onDoubts}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-border bg-secondary text-foreground hover:bg-accent transition-all whitespace-nowrap"
      >
        <HelpCircle className="h-4 w-4" />
        Doubts
      </button>
    </div>
  );
});

LessonActionBar.displayName = "LessonActionBar";

export default LessonActionBar;
