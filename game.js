// Game State
const gameState = {
    character: null,
    difficulty: null,
    score: 0,
    shiftTime: 180, // Will be set based on difficulty
    beds: { total: 10, available: 10 },
    staff: [],
    budget: 5000,
    patients: [],
    waitingQueue: [],
    treatedPatients: [],
    savedCount: 0,
    lostCount: 0,
    accuracyCount: 0,
    totalAssessments: 0,
    isPaused: false,
    dilemmaActive: false,
    dilemmaCount: 0 // Track number of dilemmas shown
};

// Medical Conditions with weighted frequencies
const medicalConditions = [
    { name: "Cardiac arrest", priority: 5, symptoms: ["No pulse", "Not breathing", "Unconscious"], frequency: 2 },
    { name: "Severe trauma", priority: 5, symptoms: ["Heavy bleeding", "Multiple injuries", "Shock"], frequency: 3 },
    { name: "Stroke", priority: 5, symptoms: ["Facial drooping", "Arm weakness", "Speech difficulty"], frequency: 3 },
    { name: "Respiratory failure", priority: 5, symptoms: ["Can't breathe", "Blue lips", "Gasping"], frequency: 2 },
    { name: "Anaphylactic shock", priority: 5, symptoms: ["Swelling", "Hives", "Difficulty breathing"], frequency: 2 },
    { name: "Heart attack", priority: 4, symptoms: ["Chest pain", "Shortness of breath", "Sweating"], frequency: 4 },
    { name: "Severe burns", priority: 4, symptoms: ["Third-degree burns", "Large area affected", "Pain"], frequency: 3 },
    { name: "Head injury", priority: 4, symptoms: ["Confusion", "Vomiting", "Loss of consciousness"], frequency: 4 },
    { name: "Sepsis", priority: 4, symptoms: ["High fever", "Rapid heart rate", "Confusion"], frequency: 3 },
    { name: "Diabetic emergency", priority: 4, symptoms: ["Unconscious", "Sweet breath", "Sweating"], frequency: 4 },
    { name: "Severe asthma", priority: 3, symptoms: ["Wheezing", "Can't speak full sentences", "Anxiety"], frequency: 5 },
    { name: "Broken bones", priority: 3, symptoms: ["Visible deformity", "Severe pain", "Can't move limb"], frequency: 6 },
    { name: "Kidney stones", priority: 3, symptoms: ["Severe back pain", "Blood in urine", "Nausea"], frequency: 5 },
    { name: "Severe dehydration", priority: 3, symptoms: ["Dizziness", "Rapid heartbeat", "No urination"], frequency: 5 },
    { name: "High fever", priority: 3, symptoms: ["Temperature 103°F+", "Chills", "Weakness"], frequency: 6 },
    { name: "Moderate laceration", priority: 2, symptoms: ["Deep cut", "Bleeding controlled", "Needs stitches"], frequency: 7 },
    { name: "Migraine", priority: 2, symptoms: ["Severe headache", "Light sensitivity", "Nausea"], frequency: 8 },
    { name: "Food poisoning", priority: 2, symptoms: ["Vomiting", "Diarrhea", "Stomach cramps"], frequency: 8 },
    { name: "Sprained ankle", priority: 1, symptoms: ["Swelling", "Pain when walking", "Bruising"], frequency: 10 },
    { name: "Common cold", priority: 1, symptoms: ["Runny nose", "Cough", "Mild fever"], frequency: 10 }
];

// Character abilities
const characterAbilities = {
    veteran: {
        name: "Dr. Saniel",
        diagnosisBonus: 0.1,
        speedBonus: 0,
        comfortBonus: 0,
        extraBeds: 0
    },
    empath: {
        name: "Nurse Ihris",
        diagnosisBonus: 0,
        speedBonus: 0,
        comfortBonus: 0.15,
        extraBeds: 0
    },
    efficient: {
        name: "Dr. Dunny",
        diagnosisBonus: 0,
        speedBonus: 0.2,
        comfortBonus: 0,
        extraBeds: 0
    },
    resourceful: {
        name: "Dr. Ssaac",
        diagnosisBonus: 0,
        speedBonus: 0,
        comfortBonus: 0,
        extraBeds: 2
    }
};

// Difficulty settings
const difficultySettings = {
    easy: { patientRate: 3, startBudget: 7000, staffCount: 12, gameTime: 300 }, // 5 minutes
    medium: { patientRate: 2, startBudget: 5000, staffCount: 10, gameTime: 180 }, // 3 minutes
    hard: { patientRate: 1, startBudget: 3000, staffCount: 8, gameTime: 60 } // 1 minute - fixed!
};


function setupCharacterSelection() {
    const characterCards = document.querySelectorAll('.character-card');
    const difficultyButtons = document.querySelectorAll('[data-difficulty]');
    
    characterCards.forEach(card => {
        card.addEventListener('click', () => {
            characterCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            gameState.character = card.dataset.character;
            checkReadyToStart();
        });
    });
    
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            gameState.difficulty = btn.dataset.difficulty;
            checkReadyToStart();
        });
    });
}

function checkReadyToStart() {
    if (gameState.character && gameState.difficulty) {
        // Show start button
        let startBtn = document.getElementById('start-game-btn');
        if (!startBtn) {
            startBtn = document.createElement('button');
            startBtn.id = 'start-game-btn';
            startBtn.className = 'pixel-btn start-btn';
            startBtn.textContent = 'START GAME';
            startBtn.onclick = startGame;
            document.querySelector('.difficulty-select').appendChild(startBtn);
        }
        startBtn.style.display = 'block';
    }
}

function startGame() {
    // Hide character select, show game screen
    document.getElementById('character-select').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    // Apply difficulty settings
    const settings = difficultySettings[gameState.difficulty];
    gameState.budget = settings.startBudget;
    gameState.staff = generateStaff(settings.staffCount);
    gameState.shiftTime = settings.gameTime; // Set base time from difficulty
    
    // Apply character bonuses
    const character = characterAbilities[gameState.character];
    if (character.speedBonus > 0) {
        // Speed bonus gives extra time (20% more time)
        gameState.shiftTime = Math.round(gameState.shiftTime * (1 + character.speedBonus));
    }
    if (character.comfortBonus > 0) {
        // Comfort bonus reduces patient deterioration rate
        gameState.comfortBonus = character.comfortBonus;
    }
    if (character.extraBeds > 0) {
        // Resource manager gets extra beds
        gameState.beds.total += character.extraBeds;
        gameState.beds.available += character.extraBeds;
    }
    
    // Initialize UI
    updateUI();
    populateStaffSelect();
    initializeBeds();
    
    // Start game loop
    startGameLoop();
    startPatientGeneration(settings.patientRate);
}

function generateStaff(count) {
    const staffTypes = ['Doctor', 'Nurse', 'Specialist'];
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Blake', 'Cameron', 'Drew', 'Sage'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin'];
    const staff = [];
    
    for (let i = 0; i < count; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
        const staffType = staffTypes[i % 3];
        
        staff.push({
            id: i,
            name: `${staffType} ${firstName} ${lastName}`,
            type: staffType,
            available: true,
            efficiency: 0.8 + Math.random() * 0.4
        });
    }
    
    return staff;
}

function populateStaffSelect() {
    const select = document.getElementById('staff-select');
    select.innerHTML = '<option value="">Select staff...</option>';
    
    gameState.staff.forEach(staff => {
        if (staff.available) {
            const option = document.createElement('option');
            option.value = staff.id;
            option.textContent = `${staff.name} (${staff.type})`;
            select.appendChild(option);
        }
    });
}

function initializeBeds() {
    const bedsContainer = document.getElementById('treatment-beds');
    bedsContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.beds.total; i++) {
        const bed = document.createElement('div');
        bed.className = 'bed empty';
        bed.dataset.bedId = i;
        bed.innerHTML = `<p>Bed ${i + 1}</p><p>Empty</p>`;
        bedsContainer.appendChild(bed);
    }
}

function generatePatient() {
    // Weighted random selection based on frequency
    const totalFrequency = medicalConditions.reduce((sum, c) => sum + c.frequency, 0);
    let random = Math.random() * totalFrequency;
    let condition = null;
    
    for (const cond of medicalConditions) {
        random -= cond.frequency;
        if (random <= 0) {
            condition = cond;
            break;
        }
    }
    
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Robert', 'Mary'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    
    const patient = {
        id: Date.now() + Math.random(),
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        age: 18 + Math.floor(Math.random() * 70),
        condition: condition.name,
        actualPriority: condition.priority,
        symptoms: condition.symptoms,
        arrivalTime: Date.now(),
        vitalSigns: generateVitalSigns(condition.priority),
        deteriorationRate: condition.priority >= 4 ? 0.001 : 0.0001,
        comfortLevel: gameState.comfortBonus || 0
    };
    
    return patient;
}

function generateVitalSigns(priority) {
    const vitals = {
        pulse: 60 + Math.floor(Math.random() * 40),
        bp: `${110 + Math.floor(Math.random() * 40)}/${70 + Math.floor(Math.random() * 20)}`,
        temp: 36.5 + (Math.random() * 2),
        respRate: 12 + Math.floor(Math.random() * 8)
    };
    
    // Adjust vitals based on condition severity
    if (priority >= 4) {
        vitals.pulse = priority === 5 ? 0 : 120 + Math.floor(Math.random() * 40);
        vitals.bp = priority === 5 ? "0/0" : `${80 + Math.floor(Math.random() * 20)}/${40 + Math.floor(Math.random() * 20)}`;
        vitals.respRate = priority === 5 ? 0 : 24 + Math.floor(Math.random() * 12);
    }
    
    return vitals;
}

function startPatientGeneration(rate) {
    // Generate initial patients
    for (let i = 0; i < 5; i++) {
        gameState.waitingQueue.push(generatePatient());
    }
    updateWaitingRoom();
    
    // Continue generating patients - faster rate for 3-minute game
    const patientGenerationInterval = setInterval(() => {
        if (gameState.waitingQueue.length < 15 && !gameState.isPaused) {
            gameState.waitingQueue.push(generatePatient());
            updateWaitingRoom();
            
            // Chance for dilemma - max 3 per game
            if (Math.random() < 0.05 && !gameState.dilemmaActive && gameState.dilemmaCount < 3) {
                triggerDilemma();
            }
        }
    }, rate * 5000); // Much faster patient generation for 3-minute game
    
    gameIntervals.push(patientGenerationInterval);
}

function updateWaitingRoom() {
    const queueContainer = document.getElementById('patient-queue');
    queueContainer.innerHTML = '';
    
    gameState.waitingQueue.forEach(patient => {
        const card = document.createElement('div');
        card.className = 'patient-card';
        if (patient.actualPriority >= 5) card.classList.add('critical');
        card.dataset.patientId = patient.id;
        
        card.innerHTML = `
            <h4>${patient.name}</h4>
            <p>Age: ${patient.age}</p>
            <p>Complaint: ${patient.symptoms[0]}</p>
            <p>Wait: ${Math.floor((Date.now() - patient.arrivalTime) / 60000)}min</p>
        `;
        
        card.addEventListener('click', () => selectPatient(patient.id));
        queueContainer.appendChild(card);
    });
}

function selectPatient(patientId) {
    const patient = gameState.waitingQueue.find(p => p.id === patientId);
    if (!patient) return;
    
    // Store the selected patient ID globally
    gameState.selectedPatientId = patientId;
    
    // Update UI selection
    document.querySelectorAll('.patient-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-patient-id="${patientId}"]`).classList.add('selected');
    
    // Display patient details
    const detailContainer = document.getElementById('current-patient');
    detailContainer.innerHTML = `
        <h4>${patient.name}</h4>
        <p>Age: ${patient.age} | Wait time: ${Math.floor((Date.now() - patient.arrivalTime) / 60000)} minutes</p>
        <div class="symptoms">
            <p><strong>Symptoms:</strong></p>
            ${patient.symptoms.map(s => `<p>• ${s}</p>`).join('')}
        </div>
        <div class="vital-signs">
            <div class="vital">Pulse: <span>${patient.vitalSigns.pulse} bpm</span></div>
            <div class="vital">BP: <span>${patient.vitalSigns.bp}</span></div>
            <div class="vital">Temp: <span>${patient.vitalSigns.temp.toFixed(1)}°C</span></div>
            <div class="vital">Resp: <span>${patient.vitalSigns.respRate}/min</span></div>
        </div>
    `;
    
    // Clear any previous priority selection
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Reset staff selection
    document.getElementById('staff-select').value = '';
    
    // Setup priority buttons
    setupPriorityButtons(patientId);
}

function setupPriorityButtons(patientId) {
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.onclick = () => {
            // Remove selected class from all priority buttons
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('selected'));
            // Add selected class to clicked button
            btn.classList.add('selected');
            assignPriority(patientId, parseInt(btn.dataset.priority));
            // Keep the patient selected after assigning priority
            maintainPatientSelection(patientId);
        };
    });
}

function maintainPatientSelection(patientId) {
    // Ensure patient card stays selected
    document.querySelectorAll('.patient-card').forEach(card => {
        card.classList.remove('selected');
    });
    const patientCard = document.querySelector(`[data-patient-id="${patientId}"]`);
    if (patientCard) {
        patientCard.classList.add('selected');
    }
    // Update global state
    gameState.selectedPatientId = patientId;
}

function assignPriority(patientId, priority) {
    const patient = gameState.waitingQueue.find(p => p.id === patientId);
    if (!patient) return;
    
    patient.assignedPriority = priority;
    
    // Just store the accuracy for later - don't give points yet
    const isAccurate = Math.abs(patient.actualPriority - priority) <= 1;
    patient.wasAccuratelyTriaged = isAccurate;
    
    updateUI();
}

function showPointsPopup(points) {
    const popup = document.getElementById('points-popup');
    const text = document.getElementById('points-text');
    
    popup.className = 'points-popup show';
    if (points > 0) {
        popup.classList.add('positive');
        text.textContent = `+${points} POINTS!`;
    } else {
        popup.classList.add('negative');
        text.textContent = `${points} POINTS`;
    }
    
    // Remove popup after animation
    setTimeout(() => {
        popup.classList.remove('show', 'positive', 'negative');
    }, 2000);
}

// Manual assign when button is clicked
document.addEventListener('DOMContentLoaded', () => {
    // Always start with character selection screen
    document.getElementById('character-select').classList.add('active');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('game-over').classList.remove('active');
    
    setupCharacterSelection();
    loadLeaderboard();
    
    // Set up assign button handler
    setTimeout(() => {
        const assignBtn = document.getElementById('assign-btn');
        if (assignBtn) {
            assignBtn.addEventListener('click', () => {
                const selectedStaffId = document.getElementById('staff-select').value;
                
                // Use the globally stored patient ID
                if (!gameState.selectedPatientId) {
                    alert('Please select a patient first.');
                    return;
                }
                
                const patient = gameState.waitingQueue.find(p => p.id === gameState.selectedPatientId);
                
                if (!patient) {
                    alert('Patient not found. Please select a patient from the waiting room.');
                    return;
                }
                
                if (!patient.assignedPriority) {
                    alert('Please assign a priority level first.');
                    return;
                }
                
                if (!selectedStaffId) {
                    alert('Please select a staff member.');
                    return;
                }
                
                const staff = gameState.staff.find(s => s.id == selectedStaffId);
                if (!staff) {
                    alert('Staff member not found.');
                    return;
                }
                
                // Assign to bed
                assignPatientToBed(patient, staff);
            });
        }
        
        // Set up play again button
        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) {
            console.log('Setting up Play Again button...');
            playAgainBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Play Again button clicked!');
                restartGame();
            });
        }
    }, 1000);
});

function assignPatientToBed(patient, staff) {
    // Find available bed (empty beds only, not discharged/deceased ones)
    const availableBed = Array.from(document.querySelectorAll('.bed.empty'))[0];
    if (!availableBed) {
        alert('All beds are occupied! No more patients can be treated.');
        return;
    }
    
    // Move patient from waiting room to treatment bed
    gameState.waitingQueue = gameState.waitingQueue.filter(p => p.id !== patient.id);
    staff.available = false;
    // Don't manually track beds.available - we count empty beds directly
    
    // Visual update - show patient occupying the bed
    availableBed.classList.remove('empty');
    availableBed.classList.add('occupied');
    const priorityNames = {
        5: 'CRITICAL',
        4: 'URGENT', 
        3: 'SERIOUS',
        2: 'STABLE',
        1: 'MINOR'
    };
    const priorityColors = {
        5: '#ff0000',
        4: '#ff6600', 
        3: '#ffaa00',
        2: '#ffff00',
        1: '#00ff00'
    };
    
    availableBed.innerHTML = `
        <div style="text-align: center;">
            <p style="font-weight: bold; font-size: 10px; margin: 2px 0;">${patient.name}</p>
            <p style="font-size: 8px; color: var(--text-secondary); margin: 1px 0;">${staff.name}</p>
            <p style="color: ${priorityColors[patient.assignedPriority]}; font-size: 8px; font-weight: bold; margin: 2px 0;">${priorityNames[patient.assignedPriority]}</p>
            <p style="font-size: 7px; color: var(--text-secondary);">Bed ${parseInt(availableBed.dataset.bedId) + 1}</p>
        </div>
    `;
    
    // Award points after complete triage process
    let pointsEarned = 0;
    if (patient.wasAccuratelyTriaged) {
        gameState.accuracyCount++;
        const characterBonus = gameState.character ? characterAbilities[gameState.character].diagnosisBonus : 0;
        pointsEarned = Math.round(100 * (1 + characterBonus));
        gameState.score += pointsEarned;
    } else {
        pointsEarned = -50;
        gameState.score -= 50;
    }
    gameState.totalAssessments++;
    
    // Show points popup
    showPointsPopup(pointsEarned);
    
    // Start treatment timer (affected by efficiency expert bonus)
    const speedMultiplier = gameState.character === 'efficient' ? 0.8 : 1;
    const treatmentTime = (6 - patient.assignedPriority) * 10000 * staff.efficiency * speedMultiplier;
    setTimeout(() => completetreatment(patient, staff, availableBed), treatmentTime);
    
    // Update UI and clear selections
    updateWaitingRoom();
    populateStaffSelect();
    updateUI();
    
    // Clear current patient selection and global state
    gameState.selectedPatientId = null;
    document.getElementById('current-patient').innerHTML = '<p>No patient selected</p>';
    document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('staff-select').value = '';
    document.querySelectorAll('.patient-card').forEach(card => card.classList.remove('selected'));
}

function completetreatment(patient, staff, bed) {
    // Release staff but keep bed occupied
    staff.available = true;
    
    // Determine outcome
    const survived = Math.random() > (patient.actualPriority * 0.1);
    if (survived) {
        gameState.savedCount++;
        gameState.score += 200;
    } else {
        gameState.lostCount++;
        gameState.score -= 100;
    }
    
    // Update bed display to show treated patient - but keep bed occupied
    bed.classList.remove('occupied');
    bed.classList.add(survived ? 'discharged' : 'deceased');
    bed.innerHTML = `
        <div style="text-align: center;">
            <p style="font-weight: bold; font-size: 10px; margin: 2px 0;">${patient.name}</p>
            <p class="outcome" style="font-size: 9px; font-weight: bold; margin: 2px 0;">${survived ? 'DISCHARGED' : 'DECEASED'}</p>
            <p style="font-size: 7px; color: var(--text-secondary);">Bed ${parseInt(bed.dataset.bedId) + 1}</p>
        </div>
    `;
    
    gameState.treatedPatients.push({ ...patient, survived });
    
    // Bed stays occupied - don't change gameState.beds.available
    // Only release staff for reassignment
    populateStaffSelect();
    updateUI();
}

function triggerDilemma() {
    gameState.dilemmaActive = true;
    gameState.isPaused = true;
    gameState.dilemmaCount++;
    
    const dilemmas = [
        {
            text: "Emergency! A multi-car accident just arrived with 5 critical patients, but you only have 2 beds available. What do you do?",
            choices: [
                { 
                    text: "Discharge 3 stable patients early to make room", 
                    effect: () => { 
                        // Free up 3 beds and fill with new critical patients
                        const freedBeds = freeUpBeds(3);
                        // Add new critical patients to freed beds
                        freedBeds.forEach((bed, index) => {
                            const criticalPatient = {
                                name: `Accident Victim ${index + 1}`,
                                actualPriority: 5,
                                priority: 5
                            };
                            bed.classList.remove('empty');
                            bed.classList.add('occupied');
                            bed.innerHTML = `
                                <p>${criticalPatient.name}</p>
                                <p style="color: #ff0000;">EMERGENCY</p>
                                <p class="small">Critical condition</p>
                            `;
                            gameState.beds.available--;
                            // Auto-complete treatment after short time
                            setTimeout(() => {
                                gameState.beds.available++;
                                completetreatment(criticalPatient, { available: false }, bed);
                            }, 15000);
                        });
                        gameState.score += 150;
                        showPointsPopup(150);
                    } 
                },
                { 
                    text: "Only treat the 2 most critical", 
                    effect: () => { 
                        gameState.lostCount += 3; 
                        gameState.savedCount += 2;
                        gameState.score -= 100;
                        showPointsPopup(-100);
                    } 
                }
            ]
        },
        {
            text: "Crisis! The hospital generator failed. You must evacuate 4 patients from life support. Two are young with good chances, two are elderly with poor prognosis. Who gets the portable equipment?",
            choices: [
                { 
                    text: "Save the younger patients", 
                    effect: () => { 
                        const beds = freeUpBeds(2, true); // Mark as deceased
                        gameState.savedCount += 2;
                        gameState.lostCount += 2;
                        gameState.score += 50;
                        showPointsPopup(50);
                    } 
                },
                { 
                    text: "First come, first served", 
                    effect: () => { 
                        const beds = freeUpBeds(2, true);
                        gameState.savedCount += 2;
                        gameState.lostCount += 2;
                        gameState.score += 100;
                        showPointsPopup(100);
                    } 
                },
                { 
                    text: "Try to save all four (risky)", 
                    effect: () => { 
                        if (Math.random() > 0.3) {
                            gameState.savedCount += 4;
                            gameState.score += 200;
                            showPointsPopup(200);
                        } else {
                            const beds = freeUpBeds(4, true);
                            gameState.lostCount += 4;
                            gameState.score -= 200;
                            showPointsPopup(-200);
                        }
                    } 
                }
            ]
        }
    ];
    
    const dilemma = dilemmas[Math.floor(Math.random() * dilemmas.length)];
    const modal = document.getElementById('dilemma-modal');
    document.getElementById('dilemma-text').textContent = dilemma.text;
    
    const choicesContainer = document.querySelector('.dilemma-choices');
    choicesContainer.innerHTML = '';
    
    dilemma.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'pixel-btn';
        btn.textContent = choice.text;
        btn.onclick = () => {
            choice.effect();
            modal.classList.remove('active');
            gameState.dilemmaActive = false;
            gameState.isPaused = false;
            updateUI();
        };
        choicesContainer.appendChild(btn);
    });
    
    modal.classList.add('active');
}

function freeUpBeds(count, markAsDeceased = false) {
    const occupiedBeds = document.querySelectorAll('.bed.occupied');
    const bedsToFree = Math.min(count, occupiedBeds.length);
    const freedBeds = [];
    
    for (let i = 0; i < bedsToFree; i++) {
        const bed = occupiedBeds[i];
        
        if (markAsDeceased) {
            // Show patient died
            const patientName = bed.querySelector('p').textContent;
            bed.classList.remove('occupied');
            bed.classList.add('deceased');
            bed.innerHTML = `
                <p>${patientName}</p>
                <p class="outcome">Deceased</p>
                <p class="small">Life support failed</p>
            `;
            // Clear after delay
            setTimeout(() => {
                bed.classList.remove('deceased');
                bed.classList.add('empty');
                bed.innerHTML = `<p>Bed ${parseInt(bed.dataset.bedId) + 1}</p><p>Empty</p>`;
            }, 5000);
        } else {
            bed.classList.remove('occupied');
            bed.classList.add('empty');
            bed.innerHTML = `<p>Bed ${parseInt(bed.dataset.bedId) + 1}</p><p>Empty</p>`;
        }
        
        gameState.beds.available++;
        freedBeds.push(bed);
        
        // Return staff to available
        const staffName = bed.textContent.match(/(?:Doctor|Nurse|Specialist)\s+\w+/);
        if (staffName) {
            const staff = gameState.staff.find(s => s.name === staffName[0]);
            if (staff) staff.available = true;
        }
    }
    
    populateStaffSelect();
    return freedBeds;
}

function startGameLoop() {
    const gameLoopInterval = setInterval(() => {
        if (!gameState.isPaused && gameState.shiftTime > 0) {
            gameState.shiftTime--;
            
            // Update timer display
            const hours = Math.floor(gameState.shiftTime / 60);
            const minutes = gameState.shiftTime % 60;
            document.getElementById('timer-display').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            // Patient deterioration (reduced by comfort bonus)
            gameState.waitingQueue.forEach(patient => {
                const adjustedRate = patient.deteriorationRate * (1 - patient.comfortLevel);
                if (Math.random() < adjustedRate) {
                    patient.actualPriority = Math.min(5, patient.actualPriority + 1);
                    updateWaitingRoom();
                }
            });
            
            // Check for game over
            if (gameState.shiftTime <= 0) {
                endGame();
            }
        }
    }, 1000);
    
    gameIntervals.push(gameLoopInterval);
}

function updateUI() {
    // Count actually empty beds (not discharged/deceased)
    const emptyBeds = document.querySelectorAll('.bed.empty').length;
    document.getElementById('beds-count').textContent = `${emptyBeds}/${gameState.beds.total}`;
    document.getElementById('staff-count').textContent = 
        `${gameState.staff.filter(s => s.available).length}/${gameState.staff.length}`;
    document.getElementById('budget').textContent = `$${gameState.budget}`;
    document.getElementById('score-display').textContent = gameState.score;
}

function endGame() {
    // Count untriaged patients as lost
    const untriagedCount = gameState.waitingQueue.length;
    gameState.lostCount += untriagedCount;
    gameState.score -= untriagedCount * 100; // Penalty for each untriaged patient
    
    // Calculate final stats
    const accuracy = gameState.totalAssessments > 0 
        ? Math.round((gameState.accuracyCount / gameState.totalAssessments) * 100) 
        : 0;
    
    // Save to leaderboard
    saveToLeaderboard({
        name: characterAbilities[gameState.character].name,
        score: gameState.score,
        saved: gameState.savedCount,
        lost: gameState.lostCount,
        accuracy: accuracy,
        difficulty: gameState.difficulty,
        date: new Date().toLocaleDateString()
    });
    
    // Show game over screen
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('game-over').classList.add('active');
    
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('patients-saved').textContent = gameState.savedCount;
    document.getElementById('patients-lost').textContent = `${gameState.lostCount} (${untriagedCount} untriaged)`;
    document.getElementById('accuracy-rate').textContent = accuracy;
    
    displayLeaderboard();
}

function saveToLeaderboard(entry) {
    // Save to specific category
    const categoryKey = `leaderboard_${gameState.character}_${gameState.difficulty}`;
    let categoryLeaderboard = JSON.parse(localStorage.getItem(categoryKey) || '[]');
    categoryLeaderboard.push(entry);
    categoryLeaderboard.sort((a, b) => b.score - a.score);
    categoryLeaderboard = categoryLeaderboard.slice(0, 20);
    localStorage.setItem(categoryKey, JSON.stringify(categoryLeaderboard));
    
    // Also save to global leaderboard
    let globalLeaderboard = JSON.parse(localStorage.getItem('leaderboard_global') || '[]');
    globalLeaderboard.push({
        ...entry,
        character: gameState.character,
        characterName: characterAbilities[gameState.character].name
    });
    globalLeaderboard.sort((a, b) => b.score - a.score);
    globalLeaderboard = globalLeaderboard.slice(0, 50); // Keep top 50 globally
    localStorage.setItem('leaderboard_global', JSON.stringify(globalLeaderboard));
}

function loadLeaderboard() {
    // Set up filter buttons when game loads
    setTimeout(() => {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                displayLeaderboard(btn.dataset.filter);
            });
        });
    }, 100);
}

// Give up functionality
function confirmGiveUp() {
    if (confirm('Are you sure you want to give up? Your current progress will be lost.')) {
        gameState.shiftTime = 0; // Force end game
        endGame();
    }
}

// Make function available globally
window.confirmGiveUp = confirmGiveUp;

// Store interval IDs to clear them on restart
let gameIntervals = [];

// Restart game function
function restartGame() {
    console.log('PLAY AGAIN button clicked - restarting game...');
    
    try {
        // Simple reload as a fallback
        window.location.reload();
    } catch (error) {
        console.error('Error restarting game:', error);
        // If reload fails, try the manual reset
        
        // Clear all running intervals
        if (typeof gameIntervals !== 'undefined') {
            gameIntervals.forEach(intervalId => clearInterval(intervalId));
            gameIntervals = [];
        }
        
        // Clear all timeouts
        for (let i = 0; i < 10000; i++) {
            clearTimeout(i);
        }
        
        // Reset all game state
        gameState.character = null;
        gameState.difficulty = null;
        gameState.score = 0;
        gameState.shiftTime = 180;
        gameState.beds = { total: 10, available: 10 };
        gameState.staff = [];
        gameState.budget = 5000;
        gameState.patients = [];
        gameState.waitingQueue = [];
        gameState.treatedPatients = [];
        gameState.savedCount = 0;
        gameState.lostCount = 0;
        gameState.accuracyCount = 0;
        gameState.totalAssessments = 0;
        gameState.isPaused = false;
        gameState.dilemmaActive = false;
        gameState.dilemmaCount = 0;
        gameState.selectedPatientId = null;
        gameState.comfortBonus = 0;
        
        // Clear UI containers
        document.getElementById('patient-queue').innerHTML = '';
        document.getElementById('treatment-beds').innerHTML = '';
        document.getElementById('current-patient').innerHTML = '<p>No patient selected</p>';
        document.getElementById('staff-select').innerHTML = '<option value="">Select staff...</option>';
        
        // Hide game over screen, show character select
        document.getElementById('game-over').classList.remove('active');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('character-select').classList.add('active');
        
        // Clear any modals
        document.getElementById('dilemma-modal').classList.remove('active');
        document.getElementById('points-popup').classList.remove('show', 'positive', 'negative');
        
        // Reset character and difficulty selections
        document.querySelectorAll('.character-card').forEach(card => card.classList.remove('selected'));
        document.querySelectorAll('[data-difficulty]').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('selected'));
        
        // Hide start button
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.style.display = 'none';
        }
        
        console.log('Game restarted successfully - back to character selection');
    }
}

// Make function available globally
window.restartGame = restartGame;


function displayLeaderboard(filter = 'all') {
    const container = document.getElementById('leaderboard-list');
    let entries = [];
    
    if (filter === 'all') {
        // Show global leaderboard
        entries = JSON.parse(localStorage.getItem('leaderboard_global') || '[]');
    } else if (filter === 'character') {
        // Show only current character
        const key = `leaderboard_${gameState.character}_${gameState.difficulty}`;
        entries = JSON.parse(localStorage.getItem(key) || '[]');
    } else if (filter === 'difficulty') {
        // Show all characters but same difficulty
        const characters = ['veteran', 'empath', 'efficient', 'resourceful'];
        characters.forEach(char => {
            const key = `leaderboard_${char}_${gameState.difficulty}`;
            const charEntries = JSON.parse(localStorage.getItem(key) || '[]');
            entries = entries.concat(charEntries.map(e => ({
                ...e,
                character: char,
                characterName: characterAbilities[char].name
            })));
        });
        entries.sort((a, b) => b.score - a.score);
    }
    
    // Create leaderboard HTML
    container.innerHTML = entries.slice(0, 20).map((entry, index) => {
        const isCurrentPlayer = entry.score === gameState.score && 
                               entry.name === characterAbilities[gameState.character].name &&
                               entry.difficulty === gameState.difficulty;
        
        return `
            <div class="leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''}">
                <span class="rank">#${index + 1}</span>
                <div class="player-info">
                    <span class="player-name">${entry.name || entry.characterName}</span>
                    <span class="player-details">${entry.difficulty.toUpperCase()} • ${entry.date}</span>
                </div>
                <span class="score-display">${entry.score} pts</span>
                <span>${entry.saved} saved</span>
                <span>${entry.accuracy}% acc</span>
            </div>
        `;
    }).join('') || '<p style="text-align: center; color: var(--text-secondary);">No scores yet!</p>';
    
    // Set up filter buttons if they exist
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.onclick = () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayLeaderboard(btn.dataset.filter);
        };
    });
}