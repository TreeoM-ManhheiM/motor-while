const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map();

// ==================== 30 MISSÕES COMPLETAS ====================
const MISSOES = [
    { id:0, titulo:"1. Contagem regressiva", historia:"Use um loop `while` para exibir os números de 5 até 1 (decrescente).", codigoEsperado:["contador = 5","while contador > 0:","    print(contador)","    contador -= 1"] },
    { id:1, titulo:"2. Soma até 100", historia:"Some números de 1 até atingir ou ultrapassar 100. Exiba a soma final.", codigoEsperado:["soma = 0","numero = 1","while soma < 100:","    soma += numero","    numero += 1","print(soma)"] },
    { id:2, titulo:"3. Menu com Break", historia:"Crie um loop infinito que pede um comando. Se digitar 'sair', use break.", codigoEsperado:["while True:","    comando = input('Digite um comando (ou \"sair\"): ')","    if comando == 'sair':","        break","    print(f'Você digitou: {comando}')"] },
    { id:3, titulo:"4. Continue - Números ímpares", historia:"Exiba apenas números ímpares de 1 a 10. Use continue para pular pares.", codigoEsperado:["i = 1","while i <= 10:","    if i % 2 == 0:","        i += 1","        continue","    print(i)","    i += 1"] },
    { id:4, titulo:"5. AND - Múltiplo de 3 e 5", historia:"Percorra números de 1 a 20. Pare ao encontrar um número divisível por 3 e por 5.", codigoEsperado:["i = 1","while i <= 20:","    if i % 3 == 0 and i % 5 == 0:","        break","    print(i)","    i += 1"] },
    { id:5, titulo:"6. OR - Parada com 0 ou negativo", historia:"Peça números até que o usuário digite 0 ou um número negativo. Use break.", codigoEsperado:["while True:","    num = int(input('Digite um número (0 ou negativo para parar): '))","    if num == 0 or num < 0:","        break","    print(f'Você digitou: {num}')"] },
    { id:6, titulo:"7. NOT - Validação de senha", historia:"Peça a senha. Enquanto a senha NÃO for '1234', continue pedindo.", codigoEsperado:["senha = ''","while not senha == '1234':","    senha = input('Digite a senha: ')","print('Acesso liberado!')"] },
    { id:7, titulo:"8. Tabuada interativa", historia:"Peça um número e mostre sua tabuada do 1 ao 10 usando while.", codigoEsperado:["n = int(input('Digite um número: '))","i = 1","while i <= 10:","    print(f'{n} x {i} = {n*i}')","    i += 1"] },
    { id:8, titulo:"9. Break - Encontrando primo", historia:"Verifique se um número é primo. Se encontrar um divisor, use break.", codigoEsperado:["num = int(input('Digite um número: '))","i = 2","while i < num:","    if num % i == 0:","        print(f'{num} não é primo')","        break","    i += 1","else:","    print(f'{num} é primo')"] },
    { id:9, titulo:"10. Continue - Múltiplos de 3", historia:"Exiba números de 1 a 20, pulando os múltiplos de 3 (use continue).", codigoEsperado:["i = 1","while i <= 20:","    if i % 3 == 0:","        i += 1","        continue","    print(i)","    i += 1"] },
    { id:10, titulo:"11. Validação de entrada (1 a 10)", historia:"Peça um número entre 1 e 10. Enquanto não estiver nesse intervalo, continue pedindo.", codigoEsperado:["num = 0","while num < 1 or num > 10:","    num = int(input('Digite um número entre 1 e 10: '))","print(f'Número válido: {num}')"] },
    { id:11, titulo:"12. Fatorial", historia:"Calcule o fatorial de um número usando while.", codigoEsperado:["n = int(input('Digite um número: '))","fatorial = 1","original = n","while n > 0:","    fatorial *= n","    n -= 1","print(f'{original}! = {fatorial}')"] },
    { id:12, titulo:"13. Break e Continue combinados", historia:"Percorra 1 a 50. Pule pares (continue). Se primo maior que 30, pare (break).", codigoEsperado:["i = 1","while i <= 50:","    if i % 2 == 0:","        i += 1","        continue","    if i > 30 and i % 2 != 0 and i % 3 != 0 and i % 5 != 0:","        print(f'Primo encontrado: {i}')","        break","    print(i)","    i += 1"] },
    { id:13, titulo:"14. Caixa eletrônico", historia:"Saldo 1000. Saques: se insuficiente, continue; se 0, break.", codigoEsperado:["saldo = 1000","while True:","    saque = int(input('Digite o valor do saque (0 para sair): '))","    if saque == 0:","        break","    if saque > saldo:","        print('Saldo insuficiente!')","        continue","    saldo -= saque","    print(f'Saque realizado. Saldo atual: {saldo}')"] },
    { id:14, titulo:"15. Jogo da adivinhação", historia:"Número secreto = 42. Peça palpites até acertar. Use break.", codigoEsperado:["secreto = 42","while True:","    palpite = int(input('Adivinhe o número secreto: '))","    if palpite == secreto:","        print('Acertou!')","        break","    else:","        print('Tente novamente!')"] },
    { id:15, titulo:"16. Média de notas", historia:"Peça notas até -1. Ignore negativas (continue). Calcule a média.", codigoEsperado:["soma = 0","contador = 0","while True:","    nota = float(input('Digite a nota (-1 para sair): '))","    if nota == -1:","        break","    if nota < 0:","        continue","    soma += nota","    contador += 1","if contador > 0:","    media = soma / contador","    print(f'Média: {media:.2f}')"] },
    { id:16, titulo:"17. While aninhado com break", historia:"i de 1 a 3, j de 1 a 5. Se j==3, break interno.", codigoEsperado:["i = 1","while i <= 3:","    j = 1","    while j <= 5:","        if j == 3:","            break","        print(i, j)","        j += 1","    i += 1"] },
    { id:17, titulo:"18. Sequência de Fibonacci", historia:"Gere Fibonacci até ultrapassar 1000. Pare quando termo > 1000.", codigoEsperado:["a, b = 0, 1","while a <= 1000:","    print(a)","    a, b = b, a + b"] },
    { id:18, titulo:"19. Operadores compostos", historia:"Peça um número entre 51 e 99. Enquanto não, continue.", codigoEsperado:["num = 0","while not (num > 50 and num < 100):","    num = int(input('Digite um número entre 51 e 99: '))","print(f'Número aceito: {num}')"] },
    { id:19, titulo:"20. Login com tentativas", historia:"3 tentativas. Use while, break se acertar, continue se errar.", codigoEsperado:["tentativas = 0","while tentativas < 3:","    usuario = input('Usuário: ')","    senha = input('Senha: ')","    if usuario == 'admin' and senha == '123':","        print('Acesso liberado!')","        break","    else:","        tentativas += 1","        print(f'Senha incorreta! Tentativas restantes: {3 - tentativas}')","        continue","else:","    print('Conta bloqueada! Muitas tentativas.')"] },
    { id:20, titulo:"21. Pares até N", historia:"Exiba todos os números pares de 2 até N.", codigoEsperado:["n = int(input('Digite um número: '))","i = 2","while i <= n:","    print(i)","    i += 2"] },
    { id:21, titulo:"22. Decrescente com passo 2", historia:"Exiba 10,8,6,4,2 usando while.", codigoEsperado:["i = 10","while i >= 1:","    print(i)","    i -= 2"] },
    { id:22, titulo:"23. Potência de 2", historia:"Exiba potências de 2 menores que 1000 (1,2,4,8...).", codigoEsperado:["i = 1","while i < 1000:","    print(i)","    i *= 2"] },
    { id:23, titulo:"24. Soma até negativo", historia:"Some números até digitar um negativo. Use break.", codigoEsperado:["soma = 0","while True:","    num = int(input('Digite um número (negativo para parar): '))","    if num < 0:","        break","    soma += num","    print(f'Soma parcial: {soma}')"] },
    { id:24, titulo:"25. Continue - múltiplos de 5", historia:"Exiba 1 a 30, pulando múltiplos de 5.", codigoEsperado:["i = 1","while i <= 30:","    if i % 5 == 0:","        i += 1","        continue","    print(i)","    i += 1"] },
    { id:25, titulo:"26. Múltiplo de 3 ou 5", historia:"Peça número múltiplo de 3 ou 5. Enquanto não, continue.", codigoEsperado:["num = 0","while not (num % 3 == 0 or num % 5 == 0):","    num = int(input('Digite um múltiplo de 3 ou 5: '))","print(f'Número válido: {num}')"] },
    { id:26, titulo:"27. Crescente até N com limite", historia:"Exiba 1 a N, mas pare se ultrapassar 100.", codigoEsperado:["n = int(input('Digite o limite: '))","i = 1","while i <= n:","    if i > 100:","        break","    print(i)","    i += 1"] },
    { id:27, titulo:"28. Soma dos dígitos", historia:"Calcule a soma dos dígitos de um número positivo.", codigoEsperado:["n = int(input('Digite um número: '))","soma = 0","while n > 0:","    soma += n % 10","    n //= 10","print(f'Soma dos dígitos: {soma}')"] },
    { id:28, titulo:"29. Inverter número", historia:"Inverta a ordem dos dígitos. Ex: 123 → 321.", codigoEsperado:["n = int(input('Digite um número: '))","invertido = 0","while n > 0:","    invertido = invertido * 10 + n % 10","    n //= 10","print(f'Número invertido: {invertido}')"] },
    { id:29, titulo:"30. Desafio final", historia:"Peça números até soma > 500 ou digitar -1. Mostre soma final.", codigoEsperado:["soma = 0","while True:","    num = int(input('Digite um número (-1 para sair): '))","    if num == -1:","        break","    soma += num","    if soma > 500:","        break","    print(f'Soma atual: {soma}')","print(f'Soma final: {soma}')"] }
];

function getMissao(id) { return MISSOES[id]; }

function createGameState(playersNames) {
    return {
        players: playersNames,
        currentPlayerIndex: 0,
        boardSize: 30,
        playersPositions: new Array(playersNames.length).fill(0),
        gameActive: true,
        winner: null
    };
}

io.on('connection', (socket) => {
    console.log(`Cliente ${socket.id} conectado`);

    socket.on('join-room', ({ playerName, roomName }) => {
        const roomId = roomName.trim();
        if (!rooms.has(roomId)) rooms.set(roomId, { players: {}, readyStatus: {}, gameState: null });
        const room = rooms.get(roomId);
        if (room.gameState && room.gameState.gameActive) { socket.emit('error-msg', 'Jogo já começou.'); return; }
        if (room.players[playerName]) { socket.emit('error-msg', 'Nome já usado.'); return; }
        room.players[playerName] = socket.id;
        room.readyStatus[playerName] = false;
        socket.join(roomId);
        socket.emit('room-joined', { room: roomId, playerName, players: room.players, readyStatus: room.readyStatus });
        io.to(roomId).emit('room-update', { players: room.players, readyStatus: room.readyStatus });
    });

    socket.on('player-ready', ({ room, playerName }) => {
        const roomObj = rooms.get(room);
        if (!roomObj) return;
        if (roomObj.gameState) return;
        roomObj.readyStatus[playerName] = true;
        io.to(room).emit('room-update', { players: roomObj.players, readyStatus: roomObj.readyStatus });
        const allReady = Object.values(roomObj.readyStatus).every(v => v === true);
        const count = Object.keys(roomObj.players).length;
        if (allReady && count >= 2) {
            const playersNames = Object.keys(roomObj.players);
            const gameState = createGameState(playersNames);
            roomObj.gameState = gameState;
            io.to(room).emit('game-start', {
                players: playersNames,
                positions: gameState.playersPositions,
                currentPlayer: gameState.players[gameState.currentPlayerIndex]
            });
        }
    });

    socket.on('roll-dice', ({ room, playerId }) => {
        const roomObj = rooms.get(room);
        if (!roomObj || !roomObj.gameState) return;
        const state = roomObj.gameState;
        const idx = state.players.indexOf(playerId);
        if (idx !== state.currentPlayerIndex) { socket.emit('error-msg', 'Não é sua vez'); return; }
        const dice = Math.floor(Math.random() * 6) + 1; // Dado normal 1-6
        let newPos = state.playersPositions[idx] + dice;
        if (newPos > state.boardSize) newPos = state.boardSize;
        state.playersPositions[idx] = newPos;
        io.to(room).emit('dice-rolled', { playerId, dice, newPosition: newPos, positions: state.playersPositions });
        if (newPos === state.boardSize) {
            state.gameActive = false;
            state.winner = playerId;
            io.to(room).emit('game-ended', { winner: playerId });
            return;
        }
        const missao = getMissao(newPos);
        io.to(room).emit('missao-received', { playerId, missao, posicao: newPos });
    });

    socket.on('submit-codigo', ({ room, playerId, posicao, blocosMontados }) => {
        const roomObj = rooms.get(room);
        if (!roomObj || !roomObj.gameState) return;
        const state = roomObj.gameState;
        const idx = state.players.indexOf(playerId);
        if (idx !== state.currentPlayerIndex) { socket.emit('error-msg', 'Não é sua vez'); return; }

        const esperado = getMissao(posicao).codigoEsperado;
        let acertou = (blocosMontados.length === esperado.length);
        if (acertou) {
            for (let i=0; i<esperado.length; i++) {
                if (blocosMontados[i] !== esperado[i]) { acertou = false; break; }
            }
        }
        let mensagem = '';
        if (acertou) {
            let newPos = state.playersPositions[idx] + 1;
            if (newPos > state.boardSize) newPos = state.boardSize;
            state.playersPositions[idx] = newPos;
            mensagem = '✅ Código correto! Avançou uma casa.';
            io.to(room).emit('move-result', { playerId, success: true, newPosition: newPos, positions: state.playersPositions, message: mensagem });
            if (newPos === state.boardSize) {
                state.gameActive = false;
                state.winner = playerId;
                io.to(room).emit('game-ended', { winner: playerId });
                return;
            }
        } else {
            let newPos = Math.max(0, state.playersPositions[idx] - 1);
            state.playersPositions[idx] = newPos;
            mensagem = '❌ Código incorreto! Voltou uma casa.';
            io.to(room).emit('move-result', { playerId, success: false, newPosition: newPos, positions: state.playersPositions, message: mensagem });
        }
        // Passa o turno para o próximo jogador
        state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
        io.to(room).emit('turn-update', { currentPlayer: state.players[state.currentPlayerIndex], positions: state.playersPositions });
    });

    socket.on('disconnect', () => {
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
                if (Object.keys(room.players).length === 0) rooms.delete(roomId);
                else io.to(roomId).emit('room-update', { players: room.players, readyStatus: room.readyStatus });
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
