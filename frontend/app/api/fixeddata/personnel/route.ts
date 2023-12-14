import {NextResponse} from "next/server";
import sql from "mssql";
import {sqlConfig} from "@/config/macros";
import {PersonnelRDS} from "@/config/sqlmacros";

async function getSqlConnection(tries: number) {
  return await sql.connect(sqlConfig).catch((err) => {
    console.error(err);
    if (tries == 5) {
      throw new Error("Connection failure");
    }
    console.log("conn failed --> trying again!");
    getSqlConnection(tries + 1);
  });
}

async function runQuery(conn: sql.ConnectionPool, query: string) {
  if (!conn) {
    throw new Error("invalid ConnectionPool object. check connection string settings.")
  }
  return await conn.request().query(query);
}


export async function GET(): Promise<NextResponse<PersonnelRDS[]>> {
  let i = 0;
  let conn = await getSqlConnection(i);
  if (!conn) throw new Error('sql connection failed');
  let results = await runQuery(conn, `SELECT * FROM forestgeo.Attributes`);
  if (!results) throw new Error("call failed");
  await conn.close();
  let personnelRows: PersonnelRDS[] = []
  Object.values(results.recordset).map((row, index) => {
    personnelRows.push({
      id: index + 1,
      personnelID: row['PersonnelID'],
      firstName: row['FirstName'],
      lastName: row['LastName'],
      role: row['Role']
    })
  })
  return new NextResponse(
    JSON.stringify(personnelRows),
    {status: 200}
  );
}