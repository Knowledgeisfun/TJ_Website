/**
 * TJ Productions - Main Script
 * Handles loader, navigation, modal, and API form submissions.
 */

// --- Loader Logic ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }, 1000); 
    }
});

// --- Mobile Menu Toggle ---
const btn = document.getElementById('mobile-menu-btn');
const menu = document.getElementById('mobile-menu');

if (btn && menu) {
    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });
}

// --- Sticky Navbar Effect ---
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) {
        if (window.scrollY > 50) {
            nav.classList.add('shadow-lg');
            nav.style.background = 'rgba(5, 5, 5, 0.95)';
        } else {
            nav.classList.remove('shadow-lg');
            nav.style.background = 'rgba(5, 5, 5, 0.8)';
        }
    }
});

// --- Image Modal Logic ---
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalCat = document.getElementById('modal-cat');

function openModal(src, title, category) {
    if (modal && modalImg && modalTitle && modalCat) {
        modalImg.src = src;
        modalTitle.innerText = title;
        modalCat.innerText = category;
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Make functions globally available
window.openModal = openModal;
window.closeModal = closeModal;

// --- Chatbot Logic ---
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const closeChat = document.getElementById('close-chat');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');

if (chatToggle && chatWindow) {
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.remove('hidden');
        setTimeout(() => {
            chatWindow.classList.remove('scale-90', 'opacity-0');
        }, 10);
    });
}

if (closeChat && chatWindow) {
    closeChat.addEventListener('click', () => {
        chatWindow.classList.add('scale-90', 'opacity-0');
        setTimeout(() => {
            chatWindow.classList.add('hidden');
        }, 300);
    });
}

// Handle Chat Submission
window.handleChat = async function(e) {
    e.preventDefault();
    const msg = chatInput.value;
    if(!msg) return;

    // 1. Add User Message to UI
    const userDiv = document.createElement('div');
    userDiv.className = 'flex gap-2 justify-end';
    userDiv.innerHTML = `<div class="bg-brand-accent p-3 rounded-lg text-sm text-brand-dark font-semibold">${msg}</div>`;
    chatMessages.appendChild(userDiv);
    
    // Clear input and scroll
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 2. Send to Backend
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        
        const data = await response.json();

        // 3. Add Bot Reply to UI
        const aiDiv = document.createElement('div');
        aiDiv.className = 'flex gap-2';
        aiDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-xs font-bold text-black"><i class="fas fa-robot"></i></div>
            <div class="bg-white/10 p-3 rounded-lg text-sm text-gray-200">${data.reply}</div>
        `;
        chatMessages.appendChild(aiDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error('Chat Error:', error);
        // Fallback error message in UI
        const errorDiv = document.createElement('div');
        errorDiv.className = 'flex gap-2';
        errorDiv.innerHTML = `<div class="bg-red-900/50 p-3 rounded-lg text-sm text-red-200">System offline. Please try again.</div>`;
        chatMessages.appendChild(errorDiv);
    }
};

// --- Contact Form Logic ---
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const btn = this.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'SENDING...';
        btn.disabled = true;
        
        // Convert FormData to JSON object
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();

            if(response.ok) {
                alert('Thanks! ' + result.message);
                this.reset();
            } else {
                alert('Submission failed. Please try again.');
            }
        } catch (error) {
            console.error('Contact Form Error:', error);
            alert('Server error. Please check your connection.');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}