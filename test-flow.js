async function test() {
  // Create HR
  await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'HR', email: 'hr1@example.com', password: 'password', role: 'hr' })
  });

  // Create Employee
  await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Emp', email: 'emp1@example.com', password: 'password', role: 'employee' })
  });

  // Login HR
  const hrLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hr1@example.com', password: 'password' })
  })).json();

  // Create Job as HR
  const jobRes = await (await fetch('http://localhost:5000/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hrLogin.accessToken}` },
    body: JSON.stringify({ title: 'Test Job', description: 'Desc', department: 'IT', location: 'Remote', experience: '2' })
  })).json();
  console.log("Create Job Response:", jobRes);

  // Login Employee
  const empLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'emp1@example.com', password: 'password' })
  })).json();

  // Fetch Jobs as Employee
  const fetchJobs = await (await fetch('http://localhost:5000/api/jobs', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${empLogin.accessToken}` }
  })).json();
  console.log("Fetched Jobs as Employee:", fetchJobs);
}

test();

