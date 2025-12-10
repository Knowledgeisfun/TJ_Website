/**
 * TJ Productions - Main Script
 * Handles loader, navigation, video/image modals, API form submissions, Intelligent Chat, and UI Polish.
 */

// --- SESSION ID GENERATOR ---
let sessionId = localStorage.getItem('chat_session_id');
if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chat_session_id', sessionId);
}
console.log("Chat Session ID:", sessionId);

// --- MODERN NOTIFICATION SYSTEM (Toasts) ---
function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transition-all duration-500 opacity-0 translate-y-[-20px] backdrop-blur-md border pointer-events-none`;
    
    if (type === 'success') {
        toast.classList.add('bg-green-900/90', 'border-green-500/50', 'text-green-100');
        toast.innerHTML = `<i class="fas fa-check-circle text-xl"></i> <span class="font-medium font-sans">${message}</span>`;
    } else if (type === 'error') {
        toast.classList.add('bg-red-900/90', 'border-red-500/50', 'text-red-100');
        toast.innerHTML = `<i class="fas fa-exclamation-circle text-xl"></i> <span class="font-medium font-sans">${message}</span>`;
    } else { // Info
        toast.classList.add('bg-brand-gray/95', 'border-brand-accent/50', 'text-brand-accent');
        toast.innerHTML = `<i class="fas fa-magic text-xl"></i> <span class="font-medium font-sans">${message}</span>`;
    }

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-[-20px]');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-20px]');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

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
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (!nav) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop > 50) {
        nav.classList.add('shadow-lg');
        nav.style.background = 'rgba(5, 5, 5, 0.95)';
    } else {
        nav.classList.remove('shadow-lg');
        nav.style.background = 'rgba(5, 5, 5, 0.8)';
    }

    if (scrollTop > lastScrollTop && scrollTop > 100) {
        nav.style.transform = 'translateY(-100%)';
    } else {
        nav.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// --- MODAL LOGIC (Images & Video) ---

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
        document.body.style.overflow = 'hidden'; 
    }
}

function closeModal() {
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

const videoModal = document.getElementById('video-modal');
const youtubePlayer = document.getElementById('youtube-player');

function openVideoModal(videoId, title, category) {
    if (videoModal && youtubePlayer) {
        youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        videoModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeVideoModal() {
    if (videoModal && youtubePlayer) {
        videoModal.classList.add('hidden');
        youtubePlayer.src = ""; 
        document.body.style.overflow = '';
    }
}

function attachSwipeClose(element, closeCallback) {
    if (!element) return;
    let touchStartY = 0;
    element.addEventListener('touchstart', (e) => { touchStartY = e.changedTouches[0].screenY; }, { passive: true });
    element.addEventListener('touchend', (e) => {
        if (e.changedTouches[0].screenY - touchStartY > 50) closeCallback();
    }, { passive: true });
}

attachSwipeClose(modal, closeModal);
attachSwipeClose(videoModal, closeVideoModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
    if (e.target === videoModal) closeVideoModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeVideoModal();
    }
});

window.openModal = openModal;
window.closeModal = closeModal;
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;

// --- Chatbot Logic ---
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const closeChat = document.getElementById('close-chat');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');

// Helper to set button state (Rotate & Swap Icon)
function setChatButtonState(isOpen) {
    if (chatToggle) {
        chatToggle.style.transition = 'transform 0.3s ease-in-out';
        if (isOpen) {
            chatToggle.style.transform = 'rotate(90deg)';
            chatToggle.innerHTML = '<i class="fas fa-times text-2xl"></i>';
        } else {
            chatToggle.style.transform = 'rotate(0deg)';
            chatToggle.innerHTML = '<i class="fas fa-comment-dots text-2xl"></i>';
        }
    }
}

// Reusable Open/Close Functions
function openChatBot() {
    if (chatWindow) {
        chatWindow.classList.remove('hidden');
        setTimeout(() => {
            chatWindow.classList.remove('scale-0', 'opacity-0');
            // Only auto-focus on desktop to prevent mobile keyboard jumping
            if(window.innerWidth > 768 && chatInput) chatInput.focus(); 
        }, 10);
        setChatButtonState(true);
    }
}

function closeChatBot() {
    if (chatWindow) {
        chatWindow.classList.add('scale-0', 'opacity-0');
        setTimeout(() => {
            chatWindow.classList.add('hidden');
        }, 300);
        setChatButtonState(false);
    }
}

// Toggle Listener
if (chatToggle && chatWindow) {
    chatToggle.addEventListener('click', () => {
        const isHidden = chatWindow.classList.contains('hidden');
        if (isHidden) openChatBot();
        else closeChatBot();
    });
}

// Close Button Listener
if (closeChat) {
    closeChat.addEventListener('click', closeChatBot);
}

// Enable Swipe Down on Header to Close (Native Mobile Feel)
if (chatWindow) {
    // Select the first child (the header bar)
    const chatHeader = chatWindow.firstElementChild;
    if (chatHeader) {
        attachSwipeClose(chatHeader, closeChatBot);
    }
}

// FIX: Ensure Mobile "Enter" Key submits the form
if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.handleChat(e);
        }
    });
}

// --- INTELLIGENT CHAT HANDLER ---
window.handleChat = async function(e) {
    if(e) e.preventDefault();
    const msg = chatInput.value.trim();
    if(!msg) return;

    const userDiv = document.createElement('div');
    userDiv.className = 'flex gap-2 justify-end';
    userDiv.innerHTML = `<div class="bg-brand-accent p-3 rounded-lg text-sm text-brand-dark font-semibold text-left">${msg}</div>`;
    chatMessages.appendChild(userDiv);
    
    chatInput.value = '';
    chatInput.disabled = true;
    chatInput.placeholder = "Thinking...";
    
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'flex gap-2';
    typingDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-xs font-bold text-black"><i class="fas fa-robot"></i></div>
        <div class="bg-white/10 p-3 rounded-lg text-sm text-gray-400 italic flex items-center gap-1">
            <span>Typing</span>
            <span class="animate-bounce">.</span>
            <span class="animate-bounce" style="animation-delay: 0.1s">.</span>
            <span class="animate-bounce" style="animation-delay: 0.2s">.</span>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, sessionId: sessionId })
        });
        
        const data = await response.json();
        let botText = data.reply;

        const indicator = document.getElementById('typing-indicator');
        if(indicator) indicator.remove();

        if (botText.includes('^^^JSON')) {
            try {
                const parts = botText.split('^^^JSON');
                const rawJson = parts[1].split('^^^')[0]; 
                const autoFillData = JSON.parse(rawJson);

                botText = parts[0]; 

                const form = document.getElementById('contactForm');
                if (form) {
                    if(autoFillData.fullName) form.querySelector('input[name="fullName"]').value = autoFillData.fullName;
                    
                    const serviceSelect = form.querySelector('select[name="serviceType"]');
                    const serviceVal = autoFillData.serviceType ? autoFillData.serviceType.toLowerCase() : "";
                    
                    if(serviceVal.includes('video') || serviceVal.includes('wedding')) serviceSelect.value = 'videography';
                    else if(serviceVal.includes('jewel')) serviceSelect.value = 'jewellery';
                    else if(serviceVal.includes('life') || serviceVal.includes('fashion')) serviceSelect.value = 'lifestyle';
                    else if(serviceVal.includes('anim')) serviceSelect.value = 'animation';
                    
                    if(autoFillData.message) form.querySelector('textarea[name="message"]').value = autoFillData.message;

                    setTimeout(() => {
                        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                        form.classList.add('ring-2', 'ring-brand-accent', 'transition-all', 'duration-500');
                        setTimeout(() => form.classList.remove('ring-2', 'ring-brand-accent'), 2000);
                        
                        showNotification("Draft ready! Check the form below.", "info");
                    }, 800);
                }
            } catch (jsonError) {
                console.error("Auto-fill parsing error:", jsonError);
            }
        }

        const aiDiv = document.createElement('div');
        aiDiv.className = 'flex gap-2';
        aiDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-xs font-bold text-black"><i class="fas fa-robot"></i></div>
            <div class="bg-white/10 p-3 rounded-lg text-sm text-gray-200 text-left">${botText}</div>
        `;
        chatMessages.appendChild(aiDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error('Chat Error:', error);
        
        const indicator = document.getElementById('typing-indicator');
        if(indicator) indicator.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'flex gap-2';
        errorDiv.innerHTML = `<div class="bg-red-900/50 p-3 rounded-lg text-sm text-red-200">System offline. Please try again.</div>`;
        chatMessages.appendChild(errorDiv);
    } finally {
        chatInput.disabled = false;
        chatInput.placeholder = "Ask about rates...";
        if(window.innerWidth > 768) chatInput.focus();
    }
};

// --- Contact Form Logic ---
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.setAttribute('novalidate', 'true');

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        if (!data.fullName || !data.email || !data.message) {
            showNotification('Please fill in all required fields.', 'error');
            
            if(!data.fullName) this.querySelector('[name="fullName"]').classList.add('border-red-500');
            if(!data.email) this.querySelector('[name="email"]').classList.add('border-red-500');
            if(!data.message) this.querySelector('[name="message"]').classList.add('border-red-500');
            
            setTimeout(() => {
                this.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));
            }, 2000);
            
            return;
        }

        const btn = this.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'SENDING...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();

            if(response.ok) {
                showNotification('Inquiry sent successfully! Talk to you soon.', 'success');
                this.reset();
            } else {
                showNotification('Submission failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Contact Form Error:', error);
            showNotification('Network error. Check your connection.', 'error');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}