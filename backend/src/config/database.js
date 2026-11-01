
/*
 * Ket noi Microsoft SQL Server
 * He thong quan ly ket qua hoc tap hoc sinh THPT
 *
 * Su dung:
 * - Microsoft SQL Server Express
 * - Windows Authentication
 * - ODBC Driver 18 for SQL Server
 * - Cau hinh tu file .env
 */

const path = require("path");
const dotenv = require("dotenv");
const sql = require("mssql/msnodesqlv8");

// Doc file .env trong thu muc backend
dotenv.config({
    path: path.resolve(__dirname, "../../.env")
});

// Lay thong tin ket noi tu .env
const DB_SERVER = process.env.DB_SERVER;
const DB_INSTANCE = process.env.DB_INSTANCE;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
const DB_AUTH = process.env.DB_AUTH;

// Kiem tra cau hinh bat buoc
if (!DB_SERVER || !DB_NAME) {
    throw new Error(
        "Thieu DB_SERVER hoac DB_NAME trong file .env"
    );
}

// Hien tai su dung Windows Authentication
if (DB_AUTH !== "windows") {
    throw new Error(
        "Phuong thuc xac thuc chua duoc ho tro"
    );
}

// Xac dinh ten SQL Server
let serverName = DB_SERVER;

if (DB_INSTANCE) {
    serverName += "\\" + DB_INSTANCE;
} else if (DB_PORT) {
    serverName += "," + DB_PORT;
}

// Cau hinh ma hoa ket noi
const encrypt =
    process.env.DB_ENCRYPT === "true" ? "Yes" : "No";

const trustCertificate =
    process.env.DB_TRUST_SERVER_CERTIFICATE === "true"
        ? "Yes"
        : "No";

// Chuoi ket noi SQL Server
const connectionString = [
    "Driver={ODBC Driver 18 for SQL Server}",
    `Server=${serverName}`,
    `Database=${DB_NAME}`,
    "Trusted_Connection=Yes",
    `Encrypt=${encrypt}`,
    `TrustServerCertificate=${trustCertificate}`
].join(";") + ";";

// Tao connection pool
const pool = new sql.ConnectionPool({
    connectionString: connectionString
});

// Ham ket noi database
async function connectDatabase() {
    return await pool.connect();
}

// Xuat cac thanh phan de su dung o file khac
module.exports = {
    sql,
    pool,
    connectDatabase
};
