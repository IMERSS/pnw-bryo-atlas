"use strict";

/* global Papa, maplibregl */

// noinspection ES6ConvertVarToLetConst
var imerss = {};

// Viridis stops (approximation)
// Source: https://cran.r-project.org/web/packages/viridis/vignettes/intro-to-viridis.html
const viridisStops = [
    "#440154", // dark purple
    "#482777",
    "#3e4989",
    "#31688e",
    "#26828e",
    "#1f9e89",
    "#35b779",
    "#6ece58",
    "#b5de2b",
    "#fde725"  // yellow
];

function csvToGeoJSON(csv) {
    const parsed = Papa.parse(csv, { header: true, dynamicTyping: true }).data;
    return {
        type: "FeatureCollection",
        features: parsed
            .filter(row => row.decimalLongitude && row.decimalLatitude) // skip incomplete rows
            .map(row => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [row.decimalLongitude, row.decimalLatitude]
                },
                properties: row
            }))
    };
}

imerss.makeRecordsMap = function (container, recordFile) {

    // Initialize map
    const map = new maplibregl.Map({
        container,
        style: {
            version: 8,
            sources: {
                "carto-positron": {
                    type: "raster",
                    tiles: [
                        "https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png"
                    ],
                    tileSize: 256,
                    attribution:
                        `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>`
                }
            },
            layers: [
                {
                    id: "carto-positron",
                    type: "raster",
                    source: "carto-positron",
                    minzoom: 0,
                    maxzoom: 20
                }
            ]
        },
        center: [-123.4, 48.4],
        zoom: 6
    });

    map.on("load", () => {
        fetch(recordFile)
            .then(response => response.text())
            .then(csv => {
                const geojsonData = csvToGeoJSON(csv);

                // Find year range
                const years = geojsonData.features.map(f => f.properties.year);
                const minYear = Math.min(...years);
                const maxYear = Math.max(...years);

                // Build color expression
                const colorExpr = ["interpolate", ["linear"], ["get", "year"]];
                viridisStops.forEach((color, i) => {
                    const t = i / (viridisStops.length - 1);
                    const yearValue = minYear + t * (maxYear - minYear);
                    colorExpr.push(yearValue, color);
                });

                // Add source + layer
                map.addSource("records", {type: "geojson", data: geojsonData});

                map.addLayer({
                    id: "records-layer",
                    type: "circle",
                    source: "records",
                    paint: {
                        "circle-radius": 6,
                        "circle-color": colorExpr
                    }
                });

                const lats = geojsonData.features.map(f => f.geometry.coordinates[1]);
                const lngs = geojsonData.features.map(f => f.geometry.coordinates[0]);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                const bounds = [[minLng, minLat], [maxLng, maxLat]];
                map.fitBounds(bounds, { padding: 40 });

                // Popup on click
                map.on("click", "records-layer", (e) => {
                    const feature = e.features[0];
                    const props = feature.properties;
                    const popupHTML = `
          <strong>${props.species}</strong><br/>
          ${props.basisOfRecord}<br/>
          Date: ${props.date || props.year}<br/>
          <a href="https://www.gbif.org/occurrence/${props.gbifID}" target="_blank">GBIF occurrence</a>
        `;
                    const popup = new maplibregl.Popup({ closeButton: false })
                        .setLngLat(feature.geometry.coordinates)
                        .setHTML(`
    <div class="custom-popup">
      <button class="popup-close">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
             viewBox="0 0 24 24" stroke="rgb(75, 85, 99)" stroke-width="2"
             fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      ${popupHTML}
    </div>
  `).addTo(map);
                    const root = popup.getElement();
                    const btn = root.querySelector(".popup-close");
                    btn.addEventListener("click", () => popup.remove());
                });

                // Cursor change on hover
                map.on("mouseenter", "records-layer", () => {
                    map.getCanvas().style.cursor = "pointer";
                });
                map.on("mouseleave", "records-layer", () => {
                    map.getCanvas().style.cursor = "";
                });
            });
    });
    return map;
};
