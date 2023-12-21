import {NextResponse} from "next/server";
import sql from "mssql";
import {sqlConfig} from "@/config/macros";
import {SpeciesRDS} from "@/config/sqlmacros";

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

export async function GET(): Promise<NextResponse<SpeciesRDS[]>> {
  let i = 0;
  let conn = await getSqlConnection(i);
  if (!conn) throw new Error('sql connection failed');
  let results = await runQuery(conn, `SELECT * FROM forestgeo.Species`);
  if (!results) throw new Error("call failed");
  await conn.close();
  let speciesRows: SpeciesRDS[] = []
  Object.values(results.recordset).map((row, index) => {
    speciesRows.push({
      id: index + 1,
      speciesID: row['SpeciesID'],
      genusID: row['GenusID'],
      currentTaxonFlag: row['CurrentTaxonFlag'],
      obsoleteTaxonFlag: row['ObsoleteTaxonFlag'],
      speciesName: row['SpeciesName'],
      speciesCode: row['SpeciesCode'],
      idLevel: row['IDLevel'],
      authority: row['Authority'],
      fieldFamily: row['FieldFamily'],
      description: row['Description'],
      referenceID: row['ReferenceID']
    })
  })
  return new NextResponse(
    JSON.stringify(speciesRows),
    {status: 200}
  );
}