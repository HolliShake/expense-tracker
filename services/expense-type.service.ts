import { ExpensesCategoryTable } from "@/db/schema";
import { GenericService, PaginatedResponse } from "./generic.service";
import { count, eq } from "drizzle-orm";
import { ExpenseCategory } from "@/models/ExpenseCategory";


class ExpenseTypeService extends GenericService<typeof ExpensesCategoryTable> {
    constructor() {
        super(ExpensesCategoryTable);
    }

    public async findByUserIdPaginated(userId: number, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<ExpenseCategory>> {
        page = Math.max(1, Math.floor(page));
        pageSize = Math.max(1, Math.floor(pageSize));

        const offset = (page - 1) * pageSize;

        const totalResult = await this.db
            .select({ count: count() })
            .from(this.table)
            .where(eq(this.table.userId, userId));
        const totalItems = totalResult[0]?.count ?? 0;

        const data = await this.db
            .select()
            .from(this.table)
            .where(eq(this.table.userId, userId))
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
}

const expenseTypeService = new ExpenseTypeService();

export default expenseTypeService;
