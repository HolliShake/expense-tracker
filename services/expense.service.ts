import { ExpensesTable } from "@/db/schema";
import { GenericService } from "./generic.service";
import { Expense } from "@/models/Expense";
import { eq } from "drizzle-orm";




class ExpenseService extends GenericService<typeof ExpensesTable> {
    constructor() {
        super(ExpensesTable);
    }

    public async getExpensesBySalaryId(salaryId: number): Promise<Expense[]> {
        return await this.db.select().from(this.table).where(eq(this.table.salaryId, salaryId));
    }
}

const expenseService = new ExpenseService();

export default expenseService;