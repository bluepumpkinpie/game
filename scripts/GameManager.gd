extends Node
class_name GameManager

## Главный менеджер игры - управляет состоянием, инвентарем и переходами между комнатами

signal description_changed(text: String)
signal room_changed(room_name: String)
signal inventory_changed()

var current_room: Room = null
var inventory: Array[InventoryItem] = []
var selected_item: InventoryItem = null
var current_action: String = "examine"  # examine, take, use
var game_state: Dictionary = {}

func _ready():
	print("Game Manager initialized")

## Добавить предмет в инвентарь
func add_to_inventory(item_id: String, item_name: String) -> void:
	var existing_item = inventory.filter(func(item): return item.id == item_id)
	if existing_item.is_empty():
		var new_item = InventoryItem.new()
		new_item.id = item_id
		new_item.display_name = item_name
		inventory.append(new_item)
		inventory_changed.emit()
		update_description("Вы взяли: " + item_name)

## Удалить предмет из инвентаря
func remove_from_inventory(item_id: String) -> void:
	inventory = inventory.filter(func(item): return item.id != item_id)
	if selected_item and selected_item.id == item_id:
		selected_item = null
	inventory_changed.emit()

## Проверить наличие предмета
func has_item(item_id: String) -> bool:
	return not inventory.filter(func(item): return item.id == item_id).is_empty()

## Установить выбранный предмет
func select_item(item: InventoryItem) -> void:
	if selected_item == item:
		selected_item = null
		update_description("Предмет снят с выбора")
		current_action = "examine"
	else:
		selected_item = item
		update_description("Выбран предмет: " + item.display_name)
		current_action = "use"
	inventory_changed.emit()

## Обновить текст описания
func update_description(text: String) -> void:
	description_changed.emit(text)

## Загрузить комнату
func load_room(room: Room) -> void:
	current_room = room
	if room:
		room_changed.emit(room.room_name)
		update_description(room.room_description)

## Класс для предметов инвентаря
class InventoryItem:
	var id: String
	var display_name: String
