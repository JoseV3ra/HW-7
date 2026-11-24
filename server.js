import express from 'express';
import pg from 'pg';

const app = express();
const db = new pg.Client({
    user: "postgres",
    password: process.env.PGPASSWORD,
    host: "localhost",
    port: 5432,
    database: "hw7_dashboard",
});
const limit = 5;
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get('/', async (req, res) => {
    try {
        // 1. Customer count supplies both the card and the pagination total.
        const customerCountResult = await db.query('SELECT count(*) FROM customers');
        const totalCustomers = Number(customerCountResult.rows[0].count);
        const totalPages = Math.max(1, Math.ceil(totalCustomers / limit));
        const requestedPage = Number(req.query.page);
        const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0
            ? Math.min(requestedPage, totalPages) : 1;
        const offset = (currentPage - 1) * limit;

        // 2. Parameters keep pagination values separate from SQL text.
        const customerResult = await db.query(
            'SELECT * FROM customers ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
        // 3. Total revenue.
        const revenueResult = await db.query('SELECT sum(saleamount) FROM sales');
        // 4. Join each sale to its product name.
        const salesResult = await db.query(`SELECT products.name, sales.quantity, sales.saleamount
            FROM sales LEFT JOIN products ON sales.productid = products.id ORDER BY sales.id ASC`);
        // 5. Order count, using the supplied query exactly.
        const ordersResult = await db.query('SELECT count(quantity) FROM orders');
        // 6–10. Alert counts and lists.
        const issueCountResult = await db.query("SELECT count(id) FROM alerts WHERE type = 'issues'");
        const issuesResult = await db.query("SELECT * FROM alerts WHERE type = 'issues'");
        const notificationCountResult = await db.query("SELECT count(id) FROM alerts WHERE type = 'notifications'");
        const notificationsResult = await db.query("SELECT * FROM alerts WHERE type = 'notifications'");
        const tasksResult = await db.query("SELECT * FROM alerts WHERE type = 'tasks'");

        res.render('index', {
            totalCustomers, customers: customerResult.rows, currentPage, totalPages,
            revenue: revenueResult.rows[0].sum ?? 0,
            sales: salesResult.rows, orderCount: ordersResult.rows[0].count,
            issueCount: issueCountResult.rows[0].count, issues: issuesResult.rows,
            notificationCount: notificationCountResult.rows[0].count,
            notifications: notificationsResult.rows, tasks: tasksResult.rows,
            money: value => Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            formatDate: value => value instanceof Date ? value.toLocaleDateString('en-US') : value,
        });
    } catch (error) {
        console.error('Dashboard database error:', error.message);
        res.status(500).send('Could not load the dashboard. Check PostgreSQL and your connection settings.');
    }
});

const port = 3000;
try {
    await db.connect();
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
} catch (error) {
    console.error("Database connection failed:", error.message);
}
