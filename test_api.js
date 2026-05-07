
import axios from 'axios';

const API_BASE = 'http://localhost:5173/application/api';

async function testCreate() {
    try {
        console.log('Testing ClientCompany creation...');
        const resp = await axios.post(`${API_BASE}/ClientCompany`, {
            name: 'API TEST COMPANY ' + Date.now(),
            inn: '1122334455'
        });
        console.log('Created:', resp.data);
        
        const id = resp.data.id;
        const getResp = await axios.get(`${API_BASE}/ClientCompany/${id}`);
        console.log('Fetched:', getResp.data);
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
}

testCreate();
