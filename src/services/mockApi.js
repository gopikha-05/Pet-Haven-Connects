const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

function createMockToken(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    })
  );
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
}

export async function mockRequest(handler, ms = 400) {
  await delay(ms);
  try {
    const data = await handler();
    return { data, status: 200 };
  } catch (err) {
    throw { response: { status: err.status || 400, data: { message: err.message } } };
  }
}

export { createMockToken, delay };
