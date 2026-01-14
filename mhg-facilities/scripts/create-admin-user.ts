import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
})

async function createUser() {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'jrodriguez@markethospitalitygroup.com',
    password: 'Jr42314231!!--',
    email_confirm: true
  })

  if (authError) {
    console.error('Error creating auth user:', authError)
    process.exit(1)
  }

  console.log('Auth user created:', authData.user.id)

  // Create user record in users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      tenant_id: '00000000-0000-0000-0000-000000000001', // MHG tenant from seed
      auth_user_id: authData.user.id,
      email: 'jrodriguez@markethospitalitygroup.com',
      full_name: 'Josue Rodriguez',
      role: 'super_admin',
      is_active: true
    })
    .select()
    .single()

  if (userError) {
    console.error('Error creating user record:', userError)
    process.exit(1)
  }

  console.log('User record created:', userData)
  console.log('\n✅ User setup complete!')
  console.log('Email: jrodriguez@markethospitalitygroup.com')
  console.log('Password: Jr42314231!!--')
}

createUser()
