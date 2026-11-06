// Offline stand-in for the online database: stores everything in this browser (localStorage).
// Starts from the snapshot built into the file.
declare const __SNAPSHOT__: Record<string, any[]>;

const KEY = 'tds-offline-data-v1';
type DB = Record<string, any[]>;

export function loadDB(): DB {
  const raw = localStorage.getItem(KEY);
  if (raw) { try { return JSON.parse(raw); } catch { /* fall through */ } }
  const db = JSON.parse(JSON.stringify(__SNAPSHOT__));
  localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}
export function saveDB(db: DB) { localStorage.setItem(KEY, JSON.stringify(db)); }
export function resetDB() { localStorage.removeItem(KEY); }

const uuid = () => (crypto as any).randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now();

class Query implements PromiseLike<any> {
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any;
  private filters: [string, any][] = [];
  private sort?: { col: string; asc: boolean };
  private mode: 'many' | 'single' | 'maybe' = 'many';
  constructor(private table: string) {}
  select() { return this; }
  insert(rows: any) { this.op = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
  update(v: any) { this.op = 'update'; this.payload = v; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(col: string, v: any) { this.filters.push([col, v]); return this; }
  order(col: string, o?: { ascending?: boolean }) { this.sort = { col, asc: o?.ascending ?? true }; return this; }
  limit() { return this; }
  single() { this.mode = 'single'; return this; }
  maybeSingle() { this.mode = 'maybe'; return this; }
  private match = (r: any) => this.filters.every(([c, v]) => r[c] === v);
  private run() {
    const db = loadDB();
    const rows = (db[this.table] ||= []);
    const now = new Date().toISOString();
    let data: any;
    if (this.op === 'insert') {
      data = this.payload.map((r: any) => ({ id: uuid(), status: 'active', created_at: now, updated_at: now, changed_at: now, ...r }));
      rows.push(...data);
    } else if (this.op === 'update') {
      data = rows.filter(this.match);
      data.forEach((r: any) => Object.assign(r, this.payload, { updated_at: now }));
    } else if (this.op === 'delete') {
      data = rows.filter(this.match);
      db[this.table] = rows.filter((r) => !this.match(r));
    } else {
      data = rows.filter(this.match).map((r) => ({ ...r }));
      if (this.sort) {
        const { col, asc } = this.sort;
        data.sort((a: any, b: any) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
      }
    }
    if (this.op !== 'select') saveDB(db);
    if (this.mode !== 'many') {
      const one = data[0] ?? null;
      if (!one && this.mode === 'single') return { data: null, error: { message: 'Record not found' } };
      return { data: one, error: null };
    }
    return { data, error: null };
  }
  then<T1, T2>(ok?: (v: any) => T1 | PromiseLike<T1>, fail?: (e: any) => T2 | PromiseLike<T2>) {
    return Promise.resolve().then(() => this.run()).then(ok, fail);
  }
}

export const supabase: any = {
  from: (t: string) => new Query(t),
  functions: { invoke: async () => ({ data: null, error: { message: 'Bulk upload is only available in the online app.' } }) },
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({}),
  },
};
export type UserRole = 'super_admin' | 'admin' | 'user';
export async function getUserRole() { return 'super_admin' as UserRole; }
export async function getUserProfile() { return { data: null, error: null }; }
