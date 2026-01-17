"use strict";

const qsa = sel => [...document.querySelectorAll(sel)];
const qs = sel => document.querySelector(sel);

document.addEventListener("DOMContentLoaded", () => {
    // Toggle click for top-level phylum dropdowns
    qsa(".dropdown-button").forEach((button) => {
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            // Close others
            qsa(".dropdown-button.active").forEach((btn) => {
                if (btn !== button) {
                    btn.classList.remove("active");
                }
            });
            // Toggle current
            button.classList.toggle("active");
            window.dropdownPortal.hideAllMenus();
        });
    });

    // Close when clicking outside
    document.addEventListener("click", () => {
        qsa(".dropdown-button.active").forEach((btn) => {
            btn.classList.remove("active");
            window.dropdownPortal.hideAllMenus();
        });
    });
});

class DropdownPortal {
    constructor() {
        this.portalContainer = document.getElementById("dropdown-portal");
        this.activeMenus = new Map(); // Track active menus and their original parents
        this.init();
    }
    init() {
        // Initialize all dropdown items recursively
        const menus = qs(".navbar-items").querySelectorAll(".dropdown-menu");
        [...menus].forEach(menu => this.initialiseDropdownMenu(menu));

    }

    initialiseDropdownMenu(menu) {
        const items = [...menu.children].filter(child => child.matches(".dropdown-item"));
        [...items].forEach(item => {
            const nestedMenu = item.querySelector(".dropdown-menu");
            if (nestedMenu) {
                item.addEventListener("mouseenter", () => {
                    this.showSubmenu(menu, item, nestedMenu);
                });
            }
        });
    }

    hideSubmenu(parentMenu, old) {
        old.classList.remove("show");
        const oldInner = this.activeMenus.get(old);
        if (oldInner) {
            this.hideSubmenu(old, oldInner);
        }
        this.activeMenus.delete(parentMenu);
    }

    showSubmenu(parentMenu, triggerItem, menu) {
        const old = this.activeMenus.get(parentMenu);
        if (old) {
            if (old === menu) {
                return;
            } else {
                this.hideSubmenu(parentMenu, old);
            }
        }
        // Move submenu to portal and make it active
        this.portalContainer.appendChild(menu);
        menu.classList.add("show");

        // Position the submenu
        this.positionSubmenu(menu, triggerItem);

        this.activeMenus.set(parentMenu, menu);
    }

    hideAllMenus() {
        // Return all active menus to their original locations
        this.activeMenus.forEach((menu) => {
            menu.classList.remove("show");
        });

        this.activeMenus.clear();
    }

    positionSubmenu(submenu, triggerItem) {
        const triggerRect = triggerItem.getBoundingClientRect();
        const submenuRect = submenu.getBoundingClientRect();

        let left = triggerRect.right;
        let top = triggerRect.top;

        // Viewport boundary checks
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Check if submenu would go off right edge
        if (left + submenuRect.width > viewportWidth - 10) {
            left = triggerRect.left - submenuRect.width - 5;
        }

        // Check if submenu would go off bottom edge
        if (top + submenuRect.height > viewportHeight - 10) {
            top = viewportHeight - submenuRect.height - 10;
        }

        // Ensure it doesn"t go off top edge
        if (top < 10) {
            top = 10;
        }

        // Only set position styles - these are necessary for positioning
        submenu.style.left = `${left}px`;
        submenu.style.top = `${top}px`;
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.dropdownPortal = new DropdownPortal();
});
