/* eslint-env node */

"use strict";

const fs = require("fs");
const mustache = require("mustache");
const {readCSV, writeCSV} = require("./utils.js");
const path = require("path");

const fluid = {};
/**
 * Set a value at a specified path within a nested object structure.
 * Creates intermediate objects as needed to ensure the path exists.
 *
 * @param {Object} root - The root object to begin traversal from.
 * @param {String[]} segs - The path to the location where the value should be set
 * @param {any} newValue - The value to set at the specified path.
 */
fluid.set = function (root, segs, newValue) {
    for (let i = 0; i < segs.length - 1; ++i) {
        const seg = segs[i];
        if (!root[seg]) {
            root[seg] = Object.create(null);
        }
        root = root[seg];
    }
    root[segs[segs.length - 1]] = newValue;
};

/**
 * Pushes an element or elements onto an array, initialising the array as a member of a holding object if it is
 * not already allocated.
 * @param {Array|Object} holder - The holding object whose member is to receive the pushed element(s).
 * @param {String} member - The member of the <code>holder</code> onto which the element(s) are to be pushed
 * @param {Array|any} topush - If an array, these elements will be added to the end of the array using Array.push.apply.
 * If a non-array, it will be pushed to the end of the array using Array.push.
 */
fluid.pushArray = function (holder, member, topush) {
    const array = holder[member] ? holder[member] : (holder[member] = []);
    if (Array.isArray(topush)) {
        array.push.apply(array, topush);
    } else {
        array.push(topush);
    }
};

const buildTaxonomy = function (rows, gbifLookup) {
    const tree = {};
    for (const row of rows) {
        const looked = gbifLookup[row.taxon];
        if (!looked) {
            throw (`Taxon ${row.taxon} not found in GBIF table`);
        }
        if (looked.family !== row.family) {
            console.log(`**** Taxonomy mismatch for ${row.taxon}, supplied family ${row.family} whereas GBIF has ${looked.family}`);
            if (!gbifLookup[row.family]) {
                console.log(`**** Urgent issue, ${row.family} itself is not in GBIF table`);
            }
        }
        fluid.set(tree, [looked.phylum, looked.family, looked.genus, row.taxon], true);
    }
    return tree;
};

const joinTaxa = function (bryo, gbif) {
    const gbifMap = new Map(gbif.map(row => [row.taxon, row]));
    const bryoMap = new Map(bryo.map(row => [row.taxon, row]));

    // Collect all unique taxa
    const allTaxa = new Set([...gbifMap.keys(), ...bryoMap.keys()]);

    // Perform full outer join
    const joined = [...allTaxa].map(taxon => {
        const gbifRow = gbifMap.get(taxon) ?? {};
        const guideRow = bryoMap.get(taxon) ?? {};
        return { taxon, ...guideRow, ...gbifRow };
    });
    return joined;
};

const genusList = function (filtered, joined) {
    // 1. Group filtered taxa by genus
    const genusGroups = {};
    filtered.forEach(row => fluid.pushArray(genusGroups, row.genus, row.taxon));

    // 2. For each genus, find the genus-level row in `joined`
    const genusRows = Object.entries(genusGroups).map(([genus, taxa]) => {
        const genusRow = joined.find(r => r.taxon === genus);
        if (genusRow.rank !== "genus") {
            throw (`Mismatched genus given rank ${genusRow.rank}`);
        }
        if (!genusRow) {
            throw (`Genus ${genus} was not found in taxonomy`);
        }
        return {
            ...genusRow,
            species: taxa
        };
    });
    return genusRows;
};

const familyList = function (genusPages, joined) {
    // 1. Group genera by family
    const familyGroups = {};
    genusPages.forEach(row => fluid.pushArray(familyGroups, row.family, row.taxon));

    // 2. For each genus, find the genus-level row in `joined`
    const familyRows = Object.entries(familyGroups).map(([family, taxa]) => {
        const familyRow = joined.find(r => r.taxon === family);
        if (!familyRow) {
            console.log("Genera: ", taxa);
            throw (`Family ${family} was not found in taxonomy`);
        }
        return {
            ...familyRow,
            genera: taxa
        };
    });
    return familyRows;
};


const search = fs.readFileSync("templates/search.html", "utf8");
const svg = fs.readFileSync("templates/svg.html", "utf8");
const modal = fs.readFileSync("templates/modal.html", "utf8");

const imageFiles = JSON.parse(fs.readFileSync("imagefiles.json", "utf8"));
const imageMap = Object.fromEntries(imageFiles.map(item => [item.path.substring(1), item.id]));

const taxonLink = taxon => `/taxa/${taxon}`;
const abbreviate = taxon => {
    const parts = taxon.split(" ");
    return parts[0][0] + ". " + parts[1];
};

const renderMenu = function (node) {
    let html = `<div class="dropdown-menu">`;
    for (const key in node) {
        if (typeof node[key] === "object") {
            html += `
        <div class="dropdown-item">
          <a href="${taxonLink(key)}">${key}</a>
          <svg width="12" height="12"><use href="#right-arrow"/></svg>
          ${renderMenu(node[key])}
        </div>`;
        } else {
            // Assume that a leaf is a species and abbreviate it
            html += `<div class="dropdown-item"><a href="${taxonLink(key)}">${abbreviate(key)}</a></div>`;
        }
    }
    html += "</div>";
    return html;
};

const phylumButton = function (name, taxon, taxonomy) {
    return `
    <div class="dropdown-button">
      ${name}
      <svg width="16" height="16"><use href="#down-arrow"/></svg>
      ${renderMenu(taxonomy[taxon])}
    </div>`;
};

const buildNavbar = function (taxonomy) {
    const mosses = phylumButton("Mosses", "Bryophyta", taxonomy);
    const liverworts = phylumButton("Liverworts", "Marchantiophyta", taxonomy);
    const hornworts = phylumButton("Hornworts", "Anthocerotophyta", taxonomy);
    return `${svg}<div class="navbar-items">${mosses} ${liverworts} ${hornworts}</div> ${search}`;
};

const mapImage = function (file, taxon, column, badImages) {
    if (file && !/^[x|X]*$/.test(file)) {
        const inverted = imageMap[file];
        if (inverted) {
            return `https://lh3.googleusercontent.com/d/${inverted}`;
        } else {
            badImages.push({file, taxon, column});
        }
    }
};

// Regex: group1 = word (letters), group2 = abbrev (Cap + .), group3 = fallback single char
const tokenRe = /([A-Z]\.)|([A-Za-z]+)|(.)/g;

const tokenizeTaxa = text => {
    const tokens = [];
    let m;
    while ((m = tokenRe.exec(text))) {
        if (m[1]) {
            tokens.push({ text: m[1], type: "word" });
        } else if (m[2]) {
            tokens.push({text: m[2], type: "word"});
        } else {
            tokens.push({ text: m[3], type: "nonword" });
        }
    }
    return tokens;
};

const linkifyText = function (row, taxonLookup, fields) {
    for (const field of fields) {
        let text = row[field] || "";

        const tokens = tokenizeTaxa(text);

        let out = "";
        let i = 0;
        while (i < tokens.length) {
            // Try double-word: word + single-space + word
            if (
                i + 2 < tokens.length &&
                tokens[i].type === "word" &&
                tokens[i + 1].text === " " &&
                tokens[i + 2].type === "word"
            ) {
                const candidate = tokens[i].text + " " + tokens[i + 2].text;
                const target = taxonLookup[candidate];
                if (target && target !== row.taxon) {
                    out += `<a href="${taxonLink(target)}">${candidate}</a>`;
                    i += 3;
                    continue;
                }
            }

            // Try single word
            if (tokens[i].type === "word") {
                const target = taxonLookup[tokens[i].text];
                if (target && target !== row.taxon) {
                    out += `<a href="${taxonLink(target)}">${tokens[i].text}</a>`;
                    i += 1;
                    continue;
                }
            }

            // Fallback
            out += tokens[i].text;
            i += 1;
        }

        row[field] = out;
    }
};

const makeTaxonLookup = allRendered => {
    const lookup = {};
    for (const row of allRendered) {
        const taxon = row.taxon;
        lookup[taxon] = taxon; // full name
        const [genus, species] = taxon.split(" ");
        if (genus && species) {
            lookup[`${genus[0]}. ${species}`] = taxon; // abbreviated form
        }
    }
    return lookup;
};

async function main() {
    const bryo = await readCSV("tabular_data/BC_Bryo_Guide.csv");
    const gbif = await readCSV("tabular_data/GBIF-taxa.csv");
    const gbifLookup = Object.fromEntries(gbif.map(row => [row.taxon, row]));

    const template = fs.readFileSync("templates/taxon.md", "utf8");

    const badImages = [];

    const start = Date.now();

    // Rename quick&Dirty to quickNDirty, filter, and add genus column
    const filtered = bryo
        .filter(row => row.generate === "yes")
        .map(row => {
            row.quickNDirty = row["quick&Dirty"];
            delete row["quick&Dirty"];
            row.genus = row.taxon.split(" ")[0];
            return row;
        });

    const taxonomy = buildTaxonomy(filtered, gbifLookup);

    const navbar = buildNavbar(taxonomy);
    fs.writeFileSync("layouts/partials/subnav.html", navbar, "utf8");

    const joined = joinTaxa(bryo, gbif);
    await writeCSV("tabular_data/joined-taxa.csv", joined);

    const genusPages = genusList(filtered, joined);

    const familyPages = familyList(genusPages, joined);

    const allRendered = filtered.concat(genusPages, familyPages);
    const taxonLookup = makeTaxonLookup(allRendered);

    const hoistImage = (key, src, drive, meta, label) =>
        drive ? { key, src, drive, meta, label } : null;

    const renderPages = function (rows, decorate) {
        for (const row of rows) {
            const driveLinks = {
                plateDrive: mapImage(row.plate, row.taxon, "plate", badImages),
                insetPhoto1Drive: mapImage(row.insetPhoto1, row.taxon, "insetPhoto1", badImages),
                insetPhoto2Drive: mapImage(row.insetPhoto2, row.taxon, "insetPhoto2", badImages),
                insetPhoto3Drive: mapImage(row.insetPhoto3, row.taxon, "insetPhoto3", badImages)
            };

            const images = {
                plate: hoistImage("plate", row.plate, driveLinks.plateDrive, row.plateMeta, "plate"),
                photo1: hoistImage("photo1", row.insetPhoto1, driveLinks.insetPhoto1Drive, row.insetPhoto1meta, "photo 1"),
                photo2: hoistImage("photo2", row.insetPhoto2, driveLinks.insetPhoto2Drive, row.insetPhoto2meta, "photo 2"),
                photo3: hoistImage("photo3", row.insetPhoto3, driveLinks.insetPhoto3Drive, row.insetPhoto3meta, "photo 3")
            };

            linkifyText(row, taxonLookup, ["distinguishingFeatures", "similarSpecies", "habitat", "associatedSpecies"]);

            const output = mustache.render(template, {...row, ...images, ...decorate(row)}, {modal});
            const outFilename = `content/taxa/${row.taxon}.md`;
            fs.writeFileSync(outFilename, output, "utf8");
            const stats = fs.statSync(outFilename);
            console.log("Written " + stats.size + " bytes to " + outFilename);
        }
    };

    fs.mkdirSync("content/taxa", { recursive: true });

    console.log("Generating species pages");
    renderPages(filtered, () => ({leaf: true}));

    console.log("Generating genus pages");
    renderPages(genusPages, row => ({
        taxonLinksHeading: "Species in this genus",
        taxonLinks: row.species.map(taxon => `<a href="${taxonLink(taxon)}">${taxon}</a><br/>`).join("\n")
    }));

    console.log("Generating family pages");
    renderPages(familyPages, row => ({
        taxonLinksHeading: "Genera in this family",
        taxonLinks: row.genera.map(taxon => `<a href="${taxonLink(taxon)}">${taxon}</a><br/>`).join("\n")
    }));

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Wrote ${filtered.length} files in ${elapsed} s`);

    /** Generate the minimal version of search index from all rendered pages for flexsearch **/
    const searchData = {};
    allRendered.forEach(row => {
        const route = taxonLink(row.taxon); // TODO: fix this using the site-root-marker
        searchData[route] = {
            title: row.taxon,
            data: {
                "": row.taxon
            }
        };
    });
    fs.writeFileSync("static/imerss-search-data.json", JSON.stringify(searchData), "utf8");
    console.log("Written static/imerss-search-data.json");

    console.log("badImages: ", badImages);
}

const task = main();

task.catch(err => {
    console.error(err);
    process.exit(1);
});

module.exports = task;
