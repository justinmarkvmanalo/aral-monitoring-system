# Supabase Migration Notes

## What changed

This repo was originally written for MySQL with `mysqli`.
The shared DB layer now expects PostgreSQL/Supabase through `PDO` in [conn.php](C:\Users\Justin Mark\OneDrive\Desktop\aral monitoring system\conn.php).

The biggest code-level changes were:

- `mysqli` queries were replaced with PDO prepared statements.
- MySQL-only `ON DUPLICATE KEY UPDATE` was changed to PostgreSQL `ON CONFLICT`.
- `NOW()` usage was replaced with `CURRENT_TIMESTAMP`.
- `numeracy_drills.questions` is now stored as `jsonb`.
- Boolean columns now use `true` / `false` instead of `1` / `0`.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL Editor in Supabase.
3. Run [supabase/schema.sql](C:\Users\Justin Mark\OneDrive\Desktop\aral monitoring system\supabase\schema.sql).
4. Import your old data after the schema exists.

## Environment variables

Use [.env.example](C:\Users\Justin Mark\OneDrive\Desktop\aral monitoring system\.env.example) as the template.

Required values:

- `SUPABASE_DB_HOST`
- `SUPABASE_DB_PORT`
- `SUPABASE_DB_NAME`
- `SUPABASE_DB_USER`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_SSLMODE`

You can also use one connection URL instead:

- `DATABASE_URL`

## Data import guidance

Your old SQL dump is MariaDB/MySQL syntax, so do not paste it directly into Supabase.

Recommended order:

1. `teachers`
2. `admins`
3. `school_years`
4. `sections`
5. `students`
6. `announcements`
7. `attendance`
8. `numeracy_skills`
9. `numeracy_drills`
10. `numeracy_quizzes`
11. `numeracy_scores`
12. remaining tables

Important adjustments while importing:

- Convert `tinyint(1)` values to `true` / `false`.
- Convert MySQL `enum` values to plain text that matches the Postgres `check` constraints.
- Keep original IDs if you want existing relationships to remain valid.
- After manual inserts with fixed IDs, reset each identity sequence.

Example sequence reset:

```sql
select setval('teachers_id_seq', coalesce((select max(id) from teachers), 1), true);
```

Repeat that for each table that keeps old IDs.

## Known app-level risks

- I could not run PHP locally in this workspace because `php` is not installed on this machine.
- The reading and science pages still need a functional pass once the app is connected to a real Supabase database.
- If your hosting does not have `pdo_pgsql` enabled, the new connection layer will fail even with correct credentials.

## Next step

Create the Supabase schema first, then give me either:

- your Supabase table export or
- the exact part of the old dump you want converted into Postgres insert statements

and I can prepare the import SQL for you.
