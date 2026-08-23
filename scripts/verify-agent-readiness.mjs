/**
 * Automated Verification Script for FableSpace AI Agent Readiness (100/100)
 * Run: node scripts/verify-agent-readiness.mjs [baseUrl]
 */

const baseUrl = process.argv[2] || process.env.TEST_URL || 'http://127.0.0.1:3000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${message}`);
    failed++;
  }
}

async function test404Handling() {
  console.log('\n--- 1. Testing Agent-Friendly 404s ---');
  
  // HTML 404 request
  const htmlRes = await fetch(`${baseUrl}/non-existent-agent-test-route-${Date.now()}`, {
    headers: { 'Accept': 'text/html' }
  });
  assert(htmlRes.status === 404, `Non-existent route returns HTTP 404 (got ${htmlRes.status})`);
  const htmlText = await htmlRes.text();
  assert(htmlText.includes('Page Not Found') || htmlText.includes('404.md') || htmlText.includes('Back to home'), 'HTML 404 contains recovery and not-found notice');

  // Markdown 404 request
  const mdRes = await fetch(`${baseUrl}/non-existent-agent-test-route-${Date.now()}`, {
    headers: { 'Accept': 'text/markdown' }
  });
  assert(mdRes.status === 404, `Markdown non-existent route returns HTTP 404 (got ${mdRes.status})`);
  const mdContentType = mdRes.headers.get('content-type') || '';
  assert(mdContentType.includes('text/markdown'), `Markdown 404 Content-Type is text/markdown (got "${mdContentType}")`);
  const mdVary = mdRes.headers.get('vary') || '';
  assert(mdVary.toLowerCase().includes('accept'), `Markdown 404 Vary header includes Accept (got "${mdVary}")`);
  const mdText = await mdRes.text();
  assert(mdText.includes('Recovery Navigation') && mdText.includes('sitemap.xml'), 'Markdown 404 body contains recovery sitemap and index links');
}

async function testContentWithoutJS() {
  console.log('\n--- 2. Testing Content without JavaScript (SSR & Heading Structure) ---');
  
  const res = await fetch(`${baseUrl}/`, {
    headers: { 'Accept': 'text/html' }
  });
  assert(res.status === 200, `Homepage returns 200 OK (got ${res.status})`);
  const html = await res.text();
  
  assert(html.length > 2000, `Raw SSR HTML is substantial (> 2000 chars, got ${html.length} chars)`);
  assert(html.includes('<h1') || html.includes('&lt;h1'), 'Raw HTML contains <h1> heading');
  assert(html.includes('<h2') || html.includes('&lt;h2'), 'Raw HTML contains <h2> headings');
  assert(html.includes('<h3') || html.includes('&lt;h3'), 'Raw HTML contains <h3> sub-headings (non-flat structure)');
  assert(html.includes('Frequently Asked Questions') || html.includes('Discover Original Stories'), 'Raw HTML contains rich semantic sections');
}

async function testMarkdownContentNegotiation() {
  console.log('\n--- 3. Testing AcceptMarkdown Content Negotiation (acceptmarkdown.com) ---');
  
  // Home page markdown
  const homeMdRes = await fetch(`${baseUrl}/`, {
    headers: { 'Accept': 'text/markdown' }
  });
  assert(homeMdRes.status === 200, `GET / with Accept: text/markdown returns 200 OK`);
  const homeMdContentType = homeMdRes.headers.get('content-type') || '';
  assert(homeMdContentType.includes('text/markdown'), `GET / returns Content-Type text/markdown (got "${homeMdContentType}")`);
  const homeMdVary = homeMdRes.headers.get('vary') || '';
  assert(homeMdVary.toLowerCase().includes('accept'), `GET / returns Vary: Accept header (got "${homeMdVary}")`);
  const homeMdText = await homeMdRes.text();
  assert(homeMdText.includes('# FableSpace') && homeMdText.includes('/openapi.json'), 'Homepage Markdown includes platform overview and directory');

  // HTML page Vary header check
  const homeHtmlRes = await fetch(`${baseUrl}/`, {
    headers: { 'Accept': 'text/html' }
  });
  const homeHtmlVary = homeHtmlRes.headers.get('vary') || '';
  assert(homeHtmlVary.toLowerCase().includes('accept'), `HTML responses include Vary: Accept for CDN caching safety (got "${homeHtmlVary}")`);

  // Browse page markdown
  const browseMdRes = await fetch(`${baseUrl}/browse?genre=fantasy`, {
    headers: { 'Accept': 'text/markdown' }
  });
  assert(browseMdRes.status === 200, `GET /browse with Accept: text/markdown returns 200 OK`);
  const browseMdText = await browseMdRes.text();
  assert(browseMdText.includes('Story Catalog') && browseMdText.includes('Fantasy'), 'Browse Markdown includes catalog structure and genre');
}

async function testDeveloperResources() {
  console.log('\n--- 4. Testing Developer Resource Discoverability ---');

  // /openapi.json
  const openApiRes = await fetch(`${baseUrl}/openapi.json`);
  assert(openApiRes.status === 200, `GET /openapi.json returns 200 OK`);
  const openApiData = await openApiRes.json();
  assert(openApiData.openapi === '3.1.0' && openApiData.info?.title?.includes('FableSpace'), 'OpenAPI 3.1 JSON spec is valid and describes FableSpace API');

  // /openapi.yaml
  const yamlRes = await fetch(`${baseUrl}/openapi.yaml`);
  assert(yamlRes.status === 200, `GET /openapi.yaml returns 200 OK`);
  const yamlText = await yamlRes.text();
  assert(yamlText.includes('openapi: 3.1.0'), 'OpenAPI YAML spec is accessible');

  // /mcp.json
  const mcpJsonRes = await fetch(`${baseUrl}/mcp.json`);
  assert(mcpJsonRes.status === 200, `GET /mcp.json returns 200 OK`);
  const mcpData = await mcpJsonRes.json();
  assert(Array.isArray(mcpData.tools) && mcpData.tools.length >= 4, 'MCP tool definitions are valid (at least 4 tools)');
}

async function testAgentInstructions() {
  console.log('\n--- 5. Testing Agent Instructions & When-to-Use Guidance ---');

  // /agent-instructions.md
  const agentMdRes = await fetch(`${baseUrl}/agent-instructions.md`);
  assert(agentMdRes.status === 200, `GET /agent-instructions.md returns 200 OK`);
  const agentMdText = await agentMdRes.text();
  assert(agentMdText.includes('Best-Fit Jobs') && agentMdText.includes('When NOT to Use FableSpace'), 'agent-instructions.md includes explicit best-fit jobs');

  // /.well-known/agent-instructions.md
  const wellKnownRes = await fetch(`${baseUrl}/.well-known/agent-instructions.md`);
  assert(wellKnownRes.status === 200, `GET /.well-known/agent-instructions.md returns 200 OK`);

  // /llms.txt
  const llmsRes = await fetch(`${baseUrl}/llms.txt`);
  assert(llmsRes.status === 200, `GET /llms.txt returns 200 OK`);
  const llmsText = await llmsRes.text();
  assert(llmsText.includes('When to Use FableSpace') && llmsText.includes('/openapi.json'), 'llms.txt contains When-to-Use section and developer resource URLs');

  // /llms-full.txt
  const llmsFullRes = await fetch(`${baseUrl}/llms-full.txt`);
  assert(llmsFullRes.status === 200, `GET /llms-full.txt returns 200 OK`);
}

async function runAllTests() {
  console.log(`\n======================================================`);
  console.log(`🔍 FableSpace AI Agent Readiness Verification Suite`);
  console.log(`Target: ${baseUrl}`);
  console.log(`======================================================`);

  try {
    await test404Handling();
    await testContentWithoutJS();
    await testMarkdownContentNegotiation();
    await testDeveloperResources();
    await testAgentInstructions();

    console.log(`\n======================================================`);
    console.log(`📊 Test Summary: \x1b[32m${passed} Passed\x1b[0m, \x1b[${failed > 0 ? '31' : '32'}m${failed} Failed\x1b[0m`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runAllTests();
