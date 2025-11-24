library(googledrive)

source("R/utils.R")

# A minimal build file which just refetches any content from the spreadsheet and rebuilds the site
# assuming there have been no changes in catalogue or images

# Fetch from BC Bryophyte Guide/BC_Bryo_Database at https://docs.google.com/spreadsheets/d/1MG7C7GX1Tl2RO_vHuMwUo8quhzYZd_mElWRnPuNbpj8/edit
downloadGdrive("1MG7C7GX1Tl2RO_vHuMwUo8quhzYZd_mElWRnPuNbpj8", "tabular_data/BC_Bryo_Guide.csv", TRUE)

# Generate md pages for each taxon and Hugo partials
run_js("js/generate-pages.js")

blogdown::hugo_cmd()
