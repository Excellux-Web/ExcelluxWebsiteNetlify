/* ========================================= */
/* cb.js - Scratch and Win Logic (Final)     */
/* ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const formModal = document.getElementById('form-modal');
    const cashbackForm = document.getElementById('cashback-form');
    const scratchContainer = document.getElementById('scratchContainer');
    const prizeAmountDisplay = document.getElementById('prizeAmount');
    const scratchCanvas = document.getElementById('scratchCanvas');
    const thankyouOverlay = document.getElementById('thankyou-overlay');
    const collectionDateSpan = document.getElementById('collectionDate');

    // Canvas/Scratch variables
    const ctx = scratchCanvas.getContext('2d');
    let isScratching = false;
    let scratchPercentage = 0;
    let isFormSubmitted = false;

    // 1. Show the modal immediately upon page load
    formModal.style.display = 'flex';

    // --- 2. Cashback Logic (New Rules) ---
    function calculateCashback(amount) {
        amount = Number(amount);
        let prizeText;

        if (amount < 5000) {
            prizeText = "BETTER LUCK NEXT TIME";
        } else {
            // Cashback: 1% to 1.5% of Invoice Value, Max 500
            const minPercent = 0.01;
            const maxPercent = 0.015;
            
            const randomPercent = Math.random() * (maxPercent - minPercent) + minPercent;
            let cashback = Math.floor(amount * randomPercent); 

            // Clamp between min (50) and max (500)
            cashback = Math.min(Math.max(cashback, 50), 500);

            prizeText = `₹${cashback} CASHBACK`;
        }
        return prizeText;
    }

    // --- 3. Form Submission ---
    cashbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(cashbackForm);
        const invoiceAmount = formData.get('amount');
        const mobileNumber = formData.get('mobile');

        // Simple Mobile Number Validation (10 digits)
        const mobilePattern = /^\d{10}$/;
        if (!mobilePattern.test(mobileNumber)) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }

        // Calculate the prize text
        const prizeResult = calculateCashback(invoiceAmount);
        
        // Append the result to form data for Netlify logging
        formData.append('prize-result', prizeResult);
        
        // Netlify Submission
        try {
            const response = await fetch(cashbackForm.action, {
                method: 'POST',
                body: new URLSearchParams(formData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.ok) {
                isFormSubmitted = true;
                formModal.style.display = 'none';
                
                // Set the determined prize before revealing the scratch card
                prizeAmountDisplay.textContent = prizeResult;
                
                // Initialize and show the scratch card
                initScratchCard();
                scratchContainer.classList.remove('hidden');

            } else {
                alert("Submission failed. Please try again.");
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert("Network error.");
        }
    });
    
    // --- 4. Scratch Card Initialization ---
    function initScratchCard() {
        // Set dimensions
        const container = document.getElementById('scratchContainer');
        scratchCanvas.width = container.offsetWidth;
        scratchCanvas.height = container.offsetHeight;
        
        // Reset scratch state
        scratchPercentage = 0;
        scratchCanvas.style.opacity = '1';
        scratchCanvas.style.transition = 'none';

        // Draw scratch layer
        const gradient = ctx.createLinearGradient(0, 0, scratchCanvas.width, scratchCanvas.height);
        gradient.addColorStop(0, '#3a3a3a');
        gradient.addColorStop(0.5, '#4a4a4a');
        gradient.addColorStop(1, '#3a3a3a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);

        // Add 'Excellux' pattern
        ctx.fillStyle = '#555';
        ctx.font = '20px ' + (ctx.font.includes('serif') ? 'Playfair Display' : 'Inter') + ' bold';
        ctx.textAlign = 'center';
        for(let i = 0; i < scratchCanvas.height; i += 45) {
            for(let j = 0; j < scratchCanvas.width; j += 100) {
                ctx.fillText('EXCELLUX', j + 50, i + 25);
            }
        }
    }

    // --- 5. Scratch Functionality ---
    const scratch = (x, y) => {
        if (!isFormSubmitted) return; // Prevent scratching before submission

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, 2 * Math.PI);
        ctx.fill();

        // Vibration effect (if supported)
        if ("vibrate" in navigator) {
            navigator.vibrate(10); 
        }

        // Check if finished
        const imageData = ctx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
        let transparent = 0;
        for(let i = 3; i < imageData.data.length; i += 4) {
            if(imageData.data[i] === 0) transparent++;
        }
        scratchPercentage = (transparent / (imageData.data.length / 4)) * 100;

        if(scratchPercentage > 60) { // If 60% of the card is scratched
            scratchCanvas.style.opacity = '0';
            scratchCanvas.style.transition = 'opacity 1.5s';
            
            // Trigger Thank You Screen Fade
            setTimeout(showThankYouScreen, 1500); // Wait for scratch fade to complete
        }
    };

    // --- Mouse/Touch Event Handlers ---
    scratchCanvas.addEventListener('mousedown', () => isScratching = true);
    scratchCanvas.addEventListener('mouseup', () => isScratching = false);
    scratchCanvas.addEventListener('mousemove', (e) => {
        if(isScratching) {
            const rect = scratchCanvas.getBoundingClientRect();
            scratch(e.clientX - rect.left, e.clientY - rect.top);
        }
    });
    scratchCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isScratching = true;
    });
    scratchCanvas.addEventListener('touchend', () => isScratching = false);
    scratchCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if(isScratching) {
            const rect = scratchCanvas.getBoundingClientRect();
            const touch = e.touches[0];
            scratch(touch.clientX - rect.left, touch.clientY - rect.top);
        }
    });

    // --- 6. Thank You Screen Logic ---
    function showThankYouScreen() {
        // Calculate collection date (Today + 3 Days)
        const date = new Date();
        date.setDate(date.getDate() + 3);

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        collectionDateSpan.textContent = date.toLocaleDateString('en-US', options);

        // Fade in the Thank You screen
        thankyouOverlay.classList.remove('hidden');
        setTimeout(() => {
            thankyouOverlay.style.opacity = '1';
        }, 10);
    }
});