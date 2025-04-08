// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
    loadTodayAppointments();
    setupViewToggle();
});

let currentDate = new Date();
let currentView = 'week'; // 'week' or 'month'

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

function renderWeekView() {
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
            const appointment = getAppointmentForSlot(day, time);
            if (appointment) {
                slot.innerHTML = `
                    <div class="appointment-card">
                        <div class="font-semibold">${appointment.name}</div>
                        <div class="text-sm">${appointment.service}</div>
                    </div>
                `;
            }
            row.appendChild(slot);
        }
        weekViewCalendar.appendChild(row);
    });
}

function renderMonthView() {
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
        const appointments = getAppointmentsForDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        appointments.forEach(appointment => {
            const appointmentDiv = document.createElement('div');
            appointmentDiv.className = 'appointment-card text-xs';
            appointmentDiv.textContent = `${appointment.time} - ${appointment.name}`;
            dayCell.appendChild(appointmentDiv);
        });

        monthGrid.appendChild(dayCell);
    }

    monthViewCalendar.appendChild(monthGrid);
}

function loadTodayAppointments() {
    const todayAppointments = document.getElementById('todayAppointments');
    const appointments = getAppointmentsForDay(new Date());

    if (appointments.length === 0) {
        todayAppointments.innerHTML = '<div class="p-4 text-gray-500">Nenhum agendamento para hoje</div>';
        return;
    }

    appointments.forEach(appointment => {
        const appointmentDiv = document.createElement('div');
        appointmentDiv.className = 'p-4 hover:bg-gray-50';
        appointmentDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h5 class="font-semibold">${appointment.time} - ${appointment.name}</h5>
                    <p class="text-sm text-gray-600">${appointment.service}</p>
                </div>
                <span class="status-${appointment.status}">${getStatusText(appointment.status)}</span>
            </div>
        `;
        todayAppointments.appendChild(appointmentDiv);
    });
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

function getAppointmentForSlot(date, time) {
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    return appointments.find(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate.getDate() === date.getDate() &&
               appointmentDate.getMonth() === date.getMonth() &&
               appointmentDate.getFullYear() === date.getFullYear() &&
               appointment.time === time;
    });
}

function getAppointmentsForDay(date) {
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    return appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate.getDate() === date.getDate() &&
               appointmentDate.getMonth() === date.getMonth() &&
               appointmentDate.getFullYear() === date.getFullYear();
    }).sort((a, b) => a.time.localeCompare(b.time));
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'confirmed': 'Confirmado',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}
