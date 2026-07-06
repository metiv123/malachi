// PostgreSQL adapter skeleton for production migration.
// Not active yet. Current MVP uses store.js JSON storage.
// To activate later: install pg, map repository methods, and run db/schema.sql.

export class PostgresStore {
  constructor(pool) { this.pool = pool; }
  async createFamily() { throw new Error('TODO: implement createFamily'); }
  async getFamilyByToken() { throw new Error('TODO: implement getFamilyByToken'); }
  async createCheck() { throw new Error('TODO: implement createCheck'); }
  async updateCheckStatus() { throw new Error('TODO: implement updateCheckStatus'); }
  async listDueChecks() { throw new Error('TODO: implement listDueChecks'); }
  async listNoResponseChecks() { throw new Error('TODO: implement listNoResponseChecks'); }
  async audit() { throw new Error('TODO: implement audit'); }
}
