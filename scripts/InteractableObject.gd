extends Node2D
class_name InteractableObject

## Интерактивный объект в игре

signal clicked(object: InteractableObject)

@export var object_id: String = "object"
@export var object_name: String = "Объект"
@export_multiline var object_description: String = "Описание объекта"
@export var object_color: Color = Color(0.23, 0.16, 0.31)
@export var object_size: Vector2 = Vector2(120, 80)
@export var can_take: bool = false
@export var inventory_name: String = ""
@export var is_visible: bool = true

## Предметы, с которыми можно использовать этот объект
var use_with_items: Dictionary = {}  # {item_id: {message, callback}}

var game_manager: GameManager

func _ready():
	game_manager = get_node("/root/GameManager") if has_node("/root/GameManager") else null
	queue_redraw()

func _draw():
	if not is_visible:
		return

	# Основной объект
	draw_rect(Rect2(Vector2.ZERO, object_size), object_color)

	# Тень
	draw_rect(Rect2(Vector2(0, object_size.y), Vector2(object_size.x, 5)), Color(0, 0, 0, 0.3))

	# Рамка
	draw_rect(Rect2(Vector2.ZERO, object_size), Color(0.42, 0.35, 0.27), false, 2)

	# Название объекта
	var font = ThemeDB.fallback_font
	var font_size = 14
	var text_size = font.get_string_size(object_name, HORIZONTAL_ALIGNMENT_CENTER, -1, font_size)
	var text_pos = Vector2(object_size.x / 2 - text_size.x / 2, -10)
	draw_string(font, text_pos, object_name, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, Color.WHITE)

## Осмотреть объект
func examine():
	if game_manager:
		game_manager.update_description(object_description)

## Взять объект
func take():
	if can_take and game_manager:
		var item_name = inventory_name if not inventory_name.is_empty() else object_name
		game_manager.add_to_inventory(object_id, item_name)
		is_visible = false
		queue_redraw()
	elif game_manager:
		game_manager.update_description("Вы не можете взять это.")

## Использовать предмет на этом объекте
func use_item(item_id: String):
	if use_with_items.has(item_id):
		var result = use_with_items[item_id]
		if game_manager:
			game_manager.update_description(result.get("message", ""))

			# Удаляем предмет если нужно
			if result.get("remove_item", false):
				game_manager.remove_from_inventory(item_id)

			# Добавляем новый предмет если нужно
			if result.has("add_item"):
				var add_data = result["add_item"]
				game_manager.add_to_inventory(add_data["id"], add_data["name"])

			# Делаем объект видимым
			if result.has("make_visible"):
				var target_id = result["make_visible"]
				var target = get_parent().get_node_or_null(target_id)
				if target and target is InteractableObject:
					target.is_visible = true
					target.queue_redraw()

			# Вызываем callback если есть
			if result.has("callback") and result["callback"] is Callable:
				result["callback"].call()
	elif game_manager:
		game_manager.update_description('"' + item_id + '" не подходит для этого.')

## Установить правило использования предмета
func set_use_with(item_id: String, data: Dictionary):
	use_with_items[item_id] = data

## Получить область взаимодействия
func get_interaction_area() -> Rect2:
	return Rect2(position, object_size)

## Обработка клика
func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		clicked.emit(self)
