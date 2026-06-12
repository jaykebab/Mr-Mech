/**
 * MR. MECH — D2C ECOMMERCE SHOPPING CART ENGINE
 * Handles cart states, quantity math, smart bundle triggers, and LocalStorage.
 */

class D2CCartEngine {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('mr_mech_cart')) || [];
        this.catalog = {
            'rat-repellent': { id: 'rat-repellent', name: 'Rat Repellent Spray', price: 599, img: 'assets/rat_repellent_white.jpg', desc: 'Engine Bay Thermal Scent Shield' },
            'interior-cleaner': { id: 'interior-cleaner', name: 'Foaming Interior Cleaner', price: 499, img: 'assets/interior_cleaner_white.jpg', desc: 'Dirt-Lifting Cabin Micro-Foam' },
            'chain-cleaner': { id: 'chain-cleaner', name: 'Motorcycle Chain Cleaner & Lube', price: 399, img: 'assets/chain_cleaner_white.png', desc: 'Complete Chain Care Combo Pack' },
            'preservation-kit': { id: 'preservation-kit', name: 'Precision Preservation Kit', price: 1399, img: 'assets/hero_car.png', desc: 'Complete D2C Preservation Ecosystem' }
        };

        this.initDOM();
        this.setupListeners();
        this.renderCart();
    }

    initDOM() {
        this.overlay = document.querySelector('.cart-drawer-overlay');
        this.drawer = document.querySelector('.cart-drawer');
        this.closeBtn = document.querySelector('.cart-close-btn');
        this.toggleBtn = document.querySelector('.cart-toggle');
        this.badge = document.querySelector('.cart-badge');
        this.itemsList = document.querySelector('.cart-items-list');
        this.emptyState = document.querySelector('.cart-empty-state');
        this.totalVal = document.querySelector('.cart-total-value');
        this.checkoutBtn = document.querySelector('.btn-checkout');
        this.toast = document.querySelector('.toast-notification');
        this.toastMsg = document.querySelector('.toast-msg');
    }

    setupListeners() {
        // Toggle Cart Drawer
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCart();
            });
        }
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeCart());
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.closeCart();
            });
        }

        // Add to Cart Button delegation
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('.btn-add-cart')) {
                const button = e.target.closest('.btn-add-cart');
                const productId = button.dataset.productId;
                this.addItem(productId);
            }
        });

        // Sliding Direct Checkout modal actions
        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', () => this.triggerCheckout());
        }
    }

    openCart() {
        if (this.overlay) {
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCart() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    saveCart() {
        localStorage.setItem('mr_mech_cart', JSON.stringify(this.cart));
        this.renderCart();
    }

    showToast(message) {
        if (!this.toast) return;
        this.toastMsg.textContent = message;
        this.toast.classList.add('show');
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    addItem(productId) {
        const product = this.catalog[productId];
        if (!product) return;

        // Smart Bundle Check: If they add the preservation kit, we clear individual products
        if (productId === 'preservation-kit') {
            this.cart = this.cart.filter(item => 
                !['rat-repellent', 'interior-cleaner', 'chain-cleaner'].includes(item.id)
            );
        }

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }

        this.checkForAutoKitConsolidation();
        this.saveCart();
        this.openCart();
        this.showToast(`ADDED ${product.name.toUpperCase()} TO CART`);
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
    }

    changeQuantity(productId, delta) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            this.removeItem(productId);
        } else {
            this.saveCart();
        }
    }

    // SMART D2C ENGINE FEATURE: Auto-Kit Consolidation
    // If the user adds Rat Repellent, Interior Cleaner, and Chain Cleaner, we bundle them into the single discounted Kit (₹1,399)!
    checkForAutoKitConsolidation() {
        const hasRepellent = this.cart.some(item => item.id === 'rat-repellent');
        const hasInterior = this.cart.some(item => item.id === 'interior-cleaner');
        const hasChain = this.cart.some(item => item.id === 'chain-cleaner');

        if (hasRepellent && hasInterior && hasChain) {
            // Remove the individuals
            this.cart = this.cart.filter(item => 
                !['rat-repellent', 'interior-cleaner', 'chain-cleaner'].includes(item.id)
            );
            
            // Proactively add the Preservation Kit
            this.addItem('preservation-kit');
            this.showToast("AUTO-CONSOLIDATED INTO PRECISION PRESERVATION BUNDLE KIT (SAVE ₹98)");
        }
    }

    // Triggered by the Cart smart cross sell module inside cart footer
    upgradeToKit() {
        // Clear individuals
        this.cart = this.cart.filter(item => 
            !['rat-repellent', 'interior-cleaner', 'chain-cleaner'].includes(item.id)
        );
        this.cart.push({ ...this.catalog['preservation-kit'], quantity: 1 });
        this.saveCart();
        this.showToast("UPGRADED TO PRECISION PRESERVATION KIT");
    }

    calculateTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    calculateCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    renderCart() {
        const total = this.calculateTotal();
        const itemCount = this.calculateCount();

        // Update Nav Cart badge
        if (this.badge) {
            this.badge.textContent = itemCount;
            this.badge.style.display = itemCount > 0 ? 'flex' : 'none';
        }

        // Render Cart Items
        if (itemCount === 0) {
            this.itemsList.style.display = 'none';
            this.emptyState.style.display = 'block';
            this.totalVal.textContent = '₹0';
            if (this.checkoutBtn) this.checkoutBtn.disabled = true;
        } else {
            this.emptyState.style.display = 'none';
            this.itemsList.style.display = 'flex';
            if (this.checkoutBtn) this.checkoutBtn.disabled = false;
            
            // Build items list HTML
            let html = '';
            this.cart.forEach(item => {
                html += `
                    <div class="cart-item">
                        <div class="cart-item-img-box">
                            <img src="${item.img}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <span class="cart-item-name">${item.name}</span>
                            <span class="cart-item-desc">${item.desc}</span>
                            <div class="cart-item-action-row">
                                <div class="quantity-controller">
                                    <button class="qty-btn btn-minus" data-id="${item.id}">-</button>
                                    <span class="qty-val">${item.quantity}</span>
                                    <button class="qty-btn btn-plus" data-id="${item.id}">+</button>
                                </div>
                                <span class="cart-item-price">₹${item.price * item.quantity}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            // Smart D2C cross sell module inside cart footer
            // If they have some products but not all three, prompt "Complete your setup"
            const hasKit = this.cart.some(item => item.id === 'preservation-kit');
            if (!hasKit && this.cart.length > 0) {
                html += `
                    <div class="cart-cross-sell">
                        <div class="cross-sell-title">COMPLETE YOUR SETUP</div>
                        <div class="cross-sell-desc">Upgrade items in your cart to the full <b>Mr. Mech Precision Preservation Kit</b> and unlock the maximum protection standard for <b>₹1,399</b> (Save ₹98).</div>
                        <div class="cross-sell-action-box">
                            <div class="cross-sell-price">₹1,399 <span>₹1,497</span></div>
                            <button class="btn-cross-sell-add">UPGRADE NOW</button>
                        </div>
                    </div>
                `;
            }

            this.itemsList.innerHTML = html;
            this.totalVal.textContent = `₹${total}`;

            // Attach event listeners for dynamic controls within list
            this.itemsList.querySelectorAll('.btn-minus').forEach(btn => {
                btn.addEventListener('click', () => this.changeQuantity(btn.dataset.id, -1));
            });
            this.itemsList.querySelectorAll('.btn-plus').forEach(btn => {
                btn.addEventListener('click', () => this.changeQuantity(btn.dataset.id, 1));
            });
            const crossSellBtn = this.itemsList.querySelector('.btn-cross-sell-add');
            if (crossSellBtn) {
                crossSellBtn.addEventListener('click', () => this.upgradeToKit());
            }
        }
    }

    triggerCheckout() {
        this.showToast("INITIALIZING D2C NATIVE GATEWAY STRIPE/RAZORPAY...");
        setTimeout(() => {
            alert(`Proceeding to direct premium checkout for Mr. Mech preservation products!\n\nOrder Value: ₹${this.calculateTotal()}\nShipping: Standard free across India.\n\nThank you for choosing Mr. Mech!`);
            this.cart = [];
            this.saveCart();
            this.closeCart();
        }, 1200);
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    window.CartEngine = new D2CCartEngine();
});
