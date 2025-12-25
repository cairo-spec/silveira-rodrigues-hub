import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline } from "lucide-react";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const RichTextEditor = ({
  value,
  onChange,
  maxLength = 900,
  placeholder = "Digite aqui...",
  rows = 4,
  className
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sanitize and set initial value
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const sanitized = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'br'],
        ALLOWED_ATTR: []
      });
      if (editorRef.current.innerHTML !== sanitized) {
        editorRef.current.innerHTML = sanitized;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const execCommand = useCallback((command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
    // Update parent with sanitized HTML content
    if (editorRef.current) {
      isInternalChange.current = true;
      const sanitized = DOMPurify.sanitize(editorRef.current.innerHTML, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'br'],
        ALLOWED_ATTR: []
      });
      onChange(sanitized);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      // Check max length (text content only)
      const textLength = editorRef.current.textContent?.length || 0;
      if (maxLength && textLength > maxLength) {
        // Truncate if needed
        return;
      }
      isInternalChange.current = true;
      const sanitized = DOMPurify.sanitize(editorRef.current.innerHTML, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'br'],
        ALLOWED_ATTR: []
      });
      onChange(sanitized);
    }
  }, [onChange, maxLength]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Get text length for counter
  const getTextLength = () => {
    if (editorRef.current) {
      return editorRef.current.textContent?.length || 0;
    }
    // Estimate from HTML
    const temp = document.createElement('div');
    temp.innerHTML = DOMPurify.sanitize(value);
    return temp.textContent?.length || 0;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1 p-1 border rounded-t-md bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('bold')}
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('italic')}
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('underline')}
          title="Sublinhado"
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          "min-h-[100px] p-3 border border-t-0 rounded-b-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "prose prose-sm max-w-none [&_b]:font-bold [&_i]:italic [&_u]:underline"
        )}
        style={{ minHeight: `${rows * 24}px` }}
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
      />
      {maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          {getTextLength()}/{maxLength}
        </p>
      )}
    </div>
  );
};

export default RichTextEditor;
