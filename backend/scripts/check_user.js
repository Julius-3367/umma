const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser() {
    const email = 'candidate@labourmobility.com';
    const password = 'candidate123';

    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true }
    });

    if (!user) {
        console.log('❌ User not found');
        return;
    }

    console.log('✅ User found:', user.email);
    console.log('User Role:', user.role.name);
    console.log('User Status:', user.status);

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
        console.log('✅ Password IS valid');
    } else {
        console.log('❌ Password IS NOT valid');

        // Reset password
        console.log('🔄 Resetting password...');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });
        console.log('✅ Password reset successfully to:', password);
    }
}

checkUser()
    .catch((e) => {
        console.error('Error:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
