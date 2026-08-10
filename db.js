const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ssdwggwkjwyioeszfdoy.supabase.co';
const supabaseKey = 'sb_publishable_t1-Jy1tcY4yhUGSUzrvoqQ_BQF_74sP';
const supabase = createClient(supabaseUrl, supabaseKey);

// محاكي متصل حقيقي بـ Supabase لجدول users عشان التسجيل والدخول يشتغلوا 100%
const db = {
  prepare: (query) => {
    const cleanQuery = query.trim().toLowerCase();

    return {
      run: async (...params) => {
        console.log('Supabase SQL Run:', query, params);
        
        // لو أمر إدخال مستخدم جديد (Register)
        if (cleanQuery.includes('insert into users')) {
          // params بيكونوا ترتيبهم حسب استعلام السيرفر: [email, password_hash, full_name, role, grade, school_id]
          const [email, password_hash, full_name, role, grade, school_id] = params;
          const { error } = await supabase
            .from('users')
            .insert([{ email, password_hash, full_name, role, grade, school_id }]);
          
          if (error) {
            console.error('Supabase Insert Error:', error);
            throw new Error(error.message);
          }
          return { changes: 1 };
        }
        return { changes: 1 };
      },

      get: async (...params) => {
        console.log('Supabase SQL Get:', query, params);
        
        // لو أمر بحث عن مستخدم بالإيميل (للlogin أو التأكد لو الإيميل موجود)
        if (cleanQuery.includes('select') && cleanQuery.includes('users') && cleanQuery.includes('email')) {
          const email = params[0];
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
          
          if (error || !data) return null;
          return data; // بيرجع بيانات المستخدم الحقيقية
        }
        return null;
      },

      all: async (...params) => {
        console.log('Supabase SQL All:', query, params);
        return [];
      }
    };
  },
  pragma: () => [],
  exec: () => {},
  supabase: supabase 
};

module.exports = db;