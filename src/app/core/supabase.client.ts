import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Exported as singleton — import this wherever Supabase access is needed
export const supabase: SupabaseClient = createClient(
  environment.supabaseUrl,
  environment.supabaseKey
);
