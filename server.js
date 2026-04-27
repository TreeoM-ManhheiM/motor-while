const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Estrutura de salas
const rooms = new Map(); // roomId -> { players: { name: socketId }, readyStatus: { name: bool }, gameState: null ou objeto }

// ==================== BARALHOS ====================
const CARDS_BY_PHASE = {
    1: [
        { text: "O que esse código imprime?\n\ni = 0\nwhile i < 3:\n    print(i)\n    i += 1", answer: "0 1 2", type: "normal" },
        { text: "Quantas vezes o loop roda?\n\nx = 5\nwhile x > 0:\n    x -= 2", answer: "3", type: "normal" },
        { text: "Este loop para? (V/F)\n\ni = 1\nwhile i != 0:\n    i = i - 1", answer: "V", type: "normal" },
        { text: "Complete para repetir 10 vezes:\n\ni = 0\nwhile __________:\n    i += 1", answer: "i < 10", type: "normal" },
        { text: "Qual a saída?\n\ni = 2\nwhile i <= 6:\n    print(i)\n    i += 2", answer: "2 4 6", type: "normal" },
        { text: "O que acontece?\n\ni = 0\nwhile i < 0:\n    print(i)", answer: "Nada (não executa)", type: "normal" },
        { text: "Qual a condição de parada?\n\ni = 10\nwhile i >= 0:\n    i -= 1", answer: "i se torna -1", type: "normal" },
        { text: "Reescreva em palavras:\n\ni = 0\nwhile i < 4:\n    i += 1", answer: "Incrementa i até 4, roda 4 vezes", type: "normal" }
    ],
    2: [
        { text: "Complete a condição (sentinela):\n\nnum = int(input())\nwhile ________:\n    print(num)\n    num = int(input())", answer: "num != 0", type: "normal" },
        { text: "Complete o acumulador para somar até 0:\n\nsoma = 0\nn = int(input())\nwhile n != 0:\n    soma = __________\n    n = int(input())\nprint(soma)", answer: "soma + n", type: "normal" },
        { text: "Conte quantos números positivos (entrada: números até 0).", answer: "cont += 1 se n > 0", type: "logic" },
        { text: "Leia notas até -1 e calcule a média. (Pseudocódigo)", answer: "soma=0,cont=0; enquanto nota != -1: soma+=nota; cont+=1; ler nota; média = soma/cont", type: "logic" },
        { text: "Leia números até 0 e mostre o maior.", answer: "inicialize maior com o primeiro número (se não for 0) e compare.", type: "logic" },
        { text: "Quantas vezes roda? i=1; while i<20: i=i*2", answer: "5 vezes", type: "normal" },
        { text: "Conte os pares (entrada: números até 0).", answer: "if n % 2 == 0: cont += 1", type: "normal" },
        { text: "Complete para somar 1..n:\n\ni=1; s=0\nwhile i <= n:\n    s += i\n    i += 1\nprint(s)", answer: "Soma de 1 até n", type: "normal" }
    ],
    3: [
        { text: "Corrija o loop infinito:\n\ni = 0\nwhile i < 5:\n    print(i)", answer: "Faltou i += 1", type: "debug" },
        { text: "Por que trava?\n\nn = 10\nwhile n > 0:\n    n = n + 1", answer: "n cresce, deveria ser n -= 1", type: "debug" },
        { text: "Condição errada:\n\ni = 0\nwhile i > 3:\n    print(i)\n    i += 1", answer: "Nunca executa, corrigir para i < 3", type: "debug" },
        { text: "Sentinela bugada:\n\nnum = int(input())\nwhile num == 0:\n    print(num)\n    num = int(input())", answer: "Condição invertida, deveria ser num != 0", type: "debug" },
        { text: "Ordem do input:\n\nwhile n != 0:\n    n = int(input())\n    print(n)", answer: "n não inicializado; ler antes do while", type: "debug" },
        { text: "Atualização errada:\n\ni = 1\nwhile i < 10:\n    print(i)\n    i = i", answer: "i nunca muda; corrigir para i += 1", type: "debug" },
        { text: "Off-by-one: i=0; while i<=3: print(i); i+=1. Queríamos 3 valores.", answer: "Imprime 4 valores. Usar i<3", type: "debug" },
        { text: "Acumulador esquecido:\n\ns=0; i=1\nwhile i <= 5:\n    i += 1\nprint(s)", answer: "s nunca muda; faltou s += i", type: "debug" }
    ],
    4: [
        { text: "Crie o pseudocódigo para ler notas até -1 e calcular a média.", answer: "soma=cont=0; enquanto nota != -1: soma+=nota; cont+=1; ler nota; media=soma/cont", type: "challenge" },
        { text: "Validação de entrada: leia idade até ser válida (0-120).", answer: "while idade < 0 or idade > 120: ler novamente", type: "challenge" },
        { text: "Faça um menu que repete até opção 0 (sair).", answer: "while opcao != 0: mostrar menu; ler opcao; executar", type: "challenge" },
        { text: "Calcule o fatorial de n (n!).", answer: "fat=1; i=1; while i<=n: fat*=i; i+=1", type: "challenge" },
        { text: "Some os números pares até n.", answer: "i=2; soma=0; while i<=n: soma+=i; i+=2", type: "challenge" },
        { text: "Conte os dígitos de um número positivo.", answer: "cont=0; while n>0: n//=10; cont+=1", type: "challenge" },
        { text: "Adivinhação: repita até acertar, dando dicas.", answer: "while chute != secreto: informar maior/menor; ler chute", type: "challenge" },
        { text: "Explique 2 formas de evitar loop infinito em while.", answer: "atualizar variável de controle; condição de parada correta", type: "challenge" }
    ]
};

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function initializeGameState(roomId, playersNames) {
    const state = {
        players: playersNames,
        currentPlayerIndex: 0,
        boardSize: 28,
        playersPositions: new Array(playersNames.length).fill(0),
        playersSkipped: new Array(playersNames.length).fill(false),
        playersSpecialCards: playersNames.map(() => ({ debug: 0, antiLoop: 0 })),
        deck: { 1: [], 2: [], 3: [], 4: [] },
        specialDeck: [],
        gameActive: true,
        winner: null
    };
    for (let i = 1; i <= 4; i++) {
        state.deck[i] = shuffleArray([...CARDS_BY_PHASE[i]]);
    }
    return state;
}

function getCardForPhase(state, phase) {
    let deck = state.deck[phase];
    if (deck.length === 0) {
        deck = shuffleArray([...CARDS_BY_PHASE[phase]]);
        state.deck[phase] = deck;
    }
    return deck.pop();
}

function movePlayer(state, playerId, diceRoll, isCorrect) {
    const idx = state.players.indexOf(playerId);
    if (idx === -1) return { success: false, message: "Jogador não encontrado" };
    if (state.playersSkipped[idx]) {
        state.playersSkipped[idx] = false;
        return { success: false, wasSkipped: true, message: "Perdeu a rodada (Loop Infinito)" };
    }

    let newPos = state.playersPositions[idx];
    if (!isCorrect && newPos !== 0) {
        newPos = Math.max(0, newPos - 1);
        state.playersPositions[idx] = newPos;
        return { success: false, newPosition: newPos, message: "Resposta errada! Voltou uma casa." };
    }

    newPos += diceRoll;
    if (newPos > state.boardSize) newPos = state.boardSize;

    // Casas especiais
    const specialTiles = {
        5: { name: 'LoopInfinito', effect: 'skip' },
        12: { name: 'Debug', effect: 'debug' },
        19: { name: 'Avanco', effect: 'advance' },
        25: { name: 'AntiLoop', effect: 'antiLoop' },
        27: { name: 'LoopInfinito', effect: 'skip' }
    };

    if (specialTiles[newPos]) {
        const tile = specialTiles[newPos];
        if (tile.effect === 'skip') state.playersSkipped[idx] = true;
        else if (tile.effect === 'debug') state.playersSpecialCards[idx].debug++;
        else if (tile.effect === 'antiLoop') state.playersSpecialCards[idx].antiLoop++;
        else if (tile.effect === 'advance') {
            newPos = Math.min(state.boardSize, newPos + 3);
            if (newPos === state.boardSize) {
                state.gameActive = false;
                state.winner = playerId;
                return { success: true, newPosition: newPos, gameEnded: true, winner: playerId, specialTile: tile.name };
            }
        }
        state.playersPositions[idx] = newPos;
        let phase = newPos <= 8 ? 1 : newPos <= 16 ? 2 : newPos <= 24 ? 3 : 4;
        const card = getCardForPhase(state, phase);
        return { success: true, newPosition: newPos, card, phase, specialTile: tile.name };
    }

    state.playersPositions[idx] = newPos;
    let gameEnded = false, winner = null;
    if (newPos === state.boardSize) {
        state.gameActive = false;
        state.winner = playerId;
        gameEnded = true;
        winner = playerId;
    }
    let phase = newPos <= 8 ? 1 : newPos <= 16 ? 2 : newPos <= 24 ? 3 : 4;
    const card = getCardForPhase(state, phase);
    return { success: true, newPosition: newPos, card, phase, gameEnded, winner };
}

function nextTurn(state) {
    if (!state.gameActive) return null;
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    return {
        currentPlayer: state.players[state.currentPlayerIndex],
        positions: state.playersPositions
    };
}

io.on('connection', (socket) => {
    console.log(`Cliente ${socket.id} conectado`);

    socket.on('join-room', ({ playerName, roomName }) => {
        const roomId = roomName.trim();
        if (!rooms.has(roomId)) {
            rooms.set(roomId, { players: {}, readyStatus: {}, gameState: null });
        }
        const room = rooms.get(roomId);
        if (room.gameState && room.gameState.gameActive) {
            socket.emit('error-msg', 'Jogo já começou nesta sala. Não é possível entrar.');
            return;
        }
        if (room.players[playerName]) {
            socket.emit('error-msg', 'Nome já usado nesta sala. Escolha outro.');
            return;
        }
        room.players[playerName] = socket.id;
        room.readyStatus[playerName] = false;
        socket.join(roomId);
        socket.emit('room-joined', { room: roomId, playerName, players: room.players, readyStatus: room.readyStatus });
        io.to(roomId).emit('room-update', { players: room.players, readyStatus: room.readyStatus });
    });

    socket.on('player-ready', ({ room, playerName }) => {
        const roomObj = rooms.get(room);
        if (!roomObj) return;
        if (roomObj.gameState && roomObj.gameState.gameActive) return;
        if (roomObj.readyStatus[playerName] !== undefined) {
            roomObj.readyStatus[playerName] = true;
            io.to(room).emit('room-update', { players: roomObj.players, readyStatus: roomObj.readyStatus });
            const allReady = Object.values(roomObj.readyStatus).every(v => v === true);
            const playerCount = Object.keys(roomObj.players).length;
            if (allReady && playerCount >= 2) {
                const playersNames = Object.keys(roomObj.players);
                const gameState = initializeGameState(room, playersNames);
                roomObj.gameState = gameState;
                io.to(room).emit('game-start', {
                    players: playersNames,
                    positions: gameState.playersPositions,
                    currentPlayer: gameState.players[gameState.currentPlayerIndex]
                });
            }
        }
    });

    socket.on('roll-dice', ({ room, playerId }) => {
        const roomObj = rooms.get(room);
        if (!roomObj || !roomObj.gameState || !roomObj.gameState.gameActive) return;
        const state = roomObj.gameState;
        const currentPlayer = state.players[state.currentPlayerIndex];
        if (currentPlayer !== playerId) {
            socket.emit('error-msg', 'Não é sua vez');
            return;
        }
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        // Envia o valor do dado
        io.to(room).emit('dice-rolled', { playerId, diceRoll });
        // Sorteia e envia o desafio baseado na posição atual do jogador
        const idx = state.players.indexOf(playerId);
        const currentPos = state.playersPositions[idx];
        let phase = currentPos <= 8 ? 1 : currentPos <= 16 ? 2 : currentPos <= 24 ? 3 : 4;
        const card = getCardForPhase(state, phase);
        io.to(room).emit('challenge-sent', { playerId, card, phase, diceRoll });
    });

    socket.on('submit-answer', ({ room, playerId, diceRoll, answer, expected, card }) => {
        const roomObj = rooms.get(room);
        if (!roomObj || !roomObj.gameState) return;
        const state = roomObj.gameState;
        const currentPlayer = state.players[state.currentPlayerIndex];
        if (currentPlayer !== playerId) return;

        const isCorrect = (answer.toLowerCase().trim() === expected.toLowerCase().trim());
        const moveResult = movePlayer(state, playerId, diceRoll, isCorrect);

        if (moveResult.wasSkipped) {
            io.to(room).emit('move-result', {
                playerId,
                success: false,
                message: moveResult.message,
                positions: state.playersPositions
            });
            const turnUpdate = nextTurn(state);
            if (turnUpdate) io.to(room).emit('turn-update', turnUpdate);
            return;
        }

        io.to(room).emit('move-result', {
            playerId,
            success: moveResult.success,
            message: moveResult.success ? (moveResult.specialTile ? `Caiu em ${moveResult.specialTile}!` : 'Avançou!') : moveResult.message,
            newPosition: moveResult.newPosition,
            positions: state.playersPositions,
            gameEnded: moveResult.gameEnded,
            winner: moveResult.winner
        });

        if (moveResult.gameEnded) {
            io.to(room).emit('game-ended', { winner: moveResult.winner });
            return;
        }

        const turnUpdate = nextTurn(state);
        if (turnUpdate) io.to(room).emit('turn-update', turnUpdate);
    });

    socket.on('disconnect', () => {
        console.log(`Cliente ${socket.id} desconectado`);
        for (let [roomId, room] of rooms.entries()) {
            let found = false;
            for (let [name, id] of Object.entries(room.players)) {
                if (id === socket.id) {
                    delete room.players[name];
                    delete room.readyStatus[name];
                    found = true;
                    break;
                }
            }
            if (found) {
                if (Object.keys(room.players).length === 0) {
                    rooms.delete(roomId);
                } else {
                    io.to(roomId).emit('room-update', { players: room.players, readyStatus: room.readyStatus });
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT} com lobby, salas e fluxo corrigido`);
});
