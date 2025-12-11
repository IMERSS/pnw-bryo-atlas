source("R/utils.R")

# Run this script to authenticate with the Google Cloud API 
# and access taxon data from the shared Google Sheet,'BC_Bryo_Database'

library(googledrive)

# Fetch from BC Bryophyte Guide/BC_Bryo_Guide
downloadGdrive("1MG7C7GX1Tl2RO_vHuMwUo8quhzYZd_mElWRnPuNbpj8", "tabular_data/BC_Bryo_Guide.csv", TRUE)
