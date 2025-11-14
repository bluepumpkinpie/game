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

        this.descriptionText = document.getElementById('description-text');
        this.currentRoomText = document.getElementById('current-room');
        this.inventoryContainer = document.getElementById('inventory-items');

        this.setupEventListeners();
        this.loadRoom('entrance');
        this.render();
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

        // Рисуем фон комнаты
        ctx.fillStyle = this.currentRoom.backgroundColor || '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Рисуем пол
        ctx.fillStyle = this.currentRoom.floorColor || '#2a2a2a';
        ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

        // Рисуем стены
        this.drawWalls();

        // Рисуем объекты
        this.currentRoom.objects.forEach(obj => {
            if (obj.visible) {
                this.drawObject(obj);
            }
        });

        // Рисуем выходы
        this.currentRoom.exits.forEach(exit => {
            this.drawExit(exit);
        });
    }

    drawWalls() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        // Левая стена
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(150, canvas.height * 0.3);
        ctx.lineTo(150, canvas.height * 0.7);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Правая стена
        ctx.beginPath();
        ctx.moveTo(canvas.width, 0);
        ctx.lineTo(canvas.width - 150, canvas.height * 0.3);
        ctx.lineTo(canvas.width - 150, canvas.height * 0.7);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Задняя стена
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(150, canvas.height * 0.3, canvas.width - 300, canvas.height * 0.4);
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
        name: 'Прихожая',
        description: 'Вы стоите в темной прихожей старого особняка. Пыль танцует в лучах света.',
        backgroundColor: '#1a1a1a',
        floorColor: '#2a2a2a',
        objects: [
            {
                id: 'table',
                name: 'Стол',
                x: 300,
                y: 350,
                width: 120,
                height: 80,
                color: '#8b7355',
                visible: true,
                canTake: false,
                description: 'Старый деревянный стол. На нем лежит какой-то предмет.',
            },
            {
                id: 'key',
                name: 'Ключ',
                inventoryName: 'Старый ключ',
                x: 330,
                y: 340,
                width: 40,
                height: 20,
                color: '#d4af37',
                visible: true,
                canTake: true,
                description: 'Старый латунный ключ. Интересно, от чего он?',
            },
            {
                id: 'painting',
                name: 'Картина',
                x: 500,
                y: 250,
                width: 100,
                height: 120,
                color: '#6a5a45',
                visible: true,
                canTake: false,
                description: 'Портрет строгого джентльмена. Его глаза словно следят за вами.',
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
                color: '#5a4a3a',
            }
        ]
    },

    library: {
        name: 'Библиотека',
        description: 'Огромная библиотека с полками от пола до потолка. Пахнет старыми книгами.',
        backgroundColor: '#1a1515',
        floorColor: '#2a2020',
        objects: [
            {
                id: 'bookshelf',
                name: 'Книжная полка',
                x: 250,
                y: 280,
                width: 150,
                height: 180,
                color: '#6a4a3a',
                visible: true,
                canTake: false,
                description: 'Массивная книжная полка. Одна книга выглядит необычно.',
                useWith: {
                    'feather': {
                        message: 'Вы смахнули пыль пером. За книгой что-то блестит!',
                        makeVisible: 'gem',
                    }
                }
            },
            {
                id: 'gem',
                name: 'Драгоценный камень',
                inventoryName: 'Изумруд',
                x: 320,
                y: 350,
                width: 30,
                height: 30,
                color: '#50C878',
                visible: false,
                canTake: true,
                description: 'Сверкающий изумруд. Очень ценная вещь!',
            },
            {
                id: 'desk',
                name: 'Письменный стол',
                x: 480,
                y: 360,
                width: 140,
                height: 100,
                color: '#8b6a55',
                visible: true,
                canTake: false,
                description: 'Старый письменный стол с запертым ящиком.',
                useWith: {
                    'old_key': {
                        message: 'Ключ подходит! В ящике лежит перо.',
                        addItem: { id: 'feather', name: 'Перо' },
                        setState: { deskUnlocked: true }
                    }
                }
            },
            {
                id: 'locked_chest',
                name: 'Сундук',
                x: 550,
                y: 400,
                width: 100,
                height: 70,
                color: '#5a4a3a',
                visible: true,
                canTake: false,
                description: 'Запертый сундук. На нем углубление в форме драгоценного камня.',
                useWith: {
                    'emerald': {
                        message: '🎉 Поздравляем! Вы открыли сундук и нашли сокровище! Игра пройдена!',
                        callback: (game) => {
                            setTimeout(() => {
                                alert('🎉 Победа! Вы разгадали тайну старого особняка!\n\nСпасибо за игру!');
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
                color: '#5a4a3a',
            },
            {
                type: 'exit',
                name: 'Секретная комната',
                to: 'secret',
                x: 650,
                y: 290,
                width: 70,
                height: 130,
                color: '#4a3a2a',
            }
        ]
    },

    secret: {
        name: 'Секретная комната',
        description: 'Маленькая секретная комната. Здесь хранились важные вещи.',
        backgroundColor: '#151515',
        floorColor: '#252525',
        objects: [
            {
                id: 'safe',
                name: 'Сейф',
                x: 350,
                y: 320,
                width: 100,
                height: 120,
                color: '#4a4a4a',
                visible: true,
                canTake: false,
                description: 'Старый сейф. Он приоткрыт.',
            },
            {
                id: 'note',
                name: 'Записка',
                inventoryName: 'Записка',
                x: 370,
                y: 350,
                width: 60,
                height: 40,
                color: '#f0e68c',
                visible: true,
                canTake: true,
                description: 'Записка гласит: "Изумруд откроет путь к сокровищу в библиотеке".',
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
                color: '#5a4a3a',
            }
        ]
    }
};

// Запуск игры
let game;
window.addEventListener('load', () => {
    game = new Game();
});
