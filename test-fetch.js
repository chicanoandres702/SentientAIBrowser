
async function testFetch() {
  const url = 'https://exp.host/--/api/v2/versions/native-modules';
  console.log(`Testing fetch to ${url}...`);
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Success!');
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

testFetch();
