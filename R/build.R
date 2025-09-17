# Content preparation in R and JS before executing Hugo

source("R/utils.R")

# Try to access a Google sheet in order to trigger authentication
source("R/authenticate.R")

# Download catalogues and tabular data and split them into small CSV for viz
# This also the credentials files in order to run JS parts of the build
source("R/split_catalogue.R")

# Clean paths in which content will be generated or downloaded

unlink("content/taxa", recursive = TRUE, force = TRUE)
unlink("docs", recursive = TRUE, force = TRUE)

# Fetch all images used in the site from the Google Drive folder and resize them to web resolution in static/img
run_js("js/fetch-images-oauth.js")

# Fetch taxonomic information from GBIF and write to tabular_data/GBIF-taxa.csv
run_js("js/fetch-gbif.js")

# Generate md pages for each taxon and Hugo partials
run_js("js/generate-pages.js")
