-- Session 08.4: Certificate layout config

-- Add certificate layout JSON to platform_settings
insert into public.platform_settings (key, value)
values (
  'certificate_layout',
  '{
    "studentName":   { "x": 50, "y": 44, "fontSize": 32, "bold": true,  "color": "#0F3D2E", "align": "center" },
    "courseTitle":   { "x": 50, "y": 55, "fontSize": 20, "bold": true,  "color": "#111111", "align": "center" },
    "dateIssued":    { "x": 22, "y": 76, "fontSize": 10, "bold": false, "color": "#5F6368", "align": "left"   },
    "certificateId": { "x": 78, "y": 76, "fontSize": 10, "bold": false, "color": "#0F3D2E", "align": "right"  },
    "qrCode":        { "x": 50, "y": 75, "size": 56 }
  }'
) on conflict (key) do update set value = excluded.value;
