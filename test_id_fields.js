
const API_BASE = 'http://localhost:5173/application/api';
const TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJERmlWTm1GZTRkV0Zua2JBUDVGUTBJVHdwdUl4TllRdms4emJObXdERHA0In0.eyJleHAiOjE3NzM3NjU2MDUsImlhdCI6MTc3Mzc2NTMwNSwianRpIjoib25ydHJ0OmY3Yzk3NTg2LTM5NTYtNjIzYi04ZTM4LTYyOGRjYmQwMzQ3MyIsImlzcyI6Imh0dHBzOi8va2V5Y2xvYWsueWMuYmFhcy5ncmF2aXRvbnVtLmNvbS9yZWFsbXMvYXBwcyIsInN1YiI6Ijc4YzQxY2RhLTg3MDctNDdiZS05Yjg1LTIxMWY1MDVlNDdlYiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImJhc2UiLCJzaWQiOiI5N2FlZGNkYy1mMDVjLTQ2ZjUtYWQ1MC0wNTY4ZTU1OGU4ZmUiLCJhY3IiOiIxIiwic2NvcGUiOiJ1c2VyIHByb2ZpbGUgdXNlciIsInByb2plY3RzIjpbIm1pbmljcm0iXSwicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1kZXYiLCJtaW5pY3JtQE1hbmFnZXIiLCJtaW5pY3JtQFZpZXdlciJdLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJtaW5pY3JtQHVzZXIxIiwidXNlciI6Im1pbmljcm1AdXNlcjEifQ.mWpcf5cKXUDryR0wlfYBQziIMKDJxwuaqA16dD-w6vfA1b8kzv9Z317mVxp8j7P0Fr6DqXVQi5T8fejT1QnAdXoySb0KoeklYYYMJ4Rd5ESxvtIjhkgTaMzKdg8GPw84mu26_hFsrkzzYd3MsmxJ6VMuPR-8lvV3T-yj2oxGLdWH-Mx1NPh5PwcqNzAuzdgyxs-fJJcU3LZzvQWQJCL7XF9FeaKiHJWas7v2fvOcylzBuLM1Sq3VuPpHRPZ4Wrami-HzqCH-azqnLNpCE4EgvLNt0OXqnx5z_mqjVbyDwNFax7U1TmbuqxbaCgzWfUB4_QwEJFIFEDachANCcBUYHg';

async function logResponse(resp, label) {
    const text = await resp.text();
    console.log(`[${label}] Status: ${resp.status}`);
    if (!text) {
        console.log(`[${label}] No Body`);
        return null;
    }
    try {
        const json = JSON.parse(text);
        // console.log(`[${label}] JSON:`, JSON.stringify(json, null, 2));
        return json;
    } catch (e) {
        console.log(`[${label}] Non-JSON Body:`, text);
        return text;
    }
}

async function testVariations() {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };
    
    // Create client
    const cResp = await fetch(`${API_BASE}/ClientCompany`, {
        method: 'POST', headers, body: JSON.stringify({ name: 'TEST-CLI' })
    });
    const client = await logResponse(cResp, 'Create Client');
    if (!client || !client.id) return;
    const clientId = client.id;

    // Create deal
    const dResp = await fetch(`${API_BASE}/Deal`, {
        method: 'POST', headers, body: JSON.stringify({ name: 'TEST-DEAL' })
    });
    const deal = await logResponse(dResp, 'Create Deal');
    if (!deal || !deal.id) return;
    const dealId = deal.id;

    const variations = [
        'clientCompanyId',
        'client_company_id',
        'clientCompany_id',
        'clientcompanyid'
    ];

    for (const field of variations) {
        console.log(`\n--- Testing variation: ${field} ---`);
        const payload = { id: dealId };
        payload[field] = clientId;
        
        const uResp = await fetch(`${API_BASE}/Deal`, {
            method: 'PUT', headers, body: JSON.stringify(payload)
        });
        const updated = await logResponse(uResp, `Update ${field}`);
        
        if (updated && updated.clientCompany && updated.clientCompany.id === clientId) {
            console.log(`✅ SUCCESS! Field '${field}' worked.`);
        } else {
            console.log(`❌ FAILED. Field '${field}' did not establish link.`);
        }
        
        // Check if client name is wiped
        const cCheck = await fetch(`${API_BASE}/ClientCompany/${clientId}`, { headers });
        const cData = await logResponse(cCheck, `Check Client (${field})`);
        if (cData && cData.name === null) {
            console.log(`🚨 DATA LOSS! Field '${field}' wiped client name.`);
        } else {
            console.log(`✨ Name preserved.`);
        }
    }
}

testVariations();
