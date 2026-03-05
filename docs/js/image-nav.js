/* global MicroModal */

"use strict";

const triggerNodes = [...document.querySelectorAll("[data-micromodal-trigger]")];

const imageIndex = triggerNodes.map(node => {
    const id = node.getAttribute("data-micromodal-trigger");
    const target = document.getElementById(id);
    return {id, target};
});

imageIndex.forEach((rec, i) => {
    const leftButton = rec.target.querySelector(".imerss-image-left");
    if (i > 0) {
        leftButton.addEventListener("click", () => {
            MicroModal.close();
            MicroModal.show(imageIndex[i - 1].id);
        });
    } else {
        leftButton.style.display = "none";
    }
    const rightButton = rec.target.querySelector(".imerss-image-right");
    if (i < imageIndex.length - 1) {
        rightButton.addEventListener("click", () => {
            MicroModal.close();
            MicroModal.show(imageIndex[i + 1].id);
        });
    } else {
        rightButton.style.display = "none";
    }
});

