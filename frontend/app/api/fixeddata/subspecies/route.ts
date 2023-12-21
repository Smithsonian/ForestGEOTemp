import {NextResponse} from "next/server";
import sql from "mssql";
import {sqlConfig} from "@/config/macros";
import {SubSpeciesRDS} from "@/config/sqlmacros";

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

export async function GET(): Promise<NextResponse<SubSpeciesRDS[]>> {
  let i = 0;
  let conn = await getSqlConnection(i);
  if (!conn) throw new Error('sql connection failed');
  let results = await runQuery(conn, `SELECT * FROM forestgeo.Species`);
  if (!results) throw new Error("call failed");
  await conn.close();
  let subSpeciesRows: SubSpeciesRDS[] = []
  Object.values(results.recordset).map((row, index) => {
    subSpeciesRows.push({
      id: index + 1,
      subSpeciesID: row['SubSpeciesID'],
      speciesID: row['SpeciesID'],
      currentTaxonFlag: row['CurrentTaxonFlag'],
      obsoleteTaxonFlag: row['ObsoleteTaxonFlag'],
      subSpeciesName: row['SubSpeciesName'],
      subSpeciesCode: row['SubSpeciesCode'],
      authority: row['Authority'],
      infraSpecificLevel: row['InfraSpecificLevel']
    })
  })
  return new NextResponse(
    JSON.stringify(subSpeciesRows),
    {status: 200}
  );
}