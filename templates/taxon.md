---
title: {{taxon}}
url: /taxa/{{taxon}}
{{#insetPhoto1}}image: "../img/{{insetPhoto1}}"{{/insetPhoto1}}
categories:
  - {{phylum}}
---

<script defer src="../../js/micromodal.min.js"></script>
<link href="../../css/micromodal.css" rel="stylesheet">

<link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
<script defer src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
<script defer src="https://unpkg.com/papaparse@5.4.1/papaparse.min.js"></script>
<script defer src="../../js/records-map.js"></script>

<link href="../../css/style-taxon.css" rel="stylesheet">

<div class="container">
<div class="imerss-content hx-max-w-screen-xl">

<div class="info-panel">
 <div class="info-left">
  <div class="taxon-name">{{taxon}}</div>
  {{#phylum}}
   <div class="taxon-rank rank-phylum"><span class="taxon-rank-label">Phylum: </span><span class="taxon-rank-value">{{phylum}}</span></div>
  {{/phylum}}
  {{#order}}
   <div class="taxon-rank rank-order"><span class="taxon-rank-label">Order: </span><span class="taxon-rank-value">{{order}}</span></div>
  {{/order}}
  {{#family}}
   <div class="taxon-rank rank-family">
     <span class="taxon-rank-label">Family: </span>
     <span class="taxon-rank-value"><a href="/taxa/{{family}}">{{family}}</a></span>
   </div>
  {{/family}}
  {{#genus}}
   <div class="taxon-rank rank-genus">
     <span class="taxon-rank-label">Genus: </span>
     <span class="taxon-rank-value"><a href="/taxa/{{genus}}">{{genus}}</a></span>
   </div>
  {{/genus}}
  <div class="taxon-scientific"><span class="scientific-label">Scientific Name: </span>
<a href="https://www.gbif.org/species/{{gbifTaxonId}}">
<span class="scientific-name">{{taxon}} {{authority}}</span>
                <svg width="20" height="20">
                    <use href="#green-dot"/>
                </svg>
</a>
 </div>
</div>
 <div class="info-right">
<table>
{{#commonName}}
<tr><td class="info-label">Common Name</td><td class="info-value">{{commonName}}</td></tr>
{{/commonName}}
{{#frequency}}
<tr><td class="info-label">Frequency</td><td class="info-value">{{frequency}}</td></tr>
{{/frequency}}
</table>
 </div>
</div>

<div class="section-nav">
  <a href="#image-gallery">Image Gallery</a>
  {{#taxonLinksHeading}}
  <a href="#taxon-links">{{taxonLinksHeading}}</a>
  {{/taxonLinksHeading}}
  <a href="#distinguishing-features">Distinguishing Features</a>
  <a href="#similar-species">Similar Species</a>
  <a href="#habitats">Habitats</a>
  <a href="#associated-species">Associated Species</a>
  {{#leaf}}
  <a href="#distribution-map">Distribution Map</a>
  {{/leaf}}
  <a href="#relevant-literature">Relevant Literature</a>
</div>


<h2 id="image-gallery">Image Gallery
{{#plate}}
<div class="tab-microscope">
    <img alt="plate"
         data-micromodal-trigger="modal-plate-{{key}}"
         src="../../images/bryo guide microscope.png"/>
  </div>

{{> modal}}
{{/plate}}
</h2>

<div class="imerss-image-header">
  {{#photo1}}
  <div class="imerss-image-holder"
       data-micromodal-trigger="modal-plate-{{key}}"
       style="background-image: url(../../img/{{src}})">
    <div class="imerss-image-copy"> © {{meta}}</div>
    {{#iNat}}
      <a href="{{iNat}}" target="_blank" class="imerss-iNat-extern">iNaturalist<span class="external-link"></span></a>
    {{/iNat}}
  </div>
  {{> modal}}
  {{/photo1}}

  {{#photo2}}
  <div class="imerss-image-holder"
       data-micromodal-trigger="modal-plate-{{key}}"
       style="background-image: url(../../img/{{src}})">
    <div class="imerss-image-copy"> © {{meta}}</div>
    {{#iNat}}
      <a href="{{iNat}}" target="_blank" class="imerss-iNat-extern">iNaturalist<span class="external-link"></span></a>
    {{/iNat}}
  </div>
  {{> modal}}
  {{/photo2}}

  {{#photo3}}
  <div class="imerss-image-holder"
       data-micromodal-trigger="modal-plate-{{key}}"
       style="background-image: url(../../img/{{src}})">
    <div class="imerss-image-copy"> © {{meta}}</div>
    {{#iNat}}
      <a href="{{iNat}}" target="_blank" class="imerss-iNat-extern">iNaturalist<span class="external-link"></span></a>
    {{/iNat}}
  </div>
  {{> modal}}
  {{/photo3}}

  {{#photo4}}
  <div class="imerss-image-holder"
       data-micromodal-trigger="modal-plate-{{key}}"
       style="background-image: url(../../img/{{src}})">
    <div class="imerss-image-copy"> © {{meta}}</div>
    {{#iNat}}
      <a href="{{iNat}}" target="_blank" class="imerss-iNat-extern">iNaturalist<span class="external-link"></span></a>
    {{/iNat}}
  </div>
  {{> modal}}
  {{/photo4}}

  {{#photo5}}
  <div class="imerss-image-holder"
       data-micromodal-trigger="modal-plate-{{key}}"
       style="background-image: url(../../img/{{src}})">
    <div class="imerss-image-copy"> © {{meta}}</div>
    {{#iNat}}
      <a href="{{iNat}}" target="_blank" class="imerss-iNat-extern">iNaturalist<span class="external-link"></span></a>
    {{/iNat}}
  </div>
  {{> modal}}
  {{/photo5}}

  {{#photo6}}
  <div class="imerss-image-holder"
       data-micromodal-trigger="modal-plate-{{key}}"
       style="background-image: url(../../img/{{src}})">
    <div class="imerss-image-copy"> © {{meta}}</div>
    {{#iNat}}
      <a href="{{iNat}}" target="_blank" class="imerss-iNat-extern">iNaturalist<span class="external-link"></span></a>
    {{/iNat}}
  </div>
  {{> modal}}
  {{/photo6}}
</div>

{{#taxonLinks}}
<h2 id="taxon-links">{{taxonLinksHeading}}</h2>
<div class="taxon-links">
{{{taxonLinks}}}
</div>
{{/taxonLinks}}

<h2 id="distinguishing-features">Distinguishing Features</h2>

{{{distinguishingFeatures}}}

<h2 id="similar-species">Similar species</h2>

{{{similarSpecies}}}

<h2 id="habitat">Habitat</h2>

{{{habitat}}}

<h2 id="associated-species">Associated species</h2>

{{{associatedSpecies}}}

{{#leaf}}

 <h2 id="distribution-map">Distribution Map</h2>

 <div class="imerss-map-holder" id="imerss-map-holder">
 </div>

 <script type="module">
    imerss.makeRecordsMap("imerss-map-holder", "../../taxa_records/{{taxon}}.csv"); 
 </script>
{{/leaf}}

<div class="taxon-footer">
 <div class="taxon-authors"><b>Authors:</b> <span>{{authors}}</span></div>
 <div class="taxon-update"><b>Last updated:</b> <span>{{lastUpdated}}</span></div>
</div>

<h2 id="relevant-literature">Relevant Literature</h2>

<ul class="list-disc list-inside text-lg leading-relaxed">
<li class="mb-2">
    Godfrey, J.D. (1977). 
    <a href="https://open.library.ubc.ca/soa/cIRcle/collections/ubctheses/831/items/1.0094118" target="_blank" rel="noopener noreferrer" class="text-green-700 hover:underline">
        <em>Hepaticae and Anthocerotae of southwestern British Columbia</em>
    </a>. [Doctoral dissertation, University of British Columbia]. UBC cIRcle.
</li>
<li class="mb-2">
    Hong, W. S. (2007). Scapania. In Flora of North America Editorial Committee (Eds.), 
    <a href="https://www.mobot.org/plantscience/BFNA/V3/Scapania_R2.pdf" target="_blank" rel="noopener noreferrer" class="text-green-700 hover:underline">
        <em>Flora of North America North of Mexico</em> (Vol. 3)
    </a>. Oxford University Press.
</li>
<li class="mb-2">
    Wagner, D. H. (2013). 
    <a href="https://herbarium.science.oregonstate.edu/wagner/liverworts/scaund.htm" target="_blank" rel="noopener noreferrer" class="text-green-700 hover:underline">
        <em>Guide to the liverworts of Oregon: Scapania undulata</em>
    </a>. Oregon State University Herbarium.
</li>
</ul>
</div>
</div>

<script type="module">
  MicroModal.init();
  const iNatLinks = [...document.querySelectorAll(".imerss-iNat-extern")];
  iNatLinks.forEach(link => link.addEventListener("click", e => e.stopPropagation()));
</script>
