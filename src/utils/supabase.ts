import { createClient } from '@supabase/supabase-js'

// التأكد من وجود المتغيرات البيئية
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables!')
}

// إنشاء عميل Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
