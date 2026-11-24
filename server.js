import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    password: process.env.PGPASSWORD,
    host: "localhost",
    port: 5432,
    database: "hw7_dashboard",
});

app.use(express.static("public"));
app.set("view engine", "ejs");

const limit = 5;

app.get("/", async (req, res) => {
    try {
        // 1. Total customers
        const customerCount = await db.query(
            "SELECT count(*) FROM customers"
        );

        const totalCustomers = Number(customerCount.rows[0].count);
        const totalPages = Math.max(1, Math.ceil(totalCustomers / limit));

        const requestedPage = Number(req.query.page) || 1;
        const currentPage = Number.isInteger(requestedPage)
            ? Math.min(Math.max(requestedPage, 1), totalPages)
            : 1;

        const offset = (currentPage - 1) * limit;

        // 2. Customers for the current page
        const customers = await db.query(
            "SELECT * FROM customers ORDER BY id LIMIT $1 OFFSET $2",
            [limit, offset]
        );

        // 3. Revenue
        const revenue = await db.query(
            "SELECT sum(saleamount) FROM sales"
        );

        // 4. Sales with product names
        const sales = await db.query(`
            SELECT products.name, sales.quantity, sales.saleamount
            FROM sales
            LEFT JOIN products ON
            sales.productid = products.id
            ORDER BY sales.id ASC
        `);

        // 5. Orders
        const orders = await db.query(
            "SELECT count(quantity) FROM orders"
        );

        // 6. Number of issues
        const issueCount = await db.query(
            "SELECT count(id) FROM alerts WHERE type = 'issues'"
        );

        // 7. Issue records
        const issues = await db.query(
            "SELECT * FROM alerts WHERE type = 'issues'"
        );

        // 8. Number of notifications
        const notificationCount = await db.query(
            "SELECT count(id) FROM alerts WHERE type = 'notifications'"
        );

        // 9. Notification records
        const notifications = await db.query(
            "SELECT * FROM alerts WHERE type = 'notifications'"
        );

        // 10. Task records
        const tasks = await db.query(
            "SELECT * FROM alerts WHERE type = 'tasks'"
        );

        res.render("index", {
            totalCustomers,
            customers: customers.rows,
            currentPage,
            totalPages,
            revenue: Number(revenue.rows[0].sum ?? 0),
            sales: sales.rows,
            orders: Number(orders.rows[0].count),
            issueCount: Number(issueCount.rows[0].count),
            issues: issues.rows,
            notificationCount: Number(notificationCount.rows[0].count),
            notifications: notifications.rows,
            tasks: tasks.rows,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading dashboard data.");
    }
});

try {
    await db.connect();
    console.log("Connected to PostgreSQL.");

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
} catch (error) {
    console.error("Database connection failed:", error.message);
}