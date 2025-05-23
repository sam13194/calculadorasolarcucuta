// ===================================
// GLOBAL VARIABLES
// ===================================
let selectedDevices = [];
let systemData = {
    onGrid: {},
    offGrid: {}
};
let currentSystemType = 'ongrid';
let chartInstances = {};

// Component prices (COP)
const PRICES = {
    panel: 1500000,        // 550W panel
    inverterOnGrid: 3000000, // per kW
    inverterOffGrid: 4000000, // per kW  
    battery: 2000000,      // per kWh
    chargeController: 800000, // MPPT controller
    structure: 300000,     // per panel
    cabling: 50000,        // per panel
    protections: 500000,   // fixed
    installation: 0.3      // 30% of equipment cost
};

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeCalculator();
    initializeModals();
    initializeLearning();
    initializeFinancing();
    
    // Set default values
    document.getElementById('electricity-rate').value = 650;
});

// ===================================
// NAVIGATION
// ===================================
function initializeNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // Update active nav
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Update active section
            document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(section).classList.add('active');
            
            // Scroll to top
            window.scrollTo(0, 0);
        });
    });
}

// ===================================
// CALCULATOR FUNCTIONS
// ===================================
function initializeCalculator() {
    // Method selector
    document.querySelectorAll('.method-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.method-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const method = this.dataset.method;
            document.getElementById(method + '-method').classList.add('active');
        });
    });
    
    // Device selection
    document.querySelectorAll('.device-item:not(.custom-device)').forEach(item => {
        item.addEventListener('click', function() {
            const deviceData = {
                id: this.dataset.device,
                name: this.querySelector('.device-name').textContent,
                power: parseInt(this.dataset.power),
                icon: this.dataset.icon,
                quantity: 1,
                hours: 24
            };
            
            openDeviceModal(deviceData);
        });
    });
    
    // Custom device
    document.querySelector('.custom-device').addEventListener('click', function() {
        openCustomModal();
    });
}

// Device Management
function openDeviceModal(deviceData) {
    const modal = document.getElementById('device-modal');
    modal.style.display = 'block';
    modal.dataset.deviceId = deviceData.id;
    
    document.getElementById('modal-device-name').value = deviceData.name;
    document.getElementById('modal-device-power').value = deviceData.power;
    document.getElementById('modal-device-quantity').value = 1;
    document.getElementById('modal-device-hours').value = deviceData.id.includes('nevera') ? 24 : 8;
}

function closeDeviceModal() {
    document.getElementById('device-modal').style.display = 'none';
}

function saveDeviceConfig() {
    const modal = document.getElementById('device-modal');
    const deviceId = modal.dataset.deviceId;
    
    const deviceData = {
        id: deviceId,
        name: document.getElementById('modal-device-name').value,
        power: parseInt(document.getElementById('modal-device-power').value),
        quantity: parseInt(document.getElementById('modal-device-quantity').value),
        hours: parseInt(document.getElementById('modal-device-hours').value)
    };
    
    // Find icon
    const deviceElement = document.querySelector(`[data-device="${deviceId}"]`);
    if (deviceElement) {
        deviceData.icon = deviceElement.dataset.icon;
    }
    
    // Add or update device
    const existingIndex = selectedDevices.findIndex(d => d.id === deviceId);
    if (existingIndex > -1) {
        selectedDevices[existingIndex] = deviceData;
    } else {
        selectedDevices.push(deviceData);
        if (deviceElement) {
            deviceElement.classList.add('selected');
        }
    }
    
    updateSelectedDevices();
    closeDeviceModal();
}

function openCustomModal() {
    document.getElementById('custom-device-modal').style.display = 'block';
}

function closeCustomModal() {
    document.getElementById('custom-device-modal').style.display = 'none';
}

function addCustomDevice() {
    const deviceData = {
        id: 'custom-' + Date.now(),
        name: document.getElementById('custom-device-name').value,
        power: parseInt(document.getElementById('custom-device-power').value),
        quantity: parseInt(document.getElementById('custom-device-quantity').value),
        hours: parseInt(document.getElementById('custom-device-hours').value),
        icon: '⚡'
    };
    
    if (!deviceData.name || !deviceData.power) {
        alert('Por favor complete todos los campos');
        return;
    }
    
    selectedDevices.push(deviceData);
    updateSelectedDevices();
    closeCustomModal();
    
    // Clear form
    document.getElementById('custom-device-name').value = '';
    document.getElementById('custom-device-power').value = '';
    document.getElementById('custom-device-quantity').value = 1;
    document.getElementById('custom-device-hours').value = '';
}

function updateSelectedDevices() {
    const summary = document.getElementById('selected-devices-summary');
    const list = document.getElementById('selected-devices-list');
    
    if (selectedDevices.length === 0) {
        summary.style.display = 'none';
        return;
    }
    
    summary.style.display = 'block';
    list.innerHTML = '';
    
    let totalDaily = 0;
    
    selectedDevices.forEach((device, index) => {
        const daily = (device.power * device.quantity * device.hours) / 1000;
        totalDaily += daily;
        
        const item = document.createElement('div');
        item.className = 'selected-device-item';
        item.innerHTML = `
            <div class="device-info">
                <span style="font-size: 1.5rem;">${device.icon || '⚡'}</span>
                <div>
                    <strong>${device.name}</strong>
                    <div style="font-size: 0.875rem; color: var(--gray);">
                        ${device.power}W × ${device.quantity} unidad(es) × ${device.hours}h = ${daily.toFixed(2)} kWh/día
                    </div>
                </div>
            </div>
            <div class="device-controls">
                <div>
                    <label>Cantidad</label>
                    <input type="number" value="${device.quantity}" min="1" 
                           onchange="updateDeviceProperty(${index}, 'quantity', this.value)">
                </div>
                <div>
                    <label>Horas/día</label>
                    <input type="number" value="${device.hours}" min="1" max="24" 
                           onchange="updateDeviceProperty(${index}, 'hours', this.value)">
                </div>
                <button class="remove-device" onclick="removeDevice(${index})">×</button>
            </div>
        `;
        list.appendChild(item);
    });
    
    document.getElementById('daily-consumption-total').textContent = totalDaily.toFixed(2) + ' kWh';
}

function updateDeviceProperty(index, property, value) {
    selectedDevices[index][property] = parseInt(value);
    updateSelectedDevices();
}

function removeDevice(index) {
    const device = selectedDevices[index];
    const deviceElement = document.querySelector(`[data-device="${device.id}"]`);
    if (deviceElement) {
        deviceElement.classList.remove('selected');
    }
    
    selectedDevices.splice(index, 1);
    updateSelectedDevices();
}

// ===================================
// SYSTEM CALCULATION
// ===================================
function calculateSystem() {
    const department = document.getElementById('department');
    const electricityRate = parseFloat(document.getElementById('electricity-rate').value) || 650;
    
    if (!department.value) {
        alert('Por favor seleccione su departamento');
        return;
    }
    
    // Calculate daily consumption
    let dailyConsumption = 0;
    const activeMethod = document.querySelector('.method-card.active').dataset.method;
    
    if (activeMethod === 'devices') {
        if (selectedDevices.length === 0) {
            alert('Por favor seleccione al menos un dispositivo');
            return;
        }
        selectedDevices.forEach(device => {
            dailyConsumption += (device.power * device.quantity * device.hours) / 1000;
        });
    } else {
        const monthlyConsumption = parseFloat(document.getElementById('monthly-consumption').value);
        if (!monthlyConsumption) {
            alert('Por favor ingrese su consumo mensual');
            return;
        }
        dailyConsumption = monthlyConsumption / 30;
    }
    
    const radiation = parseFloat(department.options[department.selectedIndex].dataset.radiation);
    
    // Calculate both systems
    calculateOnGridSystem(dailyConsumption, radiation, electricityRate);
    calculateOffGridSystem(dailyConsumption, radiation, electricityRate);
    
    // Show results
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    
    // Update diagrams
    showDiagram('ongrid');
    
    // Update financial analysis
    showFinancialAnalysis('ongrid');
    
    // Update environmental impact
    updateEnvironmentalImpact(dailyConsumption * 365);
}

function calculateOnGridSystem(dailyConsumption, radiation, electricityRate) {
    const systemEfficiency = 0.85;
    const panelWattage = 550;
    const peakSunHours = radiation;
    
    // System sizing
    const requiredDailyGeneration = dailyConsumption / systemEfficiency;
    const systemSizeKW = requiredDailyGeneration / peakSunHours;
    const panelsNeeded = Math.ceil((systemSizeKW * 1000) / panelWattage);
    const actualSystemSize = (panelsNeeded * panelWattage) / 1000;
    
    // Inverter sizing (110% of system size)
    const inverterSize = Math.ceil(actualSystemSize * 1.1 * 10) / 10;
    
    // Component costs
    const components = [
        { name: 'Paneles Solares 550W', qty: panelsNeeded, unit: 'unidades', price: PRICES.panel },
        { name: 'Inversor On-Grid', qty: inverterSize, unit: 'kW', price: PRICES.inverterOnGrid },
        { name: 'Estructura de Montaje', qty: panelsNeeded, unit: 'módulos', price: PRICES.structure },
        { name: 'Cableado DC/AC', qty: panelsNeeded, unit: 'sets', price: PRICES.cabling },
        { name: 'Protecciones Eléctricas', qty: 1, unit: 'kit', price: PRICES.protections },
        { name: 'Medidor Bidireccional', qty: 1, unit: 'unidad', price: 1500000 }
    ];
    
    const equipmentCost = components.reduce((sum, comp) => sum + (comp.qty * comp.price), 0);
    const installationCost = equipmentCost * PRICES.installation;
    const totalCost = equipmentCost + installationCost;
    
    // Financial analysis
    const monthlyGeneration = dailyConsumption * 30;
    const monthlySavings = monthlyGeneration * electricityRate;
    const yearlyGeneration = monthlyGeneration * 12;
    
    systemData.onGrid = {
        dailyConsumption,
        panelsNeeded,
        actualSystemSize,
        inverterSize,
        components,
        equipmentCost,
        installationCost,
        totalCost,
        monthlyGeneration,
        monthlySavings,
        yearlyGeneration,
        electricityRate
    };
    
    // Update UI
    updateOnGridDisplay();
}

function calculateOffGridSystem(dailyConsumption, radiation, electricityRate) {
    const systemEfficiency = 0.75; // Lower due to battery losses
    const panelWattage = 550;
    const peakSunHours = radiation;
    const autonomyDays = 3;
    const batteryDoD = 0.5; // 50% depth of discharge
    const batteryVoltage = 48;
    
    // System sizing with 20% safety margin
    const requiredDailyGeneration = (dailyConsumption * 1.2) / systemEfficiency;
    const systemSizeKW = requiredDailyGeneration / peakSunHours;
    const panelsNeeded = Math.ceil((systemSizeKW * 1000) / panelWattage);
    const actualSystemSize = (panelsNeeded * panelWattage) / 1000;
    
    // Battery sizing
    const batteryCapacityKWh = (dailyConsumption * autonomyDays) / batteryDoD;
    const batteryCapacityAh = (batteryCapacityKWh * 1000) / batteryVoltage;
    const batteriesNeeded = Math.ceil(batteryCapacityAh / 200); // 200Ah batteries
    
    // Inverter sizing (125% of peak load)
    const peakLoad = dailyConsumption * 0.3; // Assume 30% peak
    const inverterSize = Math.ceil(peakLoad * 1.25);
    
    // Charge controller sizing
    const controllerAmps = Math.ceil((actualSystemSize * 1000) / batteryVoltage * 1.25);
    
    // Component costs
    const components = [
        { name: 'Paneles Solares 550W', qty: panelsNeeded, unit: 'unidades', price: PRICES.panel },
        { name: 'Baterías 200Ah 12V', qty: batteriesNeeded * 4, unit: 'unidades', price: PRICES.battery / 4 },
        { name: 'Inversor Off-Grid', qty: inverterSize, unit: 'kW', price: PRICES.inverterOffGrid },
        { name: 'Controlador MPPT', qty: Math.ceil(controllerAmps / 60), unit: 'unidades', price: PRICES.chargeController },
        { name: 'Estructura de Montaje', qty: panelsNeeded, unit: 'módulos', price: PRICES.structure },
        { name: 'Cableado y Protecciones', qty: 1, unit: 'kit', price: PRICES.protections * 2 }
    ];
    
    const equipmentCost = components.reduce((sum, comp) => sum + (comp.qty * comp.price), 0);
    const installationCost = equipmentCost * PRICES.installation;
    const totalCost = equipmentCost + installationCost;
    
    // Financial analysis
    const monthlyGeneration = dailyConsumption * 30;
    const monthlySavings = monthlyGeneration * electricityRate;
    const yearlyGeneration = monthlyGeneration * 12;
    
    systemData.offGrid = {
        dailyConsumption,
        panelsNeeded,
        actualSystemSize,
        inverterSize,
        batteryCapacityKWh,
        batteriesNeeded: batteriesNeeded * 4,
        controllerAmps,
        components,
        equipmentCost,
        installationCost,
        totalCost,
        monthlyGeneration,
        monthlySavings,
        yearlyGeneration,
        electricityRate
    };
    
    // Update UI
    updateOffGridDisplay();
}

function updateOnGridDisplay() {
    const data = systemData.onGrid;
    const container = document.getElementById('ongrid-components');
    
    container.innerHTML = '';
    data.components.forEach(comp => {
        const item = document.createElement('div');
        item.className = 'component-item';
        item.innerHTML = `
            <div class="component-detail">
                <span class="component-qty">${comp.qty}</span>
                <span>${comp.name}</span>
            </div>
            <span class="component-price">${formatCurrency(comp.qty * comp.price)}</span>
        `;
        container.appendChild(item);
    });
    
    // Add installation cost
    const installItem = document.createElement('div');
    installItem.className = 'component-item';
    installItem.innerHTML = `
        <div class="component-detail">
            <span>Instalación y puesta en marcha</span>
        </div>
        <span class="component-price">${formatCurrency(data.installationCost)}</span>
    `;
    container.appendChild(installItem);
    
    document.getElementById('ongrid-total').textContent = formatCurrency(data.totalCost);
}

function updateOffGridDisplay() {
    const data = systemData.offGrid;
    const container = document.getElementById('offgrid-components');
    
    container.innerHTML = '';
    data.components.forEach(comp => {
        const item = document.createElement('div');
        item.className = 'component-item';
        item.innerHTML = `
            <div class="component-detail">
                <span class="component-qty">${comp.qty}</span>
                <span>${comp.name}</span>
            </div>
            <span class="component-price">${formatCurrency(comp.qty * comp.price)}</span>
        `;
        container.appendChild(item);
    });
    
    // Add installation cost
    const installItem = document.createElement('div');
    installItem.className = 'component-item';
    installItem.innerHTML = `
        <div class="component-detail">
            <span>Instalación y puesta en marcha</span>
        </div>
        <span class="component-price">${formatCurrency(data.installationCost)}</span>
    `;
    container.appendChild(installItem);
    
    document.getElementById('offgrid-total').textContent = formatCurrency(data.totalCost);
}

// ===================================
// DIAGRAMS
// ===================================
function showDiagram(type) {
    // Update tabs
    document.querySelectorAll('.diagram-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    const container = document.getElementById('system-diagram');
    
    if (type === 'ongrid') {
        container.innerHTML = createOnGridDiagram();
    } else {
        container.innerHTML = createOffGridDiagram();
    }
}

function createOnGridDiagram() {
    return `
        <svg viewBox="0 0 800 400" style="max-width: 100%; height: auto;">
            <!-- Background -->
            <rect width="800" height="400" fill="#f3f4f6"/>
            
            <!-- Title -->
            <text x="400" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="#1f2937">
                Sistema On-Grid (Conectado a Red)
            </text>
            
            <!-- Solar Panels -->
            <g transform="translate(50, 80)">
                <rect x="0" y="0" width="120" height="80" fill="#1e40af" stroke="#1d4ed8" stroke-width="2"/>
                <line x1="0" y1="40" x2="120" y2="40" stroke="#60a5fa" stroke-width="2"/>
                <line x1="40" y1="0" x2="40" y2="80" stroke="#60a5fa" stroke-width="2"/>
                <line x1="80" y1="0" x2="80" y2="80" stroke="#60a5fa" stroke-width="2"/>
                <text x="60" y="100" text-anchor="middle" font-size="14">Paneles Solares</text>
                <text x="60" y="115" text-anchor="middle" font-size="12" fill="#6b7280">550W c/u</text>
            </g>
            
            <!-- DC Cable -->
            <g>
                <path d="M170 120 L250 120" stroke="#ef4444" stroke-width="3"/>
                <text x="210" y="110" text-anchor="middle" font-size="12" fill="#ef4444">DC</text>
            </g>
            
            <!-- Inverter -->
            <g transform="translate(250, 90)">
                <rect x="0" y="0" width="80" height="60" fill="#10b981" stroke="#059669" stroke-width="2"/>
                <text x="40" y="35" text-anchor="middle" font-size="14" fill="white">INVERSOR</text>
                <text x="40" y="70" text-anchor="middle" font-size="14">On-Grid</text>
            </g>
            
            <!-- AC Cable -->
            <g>
                <path d="M330 120 L410 120" stroke="#3b82f6" stroke-width="3"/>
                <text x="370" y="110" text-anchor="middle" font-size="12" fill="#3b82f6">AC</text>
            </g>
            
            <!-- Bidirectional Meter -->
            <g transform="translate(410, 90)">
                <circle cx="40" cy="30" r="30" fill="#f59e0b" stroke="#f97316" stroke-width="2"/>
                <text x="40" y="35" text-anchor="middle" font-size="12" fill="white">kWh</text>
                <path d="M25 30 L35 30 M45 30 L55 30" stroke="white" stroke-width="2"/>
                <path d="M35 25 L45 35 M45 25 L35 35" stroke="white" stroke-width="2"/>
                <text x="40" y="75" text-anchor="middle" font-size="14">Medidor</text>
                <text x="40" y="90" text-anchor="middle" font-size="12" fill="#6b7280">Bidireccional</text>
            </g>
            
            <!-- Grid -->
            <g transform="translate(530, 80)">
                <rect x="0" y="0" width="100" height="80" fill="#6b7280" stroke="#4b5563" stroke-width="2"/>
                <line x1="20" y1="20" x2="80" y2="20" stroke="white" stroke-width="2"/>
                <line x1="20" y1="40" x2="80" y2="40" stroke="white" stroke-width="2"/>
                <line x1="20" y1="60" x2="80" y2="60" stroke="white" stroke-width="2"/>
                <circle cx="50" cy="20" r="3" fill="white"/>
                <circle cx="50" cy="40" r="3" fill="white"/>
                <circle cx="50" cy="60" r="3" fill="white"/>
                <text x="50" y="100" text-anchor="middle" font-size="14">Red Eléctrica</text>
            </g>
            
            <!-- House -->
            <g transform="translate(350, 220)">
                <path d="M0 40 L50 0 L100 40 L100 80 L0 80 Z" fill="#f59e0b" stroke="#f97316" stroke-width="2"/>
                <rect x="20" y="50" width="20" height="30" fill="#f97316"/>
                <rect x="60" y="50" width="20" height="20" fill="#f97316"/>
                <text x="50" y="100" text-anchor="middle" font-size="14">Casa</text>
            </g>
            
            <!-- Connection from meter to house -->
            <path d="M450 150 L450 220 L400 220" stroke="#3b82f6" stroke-width="3"/>
            
            <!-- Arrows -->
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
                </marker>
            </defs>
            
            <!-- Energy flow indicators -->
            <path d="M490 120 L520 120" stroke="#10b981" stroke-width="3" marker-end="url(#arrowhead)"/>
            <text x="505" y="110" text-anchor="middle" font-size="10" fill="#10b981">Venta</text>
            
            <path d="M520 140 L490 140" stroke="#ef4444" stroke-width="3" marker-end="url(#arrowhead)"/>
            <text x="505" y="155" text-anchor="middle" font-size="10" fill="#ef4444">Compra</text>
            
            <!-- Legend -->
            <g transform="translate(50, 320)">
                <text x="0" y="0" font-size="14" font-weight="bold">Flujo de Energía:</text>
                <line x1="0" y1="20" x2="30" y2="20" stroke="#ef4444" stroke-width="3"/>
                <text x="35" y="25" font-size="12">Corriente Continua (DC)</text>
                <line x1="200" y1="20" x2="230" y2="20" stroke="#3b82f6" stroke-width="3"/>
                <text x="235" y="25" font-size="12">Corriente Alterna (AC)</text>
                <path d="M400 20 L430 20" stroke="#10b981" stroke-width="3" marker-end="url(#arrowhead)"/>
                <text x="435" y="25" font-size="12">Venta de excedentes</text>
            </g>
        </svg>
    `;
}

function createOffGridDiagram() {
    return `
        <svg viewBox="0 0 800 500" style="max-width: 100%; height: auto;">
            <!-- Background -->
            <rect width="800" height="500" fill="#f3f4f6"/>
            
            <!-- Title -->
            <text x="400" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="#1f2937">
                Sistema Off-Grid (Aislado)
            </text>
            
            <!-- Solar Panels -->
            <g transform="translate(50, 80)">
                <rect x="0" y="0" width="120" height="80" fill="#1e40af" stroke="#1d4ed8" stroke-width="2"/>
                <line x1="0" y1="40" x2="120" y2="40" stroke="#60a5fa" stroke-width="2"/>
                <line x1="40" y1="0" x2="40" y2="80" stroke="#60a5fa" stroke-width="2"/>
                <line x1="80" y1="0" x2="80" y2="80" stroke="#60a5fa" stroke-width="2"/>
                <text x="60" y="100" text-anchor="middle" font-size="14">Paneles Solares</text>
                <text x="60" y="115" text-anchor="middle" font-size="12" fill="#6b7280">550W c/u</text>
            </g>
            
            <!-- DC Cable to Controller -->
            <g>
                <path d="M170 120 L250 120" stroke="#ef4444" stroke-width="3"/>
                <text x="210" y="110" text-anchor="middle" font-size="12" fill="#ef4444">DC</text>
            </g>
            
            <!-- Charge Controller -->
            <g transform="translate(250, 90)">
                <rect x="0" y="0" width="80" height="60" fill="#8b5cf6" stroke="#7c3aed" stroke-width="2"/>
                <text x="40" y="30" text-anchor="middle" font-size="12" fill="white">MPPT</text>
                <text x="40" y="45" text-anchor="middle" font-size="12" fill="white">Controller</text>
                <text x="40" y="70" text-anchor="middle" font-size="14">Controlador</text>
            </g>
            
            <!-- DC to Batteries -->
            <g>
                <path d="M290 150 L290 200" stroke="#ef4444" stroke-width="3"/>
            </g>
            
            <!-- Batteries -->
            <g transform="translate(230, 200)">
                <rect x="0" y="0" width="120" height="60" fill="#374151" stroke="#1f2937" stroke-width="2"/>
                <rect x="10" y="10" width="20" height="40" fill="#10b981"/>
                <rect x="35" y="10" width="20" height="40" fill="#10b981"/>
                <rect x="60" y="10" width="20" height="40" fill="#10b981"/>
                <rect x="85" y="10" width="20" height="40" fill="#10b981"/>
                <text x="60" y="80" text-anchor="middle" font-size="14">Banco de Baterías</text>
                <text x="60" y="95" text-anchor="middle" font-size="12" fill="#6b7280">48V</text>
            </g>
            
            <!-- DC to Inverter -->
            <g>
                <path d="M350 230 L430 230" stroke="#ef4444" stroke-width="3"/>
            </g>
            
            <!-- Inverter -->
            <g transform="translate(430, 200)">
                <rect x="0" y="0" width="80" height="60" fill="#10b981" stroke="#059669" stroke-width="2"/>
                <text x="40" y="35" text-anchor="middle" font-size="14" fill="white">INVERSOR</text>
                <text x="40" y="80" text-anchor="middle" font-size="14">Off-Grid</text>
            </g>
            
            <!-- AC to House -->
            <g>
                <path d="M510 230 L590 230" stroke="#3b82f6" stroke-width="3"/>
                <text x="550" y="220" text-anchor="middle" font-size="12" fill="#3b82f6">AC</text>
            </g>
            
            <!-- House -->
            <g transform="translate(590, 190)">
                <path d="M0 40 L50 0 L100 40 L100 80 L0 80 Z" fill="#f59e0b" stroke="#f97316" stroke-width="2"/>
                <rect x="20" y="50" width="20" height="30" fill="#f97316"/>
                <rect x="60" y="50" width="20" height="20" fill="#f97316"/>
                <text x="50" y="100" text-anchor="middle" font-size="14">Casa</text>
            </g>
            
            <!-- Protection Box -->
            <g transform="translate(360, 310)">
                <rect x="0" y="0" width="100" height="60" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
                <text x="50" y="25" text-anchor="middle" font-size="12" fill="white">Protecciones</text>
                <text x="50" y="40" text-anchor="middle" font-size="12" fill="white">DC/AC</text>
                <text x="50" y="85" text-anchor="middle" font-size="12">Tablero</text>
            </g>
            
            <!-- Connections to protection box -->
            <path d="M290 260 L290 340 L360 340" stroke="#374151" stroke-width="2" stroke-dasharray="5,5"/>
            <path d="M470 260 L470 340 L460 340" stroke="#374151" stroke-width="2" stroke-dasharray="5,5"/>
            
            <!-- Legend -->
            <g transform="translate(50, 420)">
                <text x="0" y="0" font-size="14" font-weight="bold">Componentes del Sistema:</text>
                <rect x="0" y="10" width="15" height="10" fill="#1e40af"/>
                <text x="20" y="20" font-size="12">Generación Solar</text>
                
                <rect x="150" y="10" width="15" height="10" fill="#8b5cf6"/>
                <text x="170" y="20" font-size="12">Control de Carga</text>
                
                <rect x="300" y="10" width="15" height="10" fill="#374151"/>
                <text x="320" y="20" font-size="12">Almacenamiento</text>
                
                <rect x="450" y="10" width="15" height="10" fill="#10b981"/>
                <text x="470" y="20" font-size="12">Conversión AC</text>
                
                <line x1="0" y1="40" x2="30" y2="40" stroke="#ef4444" stroke-width="3"/>
                <text x="35" y="45" font-size="12">Corriente DC</text>
                
                <line x1="150" y1="40" x2="180" y2="40" stroke="#3b82f6" stroke-width="3"/>
                <text x="185" y="45" font-size="12">Corriente AC</text>
            </g>
        </svg>
    `;
}

// ===================================
// FINANCIAL ANALYSIS
// ===================================
function showFinancialAnalysis(type) {
    // Update tabs
    document.querySelectorAll('.financial-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    currentSystemType = type;
    const data = type === 'ongrid' ? systemData.onGrid : systemData.offGrid;
    
    // Calculate financial metrics
    const paybackYears = data.totalCost / (data.monthlySavings * 12);
    const twentyYearSavings = (data.monthlySavings * 12 * 20) - data.totalCost;
    const irr = calculateIRR(data);
    
    // Update display
    document.getElementById('monthly-savings').textContent = formatCurrency(data.monthlySavings);
    document.getElementById('roi-years').textContent = paybackYears.toFixed(1) + ' años';
    document.getElementById('irr-percentage').textContent = irr.toFixed(1) + '%';
    document.getElementById('total-savings').textContent = formatCurrency(twentyYearSavings);
    
    // Create financial chart
    createFinancialChart(data);
}

function calculateIRR(data) {
    // Simplified IRR calculation
    const initialInvestment = -data.totalCost;
    const annualCashFlow = data.monthlySavings * 12;
    const years = 20;
    
    // Newton-Raphson method for IRR
    let rate = 0.1; // Initial guess 10%
    let tolerance = 0.0001;
    let maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
        let npv = initialInvestment;
        let dnpv = 0;
        
        for (let t = 1; t <= years; t++) {
            npv += annualCashFlow / Math.pow(1 + rate, t);
            dnpv -= t * annualCashFlow / Math.pow(1 + rate, t + 1);
        }
        
        let newRate = rate - npv / dnpv;
        
        if (Math.abs(newRate - rate) < tolerance) {
            return newRate * 100;
        }
        
        rate = newRate;
    }
    
    return rate * 100;
}

function createFinancialChart(data) {
    const ctx = document.getElementById('financial-chart').getContext('2d');
    
    // Destroy existing chart
    if (chartInstances.financial) {
        chartInstances.financial.destroy();
    }
    
    const years = [];
    const savings = [];
    const investment = [];
    const netBenefit = [];
    
    for (let i = 0; i <= 20; i++) {
        years.push(i);
        const totalSavings = data.monthlySavings * 12 * i;
        savings.push(totalSavings);
        investment.push(data.totalCost);
        netBenefit.push(totalSavings - data.totalCost);
    }
    
    chartInstances.financial = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Ahorro Acumulado',
                    data: savings,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Inversión Inicial',
                    data: investment,
                    borderColor: '#ef4444',
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: 'Beneficio Neto',
                    data: netBenefit,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Análisis Financiero a 20 años'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Años'
                    }
                }
            }
        }
    });
}

// ===================================
// ENVIRONMENTAL IMPACT
// ===================================
function updateEnvironmentalImpact(yearlyGeneration) {
    // CO2 factor for Colombia: 0.126 kg CO2/kWh
    const co2Factor = 0.126;
    const co2Reduction = yearlyGeneration * co2Factor;
    
    // Equivalencies
    const treesEquivalent = Math.round(co2Reduction / 21.77); // 1 tree absorbs 21.77 kg CO2/year
    const kmCar = Math.round(co2Reduction / 0.12); // 0.12 kg CO2/km for average car
    
    document.getElementById('co2-reduction').textContent = Math.round(co2Reduction).toLocaleString();
    document.getElementById('trees-equivalent').textContent = treesEquivalent.toLocaleString();
    document.getElementById('cars-equivalent').textContent = kmCar.toLocaleString();
}

// ===================================
// LEARNING MODULE
// ===================================
function initializeLearning() {
    // Module toggle functionality is handled inline in HTML
}

function toggleModule(moduleId) {
    const content = document.getElementById(moduleId);
    const toggle = event.target.querySelector('.module-toggle');
    
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▼';
    }
}

// ===================================
// FINANCING MODULE
// ===================================
function initializeFinancing() {
    // Financing mode is handled by setFinancingMode function
}

function setFinancingMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.financing-content').forEach(content => content.classList.remove('active'));
    
    event.target.closest('.mode-btn').classList.add('active');
    document.getElementById(mode + '-financing').classList.add('active');
}

function calculateBasicFinancing() {
    const loanAmount = parseFloat(document.getElementById('basic-loan-amount').value);
    const monthlyRate = parseFloat(document.getElementById('basic-interest-rate').value) / 100;
    const years = parseFloat(document.getElementById('basic-loan-term').value);
    
    if (!loanAmount || !monthlyRate || !years) {
        alert('Por favor complete todos los campos');
        return;
    }
    
    const months = years * 12;
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                          (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - loanAmount;
    
    // Compare with commercial rate (1.8% monthly)
    const commercialRate = 0.018;
    const commercialPayment = (loanAmount * commercialRate * Math.pow(1 + commercialRate, months)) / 
                             (Math.pow(1 + commercialRate, months) - 1);
    const commercialTotal = commercialPayment * months;
    const savings = commercialTotal - totalPayment;
    
    document.getElementById('basic-monthly-payment').textContent = formatCurrency(monthlyPayment);
    document.getElementById('basic-total-payment').textContent = formatCurrency(totalPayment);
    document.getElementById('basic-total-interest').textContent = formatCurrency(totalInterest);
    document.getElementById('basic-savings').textContent = formatCurrency(savings);
    
    document.getElementById('basic-financing-results').style.display = 'block';
}

function calculateAdvancedFinancing() {
    const investment = parseFloat(document.getElementById('adv-investment').value);
    const generation = parseFloat(document.getElementById('adv-generation').value);
    const rate = parseFloat(document.getElementById('adv-rate').value);
    const discountRate = parseFloat(document.getElementById('adv-discount-rate').value) / 100;
    const inflation = parseFloat(document.getElementById('adv-inflation').value) / 100;
    const degradation = parseFloat(document.getElementById('adv-degradation').value) / 100;
    
    if (!investment || !generation || !rate) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }
    
    // Calculate with incentives
    let effectiveInvestment = investment;
    if (document.getElementById('incentive-iva').checked) {
        effectiveInvestment *= 0.81; // Remove 19% IVA
    }
    if (document.getElementById('incentive-renta').checked) {
        effectiveInvestment *= 0.75; // 50% deduction = 25% savings
    }
    
    // Calculate NPV
    let npv = -effectiveInvestment;
    let paybackYear = 0;
    let cashFlows = [-effectiveInvestment];
    
    for (let year = 1; year <= 20; year++) {
        const yearGeneration = generation * (1 - degradation * year);
        const yearRate = rate * Math.pow(1 + inflation, year);
        const yearCashFlow = yearGeneration * yearRate;
        const discountedCashFlow = yearCashFlow / Math.pow(1 + discountRate, year);
        
        npv += discountedCashFlow;
        cashFlows.push(yearCashFlow);
        
        if (paybackYear === 0 && npv > 0) {
            paybackYear = year;
        }
    }
    
    // Calculate IRR
    const irr = calculateAdvancedIRR(cashFlows);
    
    // Calculate LCOE
    let totalGeneration = 0;
    let totalCost = effectiveInvestment;
    
    for (let year = 1; year <= 20; year++) {
        const yearGeneration = generation * (1 - degradation * year);
        totalGeneration += yearGeneration / Math.pow(1 + discountRate, year);
        totalCost += (investment * 0.01) / Math.pow(1 + discountRate, year); // 1% O&M
    }
    
    const lcoe = totalCost / totalGeneration;
    
    // Update display
    document.getElementById('adv-npv').textContent = formatCurrency(npv);
    document.getElementById('adv-irr').textContent = irr.toFixed(1) + '%';
    document.getElementById('adv-payback').textContent = paybackYear + ' años';
    document.getElementById('adv-lcoe').textContent = '$' + Math.round(lcoe) + '/kWh';
    
    // Create cash flow chart
    createCashFlowChart(cashFlows);
    
    document.getElementById('advanced-results').style.display = 'block';
}

function calculateAdvancedIRR(cashFlows) {
    let rate = 0.1;
    let tolerance = 0.0001;
    let maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let dnpv = 0;
        
        for (let t = 0; t < cashFlows.length; t++) {
            npv += cashFlows[t] / Math.pow(1 + rate, t);
            dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
        }
        
        let newRate = rate - npv / dnpv;
        
        if (Math.abs(newRate - rate) < tolerance) {
            return newRate * 100;
        }
        
        rate = newRate;
    }
    
    return rate * 100;
}

function createCashFlowChart(cashFlows) {
    const ctx = document.getElementById('cashflow-chart').getContext('2d');
    
    if (chartInstances.cashflow) {
        chartInstances.cashflow.destroy();
    }
    
    const years = Array.from({length: cashFlows.length}, (_, i) => i);
    const accumulated = [];
    let sum = 0;
    
    cashFlows.forEach(flow => {
        sum += flow;
        accumulated.push(sum);
    });
    
    chartInstances.cashflow = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Flujo de Caja Anual',
                    data: cashFlows,
                    backgroundColor: cashFlows.map(f => f < 0 ? '#ef4444' : '#10b981'),
                    borderRadius: 4
                },
                {
                    label: 'Flujo Acumulado',
                    data: accumulated,
                    type: 'line',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// ===================================
// REPORT GENERATION
// ===================================
function previewReport() {
    const clientName = document.getElementById('client-name').value;
    const clientEmail = document.getElementById('client-email').value;
    
    if (!clientName || !clientEmail) {
        alert('Por favor complete los datos del cliente');
        return;
    }
    
    if (!systemData.onGrid.totalCost) {
        alert('Por favor calcule primero el sistema solar');
        return;
    }
    
    // Update preview with current data
    updateReportPreview();
    
    document.getElementById('report-preview').style.display = 'block';
    document.getElementById('report-preview').scrollIntoView({ behavior: 'smooth' });
}

function updateReportPreview() {
    const systemType = document.getElementById('system-type').value;
    const data = systemType === 'ongrid' ? systemData.onGrid : systemData.offGrid;
    
    // Update components preview
    const componentsHtml = data.components.map(comp => `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
            <span>${comp.qty} ${comp.name}</span>
            <span style="font-weight: bold;">${formatCurrency(comp.qty * comp.price)}</span>
        </div>
    `).join('');
    
    document.getElementById('preview-components').innerHTML = componentsHtml + `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-weight: bold; font-size: 1.125rem;">
            <span>TOTAL INVERSIÓN</span>
            <span>${formatCurrency(data.totalCost)}</span>
        </div>
    `;
    
    // Update diagram preview
    const diagramContainer = document.getElementById('preview-diagram');
    if (systemType === 'ongrid') {
        diagramContainer.innerHTML = createOnGridDiagram();
    } else {
        diagramContainer.innerHTML = createOffGridDiagram();
    }
}

function generatePDF() {
    const clientName = document.getElementById('client-name').value;
    const clientEmail = document.getElementById('client-email').value;
    const clientPhone = document.getElementById('client-phone').value;
    const clientAddress = document.getElementById('client-address').value;
    const systemType = document.getElementById('system-type').value;
    const installationType = document.getElementById('installation-type').value;
    const roofType = document.getElementById('roof-type').value;
    const projectNotes = document.getElementById('project-notes').value;
    
    if (!clientName || !clientEmail) {
        alert('Por favor complete los datos del cliente');
        return;
    }
    
    if (!systemData.onGrid.totalCost) {
        alert('Por favor calcule primero el sistema solar');
        return;
    }
    
    // Show loading
    document.getElementById('loading-spinner').style.display = 'flex';
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const data = systemType === 'ongrid' ? systemData.onGrid : systemData.offGrid;
    
    // Colors
    const primaryColor = [37, 99, 235];
    const secondaryColor = [16, 185, 129];
    const grayColor = [107, 114, 128];
    
    // Add watermark
    doc.setFontSize(80);
    doc.setTextColor(230);
    doc.text('Synergyatech', 105, 150, { align: 'center', angle: 45 });
    
    // Reset text color
    doc.setTextColor(0);
    
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo
    doc.setFillColor(255);
    doc.circle(30, 20, 12, 'F');
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255);
    doc.text('S', 30, 26, { align: 'center' });
    
    // Title
    doc.setFontSize(24);
    doc.text('Propuesta Sistema Fotovoltaico', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(systemType === 'ongrid' ? 'Sistema Conectado a Red' : 'Sistema Aislado', 105, 30, { align: 'center' });
    
    // Client info box
    doc.setTextColor(0);
    doc.setFillColor(248, 249, 250);
    doc.rect(15, 50, 180, 35, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', 20, 58);
    
    doc.setFont(undefined, 'normal');
    doc.text(`Cliente: ${clientName}`, 20, 66);
    doc.text(`Email: ${clientEmail}`, 20, 72);
    doc.text(`Teléfono: ${clientPhone || 'No especificado'}`, 20, 78);
    doc.text(`Dirección: ${clientAddress || 'No especificada'}`, 105, 66);
    doc.text(`Tipo de instalación: ${installationType}`, 105, 72);
    doc.text(`Tipo de techo: ${roofType}`, 105, 78);
    
    // Executive Summary
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('RESUMEN EJECUTIVO', 20, 95);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0);
    const summaryText = `Basado en el análisis realizado, recomendamos un sistema fotovoltaico de ${data.actualSystemSize.toFixed(2)} kW que generará aproximadamente ${(data.yearlyGeneration).toFixed(0)} kWh anuales. Esta solución permitirá un ahorro mensual estimado de ${formatCurrency(data.monthlySavings)} con un retorno de inversión en ${(data.totalCost / (data.monthlySavings * 12)).toFixed(1)} años.`;
    
    const summaryLines = doc.splitTextToSize(summaryText, 170);
    doc.text(summaryLines, 20, 103);
    
    // System Components
    let yPos = 125;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('COMPONENTES DEL SISTEMA', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0);
    
    // Components table
    const tableHeaders = [['Componente', 'Cantidad', 'Precio Unitario', 'Precio Total']];
    const tableData = data.components.map(comp => [
        comp.name,
        `${comp.qty} ${comp.unit}`,
        formatCurrency(comp.price),
        formatCurrency(comp.qty * comp.price)
    ]);
    
    // Add installation
    tableData.push([
        'Instalación y puesta en marcha',
        '1 servicio',
        '-',
        formatCurrency(data.installationCost)
    ]);
    
    doc.autoTable({
        head: tableHeaders,
        body: tableData,
        startY: yPos,
        headStyles: {
            fillColor: primaryColor,
            fontSize: 10
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 40, halign: 'right' }
        }
    });
    
    yPos = doc.lastAutoTable.finalY + 5;
    
    // Total
    doc.setFont(undefined, 'bold');
    doc.setFillColor(...secondaryColor);
    doc.rect(15, yPos, 180, 12, 'F');
    doc.setTextColor(255);
    doc.text('INVERSIÓN TOTAL:', 20, yPos + 8);
    doc.text(formatCurrency(data.totalCost), 175, yPos + 8, { align: 'right' });
    
    // Financial Analysis (new page)
    doc.addPage();
    
    // Add watermark on new page
    doc.setFontSize(80);
    doc.setTextColor(230);
    doc.text('Synergyatech', 105, 150, { align: 'center', angle: 45 });
    doc.setTextColor(0);
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('ANÁLISIS FINANCIERO', 20, 30);
    
    // Financial metrics boxes
    const metrics = [
        { label: 'Ahorro mensual estimado', value: formatCurrency(data.monthlySavings) },
        { label: 'Período de recuperación', value: `${(data.totalCost / (data.monthlySavings * 12)).toFixed(1)} años` },
        { label: 'TIR a 20 años', value: `${calculateIRR(data).toFixed(1)}%` },
        { label: 'Ahorro total (20 años)', value: formatCurrency((data.monthlySavings * 12 * 20) - data.totalCost) }
    ];
    
    let xPos = 20;
    yPos = 45;
    
    metrics.forEach((metric, index) => {
        if (index === 2) {
            xPos = 20;
            yPos = 85;
        }
        
        doc.setFillColor(248, 249, 250);
        doc.rect(xPos, yPos, 85, 30, 'F');
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grayColor);
        doc.text(metric.label, xPos + 42.5, yPos + 10, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(metric.value, xPos + 42.5, yPos + 22, { align: 'center' });
        
        xPos += 90;
    });
    
    // Environmental Impact
    yPos = 125;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('IMPACTO AMBIENTAL', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0);
    
    const co2Reduction = data.yearlyGeneration * 0.126;
    doc.text(`• Reducción de CO₂: ${Math.round(co2Reduction).toLocaleString()} kg/año`, 25, yPos);
    doc.text(`• Equivalente a plantar ${Math.round(co2Reduction / 21.77)} árboles`, 25, yPos + 7);
    doc.text(`• Equivalente a dejar de conducir ${Math.round(co2Reduction / 0.12).toLocaleString()} km en auto`, 25, yPos + 14);
    
    // Incentives
    yPos += 30;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('INCENTIVOS TRIBUTARIOS APLICABLES', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0);
    
    const incentives = [
        '✓ Exclusión de IVA (19%) para equipos de energía solar',
        '✓ Deducción hasta del 50% de la inversión en el impuesto de renta',
        '✓ Depreciación acelerada de activos (hasta 33.33% anual)',
        '✓ Exención de aranceles para equipos importados'
    ];
    
    incentives.forEach((incentive, index) => {
        doc.text(incentive, 25, yPos + (index * 7));
    });
    
    // Timeline
    yPos += 40;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('CRONOGRAMA DE IMPLEMENTACIÓN', 20, yPos);
    
    yPos += 10;
    const timeline = [
        ['Semana 1', 'Ingeniería de detalle y permisos'],
        ['Semana 2-3', 'Adquisición de equipos'],
        ['Semana 4', 'Instalación de estructura y paneles'],
        ['Semana 5', 'Conexiones eléctricas y pruebas'],
        ['Semana 6', 'Puesta en marcha y capacitación']
    ];
    
    doc.autoTable({
        body: timeline,
        startY: yPos,
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 30, fontStyle: 'bold' },
            1: { cellWidth: 150 }
        }
    });
    
    // Footer with contact info
    yPos = 260;
    doc.setFillColor(...primaryColor);
    doc.rect(0, yPos, 210, 37, 'F');
    
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('¿Por qué elegir Synergyatech?', 105, yPos + 8, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Más de 10 años de experiencia • Ingenieros certificados • Garantía de calidad', 105, yPos + 16, { align: 'center' });
    
    doc.setFont(undefined, 'bold');
    doc.text('Contáctanos: info@synergyatech.com | +57 300 123 4567 | www.synergyatech.com', 105, yPos + 26, { align: 'center' });
    
    // Notes page if needed
    if (projectNotes || document.getElementById('include-diagram').checked) {
        doc.addPage();
        
        // Add watermark
        doc.setFontSize(80);
        doc.setTextColor(230);
        doc.text('Synergyatech', 105, 150, { align: 'center', angle: 45 });
        doc.setTextColor(0);
        
        yPos = 30;
        
        if (document.getElementById('include-diagram').checked) {
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('ESQUEMA DE CONEXIÓN', 20, yPos);
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0);
            doc.text('El siguiente diagrama muestra la configuración del sistema propuesto:', 20, yPos + 10);
            
            // Add simplified diagram description
            yPos += 20;
            if (systemType === 'ongrid') {
                doc.text('Sistema On-Grid:', 20, yPos);
                doc.text('1. Paneles Solares → 2. Inversor On-Grid → 3. Medidor Bidireccional → 4. Red Eléctrica', 25, yPos + 7);
                doc.text('Permite venta de excedentes de energía a la red.', 25, yPos + 14);
            } else {
                doc.text('Sistema Off-Grid:', 20, yPos);
                doc.text('1. Paneles Solares → 2. Controlador MPPT → 3. Banco de Baterías → 4. Inversor → 5. Casa', 25, yPos + 7);
                doc.text('Sistema independiente con almacenamiento en baterías.', 25, yPos + 14);
            }
            
            yPos += 30;
        }
        
        if (projectNotes) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('NOTAS DEL PROYECTO', 20, yPos);
            
            yPos += 10;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0);
            
            const notesLines = doc.splitTextToSize(projectNotes, 170);
            doc.text(notesLines, 20, yPos);
        }
    }
    
    // Save PDF
    const fileName = `Propuesta_Solar_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    // Hide loading
    setTimeout(() => {
        document.getElementById('loading-spinner').style.display = 'none';
    }, 1000);
}

// ===================================
// UTILITY FUNCTIONS
// ===================================
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function initializeModals() {
    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}