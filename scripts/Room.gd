extends Node2D
class_name Room

## Базовый класс для комнат замка

@export var room_name: String = "Комната"
@export_multiline var room_description: String = "Описание комнаты"
@export var has_window: bool = false
@export var background_color: Color = Color(0.04, 0.04, 0.08)  # Темный ночной цвет
@export var floor_color: Color = Color(0.1, 0.1, 0.14)

var game_manager: GameManager

func _ready():
	game_manager = get_node("/root/GameManager") if has_node("/root/GameManager") else null

func _draw():
	# Рисуем фон
	draw_rect(Rect2(0, 0, 1280, 720), background_color)

	# Рисуем ночное небо
	draw_night_sky()

	# Рисуем стены замка
	draw_castle_walls()

	# Рисуем окно с луной если есть
	if has_window:
		draw_window()

	# Рисуем пол
	draw_rect(Rect2(0, 504, 1280, 216), floor_color)

func draw_night_sky():
	# Градиент ночного неба
	var gradient = Gradient.new()
	gradient.add_point(0.0, Color(0.04, 0.04, 0.12))
	gradient.add_point(1.0, Color(0.1, 0.1, 0.18))

	for i in range(360):
		var col = gradient.sample(float(i) / 360.0)
		draw_rect(Rect2(0, i, 1280, 1), col)

func draw_castle_walls():
	# Левая стена
	var left_wall_points = PackedVector2Array([
		Vector2(0, 0),
		Vector2(240, 216),
		Vector2(240, 504),
		Vector2(0, 720)
	])
	draw_colored_polygon(left_wall_points, Color(0.16, 0.16, 0.25))

	# Правая стена
	var right_wall_points = PackedVector2Array([
		Vector2(1280, 0),
		Vector2(1040, 216),
		Vector2(1040, 504),
		Vector2(1280, 720)
	])
	draw_colored_polygon(right_wall_points, Color(0.16, 0.16, 0.25))

	# Задняя стена
	draw_rect(Rect2(240, 216, 800, 288), Color(0.29, 0.29, 0.38))

	# Каменные блоки
	for i in range(10):
		var y = i * 96
		draw_line(Vector2(0, y), Vector2(240, 216 + y * 0.4), Color(0.1, 0.1, 0.18), 2)
		draw_line(Vector2(1280, y), Vector2(1040, 216 + y * 0.4), Color(0.1, 0.1, 0.18), 2)

	# Горизонтальные линии кирпичей
	for i in range(6):
		var y = 216 + i * 72
		draw_line(Vector2(240, y), Vector2(1040, y), Color(0.16, 0.16, 0.25), 2)

func draw_window():
	var center = Vector2(640, 336)
	var radius = 120.0

	# Фон окна (ночное небо)
	draw_circle(center, radius, Color(0.04, 0.04, 0.12))

	# Луна
	var moon_pos = center + Vector2(32, -40)
	draw_circle(moon_pos, 40, Color(0.94, 0.94, 0.63))

	# Кратеры на луне
	draw_circle(moon_pos + Vector2(-13, -8), 6, Color(0.88, 0.88, 0.56))
	draw_circle(moon_pos + Vector2(8, 5), 5, Color(0.88, 0.88, 0.56))
	draw_circle(moon_pos + Vector2(-5, 13), 3, Color(0.88, 0.88, 0.56))

	# Звезды в окне
	var star_positions = [
		center + Vector2(-80, -60),
		center + Vector2(80, -50),
		center + Vector2(-50, 40),
		center + Vector2(70, 50),
		center + Vector2(0, 60)
	]

	for pos in star_positions:
		draw_circle(pos, 3, Color.WHITE)
		# Крестообразное свечение
		draw_line(pos + Vector2(-6, 0), pos + Vector2(6, 0), Color.WHITE, 1)
		draw_line(pos + Vector2(0, -6), pos + Vector2(0, 6), Color.WHITE, 1)

	# Рама окна
	draw_arc(center, radius, 0, TAU, 32, Color(0.35, 0.35, 0.44), 12, true)

	# Крест рамы
	draw_line(center + Vector2(0, -radius), center + Vector2(0, radius), Color(0.35, 0.35, 0.44), 6)
	draw_line(center + Vector2(-radius, 0), center + Vector2(radius, 0), Color(0.35, 0.35, 0.44), 6)
