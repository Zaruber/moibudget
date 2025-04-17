#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import base64
import pandas as pd
import io
import json
from openpyxl import Workbook
from datetime import datetime
from google import genai

# API ключ Google Gemini
GEMINI_API_KEY = "AIzaSyDuTi6ZQgq0_jeHuab5o35wkkWU2D0p9o0"

def process_receipt_image(image_path):
    """Обрабатывает изображение чека с помощью Google Gemini API"""
    
    # Создаем клиент Google Gemini
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    # Загружаем изображение
    receipt_file = client.files.upload(file=image_path)
    
    # Промпт для модели
    prompt = """
    Проанализируй это изображение чека из магазина и извлеки следующую информацию:
    1. Дату покупки (в формате ДД.ММ.ГГГГ)
    2. Список товаров с ценами
    3. Определи группу товаров для каждой позиции
    4. Общую сумму покупки
    
    Для определения группы товаров используй следующие категории:
    - "Алкоголь": все алкогольные напитки (пиво, вино, водка, сидр, коктейли и т.д.)
    - "Сладости": шоколад, конфеты, торты, печенье и другие сладкие изделия
    - "Молочные продукты": молоко, сыр, творог, йогурт и т.д.
    - "Мясо и рыба": любые мясные и рыбные продукты
    - "Фрукты и овощи": свежие и замороженные фрукты и овощи
    - "Хлебобулочные изделия": хлеб, булки, выпечка и т.д.
    - "Бакалея": крупы, макароны, консервы, масло, соусы и т.д.
    - "Напитки": вода, сок, газировка (не алкогольные)
    - "Снеки": чипсы, сухарики, орехи и т.д.
    - "Бытовая химия": моющие средства, средства для стирки и т.д.
    - "Товары для дома": бытовые товары, посуда, и т.д.
    - "Гигиена": зубные пасты, шампуни, бумажные полотенца и т.д.
    - "Другое": если товар не подходит ни к одной из перечисленных категорий
    
    Важные правила классификации:
    - Любые товары со словами "пиво", "сидр", "вино", "водка", "ром", "виски", "коньяк", "ликер" и т.д. относи к категории "Алкоголь"
    - Любые товары, содержащие "шоколад", "конфеты", "торт", "печенье" и т.д. относи к категории "Сладости"
    - Внимательно анализируй название товара, чтобы правильно определить категорию
    
    Выдай результат в формате JSON со следующей структурой:
    {
        "date": "ДД.ММ.ГГГГ",
        "items": [
            {
                "name": "название товара",
                "category": "группа товара из списка выше",
                "price": сумма
            },
            ...
        ],
        "total": общая_сумма
    }
    """
    
    try:
        # Отправка запроса с изображением
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[receipt_file, prompt]
        )
        
        # Получение текстового ответа
        text_response = response.text
        
        # Извлекаем JSON из текстового ответа
        # Ищем JSON в тексте (он может быть обернут в тройные обратные кавычки)
        json_start = text_response.find('{')
        json_end = text_response.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_str = text_response[json_start:json_end]
            receipt_data = json.loads(json_str)
            return receipt_data
        else:
            print("Не удалось найти JSON в ответе API")
            print(f"Полученный ответ: {text_response}")
            return None
    except Exception as e:
        print(f"Ошибка при обработке ответа: {e}")
        return None

def create_excel(receipt_data, output_path):
    """Создает Excel-файл на основе данных чека"""
    if not receipt_data:
        print("Нет данных для создания Excel-файла")
        return False
    
    # Создаем DataFrame
    data = []
    
    for item in receipt_data["items"]:
        data.append({
            "Дата затрат": receipt_data["date"],
            "Группа товаров": item["category"],
            "Конкретный товар из чека": item["name"],
            "Итого сумма": item["price"]
        })
    
    df = pd.DataFrame(data)
    
    # Сохраняем в Excel
    df.to_excel(output_path, index=False)
    
    return True

def main():
    image_path = "image.png"  # Путь к изображению
    
    print("Начинаю обработку чека...")
    receipt_data = process_receipt_image(image_path)
    
    if receipt_data:
        print("Чек успешно обработан.")
        # Генерируем имя файла с текущей датой и временем
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"receipt_data_{timestamp}.xlsx"
        
        if create_excel(receipt_data, output_path):
            print(f"Excel-файл успешно создан: {output_path}")
        else:
            print("Ошибка при создании Excel-файла")
    else:
        print("Не удалось обработать чек")

if __name__ == "__main__":
    main() 