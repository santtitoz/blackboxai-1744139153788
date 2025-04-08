// Portfolio Gallery Images
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

// Load portfolio images
document.addEventListener('DOMContentLoaded', () => {
    const portfolioGrid = document.querySelector('#portfolio .grid');
    
    portfolioImages.forEach(imageUrl => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `<img src="${imageUrl}" alt="Portfolio" class="w-full h-64 object-cover rounded-lg">`;
        portfolioGrid.appendChild(div);
    });

    // Initialize booking form
    initializeBookingForm();
    
    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector('nav button');
    const mobileMenu = document.querySelector('nav .md\\:flex');
    
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
});

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
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            service: document.getElementById('service').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value
        };

        // Store appointment in localStorage
        saveAppointment(formData);
        
        // Show success message
        showNotification('Agendamento realizado com sucesso!');
        
        // Reset form
        form.reset();
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

function saveAppointment(appointment) {
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push({
        ...appointment,
        id: Date.now(),
        status: 'pending'
    });
    localStorage.setItem('appointments', JSON.stringify(appointments));
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg fade-in';
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
