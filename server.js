const app = require('./src/app');
const { CONFIG } = require('./src/config');

app.listen(CONFIG.APP.PORT, () => console.log(`Server running on ${CONFIG.APP.PORT}`));
