import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =========================
   SUPABASE CONFIG
========================= */

const supabaseUrl = 'https://gopyozosqfnuhstkvppt.supabase.co';

/* ⚠️ RECOMMENDED: replace this with your ANON PUBLIC KEY from Supabase Dashboard */
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcHlvem9zcWZudWhzdGt2cHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDI3MDksImV4cCI6MjA5NDY3ODcwOX0.pKWknjshOndcnihJJ0yvCYZx5KuIdc4EdJn5gEx6Cp8';

const client = createClient(supabaseUrl, supabaseKey);

/* =========================
   LOGIN
========================= */

async function login() {

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  const { data: userData, error: fetchError } = await client
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (fetchError) {
    alert(fetchError.message);
    return;
  }

  localStorage.setItem('email', email);

  if (userData.role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'teacher.html';
  }
}

/* =========================
   LOGOUT
========================= */

async function logout() {
  await client.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
}

/* =========================
   LOAD TEACHERS
========================= */

async function loadTeachers() {

  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('role', 'teacher');

  if (error) {
    alert(error.message);
    return;
  }

  const select = document.getElementById('teacherSelect');
  select.innerHTML = '';

  data.forEach(user => {
    const option = document.createElement('option');
    option.value = user.email;
    option.textContent = user.email;
    select.appendChild(option);
  });

  loadSelectedTeacherMessage();
}

/* =========================
   ADD TEACHER
========================= */

async function addTeacher() {

  const email = document.getElementById('newTeacherEmail').value;
  const password = document.getElementById('newTeacherPassword').value;

  const { error } = await client.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  await client.from('users').insert([
    {
      email: email,
      role: 'teacher'
    }
  ]);

  await client.from('messages').insert([
    {
      teacher_email: email,
      message: 'No message yet.'
    }
  ]);

  alert('Teacher Added Successfully!');

  loadTeachers();
}

/* =========================
   LOAD SELECTED MESSAGE
========================= */

async function loadSelectedTeacherMessage() {

  const teacherEmail = document.getElementById('teacherSelect').value;

  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('teacher_email', teacherEmail)
    .single();

  if (error) return;

  if (data) {
    document.getElementById('messageInput').value = data.message;
  }
}

/* =========================
   UPDATE MESSAGE
========================= */

async function updateMessage() {

  const teacherEmail = document.getElementById('teacherSelect').value;
  const message = document.getElementById('messageInput').value;

  const { error } = await client
    .from('messages')
    .update({ message })
    .eq('teacher_email', teacherEmail);

  if (error) {
    alert(error.message);
  } else {
    alert('Message Updated!');
  }
}

/* =========================
   TEACHER VIEW
========================= */

async function loadTeacherMessage() {

  const email = localStorage.getItem('email');

  document.getElementById('teacherEmail').innerHTML = email;

  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('teacher_email', email)
    .single();

  if (error) return;

  if (data) {
    document.getElementById('teacherMessage').innerHTML = data.message;
  }
}