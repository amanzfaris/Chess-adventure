const boardSize = 11; // Changed from 14 to 11
const board = document.getElementById("chessboard");
let selectedPiece = null;
const MAX_MOVE_RANGE = 3; // Changed from 4 to 3 for both rook and bishop
let canMove = true;
const MOVE_COOLDOWN = 5000; // 5 seconds in milliseconds
const MOVE_DELAY = 1000; // 1 second delay between moves
const ANIMATION_DURATION = 500; // 0.5 second animation

// Define teams and their colors
const TEAMS = {
    WHITE: 'white',
    RED: 'red',
    GOLD: 'gold',  // Changed from BLUE to GOLD
    GREEN: 'green'
};

let activeTeams = {
    [TEAMS.WHITE]: true,
    [TEAMS.RED]: true,
    [TEAMS.GOLD]: true,
    [TEAMS.GREEN]: true
};

let currentTurn = TEAMS.WHITE; // Start with white team
const turnOrder = [TEAMS.WHITE, TEAMS.RED, TEAMS.GOLD, TEAMS.GREEN];

const COMPUTER_TEAMS = [TEAMS.RED, TEAMS.GOLD, TEAMS.GREEN];

const GAME_STATES = {
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
};

let gameState = GAME_STATES.PLAYING;

function createBoard() {
    board.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            let tile = document.createElement("div");
            tile.classList.add("tile");
            tile.classList.add((row + col) % 2 === 0 ? "white" : "black");
            tile.dataset.row = row;
            tile.dataset.col = col;
            tile.addEventListener('click', handleTileClick);
            board.appendChild(tile);
        }
    }
}

function placePieces() {
    // White team (bottom-left)
    placePiece(0, 2, TEAMS.WHITE, 'rook');
    placePiece(2, 0, TEAMS.WHITE, 'rook');
    placePiece(0, 1, TEAMS.WHITE, 'knight');
    placePiece(0, 0, TEAMS.WHITE, 'king');
    placePiece(1, 1, TEAMS.WHITE, 'bishop');
    placePiece(1, 0, TEAMS.WHITE, 'bishop');


    // Red team (top-left)
    placePiece(10, 2, TEAMS.RED, 'rook');
    placePiece(8, 0, TEAMS.RED, 'rook');
    placePiece(10, 1, TEAMS.RED, 'knight');
    placePiece(10, 0, TEAMS.RED, 'king');
    placePiece(9, 1, TEAMS.RED, 'bishop');
    placePiece(9, 0, TEAMS.RED, 'bishop');


    // Gold team (top-right)
    placePiece(10, 8, TEAMS.GOLD, 'rook');
    placePiece(8, 10, TEAMS.GOLD, 'rook');
    placePiece(10, 9, TEAMS.GOLD, 'knight');
    placePiece(10, 10, TEAMS.GOLD, 'king');
    placePiece(9, 9, TEAMS.GOLD, 'bishop');
    placePiece(9, 10, TEAMS.GOLD, 'bishop');


    // Green team (bottom-right)
    placePiece(0, 8, TEAMS.GREEN, 'rook');
    placePiece(2, 10, TEAMS.GREEN, 'rook');
    placePiece(0, 9, TEAMS.GREEN, 'knight');
    placePiece(0, 10, TEAMS.GREEN, 'king');
    placePiece(1, 9, TEAMS.GREEN, 'bishop');
    placePiece(1, 10, TEAMS.GREEN, 'bishop');
    

}

function placePiece(row, col, color, type) {
    const tile = getTile(row, col);
    const piece = document.createElement('div');
    piece.classList.add('piece', color, type);
    piece.dataset.type = type;
    piece.dataset.color = color;
    piece.innerHTML = getPieceSymbol(type, color);
    tile.appendChild(piece);
}

function getPieceSymbol(type, color) {
    const symbols = {
        [TEAMS.WHITE]: {
            'king': '♔',
            'queen': '♕',
            'rook': '♖',
            'knight': '♘',
            'bishop': '♗'
        },
        [TEAMS.RED]: {
            'king': '♔',
            'queen': '♕',
            'rook': '♖',
            'knight': '♘',
            'bishop': '♗'
        },
        [TEAMS.GOLD]: {
            'king': '♔',
            'queen': '♕',
            'rook': '♖',
            'knight': '♘',
            'bishop': '♗'
        },
        [TEAMS.GREEN]: {
            'king': '♔',
            'queen': '♕',
            'rook': '♖',
            'knight': '♘',
            'bishop': '♗'
        }
    };
    return symbols[color][type] || '';
}

function getTile(row, col) {
    return board.children[row * boardSize + col];
}

function handleTileClick(event) {
    if (gameState !== GAME_STATES.PLAYING) {
        return;
    }
    
    const tile = event.currentTarget;
    const piece = tile.querySelector('.piece');
    
    // Clear all highlights before processing the click
    clearHighlights();

    // If it's not player's turn, show message and return
    if (currentTurn !== TEAMS.WHITE) {
        showMessage(`Wait for ${currentTurn}'s turn`);
        return;
    }

    // If clicking on enemy piece when we have a selected piece, treat it as a capture attempt
    if (selectedPiece && piece && piece.dataset.color !== TEAMS.WHITE) {
        const targetRow = parseInt(tile.dataset.row);
        const targetCol = parseInt(tile.dataset.col);
        const currentTile = selectedPiece.parentElement;
        const currentRow = parseInt(currentTile.dataset.row);
        const currentCol = parseInt(currentTile.dataset.col);

        if (isValidMove(selectedPiece, currentRow, currentCol, targetRow, targetCol)) {
            // Handle capture
            if (piece.dataset.type === 'king') {
                handleKingCapture(piece.dataset.color);
                transformToQueen(selectedPiece);
            }
            movePiece(selectedPiece, tile);
            selectedPiece = null;
            nextTurn();
        }
        return;
    }

    // If clicking on our own piece
    if (piece && piece.dataset.color === currentTurn) {
        if (selectedPiece) {
            selectedPiece.classList.remove('selected');
        }
        selectedPiece = piece;
        piece.classList.add('selected');
        showPossibleMoves(piece);
        return;
    }

    // If clicking on empty square with a selected piece
    if (selectedPiece && !piece) {
        const targetRow = parseInt(tile.dataset.row);
        const targetCol = parseInt(tile.dataset.col);
        const currentTile = selectedPiece.parentElement;
        const currentRow = parseInt(currentTile.dataset.row);
        const currentCol = parseInt(currentTile.dataset.col);

        if (isValidMove(selectedPiece, currentRow, currentCol, targetRow, targetCol)) {
            movePiece(selectedPiece, tile);
            selectedPiece = null;
            nextTurn();
        }
    }
}

function isValidMove(piece, startRow, startCol, endRow, endCol) {
    const type = piece.dataset.type;
    const deltaRow = Math.abs(endRow - startRow);
    const deltaCol = Math.abs(endCol - startCol);

    const targetTile = getTile(endRow, endCol);
    const targetPiece = targetTile.querySelector('.piece');

    if (targetPiece && targetPiece.dataset.color === piece.dataset.color) {
        return false;
    }

    switch (type) {
        case 'king':
            return false;

        case 'queen':
            // Queen can move like both rook and bishop with range of 3
            if (deltaRow <= 3 && deltaCol <= 3) {
                if (
                    // Rook-like moves (horizontal/vertical)
                    (deltaRow === 0 && deltaCol > 0) ||
                    (deltaCol === 0 && deltaRow > 0) ||
                    // Bishop-like moves (diagonal)
                    deltaRow === deltaCol
                ) {
                    return !isPathBlocked(startRow, startCol, endRow, endCol);
                }
            }
            return false;

        case 'rook':
            if ((deltaRow === 0 && deltaCol > 0 && deltaCol <= MAX_MOVE_RANGE) || 
                (deltaCol === 0 && deltaRow > 0 && deltaRow <= MAX_MOVE_RANGE)) {
                return !isPathBlocked(startRow, startCol, endRow, endCol);
            }
            return false;

        case 'knight':
            return (deltaRow === 2 && deltaCol === 1) || (deltaRow === 1 && deltaCol === 2);

        case 'bishop':
            if (deltaRow === deltaCol && deltaRow <= MAX_MOVE_RANGE) {
                return !isPathBlocked(startRow, startCol, endRow, endCol);
            }
            return false;

        default:
            return false;
    }
}

function isPathBlocked(startRow, startCol, endRow, endCol) {
    const rowStep = endRow > startRow ? 1 : endRow < startRow ? -1 : 0;
    const colStep = endCol > startCol ? 1 : endCol < startCol ? -1 : 0;
    
    let currentRow = startRow + rowStep;
    let currentCol = startCol + colStep;

    while (currentRow !== endRow || currentCol !== endCol) {
        const tile = getTile(currentRow, currentCol);
        if (tile.querySelector('.piece')) {
            return true; // Path is blocked
        }
        currentRow += rowStep;
        currentCol += colStep;
    }
    return false;
}

function showPossibleMoves(piece) {
    // If it's a king, don't show any possible moves
    if (piece.dataset.type === 'king') {
        return;
    }

    const currentTile = piece.parentElement;
    const currentRow = parseInt(currentTile.dataset.row);
    const currentCol = parseInt(currentTile.dataset.col);

    // Check all possible positions
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (isValidMove(piece, currentRow, currentCol, row, col)) {
                const tile = getTile(row, col);
                tile.classList.add('possible-move');
            }
        }
    }
}

function clearHighlights() {
    // Clear all highlighted possible moves
    const highlightedTiles = document.querySelectorAll('.possible-move');
    highlightedTiles.forEach(tile => {
        tile.classList.remove('possible-move');
    });

    // Clear any selected pieces
    const selectedPieces = document.querySelectorAll('.selected');
    selectedPieces.forEach(piece => {
        piece.classList.remove('selected');
    });
}

function movePiece(piece, targetTile) {
    // Clear highlights before moving
    clearHighlights();
    
    // Remove any existing piece on the target tile
    const existingPiece = targetTile.querySelector('.piece');
    if (existingPiece) {
        existingPiece.remove();
    }
    
    // Move the piece to the target tile
    targetTile.appendChild(piece);
}

function updateTurnDisplay() {
    const teamIndicator = document.getElementById('current-team');
    if (teamIndicator) {
        teamIndicator.classList.remove('team-white', 'team-red', 'team-gold', 'team-green');
        teamIndicator.classList.add(`team-${currentTurn.toLowerCase()}`);
        teamIndicator.textContent = currentTurn.toUpperCase();
    }
}

function handleKingCapture(capturedTeamColor) {
    // Deactivate the team
    activeTeams[capturedTeamColor] = false;

    // Remove all pieces of the captured team
    const allPieces = document.querySelectorAll(`.piece.${capturedTeamColor}`);
    allPieces.forEach(piece => {
        piece.style.display = 'none';
    });

    // Check if only one team remains
    const remainingTeams = Object.entries(activeTeams).filter(([_, active]) => active);
    if (remainingTeams.length === 1) {
        const winningTeam = remainingTeams[0][0];
        gameState = GAME_STATES.WON;
        setTimeout(() => {
            alert(`${winningTeam.toUpperCase()} team wins!`);
        }, 500);
    }
}

function nextTurn() {
    const currentIndex = turnOrder.indexOf(currentTurn);
    let nextIndex = (currentIndex + 1) % turnOrder.length;
    
    // Skip teams that are no longer active
    while (!activeTeams[turnOrder[nextIndex]]) {
        nextIndex = (nextIndex + 1) % turnOrder.length;
    }
    
    currentTurn = turnOrder[nextIndex];
    updateTurnDisplay();
    
    // If it's a computer's turn, make their move
    if (COMPUTER_TEAMS.includes(currentTurn)) {
        setTimeout(makeComputerMove, 1000);
    }
}

function showGameOverModal(result) {
    const existingModal = document.querySelector('.game-over-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'game-over-modal';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    const message = document.createElement('p');
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'modal-buttons';

    if (result === 'win') {
        title.textContent = 'MISSION COMPLETE';
        message.textContent = 'Strategic victory achieved. All enemy kings eliminated.';
        content.classList.add('win');
    } else {
        title.textContent = 'MISSION FAILED';
        message.textContent = 'Critical asset lost. Strategic withdrawal recommended.';
        content.classList.add('lose');
    }

    const restartButton = document.createElement('button');
    restartButton.textContent = 'RESTART';
    restartButton.onclick = () => {
        modal.remove();
        resetGame();
    };

    const homeButton = document.createElement('button');
    homeButton.textContent = 'EXIT';
    homeButton.onclick = () => {
        window.location.href = 'index.html'; // Adjust path as needed
    };

    buttonsContainer.appendChild(restartButton);
    buttonsContainer.appendChild(homeButton);

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(buttonsContainer);
    modal.appendChild(content);

    document.body.appendChild(modal);
}

function resetGame() {
    gameState = GAME_STATES.PLAYING;
    // Clear the board
    while (board.firstChild) {
        board.removeChild(board.firstChild);
    }
    // Reset active teams
    activeTeams = {
        [TEAMS.WHITE]: true,
        [TEAMS.RED]: true,
        [TEAMS.GOLD]: true,
        [TEAMS.GREEN]: true
    };
    currentTurn = TEAMS.WHITE;
    // Recreate the board and pieces
    createBoard();
    placePieces();
}

function makeComputerMove() {
    if (gameState !== GAME_STATES.PLAYING) return;

    clearHighlights();

    const pieces = Array.from(document.querySelectorAll(`.piece.${currentTurn}`))
        .filter(piece => piece.dataset.type !== 'king');

    let validMoves = [];

    pieces.forEach(piece => {
        const currentTile = piece.parentElement;
        const startRow = parseInt(currentTile.dataset.row);
        const startCol = parseInt(currentTile.dataset.col);

        for (let endRow = 0; endRow < boardSize; endRow++) {
            for (let endCol = 0; endCol < boardSize; endCol++) {
                if (isValidMove(piece, startRow, startCol, endRow, endCol)) {
                    validMoves.push({
                        piece,
                        startRow,
                        startCol,
                        endRow,
                        endCol
                    });
                }
            }
        }
    });

    if (validMoves.length > 0) {
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        const targetTile = getTile(move.endRow, move.endCol);
        const targetPiece = targetTile.querySelector('.piece');

        if (targetPiece) {
            if (targetPiece.dataset.type === 'king') {
                handleKingCapture(targetPiece.dataset.color);
                // Transform the capturing piece into a queen
                transformToQueen(move.piece);
            }
            targetPiece.remove();
        }

        movePiece(move.piece, targetTile);
        nextTurn();
    }
}

function showMessage(message) {
    const messageElement = document.getElementById('game-message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.opacity = '1';
        setTimeout(() => {
            messageElement.style.opacity = '0';
        }, 2000);
    }
}

// Add CSS animation styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    .piece {
        transition: all ${ANIMATION_DURATION}ms ease;
    }
    .current-turn {
        background-color: rgba(255, 255, 0, 0.2) !important;
    }
`;
document.head.appendChild(styleSheet);

// Add this to your HTML to show current turn
function addTurnDisplay() {
    if (!document.getElementById('turnDisplay')) {
        const display = document.createElement('div');
        display.id = 'turnDisplay';
        display.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 5px;
            font-size: 16px;
        `;
        document.body.appendChild(display);
    }
}

// Call this when initializing the game
function initializeGame() {
    createBoard();
    placePieces();
    addTurnDisplay();
    updateTurnIndicator();
}

// Initialize the game
initializeGame();

// Add CSS for the modal
const modalStyles = `
    @keyframes glitch {
        0% {
            text-shadow: 0.05em 0 0 #00fffc, -0.03em -0.04em 0 #fc00ff,
                         0.025em 0.04em 0 #fffc00;
        }
        15% {
            text-shadow: 0.05em 0 0 #00fffc, -0.03em -0.04em 0 #fc00ff,
                         0.025em 0.04em 0 #fffc00;
        }
        16% {
            text-shadow: -0.05em -0.025em 0 #00fffc, 0.025em 0.035em 0 #fc00ff,
                         -0.05em -0.05em 0 #fffc00;
        }
        49% {
            text-shadow: -0.05em -0.025em 0 #00fffc, 0.025em 0.035em 0 #fc00ff,
                         -0.05em -0.05em 0 #fffc00;
        }
        50% {
            text-shadow: 0.05em 0.035em 0 #00fffc, 0.03em 0 0 #fc00ff,
                         0 -0.04em 0 #fffc00;
        }
        99% {
            text-shadow: 0.05em 0.035em 0 #00fffc, 0.03em 0 0 #fc00ff,
                         0 -0.04em 0 #fffc00;
        }
        100% {
            text-shadow: -0.05em 0 0 #00fffc, -0.025em -0.04em 0 #fc00ff,
                         -0.04em -0.025em 0 #fffc00;
        }
    }

    .game-over-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 8, 20, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    }

    .modal-content {
        background: linear-gradient(145deg, #0a1a2f, #1c2c3f);
        padding: 2.5rem;
        border-radius: 15px;
        text-align: center;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 0 30px rgba(0, 195, 255, 0.2),
                    inset 0 0 15px rgba(0, 195, 255, 0.1);
        position: relative;
        overflow: hidden;
    }

    .modal-content::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #00c3ff, #ff00c3);
        animation: scanline 2s linear infinite;
    }

    @keyframes scanline {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }

    .modal-content.win {
        border: 2px solid #00c3ff;
    }

    .modal-content.lose {
        border: 2px solid #ff0055;
    }

    .modal-content h2 {
        margin: 0 0 1.5rem 0;
        font-size: 2.5rem;
        font-family: 'Arial', sans-serif;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: #fff;
        animation: glitch 1s infinite;
    }

    .modal-content p {
        margin: 0 0 2rem 0;
        font-size: 1.2rem;
        color: #00c3ff;
        text-shadow: 0 0 10px rgba(0, 195, 255, 0.5);
    }

    .modal-buttons {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
    }

    .modal-buttons button {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .modal-buttons button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            120deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
        );
        transition: 0.5s;
    }

    .modal-buttons button:hover::before {
        left: 100%;
    }

    .modal-buttons button:first-child {
        background: linear-gradient(45deg, #00c3ff, #0066ff);
        color: white;
        box-shadow: 0 0 15px rgba(0, 195, 255, 0.5);
    }

    .modal-buttons button:last-child {
        background: linear-gradient(45deg, #ff0055, #ff00c3);
        color: white;
        box-shadow: 0 0 15px rgba(255, 0, 85, 0.5);
    }

    .modal-buttons button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0, 195, 255, 0.4);
    }

    .modal-buttons button:active {
        transform: translateY(1px);
    }

    @keyframes neonFlicker {
        0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            text-shadow: 0 0 5px #00c3ff,
                         0 0 15px #00c3ff,
                         0 0 30px #00c3ff;
        }
        20%, 22%, 24%, 55% {
            text-shadow: none;
        }
    }
`;

// Add the modal styles to the document
const modalStyleSheet = document.createElement("style");
modalStyleSheet.textContent = modalStyles;
document.head.appendChild(modalStyleSheet);

// Add this CSS class for better visibility of highlighted squares
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .highlight {
            position: relative;
        }
        .highlight::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 0, 0.3);
            border: 2px solid rgba(255, 255, 0, 0.6);
            box-sizing: border-box;
            pointer-events: none;
            z-index: 1;
        }
    `;
    document.head.appendChild(style);
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', addStyles);

// Add function to check if a square is threatened by enemy pieces
function isSquareThreatened(row, col, kingColor) {
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const tile = getTile(r, c);
            const piece = tile.querySelector('.piece');
            if (piece && piece.dataset.color !== kingColor) {
                // Skip checking other kings
                if (piece.dataset.type === 'king') continue;
                
                // Check if this enemy piece can move to the target square
                if (isValidMove(piece, r, c, row, col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Function to transform a piece into a queen
function transformToQueen(piece) {
    const color = piece.dataset.color;
    piece.dataset.type = 'queen';
    piece.className = `piece ${color} queen`;
    piece.innerHTML = getPieceSymbol('queen', color);
}

// Add this HTML element for messages
document.body.insertAdjacentHTML('beforeend', `
    <div id="game-message" style="
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1000;
    "></div>
`);

// Initialize the game
function initGame() {
    createBoard();
    placePieces();
    currentTurn = TEAMS.WHITE;
    updateTurnDisplay();
}

// Call initGame when the page loads
window.addEventListener('load', initGame);
