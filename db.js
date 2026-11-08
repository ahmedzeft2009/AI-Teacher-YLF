const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const dbInstance = new sqlite3.Database(dbPath);

// إنشاء الجدول بالأعمدة كاملة وصحيحة
dbInstance.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT,
  email TEXT,
  password_hash TEXT,
  role TEXT,
  grade TEXT,
  school_id TEXT
)`);

const createQueryBuilder = (tableName) => {
  let selectedFields = '*';
  let whereField = null;
  let whereVal = null;

  return {
    select: (fields = '*') => {
      selectedFields = fields;
      return createQueryBuilder(tableName);
    },
    eq: (field, val) => {
      whereField = field;
      whereVal = val;
      return createQueryBuilder(tableName);
    },
    insert: async (dataArray) => {
      const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(',');
      const query = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`;
      
      return new Promise((resolve) => {
        dbInstance.run(query, values, function(err) {
          if (err) {
            console.error('SQLite Insert Error:', err.message);
            resolve({ data: null, error: err });
          } else {
            resolve({ data: [{ id: this.lastID, ...data }], error: null });
          }
        });
      });
    },
    single: async () => {
      return executeQuery();
    },
    maybeSingle: async () => {
      return executeQuery();
    }
  };

  async function executeQuery() {
    let query = `SELECT ${selectedFields} FROM ${tableName}`;
    let params = [];
    if (whereField) {
      query += ` WHERE ${whereField} = ?`;
      params.push(whereVal);
    }

    return new Promise((resolve) => {
      dbInstance.get(query, params, (err, row) => {
        if (err) resolve({ data: null, error: err });
        else resolve({ data: row || null, error: null });
      });
    });
  }
};

const db = {
  from: (tableName) => createQueryBuilder(tableName),
  prepare: (query) => ({
    run: (...p) => dbInstance.run(query, p),
    get: (...p) => dbInstance.get(query, p),
    all: (...p) => dbInstance.all(query, p)
  }),
  supabase: {
    from: (tableName) => createQueryBuilder(tableName)
  }
};

module.exports = db;