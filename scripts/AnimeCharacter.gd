extends Node2D
class_name AnimeCharacter

## Аниме персонаж с возможностью рисования и диалогами

@export var character_name: String = "Персонаж"
@export var character_id: String = "character"
@export_multiline var description: String = "Описание персонажа"
@export var dialogues: Array[String] = []
@export var character_scale: float = 1.2

# Цвета персонажа
@export_group("Appearance")
@export var hair_color: Color = Color(0.54, 0.17, 0.89)  # Фиолетовый
@export var eye_color: Color = Color(1.0, 0.41, 0.71)  # Розовый
@export var skin_color: Color = Color(1.0, 0.88, 0.8)  # Светлая кожа
@export var clothes_color: Color = Color(0.29, 0.0, 0.5)  # Темно-фиолетовый
@export var accent_color: Color = Color(0.54, 0.17, 0.89)  # Акцент

var current_dialogue_index: int = 0
var is_visible: bool = true
var game_manager: GameManager

func _ready():
	game_manager = get_node("/root/GameManager") if has_node("/root/GameManager") else null
	queue_redraw()

func _draw():
	if not is_visible:
		return

	var base_x = 0.0
	var base_y = 0.0

	# Применяем масштаб
	draw_set_transform(Vector2(base_x, base_y), 0, Vector2(character_scale, character_scale))

	# Тень персонажа
	draw_ellipse(Rect2(5, 145, 40, 16), Color(0, 0, 0, 0.3))

	# Ноги
	draw_rect(Rect2(15, 100, 8, 35), clothes_color)
	draw_rect(Rect2(27, 100, 8, 35), clothes_color)

	# Обувь
	draw_rect(Rect2(13, 133, 12, 8), Color(0.1, 0.1, 0.18))
	draw_rect(Rect2(25, 133, 12, 8), Color(0.1, 0.1, 0.18))

	# Тело (платье/одежда)
	var body_polygon = PackedVector2Array([
		Vector2(25, 50),
		Vector2(10, 55),
		Vector2(5, 100),
		Vector2(45, 100),
		Vector2(40, 55)
	])
	draw_colored_polygon(body_polygon, clothes_color)

	# Акценты на одежде
	draw_line(Vector2(15, 70), Vector2(35, 70), accent_color, 2)

	# Руки
	# Левая рука
	draw_rect(Rect2(3, 55, 7, 30), skin_color)
	draw_circle(Vector2(6.5, 87), 5, skin_color)
	# Правая рука
	draw_rect(Rect2(40, 55, 7, 30), skin_color)
	draw_circle(Vector2(43.5, 87), 5, skin_color)

	# Шея
	draw_rect(Rect2(20, 45, 10, 8), skin_color)

	# Голова
	draw_circle(Vector2(25, 28), 18, skin_color)

	# Волосы - основная прическа
	draw_arc(Vector2(25, 23), 19, PI, TAU, 16, hair_color, 3, true)
	draw_circle(Vector2(15, 25), 12, hair_color)
	draw_circle(Vector2(35, 25), 12, hair_color)

	# Челка
	var bang_polygon = PackedVector2Array([
		Vector2(10, 20),
		Vector2(15, 15),
		Vector2(18, 22),
		Vector2(22, 15),
		Vector2(25, 22),
		Vector2(28, 15),
		Vector2(32, 22),
		Vector2(35, 15),
		Vector2(40, 20),
		Vector2(40, 25),
		Vector2(10, 25)
	])
	draw_colored_polygon(bang_polygon, hair_color)

	# Глаза (аниме стиль)
	# Белки глаз
	draw_ellipse(Rect2(14, 23, 8, 10), Color.WHITE)
	draw_ellipse(Rect2(28, 23, 8, 10), Color.WHITE)

	# Зрачки
	draw_circle(Vector2(18, 28), 3, eye_color)
	draw_circle(Vector2(32, 28), 3, eye_color)

	# Блики в глазах
	draw_circle(Vector2(19, 26), 1.5, Color.WHITE)
	draw_circle(Vector2(33, 26), 1.5, Color.WHITE)

	# Нос
	draw_line(Vector2(25, 32), Vector2(26, 34), Color(0.82, 0.63, 0.56), 1.5)

	# Рот (улыбка)
	draw_arc(Vector2(25, 36), 5, 0.2, PI - 0.2, 8, Color(0.75, 0.5, 0.5), 1.5, true)

	# Румянец
	draw_ellipse(Rect2(9, 31, 8, 6), Color(1.0, 0.59, 0.59, 0.3))
	draw_ellipse(Rect2(33, 31, 8, 6), Color(1.0, 0.59, 0.59, 0.3))

	# Сброс трансформации для имени
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

	# Имя персонажа над головой
	var font = ThemeDB.fallback_font
	var font_size = 16
	var text_pos = Vector2(base_x + 25 * character_scale - font.get_string_size(character_name, HORIZONTAL_ALIGNMENT_CENTER, -1, font_size).x / 2, base_y - 12)
	draw_string(font, text_pos, character_name, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, Color.WHITE)

func draw_ellipse(rect: Rect2, color: Color):
	var points = PackedVector2Array()
	var num_points = 32
	for i in range(num_points):
		var angle = TAU * i / num_points
		var x = rect.position.x + rect.size.x / 2 + cos(angle) * rect.size.x / 2
		var y = rect.position.y + rect.size.y / 2 + sin(angle) * rect.size.y / 2
		points.append(Vector2(x, y))
	draw_colored_polygon(points, color)

## Обработка клика на персонажа
func on_clicked():
	if not dialogues.is_empty() and game_manager:
		var dialogue = dialogues[current_dialogue_index]
		game_manager.update_description(dialogue)
		current_dialogue_index = (current_dialogue_index + 1) % dialogues.size()

## Получить область взаимодействия
func get_interaction_area() -> Rect2:
	var width = 50 * character_scale
	var height = 150 * character_scale
	return Rect2(position, Vector2(width, height))
