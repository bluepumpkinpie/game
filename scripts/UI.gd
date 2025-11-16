extends CanvasLayer
class_name GameUI

## Пользовательский интерфейс игры

@onready var description_label: RichTextLabel = $Panel/VBox/DescriptionPanel/DescriptionLabel
@onready var room_name_label: Label = $Panel/VBox/Header/RoomNameLabel
@onready var inventory_container: HBoxContainer = $Panel/VBox/InventoryPanel/InventoryScroll/InventoryContainer
@onready var btn_examine: Button = $Panel/VBox/ActionsPanel/ExamineButton
@onready var btn_take: Button = $Panel/VBox/ActionsPanel/TakeButton
@onready var btn_use: Button = $Panel/VBox/ActionsPanel/UseButton

var game_manager: GameManager
var inventory_item_scene = preload("res://scenes/ui/InventoryItem.tscn") if ResourceLoader.exists("res://scenes/ui/InventoryItem.tscn") else null

func _ready():
	# Получаем GameManager
	game_manager = get_node("/root/GameManager") if has_node("/root/GameManager") else null

	if game_manager:
		game_manager.description_changed.connect(_on_description_changed)
		game_manager.room_changed.connect(_on_room_changed)
		game_manager.inventory_changed.connect(_on_inventory_changed)

	# Подключаем кнопки
	btn_examine.pressed.connect(_on_examine_pressed)
	btn_take.pressed.connect(_on_take_pressed)
	btn_use.pressed.connect(_on_use_pressed)

	# Устанавливаем начальное описание
	update_description("Добро пожаловать в древний замок! Исследуйте комнаты, знакомьтесь с персонажами и раскройте тайну сокровища.")

func _on_description_changed(text: String):
	update_description(text)

func _on_room_changed(room_name: String):
	room_name_label.text = room_name

func _on_inventory_changed():
	update_inventory()

func update_description(text: String):
	if description_label:
		description_label.text = text

func update_inventory():
	if not inventory_container or not game_manager:
		return

	# Очищаем текущие предметы
	for child in inventory_container.get_children():
		child.queue_free()

	# Добавляем предметы из инвентаря
	for item in game_manager.inventory:
		var item_button = Button.new()
		item_button.text = item.display_name
		item_button.custom_minimum_size = Vector2(100, 40)
		item_button.add_theme_stylebox_override("normal", create_inventory_style(false))
		item_button.add_theme_stylebox_override("hover", create_inventory_style_hover())
		item_button.add_theme_stylebox_override("pressed", create_inventory_style(true))

		# Подсвечиваем выбранный предмет
		if game_manager.selected_item == item:
			item_button.add_theme_stylebox_override("normal", create_inventory_style(true))

		item_button.pressed.connect(func(): _on_inventory_item_clicked(item))
		inventory_container.add_child(item_button)

func create_inventory_style(selected: bool) -> StyleBoxFlat:
	var style = StyleBoxFlat.new()

	if selected:
		style.bg_color = Color(0.54, 0.17, 0.89)  # Фиолетовый для выбранного
		style.border_color = Color(0.69, 0.5, 1.0)
	else:
		style.bg_color = Color(0.16, 0.16, 0.25)
		style.border_color = Color(0.42, 0.35, 0.8)

	style.set_border_width_all(2)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8

	return style

func create_inventory_style_hover() -> StyleBoxFlat:
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.23, 0.23, 0.38)
	style.border_color = Color(0.54, 0.17, 0.89)
	style.set_border_width_all(2)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	return style

func _on_inventory_item_clicked(item: GameManager.InventoryItem):
	if game_manager:
		game_manager.select_item(item)
		update_inventory()

func _on_examine_pressed():
	if game_manager:
		game_manager.current_action = "examine"
		update_description("Режим: Осмотреть объект")

func _on_take_pressed():
	if game_manager:
		game_manager.current_action = "take"
		update_description("Режим: Взять предмет")

func _on_use_pressed():
	if game_manager and game_manager.selected_item:
		game_manager.current_action = "use"
		update_description('Используйте "' + game_manager.selected_item.display_name + '" на объекте')
	elif game_manager:
		update_description("Сначала выберите предмет из инвентаря")
