import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { useOpportunitiesMention, MentionableOpportunity, insertMention } from "@/hooks/useOpportunitiesMention";
import { cn } from "@/lib/utils";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
}

export const MentionTextarea = ({
  value,
  onChange,
  onBlur,
  onKeyDown: externalOnKeyDown,
  placeholder,
  className,
  rows = 5,
  disabled
}: MentionTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  const { filterOpportunities, isLoading } = useOpportunitiesMention();
  const suggestions = filterOpportunities(suggestionQuery);

  const checkForMention = useCallback((text: string, position: number) => {
    const beforeCursor = text.slice(0, position);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex === -1) {
      setShowSuggestions(false);
      return;
    }

    // Check if there's a space between @ and cursor
    const textAfterAt = beforeCursor.slice(atIndex + 1);
    
    // Check if it's inside a completed mention
    const beforeAt = text.slice(0, atIndex);
    const afterAt = text.slice(atIndex);
    if (afterAt.match(/^@\[[^\]]+\]\([^)]+\)/)) {
      setShowSuggestions(false);
      return;
    }

    // Show suggestions if @ is typed and no newline after it
    if (!textAfterAt.includes('\n') && !textAfterAt.includes('[')) {
      setSuggestionQuery(textAfterAt);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart || 0;
    setCursorPosition(position);
    onChange(newValue);
    checkForMention(newValue, position);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // First check for Ctrl+Enter to send message
    if (e.key === 'Enter' && e.ctrlKey) {
      externalOnKeyDown?.(e);
      return;
    }

    if (!showSuggestions || suggestions.length === 0) {
      externalOnKeyDown?.(e);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (showSuggestions) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (showSuggestions) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      default:
        externalOnKeyDown?.(e);
    }
  };

  const selectSuggestion = (opportunity: MentionableOpportunity) => {
    const { newText, newCursorPosition } = insertMention(value, cursorPosition, opportunity);
    onChange(newText);
    setShowSuggestions(false);
    
    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleClick = () => {
    if (textareaRef.current) {
      const position = textareaRef.current.selectionStart || 0;
      setCursorPosition(position);
      checkForMention(value, position);
    }
  };

  return (
    <div className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => {
            setShowSuggestions(false);
            onBlur?.();
          }, 200);
        }}
        placeholder={placeholder}
        className={cn("min-h-[120px] max-h-[200px] resize-none", className)}
        rows={rows}
        disabled={disabled}
      />

      {showSuggestions && (
        <Card className="absolute bottom-full mb-2 left-0 right-0 z-50 max-h-48 overflow-y-auto shadow-lg border">
          {isLoading ? (
            <div className="flex items-center justify-center p-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Nenhuma oportunidade encontrada
            </div>
          ) : (
            <div className="py-1">
              {suggestions.map((opp, index) => (
                <button
                  key={opp.id}
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-muted transition-colors",
                    index === selectedIndex && "bg-muted"
                  )}
                  onClick={() => selectSuggestion(opp)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm truncate">{opp.title}</span>
                </button>
              ))}
            </div>
          )}
          <div className="px-3 py-1.5 bg-muted/50 border-t text-[10px] text-muted-foreground">
            Use ↑↓ para navegar, Enter para selecionar
          </div>
        </Card>
      )}
    </div>
  );
};
