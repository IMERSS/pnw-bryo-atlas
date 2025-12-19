library(tidyverse)
library(googledrive)

source("R/utils.R")

# BC Bryophyte Guide at https://drive.google.com/drive/folders/1vNK76M7G6FTB22KxV21eYycwySg-ZAb1

# Fetch from BC Bryophyte Guide/Credentials/pnw-bryo-atlas-e1fb9a5765ea.json
downloadGdrive("1eu0reFz6cBM3pkfOaqoEnd2lmKLWlGEd", "pnw-bryo-atlas-e1fb9a5765ea.json")

# Fetch from BC Bryophyte Guide/Catalogues/GBIF-0057102-251120083545085.csv
downloadGdrive("1GEyp3QXI2ZUFfHWK6C0RCXVRowEuMLz4", "tabular_data/GBIF-catalogue.csv")

# Fetch from BC Bryophyte Guide/BC_Bryo_Guide
downloadGdrive("1MG7C7GX1Tl2RO_vHuMwUo8quhzYZd_mElWRnPuNbpj8", "tabular_data/BC_Bryo_Guide.csv", TRUE)

sr_time <- Sys.time()
# Advice from https://discourse.gbif.org/t/problem-parsing-large-occurrence-downloads/2570
rawGbif <- readr::read_tsv("tabular_data/GBIF-catalogue.csv", quote="", col_types = cols(.default = "c"))
elapsed <- round(as.numeric(difftime(Sys.time(), sr_time, units = "secs")), 2)
message(sprintf("Read %d lines in %.2f s", nrow(rawGbif), elapsed))

#gbif <- rawGbif %>% select(-all_of(c("depth", "depthAccuracy", "occurrenceStatus", "stateProvince", "countryCode", "verbatimScientificName",
#                                     "mediaType", "issue")))

gbif <- rawGbif %>% mutate(date = as.Date(substr(eventDate, 1, 10)))

gbif <- gbif %>% select(all_of(c("gbifID", "species", "basisOfRecord",
                                 "date", "year", "decimalLatitude", "decimalLongitude"))) %>%
                 drop_na(year, decimalLatitude, decimalLongitude)

gbif$basisOfRecord <- dplyr::recode(
  gbif$basisOfRecord,
  PRESERVED_SPECIMEN = "Herbarium record",
  HUMAN_OBSERVATION = "iNat record",
  .default = gbif$basisOfRecord
)

taxa <- read.csv("tabular_data/BC_Bryo_Guide.csv") %>%
  mutate_all(~replace_na(as.character(.), ""))

# Create the output folder if it doesn't exist
if (!dir.exists("static/taxa_records")) {
  dir.create("static/taxa_records")
}

start_time <- Sys.time()

# Iterate over each row in taxa
for (i in seq_len(nrow(taxa))) {
  taxon_name <- taxa$taxon[i]

  # Filter rawGbif for matching scientificName
  subset_df <- gbif %>% filter(species == taxon_name)

  file_path <- file.path("static/taxa_records", paste0(taxon_name, ".csv"))
  # Write CSV
  write.csv(subset_df, file_path, row.names = FALSE, na = "")
  message(sprintf("wrote %d lines to file %s", nrow(subset_df), file_path))
}

end_time <- Sys.time()
elapsed <- round(as.numeric(difftime(end_time, start_time, units = "secs")), 2)

message(sprintf("Wrote %d files in %.2f s", nrow(taxa), elapsed))
