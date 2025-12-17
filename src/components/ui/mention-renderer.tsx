import { parseMentions } from "@/hooks/useOpportunitiesMention";
import { cn } from "@/lib/utils";

interface MentionRendererProps {
  text: string;
  onMentionClick?: (opportunityId: string) => void;
  className?: string;
}

export const MentionRenderer = ({ text, onMentionClick, className }: MentionRendererProps) => {
  const parts = parseMentions(text);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'mention' && part.id) {
          return (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMentionClick?.(part.id!);
              }}
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded",
                "bg-gold/20 text-gold hover:bg-gold/30 transition-colors",
                "font-semibold text-sm cursor-pointer underline underline-offset-2"
              )}
            >
              @{part.content}
            </button>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
};
