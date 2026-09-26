"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSupabaseConfigured = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
let supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
// Auto-derive SUPABASE_URL from DATABASE_URL if db.xxxx.supabase.co matches
if (!supabaseUrl && process.env.DATABASE_URL) {
    const match = process.env.DATABASE_URL.match(/db\.([a-z0-9]+)\.supabase\.co/);
    if (match && match[1]) {
        supabaseUrl = `https://${match[1]}.supabase.co`;
    }
}
exports.supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project') && !supabaseKey.includes('your-key'))
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    })
    : null;
const isSupabaseConfigured = () => !!exports.supabase;
exports.isSupabaseConfigured = isSupabaseConfigured;
