
const API_BASE = 'http://localhost:5173/application/api';
const TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJERmlWTm1GZTRkV0Zua2JBUDVGUTBJVHdwdUl4TllRdms4emJObXdERHA0In0.eyJleHAiOjE3NzM3NjU2MDUsImlhdCI6MTc3Mzc2NTMwNSwianRpIjoib25ydHJ0OmY3Yzk3NTg2LTM5NTYtNjIzYi04ZTM4LTYyOGRjYmQwMzQ3MyIsImlzcyI6Imh0dHBzOi8va2V5Y2xvYWsueWMuYmFhcy5ncmF2aXRvbnVtLmNvbS9yZWFsbXMvYXBwcyIsInN1YiI6Ijc4YzQxY2RhLTg3MDctNDdiZS05Yjg1LTIxMWY1MDVlNDdlYiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImJhc2UiLCJzaWQiOiI5N2FlZGNkYy1mMDVjLTQ2ZjUtYWQ1MC0wNTY4ZTU1OGU4ZmUiLCJhY3IiOiIxIiwic2NvcGUiOiJ1c2VyIHByb2ZpbGUgdXNlciIsInByb2plY3RzIjpbIm1pbmljcm0iXSwicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1kZXYiLCJtaW5pY3JtQE1hbmFnZXIiLCJtaW5pY3JtQFZpZXdlciJdLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJtaW5pY3JtQHVzZXIxIiwidXNlciI6Im1pbmljcm1AdXNlcjEifQ.mWpcf5cKXUDryR0wlfYBQziIMKDJxwuaqA16dD-w6vfA1b8kzv9Z317mVxp8j7P0Fr6DqXVQi5T8fejT1QnAdXoySb0KoeklYYYMJ4Rd5ESxvtIjhkgTaMzKdg8GPw84mu26_hFsrkzzYd3MsmxJ6VMuPR-8lvV3T-yj2oxGLdWH-Mx1NPh5PwcqNzAuzdgyxs-fJJcU3LZzvQWQJCL7XF9FeaKiHJWas7v2fvOcylzBuLM1Sq3VuPpHRPZ4Wrami-HzqCH-azqnLNpCE4EgvLNt0OXqnx5z_mqjVbyDwNFax7U1TmbuqxbaCgzWfUB4_QwEJFIFEDachANCcBUYHg';

async function logResponse(resp, label) {
    const text = await resp.text();
    console.log(`${label} Status:`, resp.status);
    try {
        const json = JSON.parse(text);
        return json;
    } catch (e) {
        return text;
    }
}

async function testVariations() {
    try {
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };

        // 1. Create client
        const client = await (await fetch(`${API_BASE}/ClientCompany`, { method: 'POST', headers, body: JSON.stringify({ name: 'V-TEST' }) })).json();
        const clientId = client.id;

        // 2. Create deal
        const deal = await (await fetch(`${API_BASE}/Deal`, { method: 'POST', headers, body: JSON.stringify({ name: 'V-DEAL' }) })).json();
        const dealId = deal.id;

        const variations = [
            { client_company_id: clientId },
            { clientCompany_id: clientId },
            { clientCompanyId: clientId },
            { clientcompanyid: clientId },
            { clientCompany_Id: clientId }
        ];

        for (const v of variations) {
            const field = Object.keys(v)[0];
            console.log(`\nTesting field: ${field}`);
            const uResp = await fetch(`${API_BASE}/Deal`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ id: dealId, ...v })
            });
            const data = await logResponse(uResp, `Update ${field}`);
            console.log(`Link Established: ${data.clientCompany?.id === clientId}`);
            
            // Check if client name is still there
            const cCheck = await (await fetch(`${API_BASE}/ClientCompany/${clientId}`, { headers })).json();
            console.log(`Client Name: ${cCheck.name}`);
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testVariations();
