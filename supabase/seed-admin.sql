insert into admins (name, initials, email, password, is_active)
values (
    'System Admin',
    'SA',
    'admin@example.com',
    '$2a$10$.zNfMNWGs8xmuFNBgpTjkOc4DcpMWZM3nj10w3Gc.IdGp..DPb1Uu',
    true
)
on conflict (email) do update
set
    name = excluded.name,
    initials = excluded.initials,
    password = excluded.password,
    is_active = excluded.is_active,
    updated_at = current_timestamp;
