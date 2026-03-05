"use strict";

// noinspection ES6ConvertVarToLetConst
var imerss = imerss || {};

// Javascript to handle the lightbox popup
imerss.openKeyImage = function (target) {
    const modal = document.getElementById("imerss-key-imageModal");

    const modalImg = modal.querySelector(".lightbox-content");
    const captionText = modal.querySelector(".caption");

    modal.style.display = "block";
    const src = target.getAttribute("href");
    const altText = target.innerText;
    modalImg.src = src;
    captionText.innerHTML = altText;
    return false;
};

imerss.closeKeyImage = function () {
    const modal = document.getElementById("imerss-key-imageModal");
    modal.style.display = "none";
};

// Close modal if user clicks outside the image
window.onclick = function (event) {
    const modal = document.getElementById("imerss-key-imageModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};
