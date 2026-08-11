const server = process.env.RELEASE_SERVER_URL;
const web = process.env.RELEASE_WEB_URL;
if (!server || !web) throw new Error('RELEASE_TARGET_URLS_REQUIRED');
for (const value of [server, web])
  if (new URL(value).protocol !== 'https:')
    throw new Error('RELEASE_TARGET_HTTPS_REQUIRED');
async function check(url, expectedStatus = 200) {
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status !== expectedStatus)
    throw new Error(`RELEASE_CHECK_FAILED:${new URL(url).pathname}`);
  return response;
}
await check(`${server}/health/live`);
await check(`${server}/health/ready`);
const webResponse = await check(web);
for (const header of [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'strict-transport-security',
]) {
  if (!webResponse.headers.has(header))
    throw new Error(`RELEASE_HEADER_MISSING:${header}`);
}
console.log('release.post_deployment.ok');
