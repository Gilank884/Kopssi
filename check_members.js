import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
const { data, error } = await supabase.from('personal_data').select('full_name, status, users(role)').limit(10)
console.log(JSON.stringify(data, null, 2))
