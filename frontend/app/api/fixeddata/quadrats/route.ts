import {NextResponse} from "next/server";
import sql from "mssql";
import {sqlConfig} from "@/config/macros";
import {QuadratRDS} from "@/config/sqlmacros";

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

export async function GET(): Promise<NextResponse<QuadratRDS[]>> {
  let i = 0;
  let conn = await getSqlConnection(i);
  if (!conn) throw new Error('sql connection failed');
  let results = await runQuery(conn, `SELECT * FROM forestgeo.Quadrats`);
  if (!results) throw new Error("call failed");
  await conn.close();
  let quadratRows: QuadratRDS[] = []
  Object.values(results.recordset).map((row, index) => {
    quadratRows.push({
      id: index + 1,
      quadratID: row['QuadratID'],
      plotID: row['PlotID'],
      quadratName: row['QuadratName'],
      quadratX: row['QuadratX'],
      quadratY: row['QuadratY'],
      quadratZ: row['QuadratZ'],
      dimensionX: row['DimensionX'],
      dimensionY: row['DimensionY'],
      area: row['Area'],
      quadratShape: row['QuadratShape']
    })
  })
  return new NextResponse(
    JSON.stringify(quadratRows),
    {status: 200}
  );
}
