const portfolioImages = [
    'https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg',
    'https://images.pexels.com/photos/1319461/pexels-photo-1319461.jpeg',
    'https://images.pexels.com/photos/1570807/pexels-photo-1570807.jpeg',
    'https://images.pexels.com/photos/1453006/pexels-photo-1453006.jpeg',
    'https://images.pexels.com/photos/1804429/pexels-photo-1804429.jpeg',
    'https://images.pexels.com/photos/2076930/pexels-photo-2076930.jpeg',
    'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg',
    'https://images.pexels.com/photos/2809652/pexels-photo-2809652.jpeg'
];

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const portfolioGrid = document.querySelector('#portfolio .grid');
    
    portfolioImages.forEach(imageUrl => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `<img src="${imageUrl}" alt="Portfolio" class="w-full h-64 object-cover rounded-lg">`;
        portfolioGrid.appendChild(div);
    });

    initializeAuth();
    initializeBookingForm();
    
    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector('nav button');
    const mobileMenu = document.querySelector('nav .md\\:flex');
    
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
});

function initializeAuth() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const authForms = document.getElementById('authForms');
    const bookingFormContainer = document.getElementById('bookingFormContainer');
    const logoutBtn = document.getElementById('logoutBtn');

    // Show register form
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    // Show login form
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Login form submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                showNotification('Login realizado com sucesso!');
                authForms.classList.add('hidden');
                bookingFormContainer.classList.remove('hidden');
                logoutBtn.classList.remove('hidden');
            } else {
                showNotification(data.message || 'Erro no login', true);
            }
        } catch (error) {
            showNotification('Erro na conexão com o servidor', true);
        }
    });

    // Register form submit
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();

        try {
            const res = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                showNotification('Cadastro realizado com sucesso! Faça login.');
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            } else {
                showNotification(data.message || 'Erro no cadastro', true);
            }
        } catch (error) {
            showNotification('Erro na conexão com o servidor', true);
        }
    });

    // Logout button
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        authForms.classList.remove('hidden');
        bookingFormContainer.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        showNotification('Logout realizado com sucesso!');
    });

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        authForms.classList.add('hidden');
        bookingFormContainer.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
    }
}

function initializeBookingForm() {
    const form = document.getElementById('bookingForm');
    const timeSelect = document.getElementById('time');
    
    // Populate time slots
    const timeSlots = generateTimeSlots();
    timeSlots.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        timeSelect.appendChild(option);
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Você precisa estar logado para agendar.', true);
            return;
        }

        const formData = {
            name: document.getElementById('name').value,
            service: document.getElementById('service').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value
        };

        try {
            const res = await fetch(`${API_BASE_URL}/appointments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                showNotification('Agendamento realizado com sucesso!');
                form.reset();
            } else {
                showNotification(data.message || 'Erro ao agendar', true);
            }
        } catch (error) {
            showNotification('Erro na conexão com o servidor', true);
        }
    });

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
}

function generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour <= 19; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour !== 19) {
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
    }
    return slots;
}

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg fade-in ${isError ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
