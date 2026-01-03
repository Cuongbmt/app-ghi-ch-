
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ejbasqahrmichouorrrw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmFzcWFocm1pY2hvdW9ycnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MjM0NDYsImV4cCI6MjA4Mjk5OTQ0Nn0.RkyX2BwbCz0u_DYabOfzpaPem2d3ipBW_t6EjmeHZIk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
