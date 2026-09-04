# Pizzain DOKO Deploy

Folder ini berisi versi statis siap deploy ke GitHub Pages.

Cara pakai:
1. Upload semua isi folder `deploy` ke repository GitHub.
2. Aktifkan GitHub Pages dari branch/folder yang berisi file ini.
3. Buka halaman utama GitHub Pages. Aplikasi otomatis masuk ke halaman admin.

Catatan:
- Aplikasi memakai Supabase project `qipqhopjbwjquschrggt`.
- Data aplikasi ini dipisahkan di tabel `doko_*` dengan `app_id = pizzain_doko_v1`.
- Karena aplikasi berjalan dari browser, Supabase anon key memang ikut berada di file JavaScript. Pastikan RLS tetap aktif.
