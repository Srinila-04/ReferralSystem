
async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test1@example.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;

  const jobsRes = await fetch('http://localhost:5000/api/jobs', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const jobsData = await jobsRes.json();
  console.log("JOBS:", JSON.stringify(jobsData, null, 2));
}

test();
