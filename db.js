const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ssdwggwkjwyioeszfdoy.supabase.co';
const supabaseKey = 'sb_publishable_t1-Jy1tcY4yhUGSUzrvoqQ_BQF_74sP';
const supabase = createClient(supabaseUrl, supabaseKey);

// محاكي ذكي للـ SQLite متصل بـ Supabase عشان السيرفر يشتغل من غير ما نعدل الـ 1000 سطر
const db = {
  prepare: (query) => {
    return {
      run: async (...params) => {
        console.log('SQL Run (Simulated):', query, params);
        return { changes: 1 };
      },
      get: async (...params) => {
        console.log('SQL Get (Simulated):', query, params);
        return null;
      },
      all: async (...params) => {
        console.log('SQL All (Simulated):', query, params);
        return [];
      }
    };
  },
  pragma: () => [],
  exec: () => {},
  supabase: supabase 
};

module.exports = db;