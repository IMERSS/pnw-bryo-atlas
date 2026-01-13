library(googledrive)

source("R/utils.R")

# A minimal build file which just refetches any content from the spreadsheet and rebuilds the site
# assuming there have been no changes in catalogue or images

# Fetch from BC Bryophyte Guide/BC_Bryo_Database at https://docs.google.com/spreadsheets/d/1MG7C7GX1Tl2RO_vHuMwUo8quhzYZd_mElWRnPuNbpj8/edit
downloadGdrive("1MG7C7GX1Tl2RO_vHuMwUo8quhzYZd_mElWRnPuNbpj8", "tabular_data/BC_Bryo_Guide.csv", TRUE)

# Fetch from Keys at https://drive.google.com/drive/folders/1bhfv1nTHFP69qpzaoa6W3NK1-gHcvniB
downloadGdriveFolder("1bhfv1nTHFP69qpzaoa6W3NK1-gHcvniB", "tabular_data/Keys", skip_if_exists = FALSE)

moveKeyImages <- function (src, dst) {
  dirs <- list.dirs(src, full.names = TRUE, recursive = FALSE)
  
  dir.create(dst, recursive = TRUE, showWarnings = FALSE)
  
  targets <- file.path(dst, basename(dirs))
  
  message(paste("Moving", dirs, "->", targets, collapse = "\n"))
  
  # remove any pre-existing destination directories
  unlink(targets, recursive = TRUE, force = TRUE)
  
  # now the renames will succeed
  file.rename(dirs, targets)
}

moveKeyImages("tabular_data/Keys/", "static/keyImages")

# Generate md pages for each taxon and Hugo partials
run_js("js/generate-pages.js")

blogdown::hugo_cmd()
