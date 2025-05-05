// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeCalendar();
    loadTodayAppointments();
    setupViewToggle();
});

let currentDate = new Date();
let currentView = 'week'; // 'week' or 'month'
let userRole = null;
let authToken = null;

function initializeAuth() {
    authToken = localStorage.getItem('token');
    userRole = localStorage.getItem('role');
    if (!authToken) {
        alert('Você precisa estar logado para acessar o dashboard.');
        window.location.href = 'index.html';
    }
}

function initializeCalendar() {
    updateCalendarHeader();
    if (currentView === 'week') {
        renderWeekView();
    } else {
        renderMonthView();
    }

    // Setup navigation buttons
    document.getElementById('prevWeek').addEventListener('click', () => {
        navigateCalendar(-1);
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        navigateCalendar(1);
    });
}

function setupViewToggle() {
    const weekViewBtn = document.getElementById('weekView');
    const monthViewBtn = document.getElementById('monthView');
    const weekViewCalendar = document.getElementById('weekViewCalendar');
    const monthViewCalendar = document.getElementById('monthViewCalendar');

    weekViewBtn.addEventListener('click', () => {
        currentView = 'week';
        weekViewBtn.className = 'bg-yellow-500 text-black px-4 py-2 rounded-lg';
        monthViewBtn.className = 'bg-gray-200 text-gray-700 px-4 py-2 rounded-lg';
        weekViewCalendar.classList.remove('hidden');
        monthViewCalendar.classList.add('hidden');
        renderWeekView();
    });

    monthViewBtn.addEventListener('click', () => {
        currentView = 'month';
        monthViewBtn.className = 'bg-yellow-500 text-black px-4 py-2 rounded-lg';
        weekViewBtn.className = 'bg-gray-200 text-gray-700 px-4 py-2 rounded-lg';
        monthViewCalendar.classList.remove('hidden');
        weekViewCalendar.classList.add('hidden');
        renderMonthView();
    });
}

function navigateCalendar(direction) {
    if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
    } else {
        currentDate.setMonth(currentDate.getMonth() + direction);
    }
    updateCalendarHeader();
    if (currentView === 'week') {
        renderWeekView();
    } else {
        renderMonthView();
    }
}

function updateCalendarHeader() {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const headerText = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    document.getElementById('currentMonth').textContent = headerText;
}

async function fetchAppointments() {
    try {
        const res = await fetch(`${API_BASE_URL}/appointments`, {
            headers: {
                'Authorization': 'Bearer ' + authToken
            }
        });
        if (!res.ok) throw new Error('Failed to fetch appointments');
        const data = await res.json();
        return data;
    } catch (error) {
        alert('Erro ao carregar agendamentos. Faça login novamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'index.html';
        return [];
    }
}

async function renderWeekView() {
    const weekViewCalendar = document.getElementById('weekViewCalendar');
    weekViewCalendar.innerHTML = '';

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    // Create week header
    const weekHeader = document.createElement('div');
    weekHeader.className = 'grid grid-cols-8 bg-gray-50 border-b';
    
    // Time column header
    weekHeader.innerHTML = '<div class="py-2 px-4 font-semibold">Hora</div>';

    // Day columns headers
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dayHeader = document.createElement('div');
        dayHeader.className = 'py-2 px-4 font-semibold text-center';
        dayHeader.textContent = `${day.getDate()}/${day.getMonth() + 1}`;
        weekHeader.appendChild(dayHeader);
    }
    weekViewCalendar.appendChild(weekHeader);

    const appointments = await fetchAppointments();

    // Create time slots
    const timeSlots = generateTimeSlots();
    timeSlots.forEach(time => {
        const row = document.createElement('div');
        row.className = 'grid grid-cols-8 border-b';

        // Time column
        const timeCol = document.createElement('div');
        timeCol.className = 'py-2 px-4 font-medium';
        timeCol.textContent = time;
        row.appendChild(timeCol);

        // Day columns
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const slot = document.createElement('div');
            slot.className = 'py-2 px-4 text-center';

            // Check if there's an appointment for this slot
            const appointment = appointments.find(app => {
                const appDate = new Date(app.date);
                return appDate.getDate() === day.getDate() &&
                       appDate.getMonth() === day.getMonth() &&
                       appDate.getFullYear() === day.getFullYear() &&
                       app.time === time;
            });

            if (appointment) {
                slot.innerHTML = `
                    <div class="appointment-card">
                        <div class="font-semibold">${appointment.name}</div>
                        <div class="text-sm">${appointment.service}</div>
                        <div class="text-xs mt-1">Status: ${appointment.status}</div>
                        ${userRole === 'admin' ? `
                        <div class="mt-2 space-x-2">
                            <button class="btn-confirm bg-green-500 text-white px-2 py-1 rounded text-xs" data-id="${appointment.id}">Confirmar</button>
                            <button class="btn-cancel bg-red-500 text-white px-2 py-1 rounded text-xs" data-id="${appointment.id}">Cancelar</button>
                            <button class="btn-delete bg-gray-700 text-white px-2 py-1 rounded text-xs" data-id="${appointment.id}">Excluir</button>
                        </div>` : ''}
                    </div>
                `;
            }
            row.appendChild(slot);
        }
        weekViewCalendar.appendChild(row);
    });

    if (userRole === 'admin') {
        setupAdminButtons();
    }
}

async function renderMonthView() {
    const monthViewCalendar = document.getElementById('monthViewCalendar');
    monthViewCalendar.innerHTML = '';

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Create month grid
    const monthGrid = document.createElement('div');
    monthGrid.className = 'grid grid-cols-7 gap-1 p-4';

    // Add day headers
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'text-center font-semibold py-2';
        dayHeader.textContent = day;
        monthGrid.appendChild(dayHeader);
    });

    const appointments = await fetchAppointments();

    // Fill in empty days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'bg-gray-100 rounded-lg p-2 h-24';
        monthGrid.appendChild(emptyDay);
    }

    // Fill in days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'bg-white rounded-lg p-2 h-24 overflow-y-auto';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'font-semibold mb-1';
        dateHeader.textContent = day;
        dayCell.appendChild(dateHeader);

        // Add appointments for this day
        const dayAppointments = appointments.filter(app => {
            const appDate = new Date(app.date);
            return appDate.getDate() === day &&
                   appDate.getMonth() === currentDate.getMonth() &&
                   appDate.getFullYear() === currentDate.getFullYear();
        });

        dayAppointments.forEach(appointment => {
            const appointmentDiv = document.createElement('div');
            appointmentDiv.className = 'appointment-card text-xs';
            appointmentDiv.innerHTML = `
                ${appointment.time} - ${appointment.name} (${appointment.status})
                ${userRole === 'admin' ? `
                <div class="mt-1 space-x-1">
                    <button class="btn-confirm bg-green-500 text-white px-1 py-0.5 rounded text-xs" data-id="${appointment.id}">Confirmar</button>
                    <button class="btn-cancel bg-red-500 text-white px-1 py-0.5 rounded text-xs" data-id="${appointment.id}">Cancelar</button>
                    <button class="btn-delete bg-gray-700 text-white px-1 py-0.5 rounded text-xs" data-id="${appointment.id}">Excluir</button>
                </div>` : ''}
            `;
            dayCell.appendChild(appointmentDiv);
        });

        monthGrid.appendChild(dayCell);
    }

    monthViewCalendar.appendChild(monthGrid);

    if (userRole === 'admin') {
        setupAdminButtons();
    }
}

async function loadTodayAppointments() {
    const todayAppointments = document.getElementById('todayAppointments');
    todayAppointments.innerHTML = '';
    const appointments = await fetchAppointments();

    const today = new Date();
    const todaysAppointments = appointments.filter(app => {
        const appDate = new Date(app.date);
        return appDate.getDate() === today.getDate() &&
               appDate.getMonth() === today.getMonth() &&
               appDate.getFullYear() === today.getFullYear();
    });

    if (todaysAppointments.length === 0) {
        todayAppointments.innerHTML = '<div class="p-4 text-gray-500">Nenhum agendamento para hoje</div>';
        return;
    }

    todaysAppointments.forEach(appointment => {
        const appointmentDiv = document.createElement('div');
        appointmentDiv.className = 'p-4 hover:bg-gray-50 flex justify-between items-center';
        appointmentDiv.innerHTML = `
            <div>
                <h5 class="font-semibold">${appointment.time} - ${appointment.name}</h5>
                <p class="text-sm text-gray-600">${appointment.service}</p>
                <p class="text-xs mt-1">Status: ${appointment.status}</p>
            </div>
            ${userRole === 'admin' ? `
            <div class="space-x-2">
                <button class="btn-confirm bg-green-500 text-white px-2 py-1 rounded text-xs" data-id="${appointment.id}">Confirmar</button>
                <button class="btn-cancel bg-red-500 text-white px-2 py-1 rounded text-xs" data-id="${appointment.id}">Cancelar</button>
                <button class="btn-delete bg-gray-700 text-white px-2 py-1 rounded text-xs" data-id="${appointment.id}">Excluir</button>
            </div>` : ''}
        `;
        todayAppointments.appendChild(appointmentDiv);
    });

    if (userRole === 'admin') {
        setupAdminButtons();
    }
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

function setupAdminButtons() {
    document.querySelectorAll('.btn-confirm').forEach(button => {
        button.addEventListener('click', () => updateAppointmentStatus(button.dataset.id, 'confirmed'));
    });
    document.querySelectorAll('.btn-cancel').forEach(button => {
        button.addEventListener('click', () => updateAppointmentStatus(button.dataset.id, 'cancelled'));
    });
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', () => deleteAppointment(button.dataset.id));
    });
}

async function updateAppointmentStatus(id, status) {
    try {
        const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Failed to update appointment');
        showNotification('Status do agendamento atualizado!');
        refreshDashboard();
    } catch (error) {
        showNotification('Erro ao atualizar agendamento', true);
    }
}

async function deleteAppointment(id) {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + authToken
            }
        });
        if (!res.ok) throw new Error('Failed to delete appointment');
        showNotification('Agendamento excluído com sucesso!');
        refreshDashboard();
    } catch (error) {
        showNotification('Erro ao excluir agendamento', true);
    }
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

function refreshDashboard() {
    if (currentView === 'week') {
        renderWeekView();
    } else {
        renderMonthView();
    }
    loadTodayAppointments();
}
</create_file>
