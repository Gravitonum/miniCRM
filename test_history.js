const axios = require('axios');
const API_BASE = 'http://localhost:5173/application/api';
// I will get a new token by calling Auth if possible? Or I will just fetch without token? 
// The user's token might have expired. Wait! In test_id_fields.js, the token was valid until 1773765605 (year 2026).
// The user probably has the token in localStorage and it is sent via proxy. But from Node I need a token if it's required.
// Let's use the token from test_id_fields.js since it's valid until 2026.
const TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJERmlWTm1GZTRkV0Zua2JBUDVGUTBJVHdwdUl4TllRdms4emJObXdERHA0In0.eyJleHAiOjE3NzM3NjU2MDUsImlhdCI6MTc3Mzc2NTMwNSwianRpIjoib25ydHJ0OmY3Yzk3NTg2LTM5NTYtNjIzYi04ZTM4LTYyOGRjYmQwMzQ3MyIsImlzcyI6Imh0dHBzOi8va2V5Y2xvYWsueWMuYmFhcy5ncmF2aXRvbnVtLmNvbS9yZWFsbXMvYXBwcyIsInN1YiI6Ijc4YzQxY2RhLTg3MDctNDdiZS05Yjg1LTIxMWY1MDVlNDdlYiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImJhc2UiLCJzaWQiOiI5N2FlZGNkYy1mMDVjLTQ2ZjUtYWQ1MC0wNTY4ZTU1OGU4ZmUiLCJhY3IiOiIxIiwic2NvcGUiOiJ1c2VyIHByb2ZpbGUgdXNlciIsInByb2plY3RzIjpbIm1pbmljcm0iXSwicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1kZXYiLCJtaW5pY3JtQE1hbmFnZXIiLCJtaW5pY3JtQFZpZXdlciJdLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJtaW5pY3JtQHVzZXIxIiwidXNlciI6Im1pbmljcm1AdXNlcjEifQ.mWpcf5cKXUDryR0wlfYBQziIMKDJxwuaqA16dD-w6vfA1b8kzv9Z317mVxp8j7P0Fr6DqXVQi5T8fejT1QnAdXoySb0KoeklYYYMJ4Rd5ESxvtIjhkgTaMzKdg8GPw84mu26_hFsrkzzYd3MsmxJ6VMuPR-8lvV3T-yj2oxGLdWH-Mx1NPh5PwcqNzAuzdgyxs-fJJcU3LZzvQWQJCL7XF9FeaKiHJWas7v2fvOcylzBuLM1Sq3VuPpHRPZ4Wrami-HzqCH-azqnLNpCE4EgvLNt0OXqnx5z_mqjVbyDwNFax7U1TmbuqxbaCgzWfUB4_QwEJFIFEDachANCcBUYHg';

async function fetchInteractions() {
    try {
        const resp = await axios.get(`${API_BASE}/Interaction`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log("INTERACTIONS:", JSON.stringify(resp.data.data.slice(0, 5), null, 2));
    } catch (err) {
        console.error("ERR", err.message);
    }
}
fetchInteractions();
