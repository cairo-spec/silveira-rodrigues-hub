import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MentionableOpportunity {
  id: string;
  title: string;
}

export const useOpportunitiesMention = () => {
  const [opportunities, setOpportunities] = useState<MentionableOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("audited_opportunities")
      .select("id, title")
      .eq("is_published", true)
      .order("title");

    if (data) {
      setOpportunities(data);
    }
    setIsLoading(false);
  };

  const filterOpportunities = (query: string): MentionableOpportunity[] => {
    if (!query) return opportunities.slice(0, 5);
    const lowerQuery = query.toLowerCase();
    return opportunities
      .filter(opp => opp.title.toLowerCase().includes(lowerQuery))
      .slice(0, 5);
  };

  return { opportunities, filterOpportunities, isLoading };
};

// Mention format: @[Title](id)
export const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

export const parseMentions = (text: string): Array<{ type: 'text' | 'mention'; content: string; id?: string }> => {
  const parts: Array<{ type: 'text' | 'mention'; content: string; id?: string }> = [];
  let lastIndex = 0;
  let match;

  const regex = new RegExp(MENTION_REGEX.source, 'g');
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    // Add mention
    parts.push({ type: 'mention', content: match[1], id: match[2] });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
};

export const insertMention = (
  text: string,
  cursorPosition: number,
  opportunity: MentionableOpportunity
): { newText: string; newCursorPosition: number } => {
  // Find the @ symbol before cursor
  const beforeCursor = text.slice(0, cursorPosition);
  const atIndex = beforeCursor.lastIndexOf('@');
  
  if (atIndex === -1) return { newText: text, newCursorPosition: cursorPosition };

  const mention = `@[${opportunity.title}](${opportunity.id})`;
  const beforeAt = text.slice(0, atIndex);
  const afterCursor = text.slice(cursorPosition);
  
  const newText = beforeAt + mention + ' ' + afterCursor;
  const newCursorPosition = beforeAt.length + mention.length + 1;

  return { newText, newCursorPosition };
};
