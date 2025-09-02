// Quiz and Simulation Data
        const quizQuestions = [
            {
                question: "What is the most common way phishing attacks are delivered?",
                options: ["Email", "Text message", "Phone call", "Social media"],
                correct: 0,
                explanation: "Email remains the most common delivery method for phishing attacks, accounting for over 90% of all phishing attempts."
            },
            {
                question: "Which of these is a red flag in a suspicious email?",
                options: ["Personalized greeting", "Urgent action required", "Company logo", "Professional formatting"],
                correct: 1,
                explanation: "Urgent action required is a classic phishing tactic designed to pressure victims into acting without thinking."
            },
            {
                question: "What should you do if you receive a suspicious email?",
                options: ["Click to investigate", "Forward to friends", "Report and delete", "Reply asking if it's real"],
                correct: 2,
                explanation: "The safest approach is to report suspicious emails to your IT department and delete them without clicking any links."
            },
            {
                question: "What makes a strong password?",
                options: ["Personal information", "Long and complex", "Easy to remember", "Same across accounts"],
                correct: 1,
                explanation: "Strong passwords are long, complex, and unique to each account. They should include a mix of characters."
            },
            {
                question: "What is two-factor authentication?",
                options: ["Two passwords", "Password + second verification", "Biometric only", "Security questions"],
                correct: 1,
                explanation: "2FA requires both something you know (password) and something you have (phone, token) or are (biometrics)."
            }
        ];

        const simulations = [
            {
                scenario: "You receive an email from your 'bank' asking you to verify your account by clicking a link. What do you do?",
                choices: [
                    "Click the link immediately",
                    "Call the bank directly using their official number",
                    "Reply to the email asking for verification",
                    "Forward the email to friends for advice"
                ],
                correct: 1,
                explanation: "Always verify suspicious requests through official channels. Banks never ask for sensitive information via email."
            },
            {
                scenario: "A popup appears claiming your computer is infected and provides a phone number to call for help. Your response?",
                choices: [
                    "Call the number immediately",
                    "Close the popup and run legitimate antivirus",
                    "Click 'OK' to remove the virus",
                    "Download their recommended software"
                ],
                correct: 1,
                explanation: "Legitimate security warnings come from your installed antivirus software, not random popups."
            },
            {
                scenario: "You get a text message saying you've won a prize and need to click a link to claim it. What's your move?",
                choices: [
                    "Click the link to see what you won",
                    "Delete the message",
                    "Reply 'STOP' to unsubscribe",
                    "Share the good news on social media"
                ],
                correct: 1,
                explanation: "Unsolicited prize notifications are almost always scams. Delete these messages without clicking anything."
            }
        ];

        // State management
        let currentQuizQuestion = 0;
        let quizScore = 0;
        let currentSimulation = 0;
        let simulationScore = 0;
        let quizCompleted = false;
        let simulationsCompleted = false;

        // Reading module functionality
        function toggleReading(section) {
            const allSections = ['threats', 'defense', 'trends'];
            allSections.forEach(s => {
                const element = document.getElementById(`reading-${s}`);
                if (s === section) {
                    element.classList.toggle('expanded');
                } else {
                    element.classList.remove('expanded');
                }
            });
        }

        // Progress tracking
        function updateProgress() {
            const quizProgress = quizCompleted ? 100 : (currentQuizQuestion / quizQuestions.length) * 100;
            const simProgress = simulationsCompleted ? 100 : (currentSimulation / simulations.length) * 100;
            
            document.getElementById('quiz-progress-bar').style.width = quizProgress + '%';
            document.getElementById('quiz-progress-text').textContent = Math.round(quizProgress) + '%';
            document.getElementById('simulations-progress-bar').style.width = simProgress + '%';
            document.getElementById('simulations-progress-text').textContent = Math.round(simProgress) + '%';
        }

        // Quiz functionality
        function startQuiz() {
            currentQuizQuestion = 0;
            quizScore = 0;
            showQuizQuestion();
        }

        function showQuizQuestion() {
            if (currentQuizQuestion >= quizQuestions.length) {
                endQuiz();
                return;
            }

            const question = quizQuestions[currentQuizQuestion];
            const quizContainer = document.getElementById('quiz-container');
            
            quizContainer.innerHTML = `
                <div class="text-center mb-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">Question ${currentQuizQuestion + 1} of ${quizQuestions.length}</h3>
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style="width: ${((currentQuizQuestion) / quizQuestions.length) * 100}%"></div>
                    </div>
                </div>
                <h4 class="text-xl font-semibold text-gray-800 mb-6">${question.question}</h4>
                <div class="space-y-3">
                    ${question.options.map((option, index) => `
                        <button onclick="selectQuizAnswer(${index})" class="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 font-medium">
                            ${option}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        function selectQuizAnswer(selectedIndex) {
            const question = quizQuestions[currentQuizQuestion];
            const isCorrect = selectedIndex === question.correct;
            
            if (isCorrect) {
                quizScore++;
            }

            // Show feedback
            const buttons = document.querySelectorAll('#quiz-container button');
            buttons.forEach((button, index) => {
                button.disabled = true;
                if (index === question.correct) {
                    button.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
                } else if (index === selectedIndex && !isCorrect) {
                    button.classList.add('bg-red-100', 'border-red-500', 'text-red-800');
                }
            });

            // Show explanation
            setTimeout(() => {
                const explanationDiv = document.createElement('div');
                explanationDiv.className = 'mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg';
                explanationDiv.innerHTML = `
                    <p class="text-blue-800"><strong>Explanation:</strong> ${question.explanation}</p>
                    <button onclick="nextQuizQuestion()" class="mt-4 btn-primary">
                        ${currentQuizQuestion + 1 >= quizQuestions.length ? 'Finish Quiz' : 'Next Question'}
                    </button>
                `;
                document.getElementById('quiz-container').appendChild(explanationDiv);
            }, 1500);
        }

        function nextQuizQuestion() {
            currentQuizQuestion++;
            updateProgress();
            showQuizQuestion();
        }

        function endQuiz() {
            quizCompleted = true;
            updateProgress();
            const percentage = Math.round((quizScore / quizQuestions.length) * 100);
            const scoreElement = document.getElementById('quiz-score');
            
            document.getElementById('quiz-container').innerHTML = `
                <div class="text-center">
                    <div class="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span class="text-3xl">🎉</span>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Quiz Completed!</h3>
                    <div class="text-6xl font-bold gradient-text mb-2">${percentage}%</div>
                    <p class="text-gray-600 mb-6">You scored ${quizScore} out of ${quizQuestions.length} questions correctly!</p>
                    <button onclick="startQuiz()" class="btn-primary">Retake Quiz</button>
                </div>
            `;
            
            scoreElement.textContent = `Final Score: ${quizScore}/${quizQuestions.length} (${percentage}%)`;
            scoreElement.classList.remove('hidden');
        }

        // Simulation functionality
        function startSimulations() {
            currentSimulation = 0;
            simulationScore = 0;
            showSimulation();
        }

        function showSimulation() {
            if (currentSimulation >= simulations.length) {
                endSimulations();
                return;
            }

            const simulation = simulations[currentSimulation];
            const simContainer = document.getElementById('simulation-container');
            
            simContainer.innerHTML = `
                <div class="text-center mb-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">Scenario ${currentSimulation + 1} of ${simulations.length}</h3>
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div class="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all duration-500" style="width: ${((currentSimulation) / simulations.length) * 100}%"></div>
                    </div>
                </div>
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">🎭 Scenario:</h4>
                    <p class="text-gray-700">${simulation.scenario}</p>
                </div>
                <div class="space-y-3">
                    ${simulation.choices.map((choice, index) => `
                        <button onclick="selectSimulationChoice(${index})" class="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all duration-300 font-medium">
                            ${choice}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        function selectSimulationChoice(selectedIndex) {
            const simulation = simulations[currentSimulation];
            const isCorrect = selectedIndex === simulation.correct;
            
            if (isCorrect) {
                simulationScore++;
            }

            // Show feedback
            const buttons = document.querySelectorAll('#simulation-container button');
            buttons.forEach((button, index) => {
                button.disabled = true;
                if (index === simulation.correct) {
                    button.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
                } else if (index === selectedIndex && !isCorrect) {
                    button.classList.add('bg-red-100', 'border-red-500', 'text-red-800');
                }
            });

            // Show explanation
            setTimeout(() => {
                const explanationDiv = document.createElement('div');
                explanationDiv.className = 'mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg';
                explanationDiv.innerHTML = `
                    <p class="text-blue-800"><strong>Why:</strong> ${simulation.explanation}</p>
                    <button onclick="nextSimulation()" class="mt-4 btn-primary">
                        ${currentSimulation + 1 >= simulations.length ? 'Complete Simulations' : 'Next Scenario'}
                    </button>
                `;
                document.getElementById('simulation-container').appendChild(explanationDiv);
            }, 1500);
        }

        function nextSimulation() {
            currentSimulation++;
            updateProgress();
            showSimulation();
        }

        function endSimulations() {
            simulationsCompleted = true;
            updateProgress();
            const percentage = Math.round((simulationScore / simulations.length) * 100);
            
            document.getElementById('simulation-container').innerHTML = `
                <div class="text-center">
                    <div class="w-24 h-24 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span class="text-3xl">🏆</span>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Simulations Complete!</h3>
                    <div class="text-6xl font-bold gradient-text mb-2">${percentage}%</div>
                    <p class="text-gray-600 mb-6">You handled ${simulationScore} out of ${simulations.length} scenarios correctly!</p>
                    <button onclick="startSimulations()" class="btn-primary">Try Again</button>
                </div>
            `;
        }

        // Modal functionality
        function showModal(title, message) {
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-message').textContent = message;
            document.getElementById('alert-modal').style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('alert-modal').style.display = 'none';
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
            document.getElementById('start-sim-btn').addEventListener('click', startSimulations);
            document.getElementById('modal-close-btn').addEventListener('click', closeModal);
            
            // Close modal when clicking outside
            document.getElementById('alert-modal').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
            
            updateProgress();
        });

        // Smooth scroll for better UX
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add some interactive feedback for checklist items
        document.addEventListener('click', function(e) {
            if (e.target.closest('.checklist-card')) {
                const card = e.target.closest('.checklist-card');
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = 'translateY(-3px)';
                }, 150);
            }
        });

        // Keyboard navigation support
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
