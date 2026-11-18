import { WorkstationTargetId } from '../types/game';

export interface CaseStudyOption {
  id: string;
  label: string;
  isCorrect: boolean;
  feedback: string;
}

export interface CaseStudyStep {
  id: string;
  clueTag: string;
  prompt: string;
  whatToLookFor: string;
  options: CaseStudyOption[];
  learningNote: string;
}

export interface CaseStudyDefinition {
  targetId: WorkstationTargetId;
  category: 'Infrastruktur Jaringan' | 'Perbaikan PC Karyawan';
  roomLabel: string;
  title: string;
  symptomSummary: string;
  steps: CaseStudyStep[];
  successActionLabel: string;
}

export const CASE_STUDIES: Partial<Record<WorkstationTargetId, CaseStudyDefinition>> = {
  utp_spool: {
    targetId: 'utp_spool',
    category: 'Infrastruktur Jaringan',
    roomLabel: 'R.03 · Gudang Kabel',
    title: 'Pemilihan Kabel Jaringan Kantor',
    symptomSummary:
      'Workstation PC-01 (R.07) dan PC-02 (R.08) belum tersambung ke switch meja. Di rak gudang tersedia beberapa jenis gulungan kabel.',
    steps: [
      {
        id: 'utp-select',
        clueTag: 'Langkah 1 · Identifikasi Media Transmisi',
        prompt: 'Jenis kabel dan standar susunan pin mana yang tepat untuk menghubungkan PC ke Switch Gigabit (1 Gbps)?',
        whatToLookFor:
          'Perhatikan jenis perangkat yang dihubungkan (PC ke Switch) serta kebutuhan bandwidth jaringan kerja modern.',
        options: [
          {
            id: 'rj11_phone',
            label: 'Kabel Telepon RJ11 (4-Pin PSTN)',
            isCorrect: false,
            feedback:
              'Kurang tepat. Konektor RJ11 hanya memiliki 4 pin dan dirancang untuk jalur telepon suara, tidak kompatibel dengan port Ethernet Gigabit.',
          },
          {
            id: 'cat6_straight',
            label: 'Kabel UTP Cat6 Straight-Through (T568B – T568B)',
            isCorrect: true,
            feedback:
              'Tepat! Kabel UTP Cat6 mendukung kecepatan 1–10 Gbps dengan crosstalk rendah, dan tipe Straight-Through (T568B di kedua ujung) adalah standar untuk menghubungkan PC ke Switch.',
          },
          {
            id: 'coax_rg6',
            label: 'Kabel Coaxial RG6 Antena TV',
            isCorrect: false,
            feedback:
              'Salah. Kabel coaxial RG6 memakai konektor F-Type/BNC untuk sinyal TV/RF, bukan untuk port LAN Ethernet pada PC kantor.',
          },
        ],
        learningNote:
          'Perangkat berbeda jenis (PC ↔ Switch/Router) selalu memakai kabel Straight-Through (T568B–T568B) dengan minimal kategori Cat5e/Cat6 untuk kecepatan Gigabit.',
      },
    ],
    successActionLabel: 'Ambil Gulungan Kabel',
  },

  client_pc_1: {
    targetId: 'client_pc_1',
    category: 'Infrastruktur Jaringan',
    roomLabel: 'R.07 · Kerja Klien A',
    title: 'Penyambungan Kabel LAN Workstation PC-01',
    symptomSummary:
      'Layar PC-01 berwarna merah dengan status "Network Cable Unplugged". Di sisi meja terdapat Distribution Switch Hub yang lampu Port-1 nya masih padam.',
    steps: [
      {
        id: 'pc1-port',
        clueTag: 'Langkah 1 · Penyambungan Port Fisik',
        prompt: 'Saat menyambungkan kabel jaringan ke unit PC-01 dan Switch Hub, ke bagian mana konektor harus dipasang?',
        whatToLookFor:
          'Amati panel konektor di samping/belakang PC serta indikator lampu pada unit Switch Hub di sebelahnya.',
        options: [
          {
            id: 'hdmi_port',
            label: 'Colok paksa ke Port DisplayPort / HDMI monitor',
            isCorrect: false,
            feedback:
              'Salah. HDMI/DisplayPort adalah port sinyal video ke layar, bukan port data Ethernet jaringan.',
          },
          {
            id: 'usb_port',
            label: 'Sambungkan ke Port USB-A di panel depan',
            isCorrect: false,
            feedback:
              'Tidak tepat. Konektor LAN 8-pin tidak bisa masuk ke port USB-A tanpa adapter eksternal.',
          },
          {
            id: 'rj45_nic',
            label: 'Colok ke Port NIC Ethernet (RJ45) di PC & Port 1 Switch Hub hingga LED menyala hijau',
            isCorrect: true,
            feedback:
              'Benar! Bunyi klik memastikan pengait RJ45 terkunci rapat, dan LED Link hijau menandakan koneksi Layer 1 (Fisik) antara NIC PC-01 dan Switch sudah aktif.',
          },
        ],
        learningNote:
          'Selalu periksa LED Link (hijau/oranye berkedip) setelah mencolokkan kabel UTP. Jika LED mati, cek apakah klip RJ45 longgar atau kabel putus.',
      },
    ],
    successActionLabel: 'Pasang Kabel ke PC-01',
  },

  client_pc_2: {
    targetId: 'client_pc_2',
    category: 'Infrastruktur Jaringan',
    roomLabel: 'R.08 · Kerja Klien B',
    title: 'Penyambungan Kabel LAN Workstation PC-02',
    symptomSummary:
      'Workstation PC-02 di Ruang Klien B belum terhubung ke Switch meja sehingga staf tidak dapat mengakses server internal.',
    steps: [
      {
        id: 'pc2-verify',
        clueTag: 'Langkah 1 · Verifikasi Koneksi Layer-1',
        prompt: 'Setelah memasang kabel jaringan dari Switch ke PC-02, bagaimana cara memastikan pemasangan fisik sudah benar?',
        whatToLookFor:
          'Amati kondisi kedua ujung kabel pada PC dan Switch serta cara penjaluran fisiknya di meja kerja.',
        options: [
          {
            id: 'leave_one_end',
            label: 'Cukup colokkan ke PC-02 saja tanpa menghubungkan ke Switch Hub',
            isCorrect: false,
            feedback:
              'Salah. Koneksi Ethernet membutuhkan sirkuit lengkap dari NIC PC menuju port Switch agar paket data dapat diteruskan.',
          },
          {
            id: 'check_led_and_latch',
            label: 'Pastikan klip RJ45 terkunci di kedua ujung & LED Link Switch menyala hijau stabil',
            isCorrect: true,
            feedback:
              'Tepat! Klip yang terkunci mencegah kabel terlepas saat meja tersenggol, dan LED hijau membuktikan jalur transmisi-terima (TX/RX) tersambung sempurna.',
          },
          {
            id: 'bend_sharp',
            label: 'Lipat kabel 180 derajat tepat di leher konektor agar tampak pendek',
            isCorrect: false,
            feedback:
              'Berbahaya! Menekuk kabel UTP terlalu tajam dapat merusak pilinan tembaga internal dan menyebabkan packet loss atau link putus.',
          },
        ],
        learningNote:
          'Koneksi fisik yang baik ditandai oleh pengait RJ45 yang terkunci rapat, radius tekukan kabel aman, dan indikator LED Link aktif.',
      },
    ],
    successActionLabel: 'Pasang Kabel ke PC-02',
  },

  messy_cables: {
    targetId: 'messy_cables',
    category: 'Infrastruktur Jaringan',
    roomLabel: 'Koridor Utama',
    title: 'Penataan Kabel Lantai (Cable Management & K3)',
    symptomSummary:
      'Terdapat tiga bundel kabel jaringan dan listrik yang melintang acak di lantai koridor utama, berisiko membuat staf tersandung dan merusak inti kabel.',
    steps: [
      {
        id: 'cable-k3',
        clueTag: 'Langkah 1 · Standar Penataan Kabel',
        prompt: 'Bagaimana metode perapihan kabel koridor yang sesuai standar keselamatan K3 dan keandalan jaringan?',
        whatToLookFor:
          'Pertimbangkan risiko jalur lalu-lalang karyawan serta perlindungan fisik terhadap pilinan inti kabel.',
        options: [
          {
            id: 'knot_tight',
            label: 'Ikat mati kabel membentuk simpul ketat di tengah koridor',
            isCorrect: false,
            feedback:
              'Salah. Simpul ketat mematahkan inti tembaga UTP (melanggar minimum bend radius) dan tetap membahayakan orang yang lewat.',
          },
          {
            id: 'cut_cables',
            label: 'Potong kabel yang melintang agar koridor langsung bersih',
            isCorrect: false,
            feedback:
              'Keliru! Memotong kabel aktif akan memutus jaringan seluruh ruangan yang terhubung ke jalur tersebut.',
          },
          {
            id: 'floor_tray',
            label: 'Masukkan seluruh kabel ke dalam Floor Cable Tray pelindung & rapikan sepanjang tepi koridor',
            isCorrect: true,
            feedback:
              'Benar! Floor cable tray (pelindung kabel lantai) melindungi kabel dari tekanan pijakan dan menghilangkan bahaya tersandung bagi karyawan.',
          },
        ],
        learningNote:
          'Cable management bukan hanya soal estetika: penggunaan tray pelindung menjaga integritas sinyal UTP dan memenuhi standar keselamatan kerja (K3).',
      },
    ],
    successActionLabel: 'Rapikan Jalur Kabel',
  },

  ap_mount: {
    targetId: 'ap_mount',
    category: 'Infrastruktur Jaringan',
    roomLabel: 'R.09 · Ruang Wi-Fi & AP',
    title: 'Aktivasi Access Point Wi-Fi Ruangan',
    symptomSummary:
      'Access Point (AP) di Ruang 09 masih berstatus Amber (standby) dan belum memancarkan SSID Wi-Fi perusahaan untuk perangkat nirkabel.',
    steps: [
      {
        id: 'ap-security',
        clueTag: 'Langkah 1 · Daya & Keamanan Nirkabel',
        prompt: 'Konfigurasi mana yang paling aman dan stabil untuk mengaktifkan Access Point di jaringan perusahaan?',
        whatToLookFor:
          'Evaluasi cara pemberian daya, kestabilan frekuensi untuk banyak perangkat, dan perlindungan enkripsi akses.',
        options: [
          {
            id: 'open_wifi',
            label: 'Atur keamanan ke "Open (Tanpa Password)" agar semua orang langsung bisa masuk',
            isCorrect: false,
            feedback:
              'Tidak aman! Wi-Fi terbuka tanpa enkripsi memungkinkan pihak luar mengakses jaringan internal kantor dan mengendus lalu lintas data.',
          },
          {
            id: 'wpa3_5ghz',
            label: 'Aktifkan PoE, gunakan enkripsi WPA3-Personal/AES & aktifkan Dual-Band 5 GHz',
            isCorrect: true,
            feedback:
              'Tepat! PoE mengalirkan daya dan data lewat 1 kabel jaringan, 5 GHz memberi kecepatan tinggi minim gangguan, dan WPA3 melindungi trafik kantor dari penyadapan.',
          },
          {
            id: 'wep_legacy',
            label: 'Gunakan enkripsi lawas WEP dengan channel bertumpuk',
            isCorrect: false,
            feedback:
              'Kurang tepat. Enkripsi WEP sangat rentan diretas dalam hitungan menit dan memperlambat throughput Wi-Fi modern.',
          },
        ],
        learningNote:
          'Access Point perusahaan idealnya memakai PoE agar hemat kabel listrik, kanal 5 GHz untuk kepadatan perangkat tinggi, dan minimal enkripsi WPA2-AES atau WPA3.',
      },
    ],
    successActionLabel: 'Aktifkan Access Point',
  },

  server_rack: {
    targetId: 'server_rack',
    category: 'Infrastruktur Jaringan',
    roomLabel: 'R.01 · Server Room',
    title: 'Inspeksi Preventif Rak Server 42U',
    symptomSummary:
      'Lampu status header Rak Server 42U masih kuning (perlu inspeksi). Teknisi perlu memastikan kondisi ruang dan perangkat inti sehat sebelum shift berjalan.',
    steps: [
      {
        id: 'rack-audit',
        clueTag: 'Langkah 1 · Prosedur Checklist Server Room',
        prompt: 'Hal apa saja yang wajib diperiksa saat melakukan inspeksi rutin Rak Server 42U?',
        whatToLookFor:
          'Cek tiga aspek krusial ruang server: keandalan suplai daya cadangan, sirkulasi suhu ruangan, dan jalur uplink jaringan.',
        options: [
          {
            id: 'turn_off_mcb',
            label: 'Matikan MCB listrik utama selama 5 menit agar server dingin sejenak',
            isCorrect: false,
            feedback:
              'Sangat berbahaya! Mematikan listrik paksa (hard shutdown) dapat merusak sistem file database dan menghentikan seluruh layanan kantor.',
          },
          {
            id: 'block_airflow',
            label: 'Tutup seluruh ventilasi rak dengan kain supaya debu tidak masuk',
            isCorrect: false,
            feedback:
              'Salah. Menutup ventilasi justru menjebak panas di dalam rak dan memicu overheat pada prosesor server.',
          },
          {
            id: 'check_ups_temp_uplink',
            label: 'Periksa suhu AC (18–24°C), indikator baterai/beban UPS, & status LED Uplink Core Switch',
            isCorrect: true,
            feedback:
              'Benar! Menjaga suhu, kestabilan daya UPS, dan konektivitas uplink mencegah thermal throttling maupun downtime mendadak.',
          },
        ],
        learningNote:
          'Tiga pilar kesehatan Server Room adalah: Daya bersih (UPS + redundansi PSU), Pendinginan (suhu 18–24°C), dan Uplink jaringan yang termonitor.',
      },
    ],
    successActionLabel: 'Verifikasi Rak Server OK',
  },

  employee_pc_reception: {
    targetId: 'employee_pc_reception',
    category: 'Perbaikan PC Karyawan',
    roomLabel: 'R.06 · Resepsionis',
    title: 'PC Resepsionis: Tidak Bisa Akses Internet',
    symptomSummary:
      'Staf Resepsionis mengeluh tidak bisa membuka web maupun email kantor. Browser menampilkan "ERR_NAME_NOT_RESOLVED", padahal kabel LAN terpasang.',
    steps: [
      {
        id: 'rec-diagnose',
        clueTag: 'Langkah 1 · Diagnosa Gejala di Layar',
        prompt: 'Melihat pesan "ERR_NAME_NOT_RESOLVED" padahal kabel fisik terpasang, langkah pemeriksaan awal apa yang tepat?',
        whatToLookFor:
          'Bedakan terlebih dahulu apakah PC belum mendapat alamat IP valid, koneksi IP terputus, atau hanya gagal menerjemahkan nama domain.',
        options: [
          {
            id: 'reinstall_os_now',
            label: 'Langsung format harddisk dan install ulang Windows',
            isCorrect: false,
            feedback:
              'Terlalu berlebihan! Masalah jaringan seperti DNS salah atau IP konflik bisa diselesaikan dalam 1 menit tanpa menghapus sistem.',
          },
          {
            id: 'cmd_ipconfig_ping',
            label: 'Buka CMD → cek `ipconfig /all` & `ping 8.8.8.8` untuk melihat status IP dan resolusi DNS',
            isCorrect: true,
            feedback:
              'Tepat! Jika `ping 8.8.8.8` berhasil tetapi membuka situs gagal (`ERR_NAME_NOT_RESOLVED`), berarti koneksi IP bekerja namun pengaturan DNS atau DHCP lease bermasalah.',
          },
          {
            id: 'replace_monitor',
            label: 'Ganti monitor Resepsionis karena layar menampilkan teks error',
            isCorrect: false,
            feedback:
              'Salah. Monitor hanya menampilkan output dari OS; pesan `ERR_NAME_NOT_RESOLVED` berasal dari kegagalan resolusi jaringan.',
          },
        ],
        learningNote:
          'Urutan troubleshooting jaringan Windows: Cek Fisik (Layer 1) → Cek IP (`ipconfig`) → Uji IP Publik (`ping 8.8.8.8`) → Uji Resolusi Nama/DNS (`nslookup`).',
      },
      {
        id: 'rec-fix',
        clueTag: 'Langkah 2 · Perbaikan Konfigurasi Jaringan',
        prompt: 'Hasil pemeriksaan menunjukkan IP APIPA (`169.254.12.4`) / DNS nyasar ke `192.168.99.99`. Tindakan mana yang benar untuk memulihkan internet?',
        whatToLookFor:
          'Pulihkan permintaan alamat IP otomatis dari server kantor dan pastikan pencatatan alamat resolver lama dibersihkan.',
        options: [
          {
            id: 'disable_nic',
            label: 'Buka Network Connections lalu klik Disable pada Ethernet Adapter',
            isCorrect: false,
            feedback:
              'Salah. Menonaktifkan adapter Ethernet justru memutus koneksi jaringan PC secara total.',
          },
          {
            id: 'set_apipa_manual',
            label: 'Masukkan IP statis 169.254.0.1 dengan Gateway kosong',
            isCorrect: false,
            feedback:
              'Kurang tepat. Rentang 169.254.x.x (APIPA) tidak dapat merutekan trafik keluar menuju Gateway maupun internet.',
          },
          {
            id: 'renew_dns',
            label: 'Jalankan `ipconfig /release` → `ipconfig /renew`, set DNS ke `1.1.1.1` & jalankan `ipconfig /flushdns`',
            isCorrect: true,
            feedback:
              'Sempurna! PC Resepsionis kini memperoleh IP 192.168.10.x dari DHCP Server, cache DNS lama bersih, dan akses internet kembali normal.',
          },
        ],
        learningNote:
          'IP `169.254.x.x` (APIPA) artinya Windows gagal menghubungi DHCP Server. Gunakan `ipconfig /renew` setelah memastikan DHCP & kabel aktif.',
      },
    ],
    successActionLabel: 'Pulihkan Internet PC Resepsionis',
  },

  employee_pc_os: {
    targetId: 'employee_pc_os',
    category: 'Perbaikan PC Karyawan',
    roomLabel: 'R.07 · Kerja Klien A (PC Staf)',
    title: 'PC Karyawan: Sistem Operasi Gagal Boot',
    symptomSummary:
      'PC karyawan mengalami Blue Screen (`INACCESSIBLE_BOOT_DEVICE`) dan gagal masuk desktop setelah listrik padam mendadak. File kerja penting tersimpan di partisi D:.',
    steps: [
      {
        id: 'os-boot',
        clueTag: 'Langkah 1 · Persiapan Pemulihan OS',
        prompt: 'Saat PC dinyalakan ulang untuk melakukan perbaikan sistem operasi, langkah awal apa yang harus dilakukan?',
        whatToLookFor:
          'Pikirkan bagaimana komputer dapat memuat media instalasi sistem baru sebelum sistem operasi lama yang rusak berjalan.',
        options: [
          {
            id: 'pull_ram',
            label: 'Cabut keping RAM saat PC dalam kondisi menyala',
            isCorrect: false,
            feedback:
              'Sangat berbahaya! Mencabut komponen saat arus listrik mengalir bisa menyebabkan korsleting permanen pada motherboard dan RAM.',
          },
          {
            id: 'bios_uefi_usb',
            label: 'Masuk BIOS/Boot Menu (`F12`/`Del`) → pilih USB Flashdisk Installer Windows (UEFI)',
            isCorrect: true,
            feedback:
              'Benar! Memilih USB Installer berbasis UEFI memungkinkan sistem booting dari media instalasi Windows tanpa melewati OS yang rusak.',
          },
          {
            id: 'swap_keyboard',
            label: 'Ganti keyboard dengan yang baru supaya Blue Screen hilang',
            isCorrect: false,
            feedback:
              'Salah. Error `INACCESSIBLE_BOOT_DEVICE` terjadi pada partisi/sistem boot penyimpanan (SSD/HDD), bukan pada perangkat input keyboard.',
          },
        ],
        learningNote:
          'Sebelum install ulang, selalu cek mode BIOS (UEFI + GPT untuk Windows 10/11 modern) dan siapkan flashdisk bootable resmi.',
      },
      {
        id: 'os-partition-driver',
        clueTag: 'Langkah 2 · Pengaturan Partisi & Kelengkapan Pasca-Install',
        prompt: 'Pada menu pemilihan drive Setup terdapat Partisi 1 (`System C:`) dan Partisi 2 (`Data D:`). Bagaimana langkah instalasi yang aman dan lengkap?',
        whatToLookFor:
          'Ingat lokasi file kerja penting karyawan yang harus dilindungi, lalu pastikan seluruh perangkat keras PC siap digunakan kembali.',
        options: [
          {
            id: 'delete_all_partitions',
            label: 'Hapus semua partisi (termasuk Data D:) agar kapasitas C: maksimal',
            isCorrect: false,
            feedback:
              'Berbahaya! Menghapus partisi Data D: akan melenyapkan seluruh dokumen kerja penting milik karyawan.',
          },
          {
            id: 'skip_drivers',
            label: 'Install Windows di C: saja lalu biarkan Device Manager penuh tanda seru tanpa driver',
            isCorrect: false,
            feedback:
              'Belum tuntas. Tanpa driver LAN/Wi-Fi dan VGA/Chipset, PC tidak dapat terhubung ke jaringan kantor dan performanya melambat.',
          },
          {
            id: 'format_c_install_drivers',
            label: 'Format hanya Partisi `System C:`, install Windows di C:, lalu pasang Driver Chipset, VGA & LAN',
            isCorrect: true,
            feedback:
              'Tepat sekali! Data karyawan di Drive D: tetap aman 100%, Windows terpasang bersih di C:, dan seluruh hardware (LAN, audio, grafis) berfungsi optimal dengan driver resmi.',
          },
        ],
        learningNote:
          'Aturan emas install ulang PC kantor: Backup/amankan partisi Data D:, install OS di C:, lalu wajib install driver (Chipset, Network, Display) & aktivasi update.',
      },
    ],
    successActionLabel: 'Selesaikan Pemulihan PC',
  },

  employee_pc_meeting: {
    targetId: 'employee_pc_meeting',
    category: 'Perbaikan PC Karyawan',
    roomLabel: 'R.05 · Ruang Rapat',
    title: 'Laptop Rapat: Tidak Bisa Terhubung Nirkabel',
    symptomSummary:
      'Rapat akan segera dimulai, tetapi laptop presentasi tidak memunculkan daftar jaringan Wi-Fi sama sekali padahal Access Point kantor menyala normal.',
    steps: [
      {
        id: 'meet-devmgr',
        clueTag: 'Langkah 1 · Penelusuran Masalah Perangkat',
        prompt: 'Jika ikon Wi-Fi hilang dari taskbar dan daftar jaringan kosong, di mana teknisi harus mencari sumber masalahnya?',
        whatToLookFor:
          'Identifikasi terlebih dahulu apakah perangkat keras atau modul kontroler nirkabel di dalam sistem operasi dalam kondisi mati atau bermasalah.',
        options: [
          {
            id: 'unplug_hdmi',
            label: 'Cabut kabel HDMI proyektor karena HDMI memblokir sinyal Wi-Fi',
            isCorrect: false,
            feedback:
              'Kurang tepat. Kabel HDMI hanya mengirim sinyal video/audio ke layar proyektor dan tidak menonaktifkan kartu Wi-Fi.',
          },
          {
            id: 'device_manager_wifi',
            label: 'Buka Device Manager → Network Adapters, periksa status Wireless Adapter (Disabled / Driver Error)',
            isCorrect: true,
            feedback:
              'Benar! Jika Wi-Fi tidak muncul di tray Windows, penyebab paling sering adalah adapter dalam kondisi Disabled, tombol Airplane/Fn Wi-Fi mati, atau driver bermasalah.',
          },
          {
            id: 'change_wallpaper',
            label: 'Ubah tema Windows ke Dark Mode agar daftar Wi-Fi muncul',
            isCorrect: false,
            feedback:
              'Salah. Tema tampilan tidak berpengaruh pada status driver atau perangkat keras Network Adapter.',
          },
        ],
        learningNote:
          'Device Manager adalah alat diagnostik utama di Windows untuk mengecek apakah perangkat keras (Wi-Fi, LAN, Audio) terdeteksi, nonaktif, atau kehilangan driver.',
      },
      {
        id: 'meet-enable-connect',
        clueTag: 'Langkah 2 · Pemulihan Modul & Koneksi Aman',
        prompt: 'Terlihat "Intel Wi-Fi 6 Adapter" berstatus Disabled dengan versi driver usang. Langkah pemulihan mana yang benar?',
        whatToLookFor:
          'Pulihkan fungsi perangkat nirkabel yang ditemukan bermasalah lalu sambungkan ke jaringan internal kantor yang aman.',
        options: [
          {
            id: 'uninstall_only',
            label: 'Klik Uninstall Device lalu tutup laptop tanpa memasang driver pengganti',
            isCorrect: false,
            feedback:
              'Salah. Menghapus perangkat tanpa driver pengganti membuat fitur Wi-Fi tetap tidak dapat digunakan.',
          },
          {
            id: 'connect_open_guest',
            label: 'Biarkan Wi-Fi mati dan pakai tethering Bluetooth yang lambat untuk presentasi',
            isCorrect: false,
            feedback:
              'Bukan solusi permanen. Laptop rapat tetap perlu diperbaiki adapter Wi-Fi-nya agar bisa mengakses file server presentasi lokal.',
          },
          {
            id: 'enable_update_connect',
            label: 'Klik Enable Device & Update Driver Wi-Fi, lalu sambungkan ke SSID `NetOps-Office-5G` (WPA3)',
            isCorrect: true,
            feedback:
              'Mantap! Wireless Adapter kembali aktif dengan driver stabil dan terhubung ke jaringan Wi-Fi kantor yang terenkripsi.',
          },
        ],
        learningNote:
          'Selalu pastikan driver Network Adapter mutakhir dan hubungkan perangkat kantor ke SSID korporat yang terenkripsi (WPA2/WPA3), bukan Wi-Fi publik terbuka.',
      },
    ],
    successActionLabel: 'Pulihkan Koneksi Laptop Rapat',
  },
};
