<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>ARAL Monitor — Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #F4F6F3; color: #1A1F1C; }

    :root {
      --nav-h: 56px;
      --sidebar-w: 220px;
      --accent: #1D4ED8;
      --accent-light: #EEF2FF;
      --accent-mid: #1E40AF;
    }

    #app { display: flex; flex-direction: column; min-height: 100vh; }

    /* TOP NAV */
    .topnav {
      height: var(--nav-h); background: #fff;
      border-bottom: 0.5px solid rgba(0,0,0,0.1);
      display: flex; align-items: center;
      padding: 0 20px; gap: 12px;
      position: sticky; top: 0; z-index: 10;
    }
    .nav-logo { font-size: 15px; font-weight: 500; color: #1A1F1C; display: flex; align-items: center; gap: 8px; }
    .nav-logo .dot {
      width: 28px; height: 28px; border-radius: 8px; background: var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-family: 'DM Serif Display', serif; font-size: 13px; color: #fff;
    }
    .nav-logo .admin-tag {
      font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 20px;
      background: #FEF3C7; color: #92400E; letter-spacing: 0.05em; text-transform: uppercase;
    }
    .nav-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .nav-badge { font-size: 12px; padding: 4px 10px; border-radius: 20px; background: var(--accent-light); color: var(--accent-mid); font-weight: 500; }
    .nav-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: #BFDBFE; display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: 500;
      color: #1E3A8A; cursor: pointer; position: relative;
    }
    .nav-avatar:hover .dropdown { display: block; }
    .dropdown {
      display: none; position: absolute; top: 36px; right: 0;
      background: #fff; border: 0.5px solid rgba(0,0,0,0.1);
      border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      min-width: 160px; z-index: 20; overflow: hidden;
    }
    .dropdown a { display: block; padding: 10px 14px; font-size: 13px; color: #1A1F1C; text-decoration: none; }
    .dropdown a:hover { background: #F4F6F3; }
    .dropdown .logout { color: #C0392B; border-top: 0.5px solid rgba(0,0,0,0.08); }

    /* LAYOUT */
    .main-wrap { display: flex; flex: 1; }

    /* SIDEBAR */
    .sidebar {
      width: var(--sidebar-w); min-height: calc(100vh - var(--nav-h));
      background: #fff; border-right: 0.5px solid rgba(0,0,0,0.1);
      padding: 16px 10px; flex-shrink: 0;
    }
    .sidebar-section { font-size: 11px; font-weight: 500; color: #9CA3A0; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 10px 4px; margin-top: 8px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 8px; cursor: pointer;
      font-size: 13.5px; color: #5A6360;
      transition: background 0.15s, color 0.15s;
      margin-bottom: 2px; user-select: none;
    }
    .nav-item:hover { background: #F4F6F3; color: #1A1F1C; }
    .nav-item.active { background: var(--accent-light); color: var(--accent-mid); font-weight: 500; }
    .nav-item .icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .nav-count { margin-left: auto; font-size: 11px; background: #F4F6F3; padding: 2px 7px; border-radius: 20px; color: #9CA3A0; }
    .nav-count.alert { background: #FCEBEB; color: #A32D2D; }

    /* CONTENT */
    .content { flex: 1; padding: 24px; overflow-y: auto; background: #F4F6F3; }

    /* PAGE HEADER */
    .page-header { margin-bottom: 20px; }
    .page-header h1 { font-size: 18px; font-weight: 600; color: #1A1F1C; }
    .page-header p { font-size: 13px; color: #6B7570; margin-top: 3px; }

    /* STAT CARDS */
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 20px; }
    .stat-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 14px 16px; }
    .stat-card .label { font-size: 11px; color: #6B7570; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-card .value { font-size: 26px; font-weight: 600; color: #1A1F1C; line-height: 1; }
    .stat-card .sub { font-size: 11px; color: #9CA3A0; margin-top: 4px; }

    /* BADGES */
    .badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 20px; margin-top: 4px; }
    .badge-green  { background: #EAF3DE; color: #3B6D11; }
    .badge-amber  { background: #FAEEDA; color: #854F0B; }
    .badge-red    { background: #FCEBEB; color: #A32D2D; }
    .badge-blue   { background: #EEF2FF; color: #1E40AF; }
    .badge-purple { background: #F3E8FF; color: #6B21A8; }

    /* CARDS */
    .card { background: #fff; border: 0.5px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 16px 18px; margin-bottom: 14px; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .card-header h2 { font-size: 14px; font-weight: 500; color: #1A1F1C; }
    .card-action {
      font-size: 12px; padding: 5px 12px; border-radius: 7px;
      border: 0.5px solid rgba(0,0,0,0.15); background: transparent;
      color: #6B7570; cursor: pointer; transition: background 0.12s;
      font-family: 'DM Sans', sans-serif;
    }
    .card-action:hover { background: #F4F6F3; }
    .card-action.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
    .card-action.primary:hover { background: var(--accent-mid); }
    .card-action.danger { background: #FCEBEB; color: #A32D2D; border-color: #F7C1C1; }
    .card-action.danger:hover { background: #F7C1C1; }

    /* TABLE */
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { font-size: 11px; font-weight: 500; color: #9CA3A0; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 10px; text-align: left; border-bottom: 0.5px solid rgba(0,0,0,0.08); }
    tbody td { padding: 9px 10px; border-bottom: 0.5px solid rgba(0,0,0,0.06); color: #1A1F1C; vertical-align: middle; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #F4F6F3; }

    /* AVATAR */
    .s-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; flex-shrink: 0; }

    /* PROGRESS BAR */
    .prog-bar { height: 6px; background: #F4F6F3; border-radius: 3px; overflow: hidden; width: 80px; display: inline-block; vertical-align: middle; }
    .prog-fill { height: 100%; border-radius: 3px; background: var(--accent); }
    .prog-fill.green  { background: #1D9E75; }
    .prog-fill.amber  { background: #EF9F27; }
    .prog-fill.red    { background: #E24B4A; }

    /* STATUS PILL */
    .status-pill { display: inline-block; font-size: 11px; padding: 3px 9px; border-radius: 20px; font-weight: 500; }
    .status-active   { background: #EAF3DE; color: #3B6D11; }
    .status-inactive { background: #F4F6F3; color: #9CA3A0; }

    /* TOGGLE SWITCH */
    .toggle { position: relative; display: inline-block; width: 36px; height: 20px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; cursor: pointer; inset: 0;
      background: #DDE3DF; border-radius: 20px; transition: 0.2s;
    }
    .toggle-slider:before {
      content: ''; position: absolute; height: 14px; width: 14px;
      left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s;
    }
    .toggle input:checked + .toggle-slider { background: var(--accent); }
    .toggle input:checked + .toggle-slider:before { transform: translateX(16px); }

    /* ANNOUNCEMENT CARD */
    .ann-item { padding: 12px 0; border-bottom: 0.5px solid rgba(0,0,0,0.06); }
    .ann-item:last-child { border-bottom: none; }
    .ann-title { font-size: 13px; font-weight: 500; color: #1A1F1C; margin-bottom: 3px; }
    .ann-msg   { font-size: 12px; color: #6B7570; line-height: 1.5; }
    .ann-date  { font-size: 11px; color: #9CA3A0; margin-top: 4px; }

    /* MODAL */
    .modal-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.45); z-index: 50;
      align-items: center; justify-content: center; padding: 20px;
    }
    .modal-overlay.open { display: flex; }
    .modal {
      background: #fff; border-radius: 16px;
      padding: 28px 28px 24px; width: 100%; max-width: 520px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      max-height: 90vh; overflow-y: auto;
    }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .modal-header h2 { font-size: 16px; font-weight: 600; color: #1A1F1C; }
    .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: #9CA3A0; line-height: 1; padding: 2px 6px; border-radius: 6px; }
    .modal-close:hover { background: #F4F6F3; color: #1A1F1C; }
    .mfield { margin-bottom: 14px; }
    .mfield label { display: block; font-size: 12px; font-weight: 500; color: #1A1F1C; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.04em; }
    .mfield label .req { color: #E24B4A; margin-left: 2px; }
    .mfield input, .mfield select, .mfield textarea {
      width: 100%; border: 1.5px solid #DDE3DF; border-radius: 8px;
      padding: 0 12px; height: 40px; font-size: 13.5px;
      font-family: 'DM Sans', sans-serif; color: #1A1F1C;
      background: #FAFBFA; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .mfield textarea { height: auto; padding: 10px 12px; resize: vertical; }
    .mfield input:focus, .mfield select:focus, .mfield textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(29,78,216,0.1);
    }
    .mfield .hint { font-size: 11px; color: #9CA3A0; margin-top: 4px; }
    .mrow2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .modal-alert { padding: 10px 13px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; line-height: 1.5; }
    .modal-alert.err { background: #FCECEA; color: #C0392B; border: 1px solid #f5c6c2; }
    .modal-alert.ok  { background: #EEF2FF; color: #1E40AF; border: 1px solid #BFDBFE; }

    /* FLASH BANNERS */
    .flash-ok  { padding: 11px 14px; border-radius: 8px; font-size: 13.5px; margin-bottom: 14px; background: #EEF2FF; color: #1E40AF; border: 1px solid #BFDBFE; }
    .flash-err { padding: 11px 14px; border-radius: 8px; font-size: 13.5px; margin-bottom: 14px; background: #FCECEA; color: #C0392B; border: 1px solid #f5c6c2; }

    /* EXPORT */
    .export-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
    .export-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 18px 12px; border-radius: 10px; border: 0.5px solid rgba(0,0,0,0.1); background: #fff; cursor: pointer; transition: background 0.15s; text-align: center; gap: 8px; }
    .export-btn:hover { background: var(--accent-light); border-color: #BFDBFE; }
    .export-btn .e-icon  { font-size: 24px; }
    .export-btn .e-label { font-size: 13px; font-weight: 500; }
    .export-btn .e-sub   { font-size: 11px; color: #6B7570; }

    /* TOAST */
    .toast {
      position: fixed; bottom: 20px; right: 20px;
      background: #1A1F1C; color: #fff;
      padding: 10px 18px; border-radius: 8px; font-size: 13px;
      opacity: 0; transform: translateY(10px);
      transition: opacity 0.2s, transform 0.2s; z-index: 200;
      pointer-events: none;
    }
    .toast.show { opacity: 1; transform: translateY(0); }

    select, textarea {
      padding: 8px 10px; border-radius: 8px;
      border: 0.5px solid rgba(0,0,0,0.15);
      background: #F4F6F3; color: #1A1F1C;
      font-size: 13px; font-family: 'DM Sans', sans-serif;
    }

    @media (max-width: 640px) {
      .sidebar { display: none; }
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .mrow2 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div id="app">
