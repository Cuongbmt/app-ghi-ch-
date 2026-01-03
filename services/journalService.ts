
import { JournalEntry } from "../types";
import { supabase } from "../lib/supabase";

export const getEntries = async (userId: string): Promise<JournalEntry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching entries:", error);
    return [];
  }

  // Map database snake_case to frontend camelCase
  return (data || []).map(item => ({
    id: item.id,
    userId: item.user_id,
    title: item.title,
    content: item.content,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    mood: item.mood,
    aiInsights: item.ai_insights
  }));
};

export const getEntry = async (id: string): Promise<JournalEntry | null> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching entry:", error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    mood: data.mood,
    aiInsights: data.ai_insights
  };
};

export const saveEntry = async (entry: Partial<JournalEntry> & { userId: string }): Promise<JournalEntry | null> => {
  const payload = {
    user_id: entry.userId,
    title: entry.title || "Untitled",
    content: entry.content || "",
    mood: entry.mood,
    ai_insights: entry.aiInsights,
    updated_at: new Date().toISOString()
  };

  let result;
  if (entry.id) {
    // Update existing
    result = await supabase
      .from('entries')
      .update(payload)
      .eq('id', entry.id)
      .select()
      .single();
  } else {
    // Create new
    result = await supabase
      .from('entries')
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select()
      .single();
  }

  if (result.error) {
    console.error("Error saving entry:", result.error);
    return null;
  }

  const item = result.data;
  return {
    id: item.id,
    userId: item.user_id,
    title: item.title,
    content: item.content,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    mood: item.mood,
    aiInsights: item.ai_insights
  };
};

export const deleteEntry = async (id: string) => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error("Error deleting entry:", error);
  }
};
