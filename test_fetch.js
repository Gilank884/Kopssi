
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual simple env loader
function loadEnv(filePath) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const idx = trimmed.indexOf('=');
            if (idx > 0) {
                const key = trimmed.substring(0, idx).trim();
                const val = trimmed.substring(idx + 1).trim();
                process.env[key] = val;
            }
        });
    }
}

// Try loading envs
loadEnv('.env');
loadEnv('.env.local');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Key not found in .env or .env.local');
    process.exit(1);
}

const client = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log('Fetching one loan...');
    const { data: loans, error } = await client
        .from('pinjaman')
        .select(`
            *,
            personal_data:personal_data_id (
                *
            )
        `)
        .limit(1);

    if (error) {
        console.error('Error fetching loan:', error);
        return;
    }

    if (!loans || loans.length === 0) {
        console.log('No loans found.');
        return;
    }

    const loan = loans[0];
    console.log('Loan ID:', loan.id);
    console.log('personal_data_id in loan object:', loan.personal_data_id);
    console.log('personal_data joined:', loan.personal_data ? 'Yes (ID: ' + loan.personal_data.id + ')' : 'No');

    if (!loan.personal_data_id) {
        console.log('WARNING: personal_data_id is MISSING from the root object!');
    }

    const pId = loan.personal_data_id || (loan.personal_data ? loan.personal_data.id : null);

    if (pId) {
        console.log('Fetching active loans for personal_data_id:', pId);
        // Using the exact logic from loanAnalysisPdf.js
        const { data: activeLoans, error: activeError } = await client
            .from('pinjaman')
            .select('*')
            .eq('personal_data_id', pId)
            //.eq('status', 'DICAIRKAN') // Commenting this out to see ALL loans first
            //.neq('id', loan.id)
            ;

        if (activeError) console.error('Error active:', activeError);
        console.log('Total loans found for user:', activeLoans ? activeLoans.length : 0);

        if (activeLoans) {
            activeLoans.forEach(al => {
                console.log(`- Loan ${al.no_pinjaman}: Status='${al.status}', ID=${al.id}`);
            });

            // Now filter like the code does
            const filtered = activeLoans.filter(al => al.status === 'DICAIRKAN' && al.id !== loan.id);
            console.log('Filtered active loans (status=DICAIRKAN, not current):', filtered.length);
        }
    } else {
        console.log('Could not determine personal_data_id to query active loans.');
    }
}

run();
