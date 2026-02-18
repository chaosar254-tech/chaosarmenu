#!/usr/bin/env python3
"""
Projedeki bozuk (corrupted) dosyaları tarar, siler ve Git'i yeniden başlatır.
"""
import os
import sys
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
EXCLUDED_DIRS = {
    'node_modules', '.git', '.next', '.turbo', '.pnpm-store',
    'dist', 'build', '__pycache__', '.cache', '.vercel'
}
CODE_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.py', '.sql', '.css', '.html', '.json'}

def is_excluded(path: Path) -> bool:
    parts = path.parts
    return any(part in EXCLUDED_DIRS for part in parts)

def is_code_file(path: Path) -> bool:
    return path.suffix.lower() in CODE_EXTENSIONS

def try_read_file(filepath: Path) -> tuple[bool, str]:
    """Dosyayı okumayı dene. (başarılı_mı, hata_mesajı) döner."""
    try:
        size = filepath.stat().st_size
        with open(filepath, 'rb') as f:
            data = f.read()
        if len(data) != size:
            return False, f"Short read: beklenen {size} byte, okunan {len(data)} byte"
        return True, ""
    except (IOError, OSError) as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("BOZUK DOSYA TARAMASI BAŞLIYOR")
    print("=" * 60)
    
    deleted_files = []
    deleted_code_files = []
    
    for root, dirs, files in os.walk(PROJECT_ROOT, topdown=True, followlinks=False):
        root_path = Path(root)
        if is_excluded(root_path):
            dirs[:] = []  # Alt dizinlere inme
            continue
        
        # Alt dizinlerde excluded varsa atla (symlink'ler dahil)
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        
        for name in files:
            filepath = root_path / name
            try:
                rel_path = filepath.relative_to(PROJECT_ROOT)
            except ValueError:
                continue
            
            success, err_msg = try_read_file(filepath)
            if not success:
                print(f"BOZUK: {rel_path} - {err_msg}", flush=True)
                try:
                    filepath.unlink()
                    deleted_files.append(str(rel_path))
                    if is_code_file(filepath):
                        deleted_code_files.append(str(rel_path))
                    print(f"  -> Silindi")
                except Exception as e:
                    print(f"  -> Silinemedi: {e}")
    
    print()
    print("=" * 60)
    print("SİLİNEN DOSYALAR RAPORU")
    print("=" * 60)
    for f in deleted_files:
        print(f"  - {f}")
    
    if deleted_code_files:
        print()
        print(">>> YENİDEN OLUŞTURULMASI GEREKEBİLECEK KOD DOSYALARI:")
        for f in deleted_code_files:
            print(f"  - {f}")
    
    print()
    print("=" * 60)
    print(".git KALDIRILIYOR VE YENİDEN BAŞLATILIYOR")
    print("=" * 60)
    
    git_dir = PROJECT_ROOT / ".git"
    if git_dir.exists():
        import shutil
        shutil.rmtree(git_dir)
        print(".git silindi.")
    else:
        print(".git zaten yok.")
    
    print()
    print("git init çalıştırılıyor...")
    r1 = subprocess.run(["git", "init"], cwd=PROJECT_ROOT, capture_output=True, text=True)
    print(r1.stdout or r1.stderr or "")
    if r1.returncode != 0:
        print(f"HATA: git init başarısız (exit {r1.returncode})")
        sys.exit(1)
    print("git init başarılı.")
    
    print()
    print("git add . çalıştırılıyor...")
    r2 = subprocess.run(["git", "add", "."], cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=180)
    if r2.stdout:
        print(r2.stdout)
    if r2.stderr:
        print(r2.stderr)
    if r2.returncode == 0:
        print(">>> git add . BAŞARILI!")
    else:
        print(f">>> git add . BAŞARISIZ (exit {r2.returncode})")
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("TAMAMLANDI")
    print("=" * 60)

if __name__ == "__main__":
    main()
