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
}

const userService = new UserService();

export default userService;
