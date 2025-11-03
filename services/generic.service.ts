import 'dotenv/config';
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import { eq, count } from 'drizzle-orm';

const client = createClient({ url: process.env.DB_FILE_NAME! });

export type PaginatedResponse<T> = {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
};

export class GenericService<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TTable extends SQLiteTableWithColumns<any>
> {
    public readonly db: LibSQLDatabase<Record<string, never>>;
    public readonly table: TTable;

    constructor(table: TTable) {
        this.db = drizzle({ client });
        this.table = table;
    }

    public async read(id: number): Promise<TTable['$inferSelect'] | undefined> {
        const result = await this.db
            .select()
            .from(this.table)
            .where(eq(this.table.id, id))
            .limit(1);
        
        return result[0];
    }

    public async readAll(): Promise<TTable['$inferSelect'][]> {
        return await this.db.select().from(this.table);
    }

    public async paginate(
        page: number = 1,
        pageSize: number = 10
    ): Promise<PaginatedResponse<TTable['$inferSelect']>> {
        // Ensure page and pageSize are positive integers
        page = Math.max(1, Math.floor(page));
        pageSize = Math.max(1, Math.floor(pageSize));

        const offset = (page - 1) * pageSize;

        // Get total count
        const totalResult = await this.db
            .select({ count: count() })
            .from(this.table);
        const totalItems = totalResult[0]?.count ?? 0;

        // Get paginated data
        const data = await this.db
            .select()
            .from(this.table)
            .limit(pageSize)
            .offset(offset);

        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data,
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    public async create(data: TTable['$inferInsert']): Promise<TTable['$inferSelect']> {
        const result = await this.db
            .insert(this.table)
            .values(data)
            .returning();
        
        if (!result || result.length === 0) {
            throw new Error('Failed to create record');
        }
        
        return result[0] as TTable['$inferSelect'];
    }

    public async update(
        id: number,
        data: Partial<TTable['$inferInsert']>
    ): Promise<TTable['$inferSelect']> {
        const result = await this.db
            .update(this.table)
            .set(data)
            .where(eq(this.table.id, id))
            .returning();
        
        if (!result || result.length === 0) {
            throw new Error(`Failed to update record with id ${id}`);
        }
        
        return result[0] as TTable['$inferSelect'];
    }

    public async delete(id: number): Promise<void> {
        await this.db
            .delete(this.table)
            .where(eq(this.table.id, id));
    }

    public async exists(id: number): Promise<boolean> {
        const result = await this.db
            .select({ id: this.table.id })
            .from(this.table)
            .where(eq(this.table.id, id))
            .limit(1);
        
        return result.length > 0;
    }
}