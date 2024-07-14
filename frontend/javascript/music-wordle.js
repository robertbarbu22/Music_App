document.addEventListener('DOMContentLoaded', () => {
    let currentAttempt = 0;
    let wordLength = 0;
    let wordleWord = '';
    let gameLocked = false;

    fetch('/api/wordle')
        .then(response => response.json())
        .then(data => {
            wordleWord = data.word.toLowerCase();
            wordLength = wordleWord.length;
            createWordleGrid(wordleWord);

            if (data.attempts) {
                populateAttempts(data.attempts);
                lockGame(); // Lock daca deja s-a jucat
            }
        })
        .catch(error => console.error('Error fetching Wordle data:', error));

    document.getElementById('check-button').addEventListener('click', () => {
        if (gameLocked) return;

        const attempt = getCurrentAttempt();
        checkAttempt(attempt);
    });

    document.addEventListener('keydown', (event) => {
        if (gameLocked) return;

        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('wordle-cell') && !activeElement.disabled) {
            if (event.key.match(/^[a-z]$/i)) {
                activeElement.value = event.key.toLowerCase();
                const nextSibling = getNextSibling(activeElement);
                if (nextSibling) {
                    nextSibling.focus();
                }
                event.preventDefault();
            } else if (event.key === 'Backspace') {
                activeElement.value = '';
                const prevSibling = getPreviousSibling(activeElement);
                if (prevSibling) {
                    prevSibling.focus();
                }
                event.preventDefault();
            } else if (event.key === 'Enter') {
                const attempt = getCurrentAttempt();
                checkAttempt(attempt);
                event.preventDefault();
            }
        }
    });

    function createWordleGrid(word) {
        const grid = document.getElementById('wordle-grid');
        grid.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const row = document.createElement('div');
            row.classList.add('wordle-row');
            for (let j = 0; j < word.length; j++) {
                const cell = document.createElement('input');
                cell.setAttribute('type', 'text');
                cell.setAttribute('maxlength', '1');
                cell.classList.add('wordle-cell');
                cell.dataset.index = `${i}-${j}`;
                if (i > 0) cell.setAttribute('disabled', 'true');
                if (word[j] === ' ') {
                    cell.setAttribute('disabled', 'true');
                    cell.classList.add('space-cell');
                }
                row.appendChild(cell);
            }
            grid.appendChild(row);
        }
        document.querySelector('.wordle-cell:not([disabled])').focus();
    }

    function getCurrentAttempt() {
        const row = document.querySelectorAll('.wordle-row')[currentAttempt];
        return Array.from(row.children)
            .map(cell => (cell.disabled ? ' ' : cell.value.toLowerCase()))
            .join('');
    }

    function checkAttempt(attempt) {
        if (attempt.length !== wordLength) {
            showToast('Complete the row before checking!');
            return;
        }

        const row = document.querySelectorAll('.wordle-row')[currentAttempt];
        let correct = 0;
        let wordleWordCopy = wordleWord.split('');

        // litere in pozitia corecta
        attempt.split('').forEach((letter, index) => {
            const cell = row.children[index];
            if (cell.disabled) return;

            if (letter === wordleWordCopy[index]) {
                cell.classList.add('correct');
                wordleWordCopy[index] = null;
                correct++;
            }
        });

        // litere care exista in cuvant dar nu sunt in pozitita buna
        attempt.split('').forEach((letter, index) => {
            const cell = row.children[index];
            if (cell.disabled || cell.classList.contains('correct')) return;

            if (wordleWordCopy.includes(letter)) {
                cell.classList.add('present');
                wordleWordCopy[wordleWordCopy.indexOf(letter)] = null;
            } else {
                cell.classList.add('absent');
            }
        });

        if (correct === wordLength - wordleWord.split(' ').length + 1) { // pentru spatiu
            showToast(`Congratulations, the artist name was ${wordleWord}!`, true);
            updateStreak();
            lockGame();
            saveAttempts(attempt); 
            return;
        }

        currentAttempt++;
        if (currentAttempt >= 5) {
            showToast(`Game Over! The artist name was ${wordleWord}`);
            lockGame();
            saveAttempts(attempt); 
            return;
        }

        const nextRow = document.querySelectorAll('.wordle-row')[currentAttempt];
        Array.from(nextRow.children).forEach(cell => {
            if (!cell.classList.contains('space-cell')) {
                cell.removeAttribute('disabled');
            }
        });
        document.querySelector(`[data-index="${currentAttempt}-0"]`).focus();
    }

    function showToast(message, success = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + (success ? 'success' : 'error');
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    function updateStreak() {
        fetch('/api/update-streak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Streak updated:', data);
            })
            .catch(error => {
                console.error('Error updating streak:', error);
            });
    }

    function lockGame() {
        gameLocked = true;
        document.querySelectorAll('.wordle-cell').forEach(cell => {
            cell.setAttribute('disabled', 'true');
        });
        document.getElementById('check-button').setAttribute('disabled', 'true');
    }

    function getNextSibling(cell) {
        let nextSibling = cell.nextElementSibling;
        while (nextSibling && nextSibling.disabled) {
            nextSibling = nextSibling.nextElementSibling;
        }
        return nextSibling;
    }

    function getPreviousSibling(cell) {
        let prevSibling = cell.previousElementSibling;
        while (prevSibling && prevSibling.disabled) {
            prevSibling = prevSibling.previousElementSibling;
        }
        return prevSibling;
    }

    function saveAttempts(attempt) {
        fetch('/api/wordle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attempts: attempt })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Attempts saved:', data);
        })
        .catch(error => {
            console.error('Error saving attempts:', error);
        });
    }

    function populateAttempts(attempts) {
        const attemptsArray = attempts.split('\n');
        attemptsArray.forEach((attempt, rowIndex) => {
            const row = document.querySelectorAll('.wordle-row')[rowIndex];
            attempt.split('').forEach((letter, cellIndex) => {
                const cell = row.children[cellIndex];
                cell.value = letter.toLowerCase();
                if (wordleWord[cellIndex] === letter.toLowerCase()) {
                    cell.classList.add('correct');
                } else if (wordleWord.includes(letter.toLowerCase())) {
                    cell.classList.add('present');
                } else {
                    cell.classList.add('absent');
                }
            });
        });
    }
});

