"""
Script de verificación y diagnóstico de Supabase
"""

import sys
import os

# Add backend directory to pythonpath
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import get_db, get_service_db


def test_supabase_connection():
    print("=" * 60)
    print("[*] Peso a Peso - Verificacion de Conexion a Supabase")
    print("=" * 60)
    print(f"Supabase URL: {settings.SUPABASE_URL}")
    print(f"Ambiente: {settings.ENVIRONMENT}")
    print("-" * 60)

    client = get_db()
    if client is None:
        print("⚠️ Cliente Supabase no conectado (usando URL placeholder o sin credenciales).")
        print("  Para conectar una base de datos real, configura SUPABASE_URL y SUPABASE_ANON_KEY en backend/.env")
        return

    try:
        response = client.table("categories").select("count", count="exact").execute()
        print(f"[OK] Conexion exitosa. Categorias encontradas en DB: {response.count}")
    except Exception as e:
        print(f"[ERROR] Error al consultar la base de datos: {e}")


if __name__ == "__main__":
    test_supabase_connection()
