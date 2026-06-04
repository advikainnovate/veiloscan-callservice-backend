/*
  Usage:
    node src/scripts/createAdmin.js --email admin@example.com --password Secret123 --role super_admin --username Admin
  Or set env vars: CREATE_ADMIN_EMAIL, CREATE_ADMIN_PASSWORD, CREATE_ADMIN_ROLE, CREATE_ADMIN_USERNAME
*/

require('dotenv').config();
const db = require('../database/models');
const userRepository = require('../repository/user.repository');
const { bcrypt } = require('../utils');

const args = require('minimist')(process.argv.slice(2));

const email = args.email || process.env.CREATE_ADMIN_EMAIL;
const password = String(args.password || process.env.CREATE_ADMIN_PASSWORD || '');
const role = args.role || process.env.CREATE_ADMIN_ROLE || 'super_admin';
const username = args.username || process.env.CREATE_ADMIN_USERNAME || (email ? email.split('@')[0] : 'admin');
const phone = args.phone || process.env.CREATE_ADMIN_PHONE || null;

if (!email || !password) {
    console.error('Error: email and password are required. Provide via --email and --password or env vars.');
    process.exit(1);
}

async function main() {
    try {
        await db.sequelize.authenticate();
        console.log('DB connected');

        // check existing user
        const existing = await userRepository.findUserByEmail(email);
        const hashed = await bcrypt.generatePassword(password);

        if (existing) {
            await db.UserModel.update(
                { password: hashed, role: role, username },
                { where: { id: existing.id } }
            );
            console.log(`Updated existing admin user (${email}) with role ${role}`);
            process.exit(0);
        }

        const payload = {
            username,
            email,
            password: hashed,
            role,
            phone,
            display_name: username,
            gender: 'male',
            countryCode: null,
        };

        const user = await userRepository.register(payload);
        console.log(`Admin user created: ${user.email} (id=${user.id})`);
        process.exit(0);
    } catch (err) {
        console.error('Error creating admin user:', err.message || err);
        process.exit(1);
    }
}

main();
