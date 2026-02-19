/**
 * Script to check if all i18n JSON files have the same keys.
 * Run with: node scripts/check-i18n.cjs
 */
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const files = ['ru.json', 'en.json'];

function getKeys(obj, prefix = '') {
    return Object.keys(obj).reduce((res, el) => {
        if (Array.isArray(obj[el])) {
            return res;
        } else if (typeof obj[el] === 'object' && obj[el] !== null) {
            return [...res, ...getKeys(obj[el], prefix + el + '.')];
        }
        return [...res, prefix + el];
    }, []);
}

function check() {
    console.log('🔍 Checking i18n synchronization...');

    const contents = files.map(file => {
        const filePath = path.join(localesDir, file);
        return {
            name: file,
            keys: getKeys(JSON.parse(fs.readFileSync(filePath, 'utf8')))
        };
    });

    const base = contents[0];
    let hasErrors = false;

    for (let i = 1; i < contents.length; i++) {
        const current = contents[i];

        // Check for missing keys in current file
        const missing = base.keys.filter(k => !current.keys.includes(k));
        if (missing.length > 0) {
            console.error(`❌ File ${current.name} is missing keys from ${base.name}:`);
            missing.forEach(k => console.error(`   - ${k}`));
            hasErrors = true;
        }

        // Check for extra keys in current file
        const extra = current.keys.filter(k => !base.keys.includes(k));
        if (extra.length > 0) {
            console.error(`❌ File ${current.name} has extra keys not found in ${base.name}:`);
            extra.forEach(k => console.error(`   - ${k}`));
            hasErrors = true;
        }
    }

    if (!hasErrors) {
        console.log('✅ All i18n files are synchronized!');
        process.exit(0);
    } else {
        process.exit(1);
    }
}

check();
