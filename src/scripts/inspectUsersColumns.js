require('dotenv').config();
const db = require('../database/models');
(async () => {
  try {
    await db.sequelize.authenticate();
    const [results] = await db.sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position;"
    );
    console.log(results.map((r) => r.column_name).join(', '));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
