const API_BASE = 'http://localhost:5173/application/api';
const TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJERmlWTm1GZTRkV0Zua2JBUDVGUTBJVHdwdUl4TllRdms4emJObXdERHA0In0.eyJleHAiOjE3NzM3NjU2MDUsImlhdCI6MTc3Mzc2NTMwNSwianRpIjoib25ydHJ0OmY3Yzk3NTg2LTM5NTYtNjIzYi04ZTM4LTYyOGRjYmQwMzQ3MyIsImlzcyI6Imh0dHBzOi8va2V5Y2xvYWsueWMuYmFhcy5ncmF2aXRvbnVtLmNvbS9yZWFsbXMvYXBwcyIsInN1YiI6Ijc4YzQxY2RhLTg3MDctNDdiZS05Yjg1LTIxMWY1MDVlNDdlYiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImJhc2UiLCJzaWQiOiI5N2FlZGNkYy1mMDVjLTQ2ZjUtYWQ1MC0wNTY4ZTU1OGU4ZmUiLCJhY3IiOiIxIiwic2NvcGUiOiJ1c2VyIHByb2ZpbGUgdXNlciIsInByb2plY3RzIjpbIm1pbmljcm0iXSwicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1kZXYiLCJtaW5pY3JtQE1hbmFnZXIiLCJtaW5pY3JtQFZpZXdlciJdLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJtaW5pY3JtQHVzZXIxIiwidXNlciI6Im1pbmljcm1AdXNlcjEifQ.mWpcf5cKXUDryR0wlfYBQziIMKDJxwuaqA16dD-w6vfA1b8kzv9Z317mVxp8j7P0Fr6DqXVQi5T8fejT1QnAdXoySb0KoeklYYYMJ4Rd5ESxvtIjhkgTaMzKdg8GPw84mu26_hFsrkzzYd3MsmxJ6VMuPR-8lvV3T-yj2oxGLdWH-Mx1NPh5PwcqNzAuzdgyxs-fJJcU3LZzvQWQJCL7XF9FeaKiHJWas7v2fvOcylzBuLM1Sq3VuPpHRPZ4Wrami-HzqCH-azqnLNpCE4EgvLNt0OXqnx5z_mqjVbyDwNFax7U1TmbuqxbaCgzWfUB4_QwEJFIFEDachANCcBUYHg';

async function run() {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };
    
    // Fetch limits to get latest
    console.log("Fetching ContactCompanyLink...");
    const p1 = await fetch(`${API_BASE}/ContactCompanyLink`, { headers });
    const d1 = await p1.json();
    console.log(JSON.stringify(d1.data ? d1.data.slice(0, 2) : d1.slice(0, 2), null, 2));

    console.log("\nFetching Interaction...");
    const p2 = await fetch(`${API_BASE}/Interaction`, { headers });
    const d2 = await p2.json();
    console.log(JSON.stringify(d2.data ? d2.data.slice(0, 2) : d2.slice(0, 2), null, 2));
}

run();
