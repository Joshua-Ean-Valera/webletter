const supabaseUrl = 'https://gopyozosqfnuhstkvppt.supabase.co'
const supabaseKey = 'sb_publishable_o1IWjQenlJmHvmduHjt6eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcHlvem9zcWZudWhzdGt2cHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDI3MDksImV4cCI6MjA5NDY3ODcwOX0.pKWknjshOndcnihJJ0yvCYZx5KuIdc4EdJn5gEx6Cp81A_sn5QgLY_'

const client = supabase.createClient(
  supabaseUrl,
  supabaseKey
)

/* =========================
   LOGIN
========================= */

async function login(){

  const email =
    document.getElementById('email').value

  const password =
    document.getElementById('password').value

  const { error } =
    await client.auth.signInWithPassword({
      email,
      password
    })

  if(error){
    alert(error.message)
    return
  }

  const { data:userData } =
    await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

  localStorage.setItem('email', email)

  if(userData.role === 'admin'){
    window.location.href = 'admin.html'
  } else {
    window.location.href = 'teacher.html'
  }
}

/* =========================
   LOGOUT
========================= */

async function logout(){

  await client.auth.signOut()

  localStorage.clear()

  window.location.href = 'index.html'
}

/* =========================
   LOAD TEACHERS
========================= */

async function loadTeachers(){

  const { data } =
    await client
      .from('users')
      .select('*')
      .eq('role', 'teacher')

  const select =
    document.getElementById('teacherSelect')

  select.innerHTML = ''

  data.forEach(user => {

    const option =
      document.createElement('option')

    option.value = user.email
    option.textContent = user.email

    select.appendChild(option)
  })

  loadSelectedTeacherMessage()
}

/* =========================
   ADD TEACHER
========================= */

async function addTeacher(){

  const email =
    document.getElementById('newTeacherEmail').value

  const password =
    document.getElementById('newTeacherPassword').value

  const { error } =
    await client.auth.signUp({
      email,
      password
    })

  if(error){
    alert(error.message)
    return
  }

  await client
    .from('users')
    .insert([
      {
        email: email,
        role: 'teacher'
      }
    ])

  await client
    .from('messages')
    .insert([
      {
        teacher_email: email,
        message: 'No message yet.'
      }
    ])

  alert('Teacher Added Successfully!')

  loadTeachers()
}

/* =========================
   LOAD SELECTED MESSAGE
========================= */

async function loadSelectedTeacherMessage(){

  const teacherEmail =
    document.getElementById('teacherSelect').value

  const { data } =
    await client
      .from('messages')
      .select('*')
      .eq('teacher_email', teacherEmail)
      .single()

  if(data){

    document.getElementById(
      'messageInput'
    ).value = data.message
  }
}

/* =========================
   UPDATE MESSAGE
========================= */

async function updateMessage(){

  const teacherEmail =
    document.getElementById('teacherSelect').value

  const message =
    document.getElementById('messageInput').value

  const { error } =
    await client
      .from('messages')
      .update({
        message: message
      })
      .eq('teacher_email', teacherEmail)

  if(error){
    alert(error.message)
  }else{
    alert('Message Updated!')
  }
}

/* =========================
   TEACHER VIEW
========================= */

async function loadTeacherMessage(){

  const email =
    localStorage.getItem('email')

  document.getElementById(
    'teacherEmail'
  ).innerHTML = email

  const { data } =
    await client
      .from('messages')
      .select('*')
      .eq('teacher_email', email)
      .single()

  if(data){

    document.getElementById(
      'teacherMessage'
    ).innerHTML = data.message
  }
}
