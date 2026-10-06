// ==========================================
// ⚙ CONFIGURATION OBJECT
// ==========================================
const CONFIG = {
    centerName: "Kamal Digital Seva",
    address: "Hojai, Gitamandir, PNB opposite, 1st floor",
    
    // 🌐 Live Updates Fetch URL
    webAppUrl: "https://script.google.com/macros/s/AKfycbxAy2z0MJn19pK7bQQn3T99Mn2hut-q_4nLmRF3Tv-t4pw5ZzuTN4gg1l0vPr_11lU/exec",
    
    // 📤 Customer Leads Save URL (Updated)
    saveCustomerUrl: "https://script.google.com/macros/s/AKfycbzzIVjuPHKfe5zTxQRC-zi_8HwVFIVTGJ0YThRXFc6ejm6QRwmTgB47-BPuGA_fFfF1Pg/exec",

    // 🔒 Security Token
    secretToken: "KamalSeva2026SecurePasskey99"
};

let latestSheetData = [];
let currentTargetUrl = "";
let currentSchemeName = "";

// ==========================================
// 📱 UI INITIALIZATION & MENU DRAWER LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const nameElem = document.getElementById('ui-center-name');
    if (nameElem) nameElem.innerText = CONFIG.centerName;

    const openBtn = document.getElementById('openDrawerBtn');
    const closeBtn = document.getElementById('closeDrawerBtn');
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('drawerOverlay');

    if (openBtn && drawer && overlay) {
        openBtn.addEventListener('click', () => {
            drawer.classList.add('open');
            overlay.classList.add('active');
        });

        closeBtn.addEventListener('click', () => {
            drawer.classList.remove('open');
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', () => {
            drawer.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    const bellBtn = document.getElementById('bellIconBtn');
    if (bellBtn) {
        bellBtn.addEventListener('click', markNotificationsAsRead);
    }

    initAutoSlider();
    createApplyModalHTML();
    fetchLiveSheetUpdates("Sheet1"); 
});

// ==========================================
// 🖼️ IMAGE AUTO-SLIDER LOGIC
// ==========================================
function initAutoSlider() {
    const wrapper = document.querySelector('.slider-wrapper');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dotsContainer = document.querySelector('.slider-dots');
    const sliderContainer = document.querySelector('.slider-container');

    if (!wrapper || slides.length === 0) return;

    let currentIndex = 0;
    let slideInterval;
    const totalSlides = slides.length;

    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
    }

    const dots = document.querySelectorAll('.dot');

    function updateSlider() {
        wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        updateSlider();
        resetTimer();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateSlider();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateSlider();
    }

    function startTimer() {
        slideInterval = setInterval(nextSlide, 4000);
    }

    function resetTimer() {
        clearInterval(slideInterval);
        startTimer();
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetTimer();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetTimer();
        });
    }

    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
        sliderContainer.addEventListener('mouseleave', startTimer);
    }

    startTimer();
}

// ==========================================
// 📊 DYNAMIC GOOGLE SHEET DATA LOADER
// ==========================================
async function fetchLiveSheetUpdates(tabName = "Sheet1") {
    const tbody = document.getElementById('live-data-tbody');
    
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #64748b;">⏳ Loading live updates...</td></tr>';
    }

    const endpoint = `${CONFIG.webAppUrl}?tab=${encodeURIComponent(tabName)}&token=${encodeURIComponent(CONFIG.secretToken)}`;

    try {
        const res = await fetch(endpoint);
        
        if (!res.ok) {
            throw new Error(`HTTP Error Status: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.status === "error") {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#e11d48; padding:15px;">🔒 Security Error: ${data.message}</td></tr>`;
            }
            return;
        }

        if (!Array.isArray(data) || data.length === 0) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px;">No active updates found.</td></tr>';
            }
            return;
        }

        latestSheetData = data;
        checkUnreadNotifications(data);

        if (tbody) {
            tbody.innerHTML = '';
            data.forEach(item => {
                const title = item.schemename || '';
                const category = item.category || '';
                const deadline = item.lastdate || '';
                let url = item.link || '';

                let actionHtml = '—';
                if (url && url !== '#' && url.trim() !== '') {
                    const safeTitle = title.replace(/'/g, "\\'");
                    const safeUrl = url.replace(/'/g, "\\'");
                    actionHtml = `<button type="button" onclick="openApplyModal('${safeTitle}', '${safeUrl}')" class="btn-action" style="border:none; cursor:pointer;">Apply Now</button>`;
                }

                if (title) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${title}</strong></td>
                        <td>${category}</td>
                        <td><span class="badge-deadline">${deadline}</span></td>
                        <td>${actionHtml}</td>
                    `;
                    tbody.appendChild(tr);
                }
            });
        }

    } catch (err) {
        console.error("Sheet Sync Error:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#e11d48; padding:15px;">Error: ${err.message}</td></tr>`;
        }
    }
}

// ==========================================
// 📝 CONFIRMATION MODAL & GUIDELINES LOGIC
// ==========================================
function createApplyModalHTML() {
    if (document.getElementById('applyModalOverlay')) return;

    const modalHTML = `
    <div class="modal-overlay" id="applyModalOverlay">
        <div class="modal-card" id="modalCardBody">
            <div id="modalFormContent">
                <div class="modal-header">
                    <h4 class="modal-title" id="modalSchemeTitle">Application Confirmation</h4>
                    <button type="button" class="close-modal-btn" id="closeApplyModalBtn">&times;</button>
                </div>

                <div class="guidelines-box">
                    <h5>📋 Application Guidelines:</h5>
                    <ul>
                        <li>Please verify all your details carefully before submitting.</li>
                        <li>Keep all required documents ready.</li>
                        <li>Provide an active mobile / WhatsApp number for communication.</li>
                    </ul>
                </div>

                <form id="applyConfirmationForm" class="apply-form">
                    <div class="form-group">
                        <label for="applicantName">Full Name *</label>
                        <input type="text" id="applicantName" placeholder="Enter your full name" required>
                    </div>

                    <div class="form-group">
                        <label for="applicantPhone">Phone Number *</label>
                        <input type="tel" id="applicantPhone" placeholder="10-digit mobile number" pattern="[0-9]{10}" required>
                    </div>

                    <div class="form-group">
                        <label for="applicantAddress">Full Address *</label>
                        <textarea id="applicantAddress" rows="2" placeholder="Village / Town, PIN Code, District" required></textarea>
                    </div>

                    <div class="form-group">
                        <label for="applicantDescription">Description / Extra Details (Optional)</label>
                        <textarea id="applicantDescription" rows="2" placeholder="Enter any additional details or notes..."></textarea>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn-cancel-modal" id="cancelApplyModalBtn">Cancel</button>
                        <button type="submit" class="btn-submit-apply" id="submitApplyBtn">Submit Application</button>
                    </div>
                </form>
            </div>

            <div id="modalSuccessContent" style="display: none; text-align: center; padding: 20px 10px;">
                <div style="font-size: 3.5rem; color: #16a34a; margin-bottom: 10px;">✅</div>
                <h3 style="color: #0f172a; margin-bottom: 10px; font-weight: 700;">Successfully Applied!</h3>
                <p style="color: #334155; font-size: 1rem; line-height: 1.5; margin-bottom: 20px;">
                    You have successfully applied through our center. We will contact you shortly.
                </p>
                <button type="button" class="btn-submit-apply" id="closeSuccessBtn" style="width: 100%;">OK / Close</button>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('closeApplyModalBtn').addEventListener('click', closeApplyModal);
    document.getElementById('cancelApplyModalBtn').addEventListener('click', closeApplyModal);
    document.getElementById('closeSuccessBtn').addEventListener('click', closeApplyModal);
    
    document.getElementById('applyModalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'applyModalOverlay') closeApplyModal();
    });

    document.getElementById('applyConfirmationForm').addEventListener('submit', handleApplyFormSubmit);
}

function openApplyModal(schemeTitle, targetUrl) {
    currentSchemeName = schemeTitle;
    currentTargetUrl = targetUrl;

    const modalOverlay = document.getElementById('applyModalOverlay');
    const titleElem = document.getElementById('modalSchemeTitle');

    if (titleElem) titleElem.innerText = schemeTitle || "Application Confirmation";

    const form = document.getElementById('applyConfirmationForm');
    if (form) form.reset();

    const formContent = document.getElementById('modalFormContent');
    const successContent = document.getElementById('modalSuccessContent');
    if (formContent) formContent.style.display = 'block';
    if (successContent) successContent.style.display = 'none';

    if (modalOverlay) modalOverlay.classList.add('active');
}

function closeApplyModal() {
    const modalOverlay = document.getElementById('applyModalOverlay');
    if (modalOverlay) modalOverlay.classList.remove('active');
}

// ==========================================
// 📤 SECURED FORM SUBMISSION LOGIC
// ==========================================
async function handleApplyFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('applicantName').value.trim();
    const phone = document.getElementById('applicantPhone').value.trim();
    const address = document.getElementById('applicantAddress').value.trim();
    const description = document.getElementById('applicantDescription').value.trim();

    if (!name || !phone || !address) {
        alert("Please fill in all required fields (Name, Phone, Address).");
        return;
    }

    if (phone.length !== 10) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
    }

    const submitBtn = document.getElementById('submitApplyBtn');
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Saving Data...";
    submitBtn.disabled = true;

    // LocalStorage Record
    const applicationRecord = {
        scheme: currentSchemeName,
        applicantName: name,
        phone: phone,
        address: address,
        description: description || "N/A",
        date: new Date().toLocaleString()
    };

    let userApplications = JSON.parse(localStorage.getItem('myApplications') || '[]');
    userApplications.push(applicationRecord);
    localStorage.setItem('myApplications', JSON.stringify(userApplications));

    // 🔒 Secured Submission with Token to Customer URL
    if (CONFIG.saveCustomerUrl) {
        try {
            const formData = new URLSearchParams();
            formData.append('scheme', currentSchemeName);
            formData.append('applicantName', name);
            formData.append('phone', phone);
            formData.append('address', address);
            formData.append('description', description || "N/A");
            formData.append('secretToken', CONFIG.secretToken);

            await fetch(CONFIG.saveCustomerUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });
        } catch (err) {
            console.error('Sheet Data Save Error:', err);
        }
    }

    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;

    document.getElementById('modalFormContent').style.display = 'none';
    document.getElementById('modalSuccessContent').style.display = 'block';
}

// ==========================================
// 🔔 NOTIFICATION SYSTEM
// ==========================================
function checkUnreadNotifications(data) {
    const badge = document.getElementById('bell-badge');
    if (!badge) return;

    const seenTitles = JSON.parse(localStorage.getItem('seenUpdateTitles') || '[]');

    const unreadItems = data.filter(item => {
        const title = item.schemename ? item.schemename.trim() : '';
        return title !== '' && !seenTitles.includes(title);
    });

    if (unreadItems.length > 0) {
        badge.innerText = unreadItems.length > 9 ? '9+' : unreadItems.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function markNotificationsAsRead() {
    const badge = document.getElementById('bell-badge');

    if (latestSheetData.length > 0) {
        const currentTitles = latestSheetData
            .map(item => item.schemename ? item.schemename.trim() : '')
            .filter(Boolean);

        localStorage.setItem('seenUpdateTitles', JSON.stringify(currentTitles));
    }

    if (badge) {
        badge.style.display = 'none';
    }

    const tbody = document.getElementById('live-data-tbody');
    if (tbody) {
        tbody.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.location.href = 'updates.html';
    }
}
