// Игровой движок для 2D Point & Click Adventure
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentRoom = null;
        this.inventory = [];
        this.selectedItem = null;
        this.currentAction = 'examine';
        this.gameState = {};
        this.animationFrame = 0;

        this.descriptionText = document.getElementById('description-text');
        this.currentRoomText = document.getElementById('current-room');
        this.inventoryContainer = document.getElementById('inventory-items');

        this.setupEventListeners();
        this.loadRoom('entrance');
        this.startAnimation();
    }

    startAnimation() {
        const animate = () => {
            this.animationFrame++;
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }

    setupEventListeners() {
        // Клики по canvas
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // Кнопки действий
        document.getElementById('btn-examine').addEventListener('click', () => {
            this.currentAction = 'examine';
            this.updateDescription('Режим: Осмотреть объект');
        });

        document.getElementById('btn-use').addEventListener('click', () => {
            if (this.selectedItem) {
                this.currentAction = 'use';
                this.updateDescription(`Используйте "${this.selectedItem}" на объекте`);
            } else {
                this.updateDescription('Сначала выберите предмет из инвентаря');
            }
        });

        document.getElementById('btn-take').addEventListener('click', () => {
            this.currentAction = 'take';
            this.updateDescription('Режим: Взять предмет');
        });
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const clickedObject = this.getObjectAtPosition(x, y);

        if (clickedObject) {
            this.interactWithObject(clickedObject);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const hoveredObject = this.getObjectAtPosition(x, y);

        if (hoveredObject) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }

    getObjectAtPosition(x, y) {
        if (!this.currentRoom) return null;

        // Проверяем персонажей
        if (this.currentRoom.characters) {
            for (let char of this.currentRoom.characters) {
                if (!char.visible) continue;
                if (x >= char.x && x <= char.x + char.width &&
                    y >= char.y && y <= char.y + char.height) {
                    return char;
                }
            }
        }

        // Проверяем все объекты в комнате
        for (let obj of this.currentRoom.objects) {
            if (!obj.visible) continue;

            if (x >= obj.x && x <= obj.x + obj.width &&
                y >= obj.y && y <= obj.y + obj.height) {
                return obj;
            }
        }

        // Проверяем выходы
        for (let exit of this.currentRoom.exits) {
            if (x >= exit.x && x <= exit.x + exit.width &&
                y >= exit.y && y <= exit.y + exit.height) {
                return exit;
            }
        }

        return null;
    }

    interactWithObject(obj) {
        if (obj.type === 'exit') {
            this.loadRoom(obj.to);
            return;
        }

        switch (this.currentAction) {
            case 'examine':
                this.examineObject(obj);
                break;
            case 'take':
                this.takeObject(obj);
                break;
            case 'use':
                this.useItemOnObject(obj);
                break;
        }
    }

    examineObject(obj) {
        this.updateDescription(obj.description);
        if (obj.onExamine) {
            obj.onExamine(this);
        }
    }

    takeObject(obj) {
        if (obj.canTake) {
            if (obj.requiresItem && !this.hasItem(obj.requiresItem)) {
                this.updateDescription(obj.requiresMessage || 'Вы не можете взять это сейчас.');
                return;
            }

            this.addToInventory(obj.id, obj.inventoryName || obj.name);
            obj.visible = false;
            this.updateDescription(`Вы взяли: ${obj.inventoryName || obj.name}`);

            if (obj.onTake) {
                obj.onTake(this);
            }

            this.render();
        } else {
            this.updateDescription('Вы не можете взять это.');
        }
    }

    useItemOnObject(obj) {
        if (!this.selectedItem) {
            this.updateDescription('Сначала выберите предмет из инвентаря');
            return;
        }

        if (obj.useWith && obj.useWith[this.selectedItem]) {
            const result = obj.useWith[this.selectedItem];
            this.updateDescription(result.message);

            if (result.removeItem) {
                this.removeFromInventory(this.selectedItem);
            }

            if (result.addItem) {
                this.addToInventory(result.addItem.id, result.addItem.name);
            }

            if (result.setState) {
                for (let key in result.setState) {
                    this.gameState[key] = result.setState[key];
                }
            }

            if (result.makeVisible) {
                const targetObj = this.currentRoom.objects.find(o => o.id === result.makeVisible);
                if (targetObj) targetObj.visible = true;
            }

            if (result.makeInvisible) {
                const targetObj = this.currentRoom.objects.find(o => o.id === result.makeInvisible);
                if (targetObj) targetObj.visible = false;
            }

            if (result.callback) {
                result.callback(this);
            }

            this.render();
        } else {
            this.updateDescription(`"${this.selectedItem}" не подходит для этого.`);
        }
    }

    addToInventory(id, name) {
        if (!this.inventory.find(item => item.id === id)) {
            this.inventory.push({ id, name });
            this.renderInventory();
        }
    }

    removeFromInventory(id) {
        this.inventory = this.inventory.filter(item => item.id !== id);
        if (this.selectedItem === id) {
            this.selectedItem = null;
        }
        this.renderInventory();
    }

    hasItem(id) {
        return this.inventory.some(item => item.id === id);
    }

    renderInventory() {
        this.inventoryContainer.innerHTML = '';

        this.inventory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            if (this.selectedItem === item.id) {
                itemDiv.classList.add('selected');
            }
            itemDiv.textContent = item.name;
            itemDiv.addEventListener('click', () => {
                this.selectedItem = this.selectedItem === item.id ? null : item.id;
                this.renderInventory();
                if (this.selectedItem) {
                    this.updateDescription(`Выбран предмет: ${item.name}`);
                    this.currentAction = 'use';
                } else {
                    this.updateDescription('Предмет снят с выбора');
                    this.currentAction = 'examine';
                }
            });
            this.inventoryContainer.appendChild(itemDiv);
        });
    }

    updateDescription(text) {
        this.descriptionText.textContent = text;
    }

    loadRoom(roomId) {
        this.currentRoom = rooms[roomId];
        if (this.currentRoom) {
            this.currentRoomText.textContent = this.currentRoom.name;
            this.updateDescription(this.currentRoom.description);
            this.render();
        }
    }

    render() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!this.currentRoom) return;

        // Рисуем ночное небо (для комнат с окнами)
        this.drawNightSky();

        // Рисуем фон комнаты
        ctx.fillStyle = this.currentRoom.backgroundColor || '#0a0a15';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Рисуем пол
        ctx.fillStyle = this.currentRoom.floorColor || '#1a1a25';
        ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

        // Рисуем стены замка
        this.drawCastleWalls();

        // Рисуем окно с луной (если есть)
        if (this.currentRoom.hasWindow) {
            this.drawWindow();
        }

        // Рисуем объекты
        this.currentRoom.objects.forEach(obj => {
            if (obj.visible) {
                this.drawObject(obj);
            }
        });

        // Рисуем персонажей
        if (this.currentRoom.characters) {
            this.currentRoom.characters.forEach(char => {
                if (char.visible) {
                    this.drawAnimeCharacter(char);
                }
            });
        }

        // Рисуем выходы
        this.currentRoom.exits.forEach(exit => {
            this.drawExit(exit);
        });
    }

    drawNightSky() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        // Градиент ночного неба
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);
        gradient.addColorStop(0, '#0a0a20');
        gradient.addColorStop(1, '#1a1a30');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5);
    }

    drawCastleWalls() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        // Левая стена замка с каменной текстурой
        const leftGradient = ctx.createLinearGradient(0, 0, 150, 0);
        leftGradient.addColorStop(0, '#2a2a40');
        leftGradient.addColorStop(1, '#3a3a50');
        ctx.fillStyle = leftGradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(150, canvas.height * 0.3);
        ctx.lineTo(150, canvas.height * 0.7);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Каменные блоки на левой стене
        ctx.strokeStyle = '#1a1a30';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            const y = i * 60;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(150, canvas.height * 0.3 + (y * 0.4));
            ctx.stroke();
        }

        // Правая стена замка
        const rightGradient = ctx.createLinearGradient(canvas.width - 150, 0, canvas.width, 0);
        rightGradient.addColorStop(0, '#3a3a50');
        rightGradient.addColorStop(1, '#2a2a40');
        ctx.fillStyle = rightGradient;
        ctx.beginPath();
        ctx.moveTo(canvas.width, 0);
        ctx.lineTo(canvas.width - 150, canvas.height * 0.3);
        ctx.lineTo(canvas.width - 150, canvas.height * 0.7);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Каменные блоки на правой стене
        for (let i = 0; i < 10; i++) {
            const y = i * 60;
            ctx.beginPath();
            ctx.moveTo(canvas.width, y);
            ctx.lineTo(canvas.width - 150, canvas.height * 0.3 + (y * 0.4));
            ctx.stroke();
        }

        // Задняя стена замка
        const backGradient = ctx.createLinearGradient(0, canvas.height * 0.3, 0, canvas.height * 0.7);
        backGradient.addColorStop(0, '#4a4a60');
        backGradient.addColorStop(1, '#3a3a50');
        ctx.fillStyle = backGradient;
        ctx.fillRect(150, canvas.height * 0.3, canvas.width - 300, canvas.height * 0.4);

        // Горизонтальные линии кирпичей
        ctx.strokeStyle = '#2a2a40';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const y = canvas.height * 0.3 + (i * 48);
            ctx.beginPath();
            ctx.moveTo(150, y);
            ctx.lineTo(canvas.width - 150, y);
            ctx.stroke();
        }

        // Вертикальные линии кирпичей
        for (let i = 0; i < 8; i++) {
            const x = 150 + (i * 80);
            ctx.beginPath();
            ctx.moveTo(x, canvas.height * 0.3);
            ctx.lineTo(x, canvas.height * 0.7);
            ctx.stroke();
        }
    }

    drawWindow() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        const winX = canvas.width / 2 - 80;
        const winY = canvas.height * 0.35;
        const winW = 160;
        const winH = 140;

        // Арка окна
        ctx.fillStyle = '#0a0a20';
        ctx.beginPath();
        ctx.arc(winX + winW / 2, winY + winH / 2, winW / 2, 0, Math.PI * 2);
        ctx.fill();

        // Небо в окне с градиентом
        const skyGradient = ctx.createRadialGradient(
            winX + winW / 2, winY + winH / 2, 10,
            winX + winW / 2, winY + winH / 2, winW / 2
        );
        skyGradient.addColorStop(0, '#1a1a40');
        skyGradient.addColorStop(1, '#0a0a20');
        ctx.fillStyle = skyGradient;
        ctx.beginPath();
        ctx.arc(winX + winW / 2, winY + winH / 2, winW / 2 - 10, 0, Math.PI * 2);
        ctx.fill();

        // Луна
        const moonX = winX + winW / 2 + 20;
        const moonY = winY + 40;
        ctx.fillStyle = '#f0f0a0';
        ctx.shadowColor = '#f0f0a0';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Кратеры на луне
        ctx.fillStyle = '#e0e090';
        ctx.beginPath();
        ctx.arc(moonX - 8, moonY - 5, 4, 0, Math.PI * 2);
        ctx.arc(moonX + 5, moonY + 3, 3, 0, Math.PI * 2);
        ctx.arc(moonX - 3, moonY + 8, 2, 0, Math.PI * 2);
        ctx.fill();

        // Звезды в окне
        ctx.fillStyle = '#ffffff';
        const stars = [
            [winX + 30, winY + 30],
            [winX + 130, winY + 40],
            [winX + 50, winY + 100],
            [winX + 120, winY + 110],
            [winX + 80, winY + 120]
        ];

        stars.forEach(([x, y]) => {
            const twinkle = Math.sin(this.animationFrame * 0.05 + x + y) * 0.5 + 0.5;
            ctx.globalAlpha = 0.5 + twinkle * 0.5;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
            // Крестообразное свечение
            ctx.fillRect(x - 4, y - 0.5, 8, 1);
            ctx.fillRect(x - 0.5, y - 4, 1, 8);
        });
        ctx.globalAlpha = 1;

        // Рама окна
        ctx.strokeStyle = '#5a5a70';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(winX + winW / 2, winY + winH / 2, winW / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Крест рамы
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(winX + winW / 2, winY);
        ctx.lineTo(winX + winW / 2, winY + winH);
        ctx.moveTo(winX, winY + winH / 2);
        ctx.lineTo(winX + winW, winY + winH / 2);
        ctx.stroke();
    }

    drawAnimeCharacter(char) {
        const ctx = this.ctx;
        const x = char.x;
        const y = char.y;
        const scale = char.scale || 1;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Тень персонажа
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(25, 145, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ноги
        ctx.fillStyle = char.clothesColor || '#2a2a50';
        ctx.fillRect(15, 100, 8, 35);
        ctx.fillRect(27, 100, 8, 35);

        // Обувь
        ctx.fillStyle = '#1a1a30';
        ctx.fillRect(13, 133, 12, 8);
        ctx.fillRect(25, 133, 12, 8);

        // Тело (платье/одежда)
        ctx.fillStyle = char.clothesColor || '#2a2a50';
        ctx.beginPath();
        ctx.moveTo(25, 50);
        ctx.lineTo(10, 55);
        ctx.lineTo(5, 100);
        ctx.lineTo(45, 100);
        ctx.lineTo(40, 55);
        ctx.closePath();
        ctx.fill();

        // Акценты на одежде
        ctx.strokeStyle = char.accentColor || '#4a4a70';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(15, 70);
        ctx.lineTo(35, 70);
        ctx.stroke();

        // Руки
        ctx.fillStyle = char.skinColor || '#ffd5b4';
        // Левая рука
        ctx.fillRect(3, 55, 7, 30);
        ctx.beginPath();
        ctx.arc(6.5, 87, 5, 0, Math.PI * 2);
        ctx.fill();
        // Правая рука
        ctx.fillRect(40, 55, 7, 30);
        ctx.beginPath();
        ctx.arc(43.5, 87, 5, 0, Math.PI * 2);
        ctx.fill();

        // Шея
        ctx.fillStyle = char.skinColor || '#ffd5b4';
        ctx.fillRect(20, 45, 10, 8);

        // Голова
        ctx.fillStyle = char.skinColor || '#ffd5b4';
        ctx.beginPath();
        ctx.arc(25, 28, 18, 0, Math.PI * 2);
        ctx.fill();

        // Волосы
        ctx.fillStyle = char.hairColor || '#4a2a2a';

        // Основная прическа
        ctx.beginPath();
        ctx.arc(25, 23, 19, Math.PI, Math.PI * 2);
        ctx.arc(15, 25, 12, 0, Math.PI * 2);
        ctx.arc(35, 25, 12, 0, Math.PI * 2);
        ctx.fill();

        // Челка
        ctx.beginPath();
        ctx.moveTo(10, 20);
        ctx.quadraticCurveTo(15, 15, 18, 22);
        ctx.quadraticCurveTo(22, 15, 25, 22);
        ctx.quadraticCurveTo(28, 15, 32, 22);
        ctx.quadraticCurveTo(35, 15, 40, 20);
        ctx.lineTo(40, 25);
        ctx.lineTo(10, 25);
        ctx.closePath();
        ctx.fill();

        // Лицо - глаза (аниме стиль)
        ctx.fillStyle = '#ffffff';
        // Левый глаз
        ctx.beginPath();
        ctx.ellipse(18, 28, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Правый глаз
        ctx.beginPath();
        ctx.ellipse(32, 28, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Зрачки
        ctx.fillStyle = char.eyeColor || '#4a4aff';
        ctx.beginPath();
        ctx.arc(18, 28, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(32, 28, 3, 0, Math.PI * 2);
        ctx.fill();

        // Блики в глазах (аниме эффект)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(19, 26, 1.5, 0, Math.PI * 2);
        ctx.arc(33, 26, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Нос
        ctx.strokeStyle = '#d0a090';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(25, 32);
        ctx.lineTo(26, 34);
        ctx.stroke();

        // Рот (улыбка)
        ctx.strokeStyle = '#c08080';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(25, 36, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Румянец
        ctx.fillStyle = 'rgba(255, 150, 150, 0.3)';
        ctx.beginPath();
        ctx.ellipse(13, 34, 4, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(37, 34, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Имя персонажа
        ctx.restore();
        ctx.fillStyle = '#f0f0f0';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(char.name, x + 25, y - 10);
    }

    drawObject(obj) {
        const ctx = this.ctx;

        ctx.fillStyle = obj.color || '#8b7355';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);

        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(obj.x, obj.y + obj.height, obj.width, 5);

        // Рамка
        ctx.strokeStyle = '#6a5a45';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

        // Название
        ctx.fillStyle = '#f0f0f0';
        ctx.font = '14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(obj.name, obj.x + obj.width / 2, obj.y - 10);
    }

    drawExit(exit) {
        const ctx = this.ctx;

        // Дверь или проход
        ctx.fillStyle = exit.color || '#5a4a3a';
        ctx.fillRect(exit.x, exit.y, exit.width, exit.height);

        // Детали двери
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 3;
        ctx.strokeRect(exit.x, exit.y, exit.width, exit.height);

        // Дверная ручка
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(exit.x + exit.width - 20, exit.y + exit.height / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Стрелка
        ctx.fillStyle = '#f0f0f0';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('→', exit.x + exit.width / 2, exit.y - 10);

        // Название
        ctx.font = '12px Georgia';
        ctx.fillText(exit.name, exit.x + exit.width / 2, exit.y - 25);
    }
}

// Определение комнат и объектов
const rooms = {
    entrance: {
        name: 'Прихожая Замка',
        description: 'Вы в прихожей древнего замка. Лунный свет льется через круглое окно, освещая каменные стены.',
        backgroundColor: '#0a0a15',
        floorColor: '#1a1a25',
        hasWindow: true,
        characters: [
            {
                type: 'character',
                id: 'mysterious_girl',
                name: 'Юки',
                x: 550,
                y: 330,
                width: 50,
                height: 150,
                scale: 1.2,
                visible: true,
                canTake: false,
                hairColor: '#8a2be2',
                eyeColor: '#ff69b4',
                skinColor: '#ffe0cc',
                clothesColor: '#4a0080',
                accentColor: '#8a2be2',
                description: 'Таинственная девушка с фиолетовыми волосами. Она улыбается вам.',
                dialogue: [
                    'Добро пожаловать в древний замок! Я здесь хранительница.',
                    'Говорят, здесь спрятано великое сокровище...',
                    'Будьте осторожны в библиотеке - там много секретов!'
                ],
                currentDialogue: 0,
                onExamine: function(game) {
                    game.updateDescription(this.dialogue[this.currentDialogue]);
                    this.currentDialogue = (this.currentDialogue + 1) % this.dialogue.length;
                }
            }
        ],
        objects: [
            {
                id: 'table',
                name: 'Старинный Стол',
                x: 300,
                y: 350,
                width: 120,
                height: 80,
                color: '#3a2a50',
                visible: true,
                canTake: false,
                description: 'Древний деревянный стол с резными узорами. На нем лежит что-то блестящее.',
            },
            {
                id: 'key',
                name: 'Ключ',
                inventoryName: 'Старый ключ',
                x: 330,
                y: 340,
                width: 40,
                height: 20,
                color: '#ffd700',
                visible: true,
                canTake: true,
                description: 'Золотистый старинный ключ с магическими рунами.',
            },
            {
                id: 'armor',
                name: 'Доспехи',
                x: 240,
                y: 280,
                width: 60,
                height: 140,
                color: '#5a5a7a',
                visible: true,
                canTake: false,
                description: 'Рыцарские доспехи стоят у стены. Они выглядят очень старыми.',
            }
        ],
        exits: [
            {
                type: 'exit',
                name: 'Библиотека',
                to: 'library',
                x: 200,
                y: 300,
                width: 80,
                height: 140,
                color: '#3a2a50',
            }
        ]
    },

    library: {
        name: 'Библиотека Замка',
        description: 'Огромная библиотека замка. Древние книги хранят тайны веков. Луна светит через витражное окно.',
        backgroundColor: '#0a0a18',
        floorColor: '#15152a',
        hasWindow: true,
        characters: [
            {
                type: 'character',
                id: 'librarian',
                name: 'Айка',
                x: 180,
                y: 360,
                width: 50,
                height: 150,
                scale: 1.0,
                visible: true,
                canTake: false,
                hairColor: '#cd853f',
                eyeColor: '#32cd32',
                skinColor: '#ffd5b4',
                clothesColor: '#2a4a2a',
                accentColor: '#4a6a4a',
                description: 'Библиотекарша замка. У нее умные зеленые глаза.',
                dialogue: [
                    'Добро пожаловать в древнюю библиотеку!',
                    'Здесь хранятся знания тысячелетий...',
                    'Ищешь сокровище? Используй мудрость, не силу.',
                    'Изумруд откроет путь к тому, что ты ищешь.'
                ],
                currentDialogue: 0,
                onExamine: function(game) {
                    game.updateDescription(this.dialogue[this.currentDialogue]);
                    this.currentDialogue = (this.currentDialogue + 1) % this.dialogue.length;
                }
            }
        ],
        objects: [
            {
                id: 'bookshelf',
                name: 'Древняя Книжная Полка',
                x: 420,
                y: 280,
                width: 150,
                height: 180,
                color: '#3a2a50',
                visible: true,
                canTake: false,
                description: 'Массивная книжная полка с древними фолиантами. Одна книга светится магическим светом.',
                useWith: {
                    'feather': {
                        message: 'Вы смахнули пыль магическим пером. Книги раздвинулись, открыв сверкающий изумруд!',
                        makeVisible: 'gem',
                    }
                }
            },
            {
                id: 'gem',
                name: 'Магический Изумруд',
                inventoryName: 'Изумруд',
                x: 470,
                y: 350,
                width: 30,
                height: 30,
                color: '#00ff7f',
                visible: false,
                canTake: true,
                description: 'Сверкающий изумруд с магической аурой. Он пульсирует таинственным светом!',
            },
            {
                id: 'desk',
                name: 'Старинный Секретер',
                x: 280,
                y: 360,
                width: 120,
                height: 100,
                color: '#4a3a60',
                visible: true,
                canTake: false,
                description: 'Древний письменный стол с запертым ящиком. На нем выгравированы магические руны.',
                useWith: {
                    'old_key': {
                        message: 'Ключ подходит к замку! Ящик открылся, внутри лежит волшебное перо феникса.',
                        addItem: { id: 'feather', name: 'Перо Феникса' },
                        setState: { deskUnlocked: true }
                    }
                }
            },
            {
                id: 'locked_chest',
                name: 'Сундук Сокровищ',
                x: 600,
                y: 400,
                width: 100,
                height: 70,
                color: '#6a4a00',
                visible: true,
                canTake: false,
                description: 'Древний сундук с золотой отделкой. На крышке углубление в форме драгоценного камня.',
                useWith: {
                    'emerald': {
                        message: '✨ Магический изумруд засиял! Сундук открылся, показав легендарное сокровище замка! ✨',
                        callback: (game) => {
                            setTimeout(() => {
                                alert('🎉 Поздравляем! Вы нашли легендарное сокровище древнего замка!\n\n✨ Тайна разгадана! ✨\n\nСпасибо за игру!');
                            }, 500);
                        }
                    }
                }
            }
        ],
        exits: [
            {
                type: 'exit',
                name: 'Прихожая',
                to: 'entrance',
                x: 200,
                y: 300,
                width: 80,
                height: 140,
                color: '#3a2a50',
            },
            {
                type: 'exit',
                name: 'Секретная Комната',
                to: 'secret',
                x: 650,
                y: 290,
                width: 70,
                height: 130,
                color: '#2a1a40',
            }
        ]
    },

    secret: {
        name: 'Секретная Башня',
        description: 'Таинственная башня замка. Звезды ярко светят через открытое окно. Здесь царит магическая атмосфера.',
        backgroundColor: '#050510',
        floorColor: '#0a0a20',
        hasWindow: true,
        characters: [
            {
                type: 'character',
                id: 'ghost_girl',
                name: 'Рей',
                x: 450,
                y: 330,
                width: 50,
                height: 150,
                scale: 1.1,
                visible: true,
                canTake: false,
                hairColor: '#e0e0ff',
                eyeColor: '#b0c4de',
                skinColor: '#f0f0ff',
                clothesColor: '#6a5acd',
                accentColor: '#9370db',
                description: 'Призрачная девушка со светлыми волосами. Она выглядит дружелюбно.',
                dialogue: [
                    'Привет... Я дух этого замка.',
                    'Я охраняю сокровище уже много веков...',
                    'Эта записка поможет тебе. Удачи, путник!',
                    'Помни: изумруд - ключ к сокровищу.'
                ],
                currentDialogue: 0,
                onExamine: function(game) {
                    game.updateDescription(this.dialogue[this.currentDialogue]);
                    this.currentDialogue = (this.currentDialogue + 1) % this.dialogue.length;
                }
            }
        ],
        objects: [
            {
                id: 'safe',
                name: 'Магический Сейф',
                x: 280,
                y: 320,
                width: 100,
                height: 120,
                color: '#5a5a8a',
                visible: true,
                canTake: false,
                description: 'Древний сейф с магическими печатями. Он слегка приоткрыт.',
            },
            {
                id: 'note',
                name: 'Древняя Записка',
                inventoryName: 'Записка',
                x: 300,
                y: 350,
                width: 60,
                height: 40,
                color: '#ffe4b5',
                visible: true,
                canTake: true,
                description: 'Записка светится магическим светом: "Магический изумруд откроет путь к легендарному сокровищу в библиотеке замка."',
            },
            {
                id: 'crystal',
                name: 'Кристалл',
                x: 580,
                y: 300,
                width: 40,
                height: 60,
                color: '#9370db',
                visible: true,
                canTake: false,
                description: 'Светящийся магический кристалл. Он излучает мягкое фиолетовое свечение.',
            }
        ],
        exits: [
            {
                type: 'exit',
                name: 'Библиотека',
                to: 'library',
                x: 200,
                y: 300,
                width: 80,
                height: 140,
                color: '#3a2a50',
            }
        ]
    }
};

// Запуск игры
let game;
window.addEventListener('load', () => {
    game = new Game();
});
