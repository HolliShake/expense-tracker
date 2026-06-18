import { UsersTable } from '@/db/schema';
import { GenericService } from './generic.service';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';


class UserService extends GenericService<typeof UsersTable>
{
    constructor() {
        super(UsersTable);
    }

    public async check(email: string, password: string): Promise<boolean> {
        const user = await this.db.select().from(UsersTable).where(eq(UsersTable.email, email)).limit(1);

        if (!user || user.length === 0) {
            return false;
        }

        return await bcrypt.compare(password, user[0].passwordHash);
    }

    public async readByEmail(email: string): Promise<typeof UsersTable['$inferSelect'] | undefined> {
        const user = await this.db.select().from(UsersTable).where(eq(UsersTable.email, email)).limit(1);

        if (!user || user.length === 0) {
            return undefined;
        }

        return user[0];
    }

    public async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.db.select().from(UsersTable).where(eq(UsersTable.id, userId)).limit(1);

        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        const isValid = await bcrypt.compare(currentPassword, user[0].passwordHash);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        const newHash = await bcrypt.hash(newPassword, 16);
        await this.db.update(UsersTable).set({ passwordHash: newHash }).where(eq(UsersTable.id, userId));
    }

    public async updateCurrency(userId: number, currency: string): Promise<void> {
        await this.db.update(UsersTable).set({ currency }).where(eq(UsersTable.id, userId));
    }

    public async updateAvatar(userId: number, avatarUrl: string): Promise<void> {
        await this.db.update(UsersTable).set({ avatarUrl }).where(eq(UsersTable.id, userId));
    }

    public async updateProfile(userId: number, data: { name?: string; email?: string }): Promise<typeof UsersTable['$inferSelect']> {
        const result = await this.db
            .update(UsersTable)
            .set(data)
            .where(eq(UsersTable.id, userId))
            .returning();

        if (!result || result.length === 0) {
            throw new Error('Failed to update profile');
        }

        return result[0] as typeof UsersTable['$inferSelect'];
    }

    public async getSettings(userId: number): Promise<{ name: string; email: string; currency: string; avatarUrl: string }> {
        const user = await this.db.select({
            name: UsersTable.name,
            email: UsersTable.email,
            currency: UsersTable.currency,
            avatarUrl: UsersTable.avatarUrl,
        }).from(UsersTable).where(eq(UsersTable.id, userId)).limit(1);

        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        return {
            name: user[0].name,
            email: user[0].email,
            currency: user[0].currency ?? 'PHP',
            avatarUrl: user[0].avatarUrl ?? '',
        };
    }
}

const userService = new UserService();

export default userService;