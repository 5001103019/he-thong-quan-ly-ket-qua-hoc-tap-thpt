
const sql = require("mssql/msnodesqlv8");


const config = {
    connectionString:
        "Driver={ODBC Driver 18 for SQL Server};" +
        "Server=.\\SQLEXPRESS;" +
        "Database=thpt_grade_management;" +
        "Trusted_Connection=Yes;" +
        "Encrypt=Yes;" +
        "TrustServerCertificate=Yes;"
};


async function testConnection() {
    let pool;

    try {
        pool = await sql.connect(config);

        const result = await pool.request().query(
            "SELECT DB_NAME() AS database_name"
        );

        console.log("Ket noi SQL Server thanh cong!");
        console.log(
            "Database:",
            result.recordset[0].database_name
        );
    } catch (error) {
        console.error("Ket noi that bai!");
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

testConnection();
