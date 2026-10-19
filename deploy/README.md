# Pizzain Tenant — web siap unggah

Folder ini berisi versi web terbaru, termasuk login PIN, hak akses staff, katalog tenant terpisah, penjualan slice/loyang, dan bagi hasil per tenant.

## Unggah ke GitHub

Unggah seluruh **isi** folder ini ke repository yang dipakai untuk web. Pastikan `index.html`, ketiga file JavaScript, `styles.css`, `vercel.json`, serta folder `assets`, `admin`, `input`, dan `view` ikut terunggah. Sertakan `.nojekyll` dan `.gitignore` jika mengunggah melalui Git.

Paket ini memakai path dari **root domain**, dengan aturan rute di `vercel.json`. Jika isi folder ini menjadi repository, root website adalah root repository. Jika folder `deploy` berada di dalam repository yang lebih besar, gunakan folder `deploy` sebagai root website.

Tidak ada proses build web atau instalasi npm yang diperlukan. Repository GitHub menyimpan file; penerbitan situs tetap dilakukan melalui layanan hosting yang terhubung.

**GitHub Pages:** paket saat ini memakai path absolut seperti `/assets/...` dan rute `/input/<tenant>`. Alamat project Pages berbentuk `username.github.io/nama-repository/` memerlukan penyesuaian base path terlebih dahulu. `.nojekyll` dan `404.html` saja tidak mengatasi hal itu; `vercel.json` tidak dijalankan oleh GitHub Pages.

## Isi runtime

- `index.html`: halaman utama dengan versi cache aset terbaru.
- `access-control.js`: login PIN dan hak akses staff.
- `tenant-management.js`: pemilihan tenant dan laporan gabungan.
- `app.js`, `styles.css`: fungsi dan tema aplikasi.
- `assets/`: seluruh aset lokal, termasuk logo.
- `admin/index.html`, `input/index.html`, `view/index.html`, `404.html`: halaman masuk tambahan dan fallback.
- `vercel.json`: aturan redirect dan rewrite rute web.

## Backend yang sudah tersedia

Web ini memakai backend Supabase proyek `qipqhopjbwjquschrggt` yang sudah dikonfigurasi. Unggahan ini memperbarui web; tidak perlu menjalankan ulang skrip SQL lama. Edge Function login PIN dan database tetap berjalan di Supabase, terpisah dari hosting web.

File klien memuat public/anon key yang diperlukan untuk menghubungi backend. Paket ini tidak memerlukan service-role key, password database, PIN akun, `.env`, backup transaksi, atau APK.

Skrip SQL, Google Apps Script lama, dan skrip pemulihan shift tidak dipakai runtime web. Salinan terdahulunya dipindahkan ke arsip `.recovery` di workspace pengembangan.

## Pemeriksaan setelah terbit

1. Buka `/view`, kemudian masuk dengan PIN yang sudah ada.
2. Pastikan hak admin/staff dan pilihan tenant sesuai akun.
3. Pastikan harga Dila tampil Rp26.000/Rp100.000 dan Rp25.000/Rp95.000 untuk slice/loyang; harga Bg Pon tetap terpisah.
4. Muat ulang tab jika tampilan lama masih tersimpan.

Tidak ada APK yang dibangun atau disertakan.
