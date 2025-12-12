/* eslint-env node */

"use strict";

const pLimit = require("p-limit");
const {readCSV, writeCSV} = require("./utils");
const {queryGbif} = require("./query-gbif-api.js");

const FETCH_CONCURRENCY = 6;

async function main() {
    const taxa = await readCSV("tabular_data/BC_Bryo_Guide.csv");
    const higherTaxa = {};
    const t0 = Date.now();

    const limit = pLimit(FETCH_CONCURRENCY);
    const tasks = taxa.map(row => limit(async () => {
        const taxon = row["taxon"];
        console.log("Querying GBIF for:", taxon);
        try {
            const result = await queryGbif(taxon, row.phylum, higherTaxa);
            return {taxon, ...result};
        } catch (err) {
            console.error("Error with taxon", taxon, err.message);
            return {taxon, matchType: "error"};
        }
    }));

    const results = await Promise.all(tasks);

    const t1 = Date.now();
    console.log(`Queried ${taxa.length} taxa in ${((t1 - t0) / 1000).toFixed(2)} s`);

    // After first pass, dispatch queries for unique higher taxa names
    // Remove already fetched taxa names from higher taxa  before second pass
    taxa.forEach(row => delete higherTaxa[row.taxon]);
    // After first pass, dispatch queries for unique classification names
    const higherEntries = Object.entries(higherTaxa);
    console.log(`Dispatching ${higherEntries.length} classification names for GBIF lookup`);

    const classTasks = higherEntries.map(([name, phylum]) => limit(async () => {
        console.log("Querying GBIF for classification:", name);
        try {
            const result = await queryGbif(name, phylum, higherTaxa);
            return {taxon: name, ...result};
        } catch (err) {
            console.error("Error with classification", name, err.message);
            return {taxon: name, matchType: "error"};
        }
    }));

    const classResults = await Promise.all(classTasks);
    const allResults = results.concat(classResults);

    const remapped = allResults.map(row => ({...row,
        matchType: row.matchType.toLowerCase(),
        rank: row.rank.toLowerCase()
    }));

    await writeCSV("tabular_data/GBIF-taxa.csv", remapped);
    console.log("Wrote tabular_data/GBIF-taxa.csv with", allResults.length, "rows");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
