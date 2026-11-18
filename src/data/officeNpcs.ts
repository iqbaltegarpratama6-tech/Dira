import { OfficeNpcId, RoomId, WorkstationStats, WorkstationTargetId } from '../types/game';

export interface NpcQuestionOption {
  id: string;
  label: string;
  isCorrect: boolean;
  npcReaction: string;
  explanation: string;
}

export interface OfficeNpcProfile {
  id: OfficeNpcId;
  name: string;
  role: string;
  department: string;
  room: RoomId;
  roomLabel: string;
  targetId: WorkstationTargetId | null;
  accentColor: string;
  worldPos: { x: number; z: number };
  standPos: { x: number; z: number };
  viaPos?: { x: number; z: number };
  zoomPose: {
    camPos: [number, number, number];
    lookAt: [number, number, number];
  };
  shortTeaser: string;
  playerAskLine?: string;
  greeting: string;
  question: string;
  options: NpcQuestionOption[];
  resolvedDialogue: string;
  actionButtonLabel: string;
}

export function isNpcTargetSolved(
  targetId: WorkstationTargetId | null,
  stats: WorkstationStats
): boolean {
  if (!targetId) return false;
  switch (targetId) {
    case 'utp_spool':
      return stats.hasCableInHand || (stats.port1Connected && stats.port2Connected);
    case 'client_pc_1':
      return stats.port1Connected;
    case 'client_pc_2':
      return stats.port2Connected;
    case 'messy_cables':
      return stats.cablesTidied;
    case 'ap_mount':
      return stats.apConfigured;
    case 'server_rack':
      return stats.rackChecked;
    case 'cli_monitor':
      return stats.dhcpActive;
    case 'crimper_tool':
      return stats.crimpingVerified;
    case 'employee_pc_reception':
      return stats.receptionPcFixed;
    case 'employee_pc_os':
      return stats.osReinstalled;
    case 'employee_pc_meeting':
      return stats.meetingLaptopFixed;
    case 'boss_report':
      return stats.bossReported;
    default:
      return false;
  }
}

export const OFFICE_NPCS: Record<OfficeNpcId, OfficeNpcProfile> = {
  npc_r06_sari: {
    id: 'npc_r06_sari',
    name: 'Sari Wulandari',
    role: 'Resepsionis Utama',
    department: 'Front Desk · Layanan Tamu',
    room: 'r06_reception',
    roomLabel: 'R.06 · Resepsionis',
    targetId: 'employee_pc_reception',
    accentColor: '#f43f5e',
    worldPos: { x: -12.85, z: 4.75 },
    standPos: { x: -12.6, z: 2.95 },
    zoomPose: {
      camPos: [-11.85, 1.54, 2.7],
      lookAt: [-12.85, 1.18, 4.75],
    },
    shortTeaser: 'Kak IT, PC resepsionis muncul ERR_NAME_NOT_RESOLVED terus!',
    greeting:
      'Syukurlah Kak IT lewat! Dari pagi PC resepsionis nggak bisa buka portal tamu — muncul error ERR_NAME_NOT_RESOLVED dan IP-nya malah 169.254.12.4 padahal kabel LAN terpasang.',
    question:
      'Kak, sebenarnya alamat IP kepala 169.254.x.x itu artinya apa ya kok bisa bikin browser gagal akses?',
    options: [
      {
        id: 'apipa',
        label: 'Alamat APIPA — PC gagal mendapat IP dari DHCP Server sehingga tidak punya gateway/DNS.',
        isCorrect: true,
        npcReaction: 'Ooh pantesan! Jadi harus diperbarui sewa DHCP & cek DNS-nya ya, Kak.',
        explanation:
          'IP 169.254.x.x (APIPA) otomatis diberikan Windows saat klien tidak mendapat respons dari DHCP Server, sehingga koneksi keluar dan resolusi nama DNS gagal.',
      },
      {
        id: 'isp_quota',
        label: 'IP khusus dari ISP yang menandakan paket kuota internet gedung sudah habis.',
        isCorrect: false,
        npcReaction: 'Masa kuota ISP habis pakai IP 169.254 ya, Kak? Di ruang lain masih ada yang nyala kok.',
        explanation:
          'Rentang 169.254.0.0/16 bersifat link-local (APIPA) internal di OS, bukan IP publik dari ISP.',
      },
      {
        id: 'monitor_loose',
        label: 'Pertanda kabel HDMI monitor longgar sehingga browser gagal merender halaman web.',
        isCorrect: false,
        npcReaction: 'Layar monitornya jernih kok Kak, cuma halamannya saja yang ERR_NAME_NOT_RESOLVED.',
        explanation:
          'Error DNS dan APIPA adalah masalah lapisan jaringan (Layer 3 / layanan DHCP-DNS), bukan kabel display.',
      },
    ],
    resolvedDialogue:
      'Makasih banyak Kak! Sekarang PC resepsionis sudah online lancar dan portal tamu langsung terbuka!',
    actionButtonLabel: 'Periksa PC Resepsionis',
  },

  npc_r07_fajar: {
    id: 'npc_r07_fajar',
    name: 'Fajar Nugroho',
    role: 'Staf Keuangan',
    department: 'Divisi A · Administrasi',
    room: 'r07_client_a',
    roomLabel: 'R.07 · Kerja Klien A',
    targetId: 'employee_pc_os',
    accentColor: '#3b82f6',
    worldPos: { x: -5.25, z: 5.55 },
    standPos: { x: -4.1, z: 5.2 },
    viaPos: { x: -4.1, z: 3.1 },
    zoomPose: {
      camPos: [-4.15, 1.5, 4.15],
      lookAt: [-5.25, 1.15, 5.55],
    },
    shortTeaser: 'PC saya Blue Screen INACCESSIBLE_BOOT_DEVICE! Data D: aman nggak?',
    greeting:
      'Aduh Kak IT, PC kerja saya mendadak Blue Screen bertuliskan INACCESSIBLE_BOOT_DEVICE dan gagal masuk Windows! Padahal file rekap anggaran kuartal ini banyak banget di dalamnya.',
    question:
      'Kalau harus install ulang Windows di PC ini, file pekerjaan saya di partisi Data (D:) ikut terhapus nggak ya, Kak?',
    options: [
      {
        id: 'keep_d',
        label: 'Aman — cukup format/install di partisi Sistem (C:) saja tanpa menyentuh partisi Data (D:).',
        isCorrect: true,
        npcReaction: 'Fuhh lega banget dengernya! Silakan langsung install ulang di drive C: ya, Kak.',
        explanation:
          'Selama pengguna hanya memformat partisi OS (Drive C:) dan tidak menghapus atau memformat partisi D:, seluruh berkas di Drive D: tetap utuh.',
      },
      {
        id: 'wipe_all',
        label: 'Pasti terhapus semua, karena installer Windows selalu mengosongkan seluruh hard disk secara paksa.',
        isCorrect: false,
        npcReaction: 'Wah serius?! Masa nggak bisa pilih partisi tertentu saja waktu setup Windows?',
        explanation:
          'Pada mode Custom Installation UEFI, teknisi bisa memilih partisi C: secara spesifik tanpa memformat partisi data lainnya.',
      },
      {
        id: 'ram_replace',
        label: 'Tidak perlu install OS; cukup cabut baterai CMOS agar BSOD boot langsung hilang.',
        isCorrect: false,
        npcReaction: 'Kemarin sempat dicoba restart BIOS-nya Kak, tapi tetap nyangkut di Blue Screen yang sama.',
        explanation:
          'Reset CMOS tidak memperbaiki berkas boot Windows atau registry sistem yang rusak pada partisi C:.',
      },
    ],
    resolvedDialogue:
      'Mantap Kak! Windows 11-nya sudah mulus, driver LAN oke, dan semua file rekap saya di D: masih utuh!',
    actionButtonLabel: 'Perbaiki PC Blue Screen',
  },

  npc_r05_budi: {
    id: 'npc_r05_budi',
    name: 'Budi Santoso',
    role: 'Manajer Proyek',
    department: 'Ruang Rapat Eksekutif',
    room: 'r05_meeting',
    roomLabel: 'R.05 · Ruang Rapat',
    targetId: 'employee_pc_meeting',
    accentColor: '#f59e0b',
    worldPos: { x: 11.1, z: -5.55 },
    standPos: { x: 11.1, z: -3.2 },
    zoomPose: {
      camPos: [11.9, 1.56, -3.15],
      lookAt: [11.1, 1.15, -5.5],
    },
    shortTeaser: '5 menit lagi presentasi tapi ikon Wi-Fi di laptop rapat hilang!',
    greeting:
      'Pas sekali Kak IT datang! Lima menit lagi kita presentasi ke direksi, tapi laptop rapat ini ikon Wi-Fi-nya hilang total — daftar SSID kantor tidak muncul sama sekali.',
    question:
      'Kira-kira kalau ikon jaringan nirkabel sampai lenyap dari taskbar, bagian apa yang perlu dicek duluan di Windows?',
    options: [
      {
        id: 'dev_mgr',
        label: 'Cek Device Manager / Network Connections untuk memastikan Wi-Fi Adapter tidak Disable dan drivernya aktif.',
        isCorrect: true,
        npcReaction: 'Masuk akal! Tadi memang sempat ke-reset setelah update. Yuk cek laptopnya, Kak!',
        explanation:
          'Jika Wireless Adapter berstatus Disabled atau drivernya bermasalah di Device Manager, OS tidak menampilkan daftar SSID hingga adapter di-Enable kembali.',
      },
      {
        id: 'hdmi_proj',
        label: 'Ganti kabel HDMI proyektor karena proyektor menyedot sinyal Wi-Fi 5 GHz.',
        isCorrect: false,
        npcReaction: 'Layar proyektornya baik-baik saja kok, masalahnya murni Wi-Fi di laptop ini mati.',
        explanation:
          'Kabel display HDMI tidak menonaktifkan adapter Wi-Fi di sistem operasi.',
      },
      {
        id: 'dns_cache',
        label: 'Hapus history browser karena cache browser penuh membuat adapter Wi-Fi menghilang.',
        isCorrect: false,
        npcReaction: 'Saya sudah tutup browser tapi tetap tidak ada pilihan Wi-Fi sama sekali.',
        explanation:
          'Cache browser tidak mengendalikan status hardware/driver Network Interface Card (NIC) nirkabel.',
      },
    ],
    resolvedDialogue:
      'Keren Kak! Wi-Fi laptop presentasi langsung konek ke jaringan kantor, rapat bisa dimulai tepat waktu!',
    actionButtonLabel: 'Cek Laptop Rapat',
  },

  npc_r07_laras: {
    id: 'npc_r07_laras',
    name: 'Larasati Putri',
    role: 'Staf Operasional',
    department: 'Divisi Klien A',
    room: 'r07_client_a',
    roomLabel: 'R.07 · Kerja Klien A',
    targetId: 'client_pc_1',
    accentColor: '#38bdf8',
    worldPos: { x: -6.75, z: 5.55 },
    standPos: { x: -7.9, z: 5.2 },
    viaPos: { x: -7.9, z: 3.1 },
    zoomPose: {
      camPos: [-7.85, 1.52, 4.05],
      lookAt: [-6.75, 1.15, 5.55],
    },
    shortTeaser: 'PC-01 di seberang masih "Network Cable Unplugged", pakai kabel jenis apa ya?',
    greeting:
      'Hai Kak IT! Workstation PC-01 di depan saya ini masih bertuliskan "Network Cable Unplugged" karena kabel LAN-nya belum ada dari switch meja.',
    question:
      'Untuk menghubungkan PC-01 langsung ke Switch Hub di meja ini, tipe susunan kabel UTP mana yang benar?',
    options: [
      {
        id: 'straight',
        label: 'Kabel Straight-Through (T568B ke T568B) karena menghubungkan dua perangkat berbeda jenis (PC ke Switch).',
        isCorrect: true,
        npcReaction: 'Siap, catat! Berarti ambil gulungan Cat6 T568B dari Gudang R.03 lalu colok ke PC-01.',
        explanation:
          'Koneksi antara perangkat berbeda layer/jenis (Host PC ke Switch) menggunakan standar kabel Straight-Through dengan urutan T568B pada kedua ujung.',
      },
      {
        id: 'coaxial',
        label: 'Kabel Coaxial RG-6 dengan konektor BNC karena lebih cepat daripada RJ45.',
        isCorrect: false,
        npcReaction: 'Lho, port di belakang PC-01 dan switch ini bentuknya kotak RJ45 lho Kak.',
        explanation:
          'LAN perkantoran modern menggunakan kabel UTP/STP Cat5e/Cat6 berkonektor RJ45, bukan coaxial RG-6.',
      },
      {
        id: 'rollover',
        label: 'Kabel Rollover Console DB9 yang biasa dipakai mengatur BIOS PC.',
        isCorrect: false,
        npcReaction: 'Kayaknya kabel console buat port serial deh, bukan buat Ethernet PC-01.',
        explanation:
          'Kabel Rollover dipakai untuk manajemen console serial router/switch, bukan transmisi data Ethernet workstation.',
      },
    ],
    resolvedDialogue:
      'Mantap! Kabel Cat6 sudah terpasang dan lampu link PC-01 langsung menyala hijau!',
    actionButtonLabel: 'Periksa PC-01 Klien A',
  },

  npc_r08_dimas: {
    id: 'npc_r08_dimas',
    name: 'Dimas Aditya',
    role: 'Staf Akuntansi',
    department: 'Divisi Klien B',
    room: 'r08_client_b',
    roomLabel: 'R.08 · Kerja Klien B',
    targetId: 'client_pc_2',
    accentColor: '#10b981',
    worldPos: { x: 0.75, z: 5.55 },
    standPos: { x: 1.9, z: 5.2 },
    viaPos: { x: 1.9, z: 3.1 },
    zoomPose: {
      camPos: [1.85, 1.5, 4.1],
      lookAt: [0.75, 1.15, 5.55],
    },
    shortTeaser: 'Switch di meja kami lampunya masih oranye dan PC-02 belum nyambung kabel.',
    greeting:
      'Halo Kak! Meja sebelah saya (Workstation PC-02) belum terhubung kabel ke switch meja nih, lampu indikatornya masih kuning/oranye.',
    question:
      'Setelah kabel Cat6 dicolok dengan benar ke port RJ45 PC-02 dan switch, indikator fisik apa yang menandakan link Layer 1 sudah aktif?',
    options: [
      {
        id: 'link_led',
        label: 'LED Link/Act pada port NIC PC dan port Switch menyala hijau stabil (serta berkedip saat ada trafik).',
        isCorrect: true,
        npcReaction: 'Oke sip! Berarti tinggal pastikan kabel Cat6 terpasang rapi sampai klik.',
        explanation:
          'Lampu Link/Activity hijau menandakan koneksi fisik Ethernet terdeteksi dan negosiasi kecepatan (seperti 1000 Mbps Full-Duplex) berhasil.',
      },
      {
        id: 'beep_bios',
        label: 'PC berbunyi beep panjang 3 kali dari speaker motherboard setiap kali paket data masuk.',
        isCorrect: false,
        npcReaction: 'Wah kalau bunyi beep terus bisa pusing satu ruangan dong Kak haha.',
        explanation:
          'Beep kode BIOS menandakan hasil POST atau error hardware internal, bukan status link Ethernet.',
      },
      {
        id: 'fan_speed',
        label: 'Kipas CPU berputar dua kali lebih kencang menandakan kabel LAN aktif.',
        isCorrect: false,
        npcReaction: 'Kurang tepat deh Kak, kecepatan kipas CPU kan mengikuti suhu prosesor.',
        explanation:
          'Kecepatan kipas sistem dikendalikan sensor suhu, bukan konektivitas port RJ45.',
      },
    ],
    resolvedDialogue:
      'Sip banget Kak! PC-02 sudah konek 1000 Mbps dan tim akuntansi bisa kerja lancar lagi!',
    actionButtonLabel: 'Periksa PC-02 Klien B',
  },

  npc_r02_raka: {
    id: 'npc_r02_raka',
    name: 'Raka Pratama',
    role: 'Operator NOC',
    department: 'Network Operations Center',
    room: 'r02_noc',
    roomLabel: 'R.02 · Ruang NOC',
    targetId: 'cli_monitor',
    accentColor: '#38bdf8',
    worldPos: { x: -4.45, z: -5.6 },
    standPos: { x: -4.7, z: -3.7 },
    zoomPose: {
      camPos: [-5.65, 1.46, -3.95],
      lookAt: [-4.45, 1.18, -5.55],
    },
    shortTeaser: 'Di monitor NOC banyak PC belum dapat IP otomatis. Layanan apa yang belum jalan?',
    greeting:
      'Pagi Kak! Dari wall-display NOC terlihat jalur utama sudah menyala, tapi klien di lantai kerja masih banyak yang belum mendapat alamat IP otomatis.',
    question:
      'Supaya seluruh PC karyawan otomatis mendapat IP Address, Subnet Mask, Gateway, dan DNS saat dicolok, layanan apa yang wajib diaktifkan di terminal CLI?',
    options: [
      {
        id: 'dhcp_svc',
        label: 'Layanan DHCP Server — mendistribusikan konfigurasi IP secara dinamis kepada klien.',
        isCorrect: true,
        npcReaction: 'Betul! Langsung saja ketik perintah "dhcp" di meja terminal operator NOC sebelah kiri.',
        explanation:
          'DHCP (Dynamic Host Configuration Protocol) mengotomasi pemberian IP, Gateway, dan DNS tanpa harus mengisi IP statis di setiap komputer.',
      },
      {
        id: 'telnet_svc',
        label: 'Layanan Telnet Banner agar setiap karyawan membaca pesan selamat datang saat menyalakan PC.',
        isCorrect: false,
        npcReaction: 'Banner tidak membagikan IP Address ke kartu jaringan klien nih.',
        explanation:
          'Telnet adalah protokol akses CLI jarak jauh, bukan protokol alokasi alamat IP.',
      },
      {
        id: 'ftp_svc',
        label: 'FTP Server untuk mengunduh file gambar latar belakang desktop.',
        isCorrect: false,
        npcReaction: 'FTP buat transfer file, bukan ngasih IP ke klien LAN.',
        explanation:
          'FTP (File Transfer Protocol) melayani pertukaran berkas di Layer 7 dan baru bisa berjalan setelah IP/koneksi dasar aktif.',
      },
    ],
    resolvedDialogue:
      'Layanan DHCP sudah aktif di core router! Monitor NOC langsung menunjukkan klien mulai menerima sewa IP.',
    actionButtonLabel: 'Buka Terminal CLI NOC',
  },

  npc_r01_arif: {
    id: 'npc_r01_arif',
    name: 'Arif Rahman',
    role: 'Pengawas Fasilitas',
    department: 'Infrastruktur & Server',
    room: 'r01_server',
    roomLabel: 'R.01 · Server Room',
    targetId: 'server_rack',
    accentColor: '#f59e0b',
    worldPos: { x: -13.6, z: -3.0 },
    standPos: { x: -12.3, z: -2.9 },
    zoomPose: {
      camPos: [-11.35, 1.52, -1.95],
      lookAt: [-13.5, 1.38, -3.0],
    },
    shortTeaser: 'Lampu status Rak Server tadi sempat kuning — boleh cek AC & UPS-nya?',
    greeting:
      'Halo teknisi! Tadi lampu indikator atas Rak Server 42U sempat berkedip kuning setelah listrik gedung sempat drop sebentar.',
    question:
      'Kenapa ruang server wajib memiliki pendingin (AC) stabil dan unit UPS berkapasitas cukup sebelum listrik mati total?',
    options: [
      {
        id: 'ups_ac',
        label: 'AC mencegah overheat/thermal throttling komponen, sementara UPS memberi daya cadangan agar server tetap hidup/shutdown aman.',
        isCorrect: true,
        npcReaction: 'Tepat sekali! Tolong bantu verifikasi panel rak server, suhu AC, dan baterai UPS-nya ya.',
        explanation:
          'Suhu tinggi memperpendek umur hardware dan memicu shutdown mendadak; UPS mencegah korupsi data disk saat pemadaman listrik.',
      },
      {
        id: 'wifi_boost',
        label: 'Karena AC membuat gelombang sinyal Wi-Fi bergerak lebih dingin dan UPS mempercepat download internet.',
        isCorrect: false,
        npcReaction: 'Haha nggak gitu konsepnya, UPS itu soal proteksi kelistrikan lho.',
        explanation:
          'AC mengatur suhu termal ruang dan UPS menyediakan daya baterai sementara + stabilisasi tegangan.',
      },
      {
        id: 'dust_only',
        label: 'UPS berfungsi menyedot debu di dalam rak server dan AC dipakai untuk mendinginkan kabel UTP.',
        isCorrect: false,
        npcReaction: 'Bukan penyedot debu dong! Yuk periksa ulang fungsi utama AC presisi dan UPS.',
        explanation:
          'UPS adalah Uninterruptible Power Supply untuk backup daya listrik, bukan pembersih debu.',
      },
    ],
    resolvedDialogue:
      'Mantap! Rak server sudah berstatus hijau, suhu ruang stabil, dan baterai UPS siap siaga.',
    actionButtonLabel: 'Inspeksi Rak Server 42U',
  },

  npc_r03_maya: {
    id: 'npc_r03_maya',
    name: 'Maya Kartika',
    role: 'Logistik IT',
    department: 'Gudang Perangkat & Kabel',
    room: 'r03_storage',
    roomLabel: 'R.03 · Gudang Kabel',
    targetId: 'utp_spool',
    accentColor: '#38bdf8',
    worldPos: { x: 1.45, z: -4.35 },
    standPos: { x: 0.35, z: -3.55 },
    zoomPose: {
      camPos: [0.1, 1.42, -3.1],
      lookAt: [1.45, 0.96, -4.6],
    },
    shortTeaser: 'Di rak gudang ada beberapa jenis gulungan kabel — pastikan ambil yang tepat!',
    greeting:
      'Selamat datang di Gudang Kabel, Kak! Di rak sebelah kiri ada beberapa stok kabel jaringan dan telepon yang baru datang.',
    question:
      'Untuk mendukung jaringan kantor Gigabit Ethernet (1000 Mbps) yang tahan crosstalk ke PC klien, gulungan kabel mana yang harus kita pilih?',
    options: [
      {
        id: 'cat6',
        label: 'UTP Cat6 (8 urat tembaga / konektor RJ45) karena mendukung Gigabit stabil dengan separator anti-crosstalk.',
        isCorrect: true,
        npcReaction: 'Betul banget! Langsung saja ambil gulungan Cat6 biru dari rak sebelah.',
        explanation:
          'Kabel Cat6 memiliki 4 pasang kabel terpilin (8 pin RJ45) dengan spesifikasi hingga 250 MHz dan dukungan penuh Gigabit bahkan 10GbE jarak pendek.',
      },
      {
        id: 'rj11',
        label: 'Kabel Telepon RJ11 (4 urat) karena ukurannya lebih ramping dan mudah diselipkan.',
        isCorrect: false,
        npcReaction: 'Konektor RJ11 cuma muat 4 pin dan longgar di port Ethernet RJ45 PC-01/PC-02 lho.',
        explanation:
          'RJ11 ditujukan untuk jalur telepon analog PSTN, bukan jaringan LAN Ethernet.',
      },
      {
        id: 'audio_aux',
        label: 'Kabel Audio Stereo 3.5mm agar paket data bisa dikirim lewat gelombang suara.',
        isCorrect: false,
        npcReaction: 'Itu kabel buat headset atau speaker Kak, bukan buat port LAN switch!',
        explanation:
          'Port Ethernet RJ45 membutuhkan kabel twisted-pair seperti Cat5e/Cat6/Cat6a.',
      },
    ],
    resolvedDialogue:
      'Stok kabel Cat6 sudah tepat sasaran! Semangat menyambungkan PC-01 dan PC-02!',
    actionButtonLabel: 'Ambil Kabel di Rak',
  },

  npc_r04_nadia: {
    id: 'npc_r04_nadia',
    name: 'Nadia Kusuma',
    role: 'Teknisi Lab Fiber',
    department: 'R.04 · Lab Crimping & Uji',
    room: 'r04_lab',
    roomLabel: 'R.04 · Lab Fiber & Crimping',
    targetId: 'crimper_tool',
    accentColor: '#34d399',
    worldPos: { x: 5.15, z: -4.88 },
    standPos: { x: 5.2, z: -3.6 },
    zoomPose: {
      camPos: [5.95, 1.48, -3.45],
      lookAt: [5.15, 1.18, -4.88],
    },
    shortTeaser: 'Lagi uji crimping RJ45 nih — tahu kenapa urat kabel UTP dipilin berpasangan?',
    greeting:
      'Hai Kak! Meja lab lagi siap buat simulasi crimping konektor RJ45 standar T568B dan pengujian LAN tester.',
    question:
      'Sambil cek alat crimping, tahu nggak alasan teknis kenapa 8 urat tembaga di dalam kabel UTP selalu dibuat terpilin berpasangan (twisted pair)?',
    options: [
      {
        id: 'emi_crosstalk',
        label: 'Untuk membatalkan interferensi elektromagnetik (EMI) dari luar dan mengurangi crosstalk antar pasang kabel.',
        isCorrect: true,
        npcReaction: 'Cerdas! Pilinan berlawanan itu bikin medan magnetik saling meniadakan sehingga sinyal data tetap bersih.',
        explanation:
          'Setiap pasangan kabel dipilin dengan kerapatan berbeda agar noise EMI dan gangguan induksi antar-urat (NEXT/FEXT crosstalk) saling meniadakan.',
      },
      {
        id: 'aesthetics',
        label: 'Supaya warna kabel terlihat estetik saat selubung luarnya dikupas.',
        isCorrect: false,
        npcReaction: 'Haha bukan buat gaya-gayaan dong, ada fungsi kelistrikannya di Layer 1!',
        explanation:
          'Struktur twisted pair adalah rekayasa fisik wajib untuk menjaga integritas sinyal diferensial frekuensi tinggi.',
      },
      {
        id: 'stretch',
        label: 'Agar kabel bisa ditarik melar seperti per kalau jarak meja terlalu jauh.',
        isCorrect: false,
        npcReaction: 'Jangan ditarik melar ya Kak, nanti tembaganya putus atau impedansinya berubah!',
        explanation:
          'Menarik kabel UTP secara berlebihan merusak twist rate dan menurunkan performa transmisi.',
      },
    ],
    resolvedDialogue:
      'Hasil uji pinout T568B di lab sudah tembus semua pin 1–8! Siap dipakai di lantai kerja.',
    actionButtonLabel: 'Buka Lab Crimping RJ45',
  },

  npc_r09_bagus: {
    id: 'npc_r09_bagus',
    name: 'Bagus Prakoso',
    role: 'Teknisi Wireless',
    department: 'R.09 · Infrastruktur Wi-Fi',
    room: 'r09_wifi',
    roomLabel: 'R.09 · Ruang Wi-Fi & AP',
    targetId: 'ap_mount',
    accentColor: '#fbbf24',
    worldPos: { x: 4.4, z: 4.55 },
    standPos: { x: 5.6, z: 3.7 },
    zoomPose: {
      camPos: [5.6, 1.52, 3.35],
      lookAt: [4.4, 1.15, 4.55],
    },
    shortTeaser: 'Access Point di tiang tengah cuma pakai 1 kabel UTP, kok bisa menyala ya?',
    greeting:
      'Halo Kak! Tiang Access Point di tengah ruangan ini masih lampu kuning dan belum menyebarkan sinyal Wi-Fi kantor.',
    question:
      'Access Point modern seperti ini terpasang jauh dari stopkontak listrik dan hanya tersambung satu kabel UTP dari switch. Teknologi apa yang menghantarkan listrik lewat kabel data itu?',
    options: [
      {
        id: 'poe',
        label: 'PoE (Power over Ethernet) — mengalirkan daya DC sekaligus data melalui kabel UTP Cat6.',
        isCorrect: true,
        npcReaction: 'Tepat! Jadi cukup satu kabel UTP dari PoE Switch atau PoE Injector saja.',
        explanation:
          'Standar IEEE 802.3af/at/bt (PoE) memungkinkan switch atau injector mengirim daya listrik aman bersama data Ethernet dalam satu kabel UTP.',
      },
      {
        id: 'solar_ap',
        label: 'Panel surya mini di atas AP yang menyerap cahaya lampu neon ruangan.',
        isCorrect: false,
        npcReaction: 'Wah nggak cukup dong dayanya kalau cuma dari lampu ruangan haha.',
        explanation:
          'Access Point enterprise mengandalkan PoE dari switch atau injector melalui kabel jaringan.',
      },
      {
        id: 'usb_wifi',
        label: 'Baterai jam tangan di dalam casing AP yang bertahan 10 tahun.',
        isCorrect: false,
        npcReaction: 'Baterai kecil begitu langsung habis dalam hitungan detik kalau buat pemancar radio Wi-Fi.',
        explanation:
          'Transceiver Wi-Fi dual-band membutuhkan suplai daya kontinu via PoE atau adaptor DC.',
      },
    ],
    resolvedDialogue:
      'Cakep! Gelombang sinyal Wi-Fi dari Access Point sudah memancar hijau ke seluruh lantai kantor!',
    actionButtonLabel: 'Konfigurasi Access Point',
  },

  npc_corr_hendra: {
    id: 'npc_corr_hendra',
    name: 'Hendra Wijaya',
    role: 'Staf Umum',
    department: 'Koridor Utama Kantor',
    room: 'corridor',
    roomLabel: 'Koridor Utama',
    targetId: 'messy_cables',
    accentColor: '#f59e0b',
    worldPos: { x: -1.35, z: 0.78 },
    standPos: { x: -2.0, z: -0.2 },
    zoomPose: {
      camPos: [-2.85, 1.52, -0.55],
      lookAt: [-1.4, 1.32, 0.75],
    },
    shortTeaser: 'Kabel melintang di koridor bikin rawan kesandung — efek teknisnya juga ada?',
    greeting:
      'Eh hati-hati melangkah Kak! Banyak kabel jaringan melintang acak di tengah koridor utama nih, beberapa karyawan tadi hampir tersandung.',
    question:
      'Selain membahayakan keselamatan kerja (K3), dampak teknis apa yang terjadi pada kabel UTP kalau terus terinjak atau tertekuk tajam?',
    options: [
      {
        id: 'attenuation',
        label: 'Redaman sinyal (attenuation) meningkat, paket data error/loss, hingga urat tembaga putus di dalam.',
        isCorrect: true,
        npcReaction: 'Pantesan koneksi suka putus-nyambung kalau kabelnya kegencet! Yuk rapikan ke cable tray.',
        explanation:
          'Tekukan tajam melampaui bend radius dan tekanan injakan merusak geometri pilinan UTP, memicu packet loss dan kegagalan fisik (Layer 1).',
      },
      {
        id: 'faster_speed',
        label: 'Kecepatan internet malah bertambah cepat karena kabel menjadi lebih gepeng.',
        isCorrect: false,
        npcReaction: 'Wah justru kebalikannya dong Kak, sinyal listrik di tembaga butuh pilinan utuh.',
        explanation:
          'Deformasi fisik pada kabel tembaga selalu menurunkan kualitas sinyal dan meningkatkan crosstalk.',
      },
      {
        id: 'no_effect',
        label: 'Tidak ada efek teknis sama sekali selama warna jaket kabelnya masih cerah.',
        isCorrect: false,
        npcReaction: 'Jaket luarnya masih bagus belum tentu urat tembaga di dalamnya aman lho.',
        explanation:
          'Tembaga di dalam kabel UTP bisa patah atau mengalami gangguan impedansi meski isolasi luarnya terlihat utuh.',
      },
    ],
    resolvedDialogue:
      'Koridor jadi rapi dan aman sekarang! Nggak ada lagi drama kabel kesandung atau koneksi putus.',
    actionButtonLabel: 'Rapikan Kabel Koridor',
  },

  npc_r05_citra: {
    id: 'npc_r05_citra',
    name: 'Citra Dewi',
    role: 'Analis Bisnis',
    department: 'Ruang Rapat Eksekutif',
    room: 'r05_meeting',
    roomLabel: 'R.05 · Ruang Rapat',
    targetId: null,
    accentColor: '#a855f7',
    worldPos: { x: 12.9, z: -3.65 },
    standPos: { x: 12.9, z: -2.85 },
    zoomPose: {
      camPos: [12.15, 1.54, -2.55],
      lookAt: [12.9, 1.15, -3.65],
    },
    shortTeaser: 'Siap presentasi proyeksi jaringan — boleh tanya soal keamanan Wi-Fi?',
    playerAskLine: 'Permisi Mbak Citra, ruangan rapat sudah adem & siap? Ada yang ingin ditanyakan soal koneksi presentasi?',
    greeting:
      'Halo Mas/Mbak IT! Ruang rapat sudah tertutup rapi dan AC-nya juga sejuk banget sekarang. Kebetulan saya mau tanya nih buat keamanan materi presentasi direksi.',
    question:
      'Kenapa akses Wi-Fi tamu sebaiknya dipisah ke VLAN/SSID Guest daripada digabung ke jaringan internal karyawan?',
    options: [
      {
        id: 'vlan_isolation',
        label: 'Agar perangkat tamu terisolasi dari server & data sensitif internal perusahaan (segmentasi keamanan).',
        isCorrect: true,
        npcReaction: 'Ooh jelas banget! Jadi tamu tetap dapat internet tapi tidak bisa mengintip server internal.',
        explanation:
          'Pemisahan Guest Wi-Fi dengan VLAN berbeda mencegah akses langsung ke subnet server, NAS, dan PC kantor.',
      },
      {
        id: 'color_wifi',
        label: 'Supaya warna sinyal Wi-Fi di monitor terlihat lebih beragam.',
        isCorrect: false,
        npcReaction: 'Haha bukan soal warna tampilannya dong, tapi soal keamanan data.',
        explanation:
          'Tujuan utama multi-SSID & VLAN adalah keamanan jaringan dan manajemen bandwidth.',
      },
      {
        id: 'battery_save',
        label: 'Untuk menghemat baterai AC di ruang rapat.',
        isCorrect: false,
        npcReaction: 'AC nggak terhubung ke SSID Wi-Fi Guest kok.',
        explanation:
          'Segmentasi VLAN murni mengatur isolasi lalu lintas jaringan Layer 2/3.',
      },
    ],
    resolvedDialogue:
      'Makasih penjelasannya! Ruang rapat sudah nyaman dan kami siap presentasi ke direksi.',
    actionButtonLabel: 'Selesai',
  },

  npc_r05_farhan: {
    id: 'npc_r05_farhan',
    name: 'Farhan Malik',
    role: 'Arsitek Sistem',
    department: 'Ruang Rapat Eksekutif',
    room: 'r05_meeting',
    roomLabel: 'R.05 · Ruang Rapat',
    targetId: null,
    accentColor: '#0284c7',
    worldPos: { x: 12.0, z: -5.55 },
    standPos: { x: 12.0, z: -6.2 },
    viaPos: { x: 13.6, z: -4.2 },
    zoomPose: {
      camPos: [12.75, 1.54, -6.1],
      lookAt: [12.0, 1.15, -5.55],
    },
    shortTeaser: 'Lagi review topologi kantor di layar TV — mau diskusi DNS lokal?',
    playerAskLine: 'Halo Mas Farhan, bagaimana tampilan topologi 16 ruangan di layar rapat? Ada kendala teknis?',
    greeting:
      'Halo teknisi! Bagus banget sekarang ruang rapat tertutup tenang dan ber-AC. Oh ya, mumpung ketemu, saya mau tanya soal resolusi nama internal.',
    question:
      'Apa fungsi utama DNS (Domain Name System) dalam jaringan kantor sehingga pengguna cukup mengetik nama portal dibanding menghafal alamat IP?',
    options: [
      {
        id: 'dns_resolve',
        label: 'Menerjemahkan nama domain yang mudah dibaca (mis. portal.kantor) menjadi alamat IP numerik tujuan.',
        isCorrect: true,
        npcReaction: 'Tepat sekali! Jadi kalau IP server pindah, karyawan cukup akses domain yang sama.',
        explanation:
          'DNS memetakan hostname ke IPv4/IPv6 secara otomatis sehingga layanan web dan aplikasi internal mudah diakses.',
      },
      {
        id: 'dns_cable',
        label: 'Mengencangkan kabel UTP yang longgar di belakang switch.',
        isCorrect: false,
        npcReaction: 'Itu tugas mekanis konektor RJ45, bukan protokol DNS.',
        explanation:
          'DNS bekerja di lapisan aplikasi untuk resolusi nama domain menjadi alamat IP.',
      },
      {
        id: 'dns_cool',
        label: 'Mengatur suhu pendingin ruangan server secara otomatis.',
        isCorrect: false,
        npcReaction: 'Untuk suhu ada sensor termostat AC sendiri ya.',
        explanation:
          'DNS menangani pencarian alamat jaringan, bukan kontrol pendingin.',
      },
    ],
    resolvedDialogue:
      'Mantap! Presentasi topologi jaringan kami sudah siap dipaparkan.',
    actionButtonLabel: 'Selesai',
  },

  npc_r08_putri: {
    id: 'npc_r08_putri',
    name: 'Putri Ayu',
    role: 'Staf Payroll',
    department: 'Divisi Klien B',
    room: 'r08_client_b',
    roomLabel: 'R.08 · Kerja Klien B',
    targetId: null,
    accentColor: '#0f766e',
    worldPos: { x: -0.75, z: 5.55 },
    standPos: { x: -1.85, z: 5.2 },
    viaPos: { x: -1.85, z: 3.1 },
    zoomPose: {
      camPos: [-1.75, 1.5, 4.15],
      lookAt: [-0.75, 1.15, 5.55],
    },
    shortTeaser: 'Lagi input data payroll bulanan — mau tanya soal keamanan kabel & password?',
    playerAskLine: 'Permisi Mbak Putri, kerjaan di Divisi B lancar? Ada pertanyaan soal IT atau jaringan?',
    greeting:
      'Hai Kak IT! Kebetulan lagi lewat, meja saya di R.08 sudah nyaman dan ber-AC. Saya penasaran satu hal soal jaringan kabel vs Wi-Fi.',
    question:
      'Kenapa PC desktop staf keuangan & payroll di meja kerja tetap diprioritaskan memakai kabel LAN daripada hanya Wi-Fi?',
    options: [
      {
        id: 'wired_stability',
        label: 'Koneksi kabel (Ethernet) memberi latensi lebih rendah, bandwidth penuh stabil, dan lebih tahan interferensi.',
        isCorrect: true,
        npcReaction: 'Pantesan transfer database payroll terasa cepat dan nggak pernah putus-putus pakai LAN!',
        explanation:
          'Kabel UTP Cat6 menyediakan jalur dedicated full-duplex tanpa gangguan gelombang radio dari perangkat sekitar.',
      },
      {
        id: 'cable_power',
        label: 'Karena kabel LAN menghantarkan listrik PLN 220V langsung ke monitor.',
        isCorrect: false,
        npcReaction: 'Hati-hati dong, LAN bukan kabel tegangan tinggi PLN 220V!',
        explanation:
          'Ethernet UTP membawa sinyal data bertegangan rendah (atau PoE DC aman untuk perangkat khusus), bukan AC 220V.',
      },
      {
        id: 'wifi_heavy',
        label: 'Sinyal Wi-Fi membuat ukuran file Excel bertambah besar.',
        isCorrect: false,
        npcReaction: 'Ukuran file tetap sama kok, cuma kestabilan transfernya yang berbeda.',
        explanation:
          'Media transmisi hanya memengaruhi kecepatan dan keandalan pengiriman paket data.',
      },
    ],
    resolvedDialogue:
      'Makasih banyak penjelasannya! Koneksi kerja kami aman dan lancar sekarang.',
    actionButtonLabel: 'Selesai',
  },

  npc_r10_reza: {
    id: 'npc_r10_reza',
    name: 'Reza Mahendra',
    role: 'UI/UX Designer',
    department: 'Pantry & Lounge',
    room: 'r10_pantry',
    roomLabel: 'R.10 · Pantry & Lounge',
    targetId: null,
    accentColor: '#3b82f6',
    worldPos: { x: 12.78, z: 4.2 },
    standPos: { x: 11.45, z: 4.2 },
    zoomPose: {
      camPos: [11.2, 1.52, 3.3],
      lookAt: [12.78, 1.15, 4.2],
    },
    shortTeaser: 'Lagi ngopi sebentar — ngomong-ngomong soal bandwidth Wi-Fi di area pantry...',
    playerAskLine: 'Halo Mas Reza, lagi istirahat ngopi? Koneksi Wi-Fi di area Pantry & Lounge aman kan?',
    greeting:
      'Eh halo Kak IT! Duduk santai atau ngopi dulu nih? Ruangan pantry adem banget pakai AC baru. Sambil ngopi, saya penasaran deh soal router Wi-Fi.',
    question:
      'Apa bedanya pita frekuensi Wi-Fi 5 GHz dibanding 2.4 GHz saat dipakai streaming atau video call tim desain?',
    options: [
      {
        id: 'band_5ghz',
        label: '5 GHz menawarkan kecepatan lebih tinggi & minim interferensi untuk jarak dekat, sedangkan 2.4 GHz jangkauannya lebih jauh.',
        isCorrect: true,
        npcReaction: 'Aha! Pantas kalau dekat Access Point, SSID 5 GHz ngebut banget buat upload aset desain!',
        explanation:
          'Dual-band Access Point memanfaatkan 5 GHz untuk throughput tinggi berlatensi rendah dan 2.4 GHz untuk penetrasi dinding yang lebih luas.',
      },
      {
        id: 'band_weight',
        label: '5 GHz hanya bekerja untuk laptop bermerek warna perak saja.',
        isCorrect: false,
        npcReaction: 'Haha nggak ada hubungannya sama warna bodi laptop kali!',
        explanation:
          'Dukungan 5 GHz bergantung pada standar chip Wi-Fi (802.11ac/ax), bukan warna perangkat.',
      },
      {
        id: 'band_free',
        label: '2.4 GHz berbayar per jam sedangkan 5 GHz tidak butuh router.',
        isCorrect: false,
        npcReaction: 'Keduanya tetap dipancarkan oleh Access Point kantor yang sama kok.',
        explanation:
          'Kedua pita frekuensi merupakan fitur radio bawaan Access Point dual-band.',
      },
    ],
    resolvedDialogue:
      'Mantap Kak! Wi-Fi di pantry kencang dan suasana makin nyaman.',
    actionButtonLabel: 'Selesai',
  },

  npc_r11_tina: {
    id: 'npc_r11_tina',
    name: 'Tina Kartika',
    role: 'Staf HRD',
    department: 'Dapur Karyawan',
    room: 'r11_kitchen',
    roomLabel: 'R.11 · Dapur Karyawan',
    targetId: null,
    accentColor: '#d97706',
    worldPos: { x: 18.65, z: -6.02 },
    standPos: { x: 18.65, z: -4.9 },
    zoomPose: {
      camPos: [17.55, 1.54, -4.65],
      lookAt: [18.65, 1.28, -6.02],
    },
    shortTeaser: 'Lagi seduh kopi di dapur — sekalian mau tanya soal keamanan email phishing!',
    playerAskLine: 'Halo Mbak Tina, lagi bikin kopi di dapur? Ada kendala atau pertanyaan IT hari ini?',
    greeting:
      'Halo Kak IT! Iya nih lagi nyeduh kopi hangat di dapur. Oh iya, kemarin beberapa staf sempat dapat email aneh yang minta klik link reset password — bahaya nggak sih?',
    question:
      'Jika ada karyawan menerima email mencurigakan (phishing) yang meminta login ulang akun kantor lewat tautan asing, langkah apa yang benar?',
    options: [
      {
        id: 'report_phishing',
        label: 'Jangan klik tautan atau masukkan password; segera verifikasi alamat pengirim & laporkan ke tim IT.',
        isCorrect: true,
        npcReaction: 'Setuju banget! Nanti saya bantu ingatkan seluruh karyawan saat jam istirahat.',
        explanation:
          'Phishing mencuri kredensial lewat halaman login palsu; kewaspadaan pengguna dan pelaporan ke IT mencegah pembobolan akun.',
      },
      {
        id: 'click_fast',
        label: 'Segera isi username dan password supaya akun tidak terhapus dalam 5 menit.',
        isCorrect: false,
        npcReaction: 'Waduh jangan dong, justru itu jebakan mendesak khas pelaku phishing!',
        explanation:
          'Rasa panik/terburu-buru adalah taktik social engineering agar korban menyerahkan kredensial tanpa memeriksa URL.',
      },
      {
        id: 'forward_all',
        label: 'Teruskan tautannya ke semua grup kantor agar teman lain ikut mencoba.',
        isCorrect: false,
        npcReaction: 'Jangan disebar ya, makin banyak yang berisiko ketipu nanti!',
        explanation:
          'Tautan berbahaya tidak boleh disebarkan ke karyawan lain dan harus langsung ditangani tim IT.',
      },
    ],
    resolvedDialogue:
      'Makasih tips keamanannya Kak! Kopinya wangi dan infonya sangat bermanfaat.',
    actionButtonLabel: 'Selesai',
  },

  npc_r12_andi: {
    id: 'npc_r12_andi',
    name: 'Andi Wijaya',
    role: 'Staf Operasional',
    department: 'Area Wastafel & Toilet',
    room: 'r12_toilet',
    roomLabel: 'R.12 · Toilet',
    targetId: null,
    accentColor: '#0f766e',
    worldPos: { x: 19.72, z: 3.95 },
    standPos: { x: 18.4, z: 3.95 },
    zoomPose: {
      camPos: [17.7, 1.54, 3.25],
      lookAt: [19.72, 1.28, 3.95],
    },
    shortTeaser: 'Lagi cuci tangan habis tarik kabel — mau tanya standar kerapian kabel & perangkat?',
    playerAskLine: 'Halo Mas Andi, habis beres-beres perangkat ya? Ada yang perlu dicek lagi di area sini?',
    greeting:
      'Eh halo Kak IT! Iya habis bantu bereskan peralatan di lantai tadi, sekarang cuci tangan dulu biar bersih. Ngomong-ngomong soal perintah dasar jaringan di terminal...',
    question:
      'Perintah sederhana apa di Command Prompt/Terminal yang paling sering dipakai teknisi untuk mengetes apakah koneksi ke IP tujuan (misalnya Gateway 192.168.10.1) tersambung?',
    options: [
      {
        id: 'ping_cmd',
        label: 'Perintah `ping 192.168.10.1` untuk mengirim paket ICMP Echo dan mengecek balasan serta latensi.',
        isCorrect: true,
        npcReaction: 'Bener banget! Kalau ada Reply dengan waktu 1ms artinya jalur jaringannya sehat!',
        explanation:
          'Utilitas `ping` menguji keterjangkauan host di Layer 3 menggunakan protokol ICMP dan menampilkan round-trip time.',
      },
      {
        id: 'paint_cmd',
        label: 'Membuka aplikasi Microsoft Paint lalu menggambar kabel jaringan.',
        isCorrect: false,
        npcReaction: 'Haha kalau itu sih buat menggambar manual, bukan uji konektivitas!',
        explanation:
          'Pengujian konektivitas jaringan dilakukan melalui utilitas CLI seperti `ping`, `tracert`, atau `ipconfig`.',
      },
      {
        id: 'shutdown_cmd',
        label: 'Mengetik `shutdown /s` supaya koneksi otomatis menyala sendiri.',
        isCorrect: false,
        npcReaction: 'Lho `shutdown` malah mematikan komputer dong!',
        explanation:
          'Perintah `shutdown` mematikan atau me-restart sistem operasi, bukan mengecek koneksi jaringan.',
      },
    ],
    resolvedDialogue:
      'Sip! Fasilitas kantor bersih, ber-AC, dan tim makin paham dasar troubleshooting.',
    actionButtonLabel: 'Selesai',
  },

  npc_r13_hilman: {
    id: 'npc_r13_hilman',
    name: 'Hilman Fauzi',
    role: 'Lead Engineer',
    department: 'Mushola Kantor',
    room: 'r13_mushola',
    roomLabel: 'R.13 · Mushola',
    targetId: null,
    accentColor: '#10b981',
    worldPos: { x: 24.95, z: -5.35 },
    standPos: { x: 24.0, z: -3.2 },
    zoomPose: {
      camPos: [23.35, 1.48, -2.75],
      lookAt: [24.95, 0.96, -5.35],
    },
    shortTeaser: 'Musholanya sekarang tenang & sejuk ber-AC — mau ngobrol soal backup data rutin?',
    playerAskLine: 'Assalamu’alaikum Mas Hilman, kondisi Mushola sudah nyaman & tenang ya? Boleh ngobrol sebentar?',
    greeting:
      'Wa’alaikumussalam Kak IT! Alhamdulillah musholanya sekarang dindingnya tertutup rapi, ada rak Al-Qur’an, dan sejuk pakai AC. Sambil rehat, boleh tanya soal kebijakan backup server?',
    question:
      'Dalam manajemen infrastruktur IT, apa maksud strategi backup 3-2-1 agar data perusahaan aman dari kerusakan atau ransomware?',
    options: [
      {
        id: 'backup_321',
        label: 'Simpan 3 salinan data, pada 2 jenis media berbeda, dengan minimal 1 salinan tersimpan di lokasi terpisah (off-site/cloud).',
        isCorrect: true,
        npcReaction: 'MasyaAllah jelas sekali! Jadi walau satu lokasi kena musibah, data perusahaan tetap bisa dipulihkan.',
        explanation:
          'Prinsip 3-2-1 Backup menjamin redundansi dan pemulihan bencana (disaster recovery) tanpa single point of failure.',
      },
      {
        id: 'backup_one',
        label: 'Menyimpan 1 file saja di folder Recycle Bin supaya tidak penuh.',
        isCorrect: false,
        npcReaction: 'Recycle Bin bisa terhapus permanen sewaktu-waktu dan cuma satu tempat lho.',
        explanation:
          'Recycle Bin bukan media arsip atau backup yang aman.',
      },
      {
        id: 'backup_print',
        label: 'Mencetak seluruh isi database ke kertas lalu tidak menyimpan file digitalnya.',
        isCorrect: false,
        npcReaction: 'Ribuan gigabyte database dicetak ke kertas bisa menuhin satu gedung haha.',
        explanation:
          'Backup sistem modern memakai penyimpanan digital terenkripsi lokal dan off-site.',
      },
    ],
    resolvedDialogue:
      'Terima kasih obrolannya Kak! Semoga seluruh pekerjaan jaringan hari ini berjalan lancar dan berkah.',
    actionButtonLabel: 'Selesai',
  },

  npc_r16_rina: {
    id: 'npc_r16_rina',
    name: 'Rina Kusuma',
    role: 'Marketing Lead',
    department: 'Ruang Santai Karyawan',
    room: 'r16_lounge',
    roomLabel: 'R.16 · Ruang Santai',
    targetId: null,
    accentColor: '#10b981',
    worldPos: { x: 30.85, z: 6.12 },
    standPos: { x: 30.85, z: 5.45 },
    zoomPose: {
      camPos: [30.15, 1.48, 4.1],
      lookAt: [30.85, 1.1, 6.12],
    },
    shortTeaser: 'Lagi santai di sofa R.16 — ngomong-ngomong soal fitur hotspot & firewall kantor...',
    playerAskLine: 'Halo Mbak Rina, lagi istirahat di Ruang Santai? Koneksi Wi-Fi di sini lancar?',
    greeting:
      'Hai Kak IT! Iya nih lagi santai sebentar di sofa Ruang Santai — sofanya empuk, beanbag-nya nyaman, dan ruangannya sejuk ada AC juga! Mau tanya satu hal ringan dong.',
    question:
      'Apa peran Firewall pada router utama kantor yang selalu dinyalakan tim IT di jaringan gedung?',
    options: [
      {
        id: 'firewall_filter',
        label: 'Menyaring & mengawasi lalu lintas jaringan masuk/keluar sesuai aturan keamanan untuk memblokir akses ilegal.',
        isCorrect: true,
        npcReaction: 'Pantesan jaringan kerja terasa aman dari serangan luar! Semangat selesaikan tugas dan lapor ke Bos ya!',
        explanation:
          'Firewall memeriksa paket data dan mengizinkan atau memblokir koneksi berdasarkan port, IP, dan kebijakan keamanan.',
      },
      {
        id: 'firewall_heat',
        label: 'Memanaskan ruangan kantor saat musim hujan seperti penghangat ruangan.',
        isCorrect: false,
        npcReaction: 'Haha firewall itu dinding keamanan siber, bukan pemanas ruangan!',
        explanation:
          'Firewall adalah perangkat lunak/keras pengaman trafik jaringan komputer.',
      },
      {
        id: 'firewall_wall',
        label: 'Mengecat ulang tembok kantor menjadi warna merah menyala.',
        isCorrect: false,
        npcReaction: 'Bukan cat tembok dong Kak haha!',
        explanation:
          'Firewall melindungi jaringan dari ancaman eksternal maupun akses port tidak sah.',
      },
    ],
    resolvedDialogue:
      'Makasih banyak Kak IT! Jika semua tugas sudah beres, jangan lupa kabari Pak Direktur di R.15 ya!',
    actionButtonLabel: 'Selesai',
  },
};

export const OFFICE_NPC_LIST: OfficeNpcProfile[] = Object.values(OFFICE_NPCS);
